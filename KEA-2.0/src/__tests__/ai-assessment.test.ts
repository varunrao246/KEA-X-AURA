/**
 * KEA Platform — AI Mock Test & Hybrid Assessment Test Suite
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FallbackProvider } from "../lib/ai/fallback-provider";
import { GeneratedMockTestSchema, AssessmentEvaluationSchema } from "../lib/ai/schemas";

describe("KEA AI Mock Test & Assessment Evaluation Suite", () => {
  it("1. Generates complete 5-question mock test with multi-concept coverage", async () => {
    const fallback = new FallbackProvider();
    const test = await fallback.generateStructured(
      "Generate a mock test for Organic Chemistry Stages 1-5",
      GeneratedMockTestSchema,
      { taskType: "mock_test" }
    );

    assert.ok(test.questions.length >= 5);
    assert.equal(test.topic, "Organic Chemistry");

    const types = test.questions.map((q) => q.type);
    assert.ok(types.includes("multiple_choice"), "Must include multiple_choice");
    assert.ok(types.includes("short_answer"), "Must include short_answer");
    assert.ok(types.includes("reasoning"), "Must include reasoning");
  });

  it("2. Multiple choice questions have at least 4 options and valid correctOptionIndex", async () => {
    const fallback = new FallbackProvider();
    const test = await fallback.generateStructured(
      "Generate mock test",
      GeneratedMockTestSchema,
      { taskType: "mock_test" }
    );

    const mcQuestions = test.questions.filter((q) => q.type === "multiple_choice");
    for (const q of mcQuestions) {
      assert.ok(q.options && q.options.length >= 4);
      assert.ok(typeof q.correctOptionIndex === "number");
      assert.ok(q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length);
    }
  });

  it("3. Open-ended reasoning questions specify grading rubrics", async () => {
    const fallback = new FallbackProvider();
    const test = await fallback.generateStructured(
      "Generate mock test",
      GeneratedMockTestSchema,
      { taskType: "mock_test" }
    );

    const reasoningQuestions = test.questions.filter((q) => q.type === "reasoning");
    for (const q of reasoningQuestions) {
      assert.ok(q.rubric.length >= 1, "Reasoning question must have evaluation criteria");
      const totalWeight = q.rubric.reduce((sum, r) => sum + r.weight, 0);
      assert.ok(Math.abs(totalWeight - 1.0) < 0.05, "Rubric weights should sum to ~1.0");
    }
  });

  it("4. Assessment evaluation calculates score and identifies strengths vs improvement areas", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Evaluate student test answers with rubric hits",
      AssessmentEvaluationSchema,
      { taskType: "evaluation" }
    );

    assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= 100);
    assert.ok(evaluation.evaluations.length >= 5);
    assert.ok(evaluation.strengths.length >= 1);
    assert.ok(evaluation.areasForImprovement.length >= 1);
    assert.ok(["advance", "review", "remediate"].includes(evaluation.recommendedAction));
  });

  it("5. Assessment evaluation maps cleanly to MasteryEngine W-EMM evidence format", async () => {
    const fallback = new FallbackProvider();
    const evaluation = await fallback.generateStructured(
      "Evaluate student test answers",
      AssessmentEvaluationSchema,
      { taskType: "evaluation" }
    );

    // Convert each evaluation to a W-EMM evidence item
    const evidenceItems = evaluation.evaluations.map((e) => ({
      conceptId: e.conceptId,
      score: e.score,
      understanding: e.understanding,
      success: e.isCorrect,
      weight: e.questionId.includes("reasoning") ? 0.4 : 0.25,
      timestamp: Date.now(),
    }));

    assert.equal(evidenceItems.length, evaluation.evaluations.length);
    for (const item of evidenceItems) {
      assert.ok(item.conceptId.length > 0);
      assert.ok(item.score >= 0 && item.score <= 100);
      assert.ok(["strong", "partial", "weak"].includes(item.understanding));
    }
  });
});
