import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_QUESTIONS,
  extractNumbers,
  getFallbackRethemedQuestion,
  rethemeQuestion,
  validateInvariants,
} from "../index";

describe("KEA AI Re-Theming & Invariant Checker Test Suite (P0-04)", () => {
  const canonicalNode03 = CANONICAL_QUESTIONS["NODE_03"];

  it("1. Extracts numbers, fractions, and percentages accurately", () => {
    const text = "Compare 3/8 and 5/8 with 100% confidence over 42 attempts.";
    const nums = extractNumbers(text);
    assert.deepEqual(nums, ["3/8", "5/8", "100%", "42"]);
  });

  it("2. Invariant validator passes when all numbers and key are intact", () => {
    const validCandidate = {
      questionText: "In deep space, Rocket Tank A holds 3/8 fuel while Tank B holds 5/8 fuel. Which holds less?",
      options: [
        { id: "opt-1", text: "3/8 is greater than 5/8", isCorrect: false },
        { id: "opt-2", text: "3/8 is less than 5/8", isCorrect: true },
        { id: "opt-3", text: "They are equal", isCorrect: false },
        { id: "opt-4", text: "Cannot compare", isCorrect: false },
      ],
      correctOptionId: "opt-2",
    };

    const result = validateInvariants(canonicalNode03, validCandidate);
    assert.equal(result.passed, true);
    assert.equal(result.errors.length, 0);
    assert.deepEqual(result.preservedNumbers, ["3/8", "5/8"]);
  });

  it("3. Invariant validator rejects candidate when numbers are altered or hallucinated", () => {
    const invalidCandidate = {
      questionText: "In deep space, Rocket Tank A holds 1/2 fuel while Tank B holds 3/4 fuel. Which holds less?", // 1/2 and 3/4 instead of 3/8 and 5/8
      options: [
        { id: "opt-1", text: "1/2 is greater than 3/4", isCorrect: false },
        { id: "opt-2", text: "1/2 is less than 3/4", isCorrect: true },
        { id: "opt-3", text: "They are equal", isCorrect: false },
        { id: "opt-4", text: "Cannot compare", isCorrect: false },
      ],
      correctOptionId: "opt-2",
    };

    const result = validateInvariants(canonicalNode03, invalidCandidate);
    assert.equal(result.passed, false);
    assert.ok(result.errors.some(e => e.includes('Missing mandatory invariant number: "3/8"')));
    assert.ok(result.errors.some(e => e.includes('Missing mandatory invariant number: "5/8"')));
  });

  it("4. Invariant validator rejects candidate when option count or answer key is altered", () => {
    const alteredKeyCandidate = {
      questionText: "Compare 3/8 and 5/8.",
      options: [
        { id: "opt-1", text: "3/8 > 5/8", isCorrect: false },
        { id: "opt-2", text: "3/8 < 5/8", isCorrect: true },
      ], // Only 2 options instead of 4
      correctOptionId: "opt-1", // Altered key!
    };

    const result = validateInvariants(canonicalNode03, alteredKeyCandidate);
    assert.equal(result.passed, false);
    assert.ok(result.errors.some(e => e.includes("Option count mismatch")));
    assert.ok(result.errors.some(e => e.includes("Correct answer key mismatch")));
  });

  it("5. Fallback re-themer produces valid themed variants across all 4 student themes", () => {
    const themes = ["space", "wildlife", "chef", "superhero"] as const;

    for (const theme of themes) {
      const rethemed = getFallbackRethemedQuestion(canonicalNode03, theme);
      assert.equal(rethemed.theme, theme);
      assert.ok(rethemed.thematicContext.length > 0);
      assert.ok(rethemed.questionText.includes("3/8"));
      assert.ok(rethemed.questionText.includes("5/8"));
      assert.equal(rethemed.correctOptionId, "opt-2");
      assert.equal(rethemed.invariantCheckPassed, true);
    }
  });

  it("6. rethemeQuestion executes end-to-end without throwing and preserves invariants", async () => {
    const rethemed = await rethemeQuestion("NODE_03", "space");
    assert.equal(rethemed.canonicalId, "NODE_03");
    assert.equal(rethemed.theme, "space");
    assert.equal(rethemed.invariantCheckPassed, true);
    assert.equal(rethemed.options.length, 4);
    assert.equal(rethemed.correctOptionId, "opt-2");
  });
});
