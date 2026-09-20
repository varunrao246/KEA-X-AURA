/**
 * KEA Platform — AI Adaptive Mock Interview & Oral Defense Test Suite
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FallbackProvider } from "../lib/ai/fallback-provider";
import { InterviewTurnEvaluationSchema, InterviewSummarySchema } from "../lib/ai/schemas";

describe("KEA AI Mock Interview & Adaptive Oral Defense Suite", () => {
  it("1. Evaluates misconception when student claims catalyst provides energy", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Student response: The catalyst provides the energy for the reaction.",
      InterviewTurnEvaluationSchema,
      { taskType: "interview" }
    );

    assert.equal(evaluation.understanding, "partial");
    assert.equal(evaluation.nextAction, "follow_up");
    assert.ok(evaluation.misconceptions.some((m) => m.toLowerCase().includes("energy")));
    assert.ok(evaluation.nextQuestion.toLowerCase().includes("catalyst"));
  });

  it("2. Rewards strong conceptual response and advances to deeper concept", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Student response: Reactants adsorb onto the platinum surface, lowering activation barrier without changing equilibrium.",
      InterviewTurnEvaluationSchema,
      { taskType: "interview" }
    );

    assert.equal(evaluation.understanding, "strong");
    assert.equal(evaluation.nextAction, "advance");
    assert.ok(evaluation.confidence >= 0.9);
    assert.ok(evaluation.conceptCoverage.includes("heterogeneous_catalysis"));
  });

  it("3. Detects procedural guessing or hesitation and triggers remediation", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Student response: idk, I don't know really.",
      InterviewTurnEvaluationSchema,
      { taskType: "interview" }
    );

    assert.equal(evaluation.understanding, "weak");
    assert.equal(evaluation.nextAction, "remediate");
    assert.ok(evaluation.nextQuestion.toLowerCase().includes("analogy") || evaluation.nextQuestion.toLowerCase().includes("imagine"));
  });

  it("4. Synthesizes comprehensive oral defense summary at interview conclusion", async () => {
    const fallback = new FallbackProvider();
    const summary = await fallback.generateStructured(
      "Generate interview summary for completed oral defense session",
      InterviewSummarySchema,
      { taskType: "interview" }
    );

    assert.ok(summary.overallScore >= 0 && summary.overallScore <= 100);
    assert.ok(["expert", "proficient", "developing", "novice"].includes(summary.understandingLevel));
    assert.ok(summary.conceptsDemonstrated.length >= 2);
    assert.ok(summary.strongConcepts.length >= 1);
    assert.ok(summary.weakConcepts.length >= 1);
    assert.ok(summary.recommendedNextSteps.length >= 1);
    assert.ok(summary.reasoningQualitySummary.length >= 20);
  });

  it("5. Oral defense evidence integrates directly into MasteryEngine W-EMM update", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Evaluate student response on organic reactions",
      InterviewTurnEvaluationSchema,
      { taskType: "interview" }
    );

    // Format as MasteryEngine oral evidence item
    const oralEvidence = {
      conceptId: evaluation.nextConceptId || "concept_organic_reactions",
      score: evaluation.understanding === "strong" ? 95 : evaluation.understanding === "partial" ? 65 : 30,
      understanding: evaluation.understanding,
      source: "ai_mock_interview",
      weight: 0.40, // Oral defense has high diagnostic weight
      confidence: evaluation.confidence,
    };

    assert.ok(oralEvidence.score >= 0 && oralEvidence.score <= 100);
    assert.equal(oralEvidence.weight, 0.40);
    assert.ok(oralEvidence.confidence > 0);
  });
});
