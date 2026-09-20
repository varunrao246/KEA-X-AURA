import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calibrateDiagnostic, resolveTargetConceptId } from "../engine";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { SAMPLE_TOPIC_PLANS } from "@/lib/topic-curriculum/sample-topics";

describe("KEA Diagnostic & Prerequisite Assessment Calibration Test Suite (P0-03B)", () => {
  const pythonPlan: TopicCurriculumPlan = SAMPLE_TOPIC_PLANS.python;

  it("1. Resolves target concept ID by direct ID, name, or substring match", () => {
    const concepts = pythonPlan.stages[0].concepts; // c1: Variables & Types, c2: Standard I/O, c3: Basic Operators
    assert.equal(resolveTargetConceptId("c1", concepts), "c1");
    assert.equal(resolveTargetConceptId("Variables & Types", concepts), "c1");
    assert.equal(resolveTargetConceptId("variables", concepts), "c1");
    assert.equal(resolveTargetConceptId("Standard I/O", concepts), "c2");
  });

  it("2. Correct diagnostic answers calibrate tested foundational concepts to mastered", () => {
    // py-diag-1 tests Variables (c1), correct option is opt-b
    // py-diag-2 tests Conditional Logic (c4 in Stage 2), correct option is opt-b
    const submissions = [
      { questionId: "py-diag-1", selectedOptionId: "opt-b" },
    ];

    const result = calibrateDiagnostic(pythonPlan, submissions);
    assert.equal(result.totalQuestions, pythonPlan.diagnosticQuestions.length);
    assert.equal(result.correctCount, 1);
    assert.ok(result.masteredConceptIds.includes("c1"));
    assert.equal(result.conceptStatuses["c1"], "mastered");
  });

  it("3. Downstream concepts become unlocked when prerequisites are mastered via diagnostic", () => {
    const submissions = [
      { questionId: "py-diag-1", selectedOptionId: "opt-b" },
    ];

    const result = calibrateDiagnostic(pythonPlan, submissions);
    // When c1 is mastered, downstream concept should be unlocked
    assert.ok(result.unlockedConceptIds.includes("c1"));
    // Recommended starting point should advance to an unmastered concept
    assert.notEqual(result.recommendedStartingNodeId, "c1");
  });

  it("4. Incorrect diagnostic answers leave concepts unmastered and recommend foundational starting point", () => {
    const submissions = [
      { questionId: "py-diag-1", selectedOptionId: "opt-a" }, // Incorrect
    ];

    const result = calibrateDiagnostic(pythonPlan, submissions);
    assert.equal(result.correctCount, 0);
    assert.equal(result.conceptStatuses["c1"], "in_progress");
    assert.ok(!result.masteredConceptIds.includes("c1"));
    assert.equal(result.recommendedStartingNodeId, "c1");
  });

  it("5. Empty submissions preserve clean baseline unlock state with 0% accuracy", () => {
    const result = calibrateDiagnostic(pythonPlan, []);
    assert.equal(result.correctCount, 0);
    assert.equal(result.accuracyPercentage, 0);
    assert.equal(result.masteredConceptIds.length, 0);
    assert.equal(result.recommendedStartingNodeId, "c1");
  });

  it("6. Fully topic-agnostic: works with custom dynamic AI curriculum plan", () => {
    const customPlan: TopicCurriculumPlan = {
      topic: "Quantum Computing",
      category: "Physics & CS",
      estimatedHours: 10,
      overview: "Introduction to qubits, superposition, and quantum gates.",
      prerequisiteSummary: "Linear algebra and complex numbers.",
      diagnosticQuestions: [
        {
          id: "q-diag-1",
          question: "What is a qubit?",
          conceptTested: "Qubit Basics",
          options: [
            { id: "o1", label: "A standard classical bit", isCorrect: false },
            { id: "o2", label: "A quantum unit of information in superposition", isCorrect: true },
          ],
          explanation: "Qubits leverage quantum superposition.",
        },
      ],
      stages: [
        {
          id: "stage-q-1",
          stageNumber: 1,
          title: "Quantum Fundamentals",
          tagline: "Qubits and States",
          objective: "Understand qubits and state vectors",
          concepts: [
            { id: "q1", name: "Qubit Basics", summary: "Definition of qubits", difficulty: "foundational", status: "unlocked" },
          ],
          prerequisites: [],
          learningActivities: [],
          milestoneAssessment: "Qubit check",
          masteryCondition: "Master qubits",
          status: "unlocked",
        },
      ],
    };

    const result = calibrateDiagnostic(customPlan, [
      { questionId: "q-diag-1", selectedOptionId: "o2" },
    ]);

    assert.equal(result.correctCount, 1);
    assert.equal(result.accuracyPercentage, 100);
    assert.ok(result.masteredConceptIds.includes("q1"));
    assert.equal(result.conceptStatuses["q1"], "mastered");
    assert.equal(result.calibratedStages[0].concepts[0].status, "mastered");
  });
});
