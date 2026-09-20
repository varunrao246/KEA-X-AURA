import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/questions";
import { buildSeed } from "./seed";

describe("question bank", () => {
  const seed = buildSeed(new Date("2026-09-26T10:00:00Z"));
  const topicIds = seed.topics.map((t) => t.id);

  it("has unique ids and valid topics", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) expect(topicIds).toContain(q.topicId);
  });

  it("gives every topic at least 2 questions at every level", () => {
    for (const t of topicIds) {
      for (const level of [1, 2, 3, 4]) {
        const n = QUESTIONS.filter((q) => q.topicId === t && q.level === level).length;
        expect(n, `${t} level ${level}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("has well-formed MCQs (4 distinct options, answer among them)", () => {
    for (const q of QUESTIONS.filter((x) => x.type === "mcq")) {
      expect(q.options, q.id).toHaveLength(4);
      expect(new Set(q.options).size, q.id).toBe(4);
      expect(q.options, q.id).toContain(q.answer);
    }
  });

  it("has finite numeric answers and keeps variables for the guardrail", () => {
    for (const q of QUESTIONS.filter((x) => x.type === "numeric")) {
      expect(Number.isFinite(q.numericAnswer), q.id).toBe(true);
      expect(q.variables, q.id).toBeTruthy();
      expect(q.tolerance, q.id).toBeGreaterThan(0);
    }
  });

  it("numeric stems contain every variable value (so numbers can be validated later)", () => {
    for (const q of QUESTIONS.filter((x) => x.type === "numeric" && x.topicId !== "ph")) {
      for (const v of Object.values(q.variables!)) expect(q.stem, q.id).toContain(String(v));
    }
  });
});
