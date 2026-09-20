import { describe, expect, it } from "vitest";
import type { PrereqRef } from "./curriculum";
import {
  computeStruggle, excessiveTimeSignal, hintDependencySignal, lowAccuracySignal, MIN_EVIDENCE, prerequisiteWeaknessSignal,
  repeatedErrorsSignal, STRUGGLE_THRESHOLDS, STRUGGLE_WEIGHTS, struggleLevelOf,
} from "./struggle";
import { att, seq } from "./test-helpers";

const solid: PrereqRef[] = [{ id: "voltage", name: "Voltage", score: 85, ok: true }];
const weak: PrereqRef[] = [{ id: "voltage", name: "Voltage", score: 35, ok: false }];
const run = (attempts: ReturnType<typeof seq>, prereqs = solid) => computeStruggle({ attempts, prereqs });

describe("struggle weights and bands", () => {
  it("uses the PRD weights, which sum to 100%", () => {
    expect(STRUGGLE_WEIGHTS).toEqual({ errors: 0.25, accuracy: 0.25, time: 0.2, prerequisite: 0.15, hints: 0.15 });
    expect(Object.values(STRUGGLE_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it("uses the PRD risk bands", () => {
    expect(STRUGGLE_THRESHOLDS).toEqual({ watch: 40, intervention: 60, immediate: 80 });
    expect([0, 39].map(struggleLevelOf)).toEqual(["normal", "normal"]);
    expect([40, 59].map(struggleLevelOf)).toEqual(["watch", "watch"]);
    expect([60, 79].map(struggleLevelOf)).toEqual(["intervention", "intervention"]);
    expect([80, 100].map(struggleLevelOf)).toEqual(["immediate", "immediate"]);
  });
});

describe("the five signals", () => {
  it("repeated errors: rises with the run of wrong answers", () => {
    const v = (p: string) => repeatedErrorsSignal(seq(p)).value;
    expect(v("++++")).toBe(0);
    expect(v("+++-")).toBe(25);
    expect(v("++--")).toBe(60);
    expect(v("+---")).toBe(85);
    expect(v("----")).toBe(100);
    expect(v("-+-+")).toBe(0);
    expect(repeatedErrorsSignal(seq("+---")).detail).toBe("3 wrong answers in a row");
  });

  it("low accuracy: 70% or better is fine, 0% is maximum", () => {
    expect(lowAccuracySignal(seq("+++-+++-++")).value).toBe(0);
    expect(lowAccuracySignal(seq("----")).value).toBe(100);
    expect(lowAccuracySignal(seq("+-+-")).value).toBeCloseTo(28.6, 0);
  });

  it("excessive time: measured against the expected time for each level", () => {
    expect(excessiveTimeSignal(seq("++++", { level: 2, sec: 30 })).value).toBe(0);
    expect(excessiveTimeSignal(seq("++++", { level: 2, sec: 67 })).value).toBeCloseTo(49, 0); // 1.49x
    expect(excessiveTimeSignal(seq("++++", { level: 2, sec: 120 })).value).toBe(100); // 2.7x, capped
    // The same 60s is normal at Level 3 (expected 75s) but slow at Level 1 (expected 30s).
    expect(excessiveTimeSignal(seq("++", { level: 3, sec: 60 })).value).toBe(0);
    expect(excessiveTimeSignal(seq("++", { level: 1, sec: 60 })).value).toBe(100);
  });

  it("hint dependency: share of questions where a hint was used", () => {
    expect(hintDependencySignal(seq("++++", { hints: 0 })).value).toBe(0);
    expect(hintDependencySignal(seq("++++", { hints: 1 })).value).toBe(100);
    expect(hintDependencySignal([att(true, { hints: 1 }), att(true), att(true), att(true), att(true)]).value).toBeCloseTo(33.3, 0);
  });

  it("prerequisite weakness: a shaky prerequisite, or missing the basics, both count", () => {
    expect(prerequisiteWeaknessSignal(seq("++++"), solid).value).toBe(0);
    expect(prerequisiteWeaknessSignal(seq("++++"), weak).value).toBeCloseTo(56.3, 0); // (80-35)/80
    const basics = seq("---", { level: 1 });
    expect(prerequisiteWeaknessSignal(basics, solid).value).toBe(100);
    // Missing hard questions does NOT suggest a foundation problem.
    expect(prerequisiteWeaknessSignal(seq("---", { level: 4 }), solid).value).toBe(0);
  });
});

describe("struggle score", () => {
  it("is 0 until there is enough evidence", () => {
    expect(MIN_EVIDENCE).toBe(3);
    expect(run(seq("--")).score).toBe(0);
    expect(run(seq("--")).insufficientEvidence).toBe(true);
    expect(run(seq("---")).score).toBeGreaterThan(0);
  });

  it("equals the weighted sum of the five signals", () => {
    const r = run(seq("+-----", { level: 2, sec: 60, hints: 1 }), weak);
    const sum = r.signals.reduce((s, x) => s + x.value * x.weight, 0);
    expect(r.score).toBe(Math.round(sum));
    expect(r.signals.map((s) => s.key)).toEqual(["errors", "accuracy", "time", "prerequisite", "hints"]);
    expect(r.signals.reduce((s, x) => s + x.points, 0)).toBeCloseTo(sum, 0);
  });

  it("is low for a student doing well", () => {
    const r = run(seq("+++++-+++", { sec: 25 }));
    expect(r.score).toBeLessThan(STRUGGLE_THRESHOLDS.watch);
    expect(r.level).toBe("normal");
  });

  it("reaches 'intervention recommended' with repeated errors, low accuracy, slow answers and hints", () => {
    const r = run(seq("++--------", { level: 2, sec: 80, hints: 1 }), solid);
    expect(r.score).toBeGreaterThanOrEqual(STRUGGLE_THRESHOLDS.intervention);
  });

  it("reaches 'immediate' when everything points the same way", () => {
    const r = run(seq("--------", { level: 1, sec: 90, hints: 1 }), weak);
    expect(r.score).toBeGreaterThanOrEqual(STRUGGLE_THRESHOLDS.immediate);
    expect(r.level).toBe("immediate");
  });

  it("names the signal contributing the most", () => {
    expect(run(seq("+++----", { level: 3, sec: 30 })).mainSignal).toBe("errors");
    expect(run(seq("-+-+-+-+", { level: 3, sec: 30, hints: 1 })).mainSignal).toBe("hints");
  });

  it("falls again when the student recovers, because only the last 8 answers count", () => {
    const poor = seq("--------", { sec: 80, hints: 1 });
    const recovered = [...poor, ...seq("++++++++", { sec: 25 })];
    expect(run(recovered).score).toBeLessThan(run(poor).score - 50);
    expect(run(recovered).level).toBe("normal");
  });
});
