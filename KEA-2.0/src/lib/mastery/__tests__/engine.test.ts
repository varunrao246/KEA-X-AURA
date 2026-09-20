import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateEMMUpdate,
  calculateWeightedEvidenceScore,
  determineStatus,
  MasteryEngine,
  validateEvidence,
} from "../engine";
import {
  CONSECUTIVE_FAILURES_FOR_REMEDIATION,
  DEFAULT_ALPHA,
  EVIDENCE_WEIGHTS,
  MASTERY_THRESHOLD,
  REMEDIATION_THRESHOLD,
} from "../constants";
import { AssessmentEvidence } from "../types";
import { KnowledgeGraphEngine } from "@/lib/knowledge-graph/engine";
import { ConceptNode } from "@/lib/knowledge-graph/types";

describe("KEA Deterministic Mastery Engine (W-EMM) Test Suite", () => {
  // 1. Empty evidence
  it("1. Empty evidence list throws descriptive validation error", () => {
    assert.throws(
      () => calculateWeightedEvidenceScore([]),
      /Cannot calculate evidence score for empty/
    );

    const engine = new MasteryEngine();
    assert.throws(
      () => engine.recordEvidence([]),
      /Cannot record empty assessment evidence/
    );
  });

  // 2. Practice evidence
  it("2. Practice evidence uses correct weight (0.25) and scores accurately", () => {
    const evidence: AssessmentEvidence = {
      conceptId: "py_variables",
      assessmentType: "practice",
      score: 80,
    };
    validateEvidence(evidence);

    const { weightedAverage, summary } = calculateWeightedEvidenceScore([evidence]);
    assert.equal(weightedAverage, 80);
    assert.equal(summary.practiceCount, 1);
    assert.equal(summary.writtenCount, 0);
    assert.equal(summary.oralCount, 0);
  });

  // 3. Written evidence
  it("3. Written evidence uses correct weight (0.35) and scores accurately", () => {
    const evidence: AssessmentEvidence = {
      conceptId: "py_functions",
      assessmentType: "written",
      score: 70,
    };
    validateEvidence(evidence);

    const { weightedAverage, summary } = calculateWeightedEvidenceScore([evidence]);
    assert.equal(weightedAverage, 70);
    assert.equal(summary.writtenCount, 1);
  });

  // 4. Oral evidence
  it("4. Oral evidence uses highest weight (0.40) and scores accurately", () => {
    const evidence: AssessmentEvidence = {
      conceptId: "calc_derivatives",
      assessmentType: "oral",
      score: 95,
    };
    validateEvidence(evidence);

    const { weightedAverage, summary } = calculateWeightedEvidenceScore([evidence]);
    assert.equal(weightedAverage, 95);
    assert.equal(summary.oralCount, 1);
    assert.equal(EVIDENCE_WEIGHTS.oral, 0.40);
  });

  // 5. Mixed evidence
  it("5. Mixed evidence combines practice, written, and oral modalities", () => {
    const batch: AssessmentEvidence[] = [
      { conceptId: "photo_calvin", assessmentType: "practice", score: 100 }, // w=0.25 -> 25
      { conceptId: "photo_calvin", assessmentType: "written", score: 80 },   // w=0.35 -> 28
      { conceptId: "photo_calvin", assessmentType: "oral", score: 60 },      // w=0.40 -> 24
    ];
    // sum = 25 + 28 + 24 = 77; total weight = 1.0; average = 77
    const { weightedAverage, summary } = calculateWeightedEvidenceScore(batch);
    assert.equal(weightedAverage, 77);
    assert.equal(summary.totalItems, 3);
    assert.equal(summary.practiceCount, 1);
    assert.equal(summary.writtenCount, 1);
    assert.equal(summary.oralCount, 1);
  });

  // 6. Weighted evidence aggregation with unequal counts
  it("6. Weighted evidence aggregation computes normalized weighted mean", () => {
    const batch: AssessmentEvidence[] = [
      { conceptId: "py_oop", assessmentType: "practice", score: 100 }, // 0.25 * 100 = 25
      { conceptId: "py_oop", assessmentType: "oral", score: 50 },     // 0.40 * 50 = 20
    ];
    // Total weight = 0.25 + 0.40 = 0.65
    // Weighted score = (25 + 20) / 0.65 = 45 / 0.65 = 69.2307...
    const { weightedAverage } = calculateWeightedEvidenceScore(batch);
    assert.equal(weightedAverage, 69.23);
  });

  // 7. EMM update from previous mastery
  it("7. EMM update computes new mastery accurately from previous score", () => {
    // old = 50, evidence = 80, alpha = 0.4
    // delta = 30 -> 50 + 0.4 * 30 = 62
    const updated = calculateEMMUpdate(50, 80, 0.4);
    assert.equal(updated, 62);

    // Engine instance test
    const engine = new MasteryEngine({
      py_variables: { currentScore: 50, attemptCount: 1 },
    });
    const result = engine.recordEvidence(
      { conceptId: "py_variables", assessmentType: "practice", score: 80 },
      { alpha: 0.4 }
    );
    assert.equal(result.previousScore, 50);
    assert.equal(result.evidenceScore, 80);
    assert.equal(result.newScore, 62);
  });

  // 8. Score clamping to 0–100
  it("8. Score clamping strictly constrains outputs to [0, 100]", () => {
    assert.equal(calculateEMMUpdate(0, 0, 0.4), 0);
    assert.equal(calculateEMMUpdate(100, 100, 0.4), 100);
    assert.equal(calculateEMMUpdate(0, 100, 1.0), 100);
    assert.equal(calculateEMMUpdate(100, 0, 1.0), 0);
  });

  // 9. Exact mastery threshold
  it("9. Exact mastery threshold (80.00) transitions to mastered", () => {
    const status = determineStatus({
      score: MASTERY_THRESHOLD,
      isUnlocked: true,
      consecutiveFailures: 0,
      hasAttempted: true,
    });
    assert.equal(status, "mastered");
  });

  // 10. Just below mastery threshold
  it("10. Score just below mastery threshold (79.99) remains in_progress", () => {
    const status = determineStatus({
      score: 79.99,
      isUnlocked: true,
      consecutiveFailures: 0,
      hasAttempted: true,
    });
    assert.equal(status, "in_progress");
  });

  // 11. Just above mastery threshold
  it("11. Score just above mastery threshold (80.01) transitions to mastered", () => {
    const status = determineStatus({
      score: 80.01,
      isUnlocked: true,
      consecutiveFailures: 0,
      hasAttempted: true,
    });
    assert.equal(status, "mastered");
  });

  // 12. Repeated strong evidence
  it("12. Repeated strong evidence asymptotically approaches 100 and confirms mastery", () => {
    const engine = new MasteryEngine();
    const conceptId = "quantum_superposition";

    // 4 consecutive perfect scores
    for (let i = 0; i < 4; i++) {
      engine.recordEvidence({
        conceptId,
        assessmentType: "written",
        score: 100,
      });
    }

    const state = engine.getConceptState(conceptId);
    // 0 -> 40 -> 64 -> 78.4 -> 87.04
    assert.ok(state.currentScore >= MASTERY_THRESHOLD);
    assert.equal(state.status, "mastered");
    assert.equal(engine.getMasteredConceptIds().has(conceptId), true);
  });

  // 13. Repeated weak evidence
  it("13. Repeated weak evidence decreases score monotonically", () => {
    const engine = new MasteryEngine({
      node_test: { currentScore: 70, attemptCount: 1 },
    });

    const res1 = engine.recordEvidence({
      conceptId: "node_test",
      assessmentType: "practice",
      score: 20,
    });
    // 70 + 0.4 * (20 - 70) = 70 - 20 = 50
    assert.equal(res1.newScore, 50);

    const res2 = engine.recordEvidence({
      conceptId: "node_test",
      assessmentType: "practice",
      score: 20,
    });
    // 50 + 0.4 * (20 - 50) = 50 - 12 = 38
    assert.equal(res2.newScore, 38);
    assert.ok(res2.newScore < res1.newScore);
  });

  // 14. Remediation transition
  it("14. Remediation transition triggers when score < 60 and 2 consecutive failures occur", () => {
    const engine = new MasteryEngine({
      struggle_node: { currentScore: 55, attemptCount: 1, consecutiveFailures: 0 },
    });

    // 1st failure (< 60): consecutiveFailures becomes 1, status remains in_progress
    const res1 = engine.recordEvidence({
      conceptId: "struggle_node",
      assessmentType: "practice",
      score: 30,
    });
    assert.ok(res1.newScore < REMEDIATION_THRESHOLD);
    assert.equal(res1.status, "in_progress");
    assert.equal(res1.transitionedToRemediation, false);

    // 2nd failure (< 60): consecutiveFailures becomes 2, triggers remediation!
    assert.equal(CONSECUTIVE_FAILURES_FOR_REMEDIATION, 2);
    const res2 = engine.recordEvidence({
      conceptId: "struggle_node",
      assessmentType: "practice",
      score: 20,
    });
    assert.ok(res2.newScore < REMEDIATION_THRESHOLD);
    assert.equal(res2.status, "remediation");
    assert.equal(res2.transitionedToRemediation, true);
  });

  // 15. Negative score rejected
  it("15. Negative scores are rejected with explicit error", () => {
    assert.throws(
      () =>
        validateEvidence({
          conceptId: "test_node",
          assessmentType: "practice",
          score: -5,
        }),
      /Invalid evidence score: -5/
    );
  });

  // 16. >100 score rejected
  it("16. Scores greater than 100 are rejected with explicit error", () => {
    assert.throws(
      () =>
        validateEvidence({
          conceptId: "test_node",
          assessmentType: "oral",
          score: 105,
        }),
      /Invalid evidence score: 105/
    );
  });

  // 17. Unknown concept handled safely with default state
  it("17. Unknown concept initializes cleanly with baseline state", () => {
    const engine = new MasteryEngine();
    const state = engine.getConceptState("unknown_concept_xyz");
    assert.equal(state.conceptId, "unknown_concept_xyz");
    assert.equal(state.currentScore, 0);
    assert.equal(state.status, "unlocked");
    assert.equal(state.attemptCount, 0);
    assert.equal(state.consecutiveFailures, 0);
  });

  // 18. Locked concept remains separate from mastery
  it("18. Locked concept preserves 'locked' status regardless of internal score", () => {
    const status = determineStatus({
      score: 85, // Even with high score, if locked by graph, status is locked
      isUnlocked: false,
      consecutiveFailures: 0,
      hasAttempted: false,
    });
    assert.equal(status, "locked");

    const engine = new MasteryEngine();
    const result = engine.recordEvidence(
      { conceptId: "locked_concept", assessmentType: "practice", score: 90 },
      { isUnlocked: false }
    );
    assert.equal(result.status, "locked");
  });

  // 19. Identical inputs produce identical outputs (100% deterministic)
  it("19. Identical inputs produce bitwise identical outputs across repeated runs", () => {
    const run1 = calculateEMMUpdate(42.5, 78.25, DEFAULT_ALPHA);
    const run2 = calculateEMMUpdate(42.5, 78.25, DEFAULT_ALPHA);
    assert.equal(run1, run2);

    const batch: AssessmentEvidence[] = [
      { conceptId: "det_test", assessmentType: "practice", score: 85 },
      { conceptId: "det_test", assessmentType: "written", score: 65 },
      { conceptId: "det_test", assessmentType: "oral", score: 90 },
    ];
    const score1 = calculateWeightedEvidenceScore(batch);
    const score2 = calculateWeightedEvidenceScore(batch);
    assert.deepEqual(score1, score2);
  });

  // 20. Realistic progression: unlocked -> in_progress -> mastered
  it("20. Realistic learning progression transitions smoothly: unlocked -> in_progress -> mastered", () => {
    const engine = new MasteryEngine();
    const concept = "py_recursion";

    // Initial state: unlocked
    assert.equal(engine.getConceptState(concept).status, "unlocked");

    // 1st attempt (Practice: 70) -> score = 0 + 0.4 * 70 = 28 -> in_progress
    const step1 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "practice",
      score: 70,
    });
    assert.equal(step1.newScore, 28);
    assert.equal(step1.status, "in_progress");

    // 2nd attempt (Written: 85) -> score = 28 + 0.4 * (85 - 28) = 28 + 22.8 = 50.8 -> in_progress
    const step2 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "written",
      score: 85,
    });
    assert.equal(step2.newScore, 50.8);
    assert.equal(step2.status, "in_progress");

    // 3rd attempt (Oral: 95) -> score = 50.8 + 0.4 * (95 - 50.8) = 50.8 + 17.68 = 68.48 -> in_progress
    const step3 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "oral",
      score: 95,
    });
    assert.equal(step3.newScore, 68.48);
    assert.equal(step3.status, "in_progress");

    // 4th attempt (Written: 100) -> score = 68.48 + 0.4 * (100 - 68.48) = 68.48 + 12.61 = 81.09 -> mastered!
    const step4 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "written",
      score: 100,
    });
    assert.equal(step4.newScore, 81.09);
    assert.equal(step4.status, "mastered");
    assert.equal(step4.transitionedToMastered, true);
  });

  // 21. Realistic struggle: unlocked -> in_progress -> remediation
  it("21. Realistic struggle path transitions: unlocked -> in_progress -> remediation", () => {
    const engine = new MasteryEngine();
    const concept = "calc_integration_parts";

    // Initial state
    assert.equal(engine.getConceptState(concept).status, "unlocked");

    // Attempt 1: Poor performance (score 40 < 60) -> 0 + 0.4 * 40 = 16 -> in_progress (1 failure)
    const step1 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "practice",
      score: 40,
    });
    assert.equal(step1.status, "in_progress");
    assert.equal(engine.getConceptState(concept).consecutiveFailures, 1);

    // Attempt 2: Another poor performance (score 35 < 60) -> consecutive failures = 2 -> remediation!
    const step2 = engine.recordEvidence({
      conceptId: concept,
      assessmentType: "written",
      score: 35,
    });
    assert.equal(step2.status, "remediation");
    assert.equal(step2.transitionedToRemediation, true);
    assert.equal(engine.getConceptState(concept).consecutiveFailures, 2);
  });

  // 22. Compatibility with KnowledgeGraphEngine
  it("22. Seamless integration with KnowledgeGraphEngine for prerequisite unlocking and remediation", () => {
    // Setup a 3-node dependency chain: A -> B -> C
    const nodes: ConceptNode[] = [
      {
        id: "NODE_A",
        code: "A",
        title: "Foundation A",
        description: "Prerequisite root",
        difficulty: "foundational",
        orderIndex: 1,
        prerequisites: [],
        learningObjectives: ["A"],
        estimatedMinutes: 10,
        visualModel: "none",
      },
      {
        id: "NODE_B",
        code: "B",
        title: "Intermediate B",
        description: "Depends on A",
        difficulty: "intermediate",
        orderIndex: 2,
        prerequisites: ["NODE_A"],
        learningObjectives: ["B"],
        estimatedMinutes: 15,
        visualModel: "none",
      },
      {
        id: "NODE_C",
        code: "C",
        title: "Advanced C",
        description: "Depends on B",
        difficulty: "advanced",
        orderIndex: 3,
        prerequisites: ["NODE_B"],
        learningObjectives: ["C"],
        estimatedMinutes: 20,
        visualModel: "none",
      },
    ];

    const graph = new KnowledgeGraphEngine(nodes);
    const mastery = new MasteryEngine();

    // Initially: Node A is unlocked, Node B and C are locked
    let masteredSet = mastery.getMasteredConceptIds();
    assert.equal(graph.isUnlocked("NODE_A", masteredSet), true);
    assert.equal(graph.isUnlocked("NODE_B", masteredSet), false);
    assert.equal(graph.isUnlocked("NODE_C", masteredSet), false);

    // Learner masters NODE_A across attempts (0 -> 40 -> 64 -> 78.4 -> 87.04)
    for (let i = 0; i < 4; i++) {
      mastery.recordEvidence([
        { conceptId: "NODE_A", assessmentType: "written", score: 100 },
        { conceptId: "NODE_A", assessmentType: "oral", score: 100 },
      ]);
    }
    masteredSet = mastery.getMasteredConceptIds();
    assert.ok(masteredSet.has("NODE_A"));

    // Now Node B is unlocked!
    assert.equal(graph.isUnlocked("NODE_B", masteredSet), true);
    assert.equal(graph.isUnlocked("NODE_C", masteredSet), false);

    // Remediation target testing:
    // If learner struggles on Node C, remediation target should locate the weakest ancestor
    const scores = mastery.getMasteryScores();
    scores["NODE_A"] = 90;
    scores["NODE_B"] = 45; // Weakest ancestor
    const target = graph.getRemediationTarget("NODE_C", scores);
    assert.equal(target?.id, "NODE_B");
  });
});
