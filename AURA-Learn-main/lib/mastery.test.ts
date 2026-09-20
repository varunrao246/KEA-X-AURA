import { describe, expect, it } from "vitest";
import { bandOf, computeMastery, WEIGHTS } from "./mastery";
import { att, NOW, seq } from "./test-helpers";

const base = { prereqScores: [100], hasLab: false, labScore: 0, asOf: NOW };
const score = (attempts: ReturnType<typeof seq>, o: Partial<typeof base> = {}) => computeMastery({ ...base, ...o, attempts }).score;

describe("mastery weights and bands", () => {
  it("uses the PRD weights, which sum to 100%", () => {
    expect(WEIGHTS).toEqual({ quiz: 0.4, recent: 0.2, prereq: 0.15, retention: 0.15, lab: 0.1 });
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it("maps scores to the four bands at their boundaries", () => {
    expect([0, 39].map(bandOf)).toEqual(["not-ready", "not-ready"]);
    expect([40, 59].map(bandOf)).toEqual(["learning", "learning"]);
    expect([60, 79].map(bandOf)).toEqual(["proficient", "proficient"]);
    expect([80, 100].map(bandOf)).toEqual(["mastered", "mastered"]);
  });
});

describe("computeMastery", () => {
  it("is zero with no attempts", () => expect(computeMastery({ ...base, attempts: [] }).score).toBe(0));

  it("rises with accuracy", () => {
    const scores = ["-----+++", "--+-+-++", "+++++-++", "++++++++"].map((p) => score(seq(p)));
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    expect(scores[3]).toBeGreaterThan(scores[0] + 30);
  });

  it("counts harder questions more (level-weighted accuracy)", () => {
    const hardRight = [...seq("++", { level: 1 }).map((a) => ({ ...a, correct: false })), ...seq("++++", { level: 4 })];
    const easyRight = [...seq("++", { level: 4 }).map((a) => ({ ...a, correct: false })), ...seq("++++", { level: 1 })];
    expect(score(hardRight)).toBeGreaterThan(score(easyRight));
  });

  it("weighs the most recent five answers (recent performance)", () => {
    const improving = seq("------+++++");
    const declining = seq("+++++------");
    expect(score(improving)).toBeGreaterThan(score(declining));
  });

  it("depends on prerequisite mastery", () => {
    const a = seq("++++++++");
    expect(score(a, { prereqScores: [90] })).toBeGreaterThan(score(a, { prereqScores: [30] }));
    expect(score(a, { prereqScores: [90] }) - score(a, { prereqScores: [30] })).toBeCloseTo(0.15 * 60, -0.5);
  });

  it("fades with time away (retention), but never below the floor", () => {
    const recent = seq("++++++++").map((a) => ({ ...a, createdAt: NOW.toISOString() }));
    const old = recent.map((a) => ({ ...a, createdAt: new Date(NOW.getTime() - 5 * 86_400_000).toISOString() }));
    const ancient = recent.map((a) => ({ ...a, createdAt: new Date(NOW.getTime() - 90 * 86_400_000).toISOString() }));
    expect(score(recent)).toBeGreaterThan(score(old));
    expect(computeMastery({ ...base, attempts: ancient }).parts.retention).toBe(40);
  });

  it("adds the virtual lab as 10% when the topic has one, and redistributes it when it does not", () => {
    const a = seq("++++++++");
    const withLab = score(a, { hasLab: true, labScore: 100 });
    const noLab = score(a, { hasLab: true, labScore: 0 });
    expect(withLab - noLab).toBeCloseTo(10, 0);
    expect(score(a, { hasLab: false })).toBeGreaterThanOrEqual(noLab);
  });

  it("needs evidence: one lucky answer cannot master a topic", () => {
    expect(score([att(true, { level: 4 })])).toBeLessThan(60);
    expect(score(seq("++++++++", { level: 4 }))).toBeGreaterThanOrEqual(80);
  });

  it("falls when a student keeps getting answers wrong", () => {
    const start = seq("++++++++");
    const after = [...start, ...seq("----")];
    expect(score(after)).toBeLessThan(score(start));
  });
});
