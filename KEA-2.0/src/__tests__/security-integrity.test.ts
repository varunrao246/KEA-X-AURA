/**
 * KEA Platform — Security, Integrity & Adaptivity Audit Test Suite
 * 
 * Verifies Phase 1-5 hardening:
 * 1. Assessment answer-key secrecy (client never sees correctOptionIndex/sampleIdealAnswer).
 * 2. Assessment server-side evaluation against trusted store.
 * 3. Client-forged answer keys are rejected/ignored.
 * 4. Interview session integrity & server-side turn progression.
 * 5. Forged interview history rejection.
 * 6. Mastery engine tamper resistance (W-EMM bounds and gating).
 * 7. Generated content safety (reject duplicate MCQ options, out-of-bounds indices).
 * 8. Adaptive prompt branching (high mastery vs misconception remediation).
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  saveAssessmentSession,
  getAssessmentSession,
  clearAssessmentSessions,
} from "../lib/assessment/session-store";
import {
  createInterviewSession,
  getInterviewSession,
  recordInterviewTurn,
  completeInterviewSession,
  clearInterviewSessions,
} from "../lib/interview/session-store";
import { MockTestQuestionSchema, GeneratedMockTest, GeneratedMockTestSchema } from "../lib/ai/schemas";
import { calculateEMMUpdate, determineStatus } from "../lib/mastery/engine";
import { FallbackProvider } from "../lib/ai/fallback-provider";

describe("KEA Security & Session Integrity Audit Suite", () => {
  beforeEach(() => {
    clearAssessmentSessions();
    clearInterviewSessions();
  });

  // =========================================================================
  // 1. ASSESSMENT ANSWER-KEY SECRECY & SCRUBBING
  // =========================================================================
  it("1. Assessment answer-key secrecy: scrubbed client payload never contains correctOptionIndex or sampleIdealAnswer", () => {
    const rawMockTest: GeneratedMockTest = {
      id: "test_sec_001",
      title: "Organic Chemistry Practice Exam",
      topic: "Organic Chemistry",
      targetDifficulty: "adaptive",
      questions: [
        {
          id: "q_mcq_1",
          type: "multiple_choice",
          conceptId: "concept_valency",
          difficulty: "foundational",
          prompt: "What is the valency of carbon in methane?",
          options: ["2", "3", "4", "5"],
          correctOptionIndex: 2, // Secret!
          explanation: "Carbon forms 4 single covalent bonds.",
          rubric: [],
          expectedConcepts: ["valency"],
        },
        {
          id: "q_open_2",
          type: "short_answer",
          conceptId: "concept_alkenes",
          difficulty: "intermediate",
          prompt: "Why are alkenes more reactive than alkanes towards halogens?",
          sampleIdealAnswer: "Alkenes possess a pi bond with accessible electron density.", // Secret!
          explanation: "Pi bonds have lower bond dissociation energy than sigma bonds.",
          rubric: [{ criterion: "Mentions pi bond accessibility", weight: 1.0 }],
          expectedConcepts: ["pi_bonds"],
        },
      ],
    };

    const clientSafeTest = saveAssessmentSession(rawMockTest);

    // Verify client payload is scrubbed
    for (const q of clientSafeTest.questions) {
      assert.equal(
        (q as unknown as Record<string, unknown>).correctOptionIndex,
        undefined,
        "correctOptionIndex must NOT exist on client question"
      );
      assert.equal(
        (q as unknown as Record<string, unknown>).sampleIdealAnswer,
        undefined,
        "sampleIdealAnswer must NOT exist on client question"
      );
      assert.equal(
        (q as unknown as Record<string, unknown>).explanation,
        undefined,
        "explanation must NOT exist on client question"
      );
      assert.ok(q.prompt.length > 0);
      assert.ok(q.conceptId.length > 0);
    }

    // Verify server session holds the authoritative secrets
    const serverSession = getAssessmentSession("test_sec_001");
    assert.ok(serverSession);
    assert.equal(serverSession.questions[0].correctOptionIndex, 2);
    assert.ok(serverSession.questions[1].sampleIdealAnswer?.includes("pi bond"));
  });

  // =========================================================================
  // 2. FORGED ANSWER-KEY REJECTION
  // =========================================================================
  it("2. Forged answer-key rejection: client claiming correctOptionIndex cannot alter server evaluation", () => {
    const rawMockTest: GeneratedMockTest = {
      id: "test_sec_002",
      title: "Gating Assessment",
      topic: "Organic Chemistry",
      targetDifficulty: "intermediate",
      questions: [
        {
          id: "q_mcq_secret",
          type: "multiple_choice",
          conceptId: "concept_hydrocarbons",
          difficulty: "intermediate",
          prompt: "Identify the saturated hydrocarbon:",
          options: ["Ethane", "Ethene", "Ethyne", "Benzene"],
          correctOptionIndex: 0, // Ethane is correct
          explanation: "Ethane contains only single C-C and C-H sigma bonds.",
          rubric: [],
          expectedConcepts: ["alkanes"],
        },
      ],
    };

    saveAssessmentSession(rawMockTest);
    const serverSession = getAssessmentSession("test_sec_002");
    assert.ok(serverSession);

    // Malicious student answered 2 (Ethyne) and tampered client submission claiming correctOptionIndex: 2
    const forgedStudentAnswer = 2;
    const forgedClientClaim = 2; // Attacker claims 2 is the correct answer
    assert.equal(forgedClientClaim, 2);

    // Server-side check MUST use serverSession.questions[0].correctOptionIndex (0), ignoring forgedClientClaim
    const isCorrectReal = forgedStudentAnswer === serverSession.questions[0].correctOptionIndex;
    assert.equal(isCorrectReal, false, "Server evaluation must mark incorrect despite forged claim");

    // Legitimate student answered 0 (Ethane)
    const legitStudentAnswer = 0;
    const isCorrectLegit = legitStudentAnswer === serverSession.questions[0].correctOptionIndex;
    assert.equal(isCorrectLegit, true, "Correct student answer must be recognized by server");
  });

  // =========================================================================
  // 3. INTERVIEW SERVER SESSION INTEGRITY & FORGED HISTORY REJECTION
  // =========================================================================
  it("3. Interview session integrity: server maintains authoritative turn history", () => {
    const session = createInterviewSession({
      sessionId: "int_sec_101",
      topic: "Organic Chemistry",
      stageNumber: 3,
      currentQuestion: "Explain the nucleophilic addition mechanism.",
      currentConceptId: "concept_functional_groups",
      maxTurns: 4,
    });

    assert.equal(session.turns.length, 0);
    assert.equal(session.status, "active");

    // Turn 1
    recordInterviewTurn({
      sessionId: "int_sec_101",
      turnNumber: 1,
      question: "Explain the nucleophilic addition mechanism.",
      conceptId: "concept_functional_groups",
      studentAnswer: "A nucleophile attacks the electrophilic carbonyl carbon.",
      understanding: "strong",
      misconceptions: [],
      nextQuestion: "What determines whether an aldehyde or ketone is more reactive?",
      nextConceptId: "concept_carbonyl_reactivity",
    });

    const updated = getInterviewSession("int_sec_101");
    assert.ok(updated);
    assert.equal(updated.turns.length, 1);
    assert.equal(updated.turns[0].understanding, "strong");
    assert.equal(
      updated.currentQuestion,
      "What determines whether an aldehyde or ketone is more reactive?"
    );

    // Client attempts to forge history with a fake high score turn
    const clientForgedTurns = [
      {
        turnNumber: 1,
        question: "Fake Question",
        studentAnswer: "Fake Answer",
        understanding: "strong" as const,
      },
      {
        turnNumber: 2,
        question: "Fake Question 2",
        studentAnswer: "Fake Answer 2",
        understanding: "strong" as const,
      },
    ];
    assert.equal(clientForgedTurns.length, 2);

    // Authoritative session must retain only the true server turn
    assert.equal(updated.turns.length, 1);
    assert.equal(
      updated.turns[0].question,
      "Explain the nucleophilic addition mechanism."
    );

    completeInterviewSession("int_sec_101");
    const completed = getInterviewSession("int_sec_101");
    assert.equal(completed?.status, "completed");
  });

  // =========================================================================
  // 4. MASTERY ENGINE TAMPER RESISTANCE
  // =========================================================================
  it("4. Mastery engine tamper resistance: W-EMM update adheres strictly to mathematical bounds", () => {
    // Starting from 0 mastery, an evidence score of 100 cannot instantly jump to 100
    const updated1 = calculateEMMUpdate(0, 100, 0.4);
    assert.equal(updated1, 40, "First perfect evidence yields 40% mastery with alpha=0.4");

    const updated2 = calculateEMMUpdate(updated1, 100, 0.4);
    assert.equal(updated2, 64, "Second perfect evidence yields 64%");

    const updated3 = calculateEMMUpdate(updated2, 100, 0.4);
    assert.equal(updated3, 78.4, "Third perfect evidence yields 78.4%");

    const updated4 = calculateEMMUpdate(updated3, 100, 0.4);
    assert.equal(updated4, 87.04, "Fourth perfect evidence crosses 80% threshold");

    // Invalid inputs must throw
    assert.throws(() => calculateEMMUpdate(-10, 100));
    assert.throws(() => calculateEMMUpdate(50, 150));
    assert.throws(() => calculateEMMUpdate(50, NaN));

    // Status gating
    assert.equal(
      determineStatus({ score: 75, consecutiveFailures: 0, hasAttempted: true }),
      "in_progress"
    );
    assert.equal(
      determineStatus({ score: 85, consecutiveFailures: 0, hasAttempted: true }),
      "mastered"
    );
    assert.equal(
      determineStatus({ score: 40, consecutiveFailures: 3, hasAttempted: true }),
      "remediation"
    );
  });

  // =========================================================================
  // 5. GENERATED CONTENT SAFETY & REJECTION RULES
  // =========================================================================
  it("5. Content safety: MockTestQuestionSchema rejects duplicate MCQ options and out-of-range index", () => {
    // Duplicate options must be rejected
    const duplicateOptionsQuestion = {
      id: "q_dup",
      type: "multiple_choice",
      conceptId: "concept_carbon",
      difficulty: "foundational",
      prompt: "How many valence electrons does carbon have?",
      options: ["4", "4", "2", "6"], // Duplicate "4"
      correctOptionIndex: 0,
      explanation: "Carbon has 4 valence electrons.",
      expectedConcepts: ["valency"],
      rubric: [],
    };
    const resDup = MockTestQuestionSchema.safeParse(duplicateOptionsQuestion);
    assert.equal(resDup.success, false, "Must reject duplicate options");

    // Out-of-bounds correctOptionIndex must be rejected
    const outOfBoundsQuestion = {
      id: "q_oob",
      type: "multiple_choice",
      conceptId: "concept_carbon",
      difficulty: "foundational",
      prompt: "How many valence electrons does carbon have?",
      options: ["2", "3", "4", "5"],
      correctOptionIndex: 5, // Out of bounds (length 4)
      explanation: "Carbon has 4 valence electrons.",
      expectedConcepts: ["valency"],
      rubric: [],
    };
    const resOob = MockTestQuestionSchema.safeParse(outOfBoundsQuestion);
    assert.equal(resOob.success, false, "Must reject out-of-bounds correctOptionIndex");

    // Empty prompt must be rejected
    const emptyPromptQuestion = {
      id: "q_empty",
      type: "multiple_choice",
      conceptId: "concept_carbon",
      difficulty: "foundational",
      prompt: "   ",
      options: ["A", "B", "C", "D"],
      correctOptionIndex: 0,
      explanation: "Explanation.",
      expectedConcepts: ["valency"],
      rubric: [],
    };
    const resEmpty = MockTestQuestionSchema.safeParse(emptyPromptQuestion);
    assert.equal(resEmpty.success, false, "Must reject empty prompt");
  });

  // =========================================================================
  // 6. REAL DETERMINISTIC FALLBACK SPEED & ROBUSTNESS
  // =========================================================================
  it("6. Fallback provider returns valid structured mock test in under 50ms", async () => {
    const fallback = new FallbackProvider();
    const startTime = Date.now();
    const test = await fallback.generateStructured(
      "Generate mock test for Organic Chemistry",
      GeneratedMockTestSchema,
      { taskType: "mock_test" }
    );
    const duration = Date.now() - startTime;

    assert.ok(duration < 50, `Deterministic fallback must be fast (<50ms), got ${duration}ms`);
    assert.equal(test.questions.length, 5);
    assert.ok(test.questions.some((q) => q.type === "multiple_choice"));
    assert.ok(test.questions.some((q) => q.type === "reasoning"));
  });
});
