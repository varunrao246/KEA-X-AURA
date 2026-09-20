import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateOralHeuristic } from "../evaluator";
import { calculateEMMUpdate, MasteryEngine } from "@/lib/mastery";

describe("KEA AI Oral Comprehension Probe Test Suite (P1-01)", () => {
  const baseRequest = {
    studentId: "student_aarav",
    conceptId: "NODE_03",
    conceptTitle: "Comparing Like Denominators",
    expectedConceptPrinciple: "When denominators are equal, fractions with greater numerators represent greater quantities.",
  };

  it("1. Flags procedural guessing when student responds with 'i guessed' or empty text", () => {
    const res = evaluateOralHeuristic({
      ...baseRequest,
      transcript: "i guessed randomly",
    });

    assert.equal(res.identifiedMisconception, "procedural_guessing");
    assert.equal(res.articulatesKeyPrinciple, false);
    assert.ok(res.conceptualUnderstandingScore <= 0.25);
    assert.ok(res.encouragingChildFeedback.length > 0);
  });

  it("2. Flags whole_number_denominator_bias when student argues 8 is bigger so 3/8 has more pieces", () => {
    const res = evaluateOralHeuristic({
      ...baseRequest,
      transcript: "Because 8 is bigger than 5 so 3/8 gives you more pieces",
    });

    assert.equal(res.identifiedMisconception, "whole_number_denominator_bias");
    assert.equal(res.articulatesKeyPrinciple, false);
    assert.ok(res.conceptualUnderstandingScore <= 0.40);
    assert.ok(res.evidenceQuote.includes("8 is bigger"));
  });

  it("3. Rewards conceptual articulation when student mentions same denominator and numerator magnitude", () => {
    const res = evaluateOralHeuristic({
      ...baseRequest,
      transcript: "Both fractions have the same denominator of 8, so 5 is more than 3 slices",
    });

    assert.equal(res.identifiedMisconception, "none");
    assert.equal(res.articulatesKeyPrinciple, true);
    assert.ok(res.conceptualUnderstandingScore >= 0.80);
    assert.ok(res.isFallback);
  });

  it("4. Scores incomplete reasoning reasonably with constructive guidance", () => {
    const res = evaluateOralHeuristic({
      ...baseRequest,
      transcript: "Because the first one looked bigger on the screen",
    });

    assert.equal(res.identifiedMisconception, "incomplete_reasoning");
    assert.equal(res.articulatesKeyPrinciple, false);
    assert.ok(res.conceptualUnderstandingScore >= 0.40 && res.conceptualUnderstandingScore <= 0.65);
  });

  it("5. Directly integrates with Deterministic Mastery Engine (W-EMM weight: 0.40)", () => {
    // Oral probe scores 95%
    const oralResult = evaluateOralHeuristic({
      ...baseRequest,
      transcript: "They have equal parts, so 5 parts is greater than 3 parts",
    });

    const oralPercentage = Math.round(oralResult.conceptualUnderstandingScore * 100);
    assert.equal(oralPercentage, 95);

    // Test direct EMM mathematical update from Aarav's baseline 35%
    // 35 + 0.40 * (95 - 35) = 35 + 24 = 59
    const updatedScore = calculateEMMUpdate(35, oralPercentage, 0.40);
    assert.equal(updatedScore, 59);

    // Test MasteryEngine ingestion of oral evidence
    const engine = new MasteryEngine();
    const result = engine.recordEvidence([
      {
        conceptId: "NODE_03",
        assessmentType: "oral",
        score: oralPercentage,
      },
    ]);

    assert.equal(result.evidenceSummary.oralCount, 1);
    assert.equal(result.evidenceScore, 95);
    // Baseline starts at 0: 0 + 0.4 * (95 - 0) = 38
    assert.equal(result.newScore, 38);
    assert.equal(result.status, "in_progress");
  });
});
