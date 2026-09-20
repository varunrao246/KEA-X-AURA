import { describe, expect, it } from "vitest";
import { decideTutorStrategy } from "./tutorStrategy";
import type { TutorContext } from "./tutorContext";

/** A fully-specified "everything is fine" baseline context, overridden per test. */
function ctx(overrides: Partial<TutorContext> = {}): TutorContext {
  return {
    studentId: "u-test", topicId: "resistance", topicName: "Resistance", learningObjective: "How materials oppose current.",
    question: {
      id: "q-1", displayedStem: "Calculate the current for V = 12 V and R = 6 Ω.", type: "numeric", unit: "A", level: 2,
      answer: "2", numericAnswer: 2, explanation: "I = V / R", formula: "I = V / R",
    },
    recentAttempts: [], recentAccuracy: 70, wrongStreak: 0, correctStreak: 0, attemptsOnTopic: 5, hintsGivenForCurrentQuestion: 0,
    mastery: { score: 55, band: "learning" }, struggle: { score: 25, level: "normal", mainSignal: null },
    prerequisite: { solid: true, weakestName: null, weakestScore: null }, lastTimingRatio: 1, misconception: null,
    lesson: { bigIdea: "Resistance opposes current flow.", formula: { expr: "I = V / R", legend: "..." } },
    ...overrides,
  };
}

describe("deterministic tutor strategy (PRD section 4)", () => {
  it("1. first wrong answer, otherwise normal -> a small hint, not a full re-teach", () => {
    const d = decideTutorStrategy(ctx({ wrongStreak: 1 }), "review");
    expect(d.strategy).toBe("socratic");
    expect(d.responseType).toBe("hint");
    expect(d.maxAssistLevel).toBe("minimal");
  });

  it("2. repeated wrong answer with a detected misconception -> misconception strategy", () => {
    const d = decideTutorStrategy(ctx({ wrongStreak: 3, misconception: { type: "formula_confusion", confidence: 0.8 } }), "review");
    expect(d.strategy).toBe("misconception");
    expect(d.responseType).toBe("misconception");
    expect(d.nextAction).toBe("retry");
    expect(d.reason).toMatch(/formula confusion/);
  });

  it("3. high struggle -> simplified / worked-example strategy, reduced cognitive load", () => {
    const d = decideTutorStrategy(ctx({ struggle: { score: 82, level: "immediate", mainSignal: "errors" } }), "review");
    expect(d.strategy).toBe("worked_example");
    expect(d.maxAssistLevel).toBe("worked-example");
    expect(d.nextAction).toBe("check_understanding");
  });

  it("4. weak prerequisite under real struggle -> prerequisite tutoring, takes priority over everything else", () => {
    const d = decideTutorStrategy(ctx({
      prerequisite: { solid: false, weakestName: "Voltage", weakestScore: 35 },
      struggle: { score: 70, level: "intervention", mainSignal: "prerequisite" },
      misconception: { type: "concept_gap", confidence: 0.5 }, wrongStreak: 3,
    }), "review");
    expect(d.strategy).toBe("prerequisite");
    expect(d.responseType).toBe("prerequisite");
    expect(d.nextAction).toBe("learn_prerequisite");
    expect(d.reason).toContain("Voltage");
  });

  it("5. high mastery -> challenge strategy, not more basics", () => {
    const d = decideTutorStrategy(ctx({ mastery: { score: 88, band: "mastered" }, struggle: { score: 10, level: "normal", mainSignal: null } }), "next-step");
    expect(d.strategy).toBe("challenge");
    expect(d.responseType).toBe("challenge");
    expect(d.nextAction).toBe("attempt");
  });

  it("6. correct-answer improvement after a wrong streak -> reduce scaffolding, encourage independence", () => {
    const d = decideTutorStrategy(ctx({ correctStreak: 2, attemptsOnTopic: 6, wrongStreak: 0 }), "next-step");
    expect(d.strategy).toBe("reduce_scaffolding");
    expect(d.maxAssistLevel).toBe("minimal");
  });

  it("7. hint progression: each call for the same question asks for the next hint level, never repeats or skips", () => {
    const d1 = decideTutorStrategy(ctx({ hintsGivenForCurrentQuestion: 0 }), "hint");
    const d2 = decideTutorStrategy(ctx({ hintsGivenForCurrentQuestion: 1 }), "hint");
    const d3 = decideTutorStrategy(ctx({ hintsGivenForCurrentQuestion: 2 }), "hint");
    expect([d1.hintLevel, d2.hintLevel, d3.hintLevel]).toEqual([1, 2, 3]);
    expect(d1.maxAssistLevel).toBe("minimal");
    expect(d3.maxAssistLevel).toBe("moderate"); // later hints may say a little more, but strategy still caps it
    expect([d1, d2, d3].every((d) => d.responseType === "hint" && d.nextAction === "retry")).toBe(true);
  });

  it("low accuracy with enough evidence -> simplify, before offering more questions", () => {
    const d = decideTutorStrategy(ctx({ attemptsOnTopic: 4, recentAccuracy: 30, struggle: { score: 45, level: "watch", mainSignal: "accuracy" } }), "review");
    expect(d.strategy).toBe("simplify");
  });

  it("fast + wrong -> conceptual check, not a full re-teach (likely misread, not a knowledge gap)", () => {
    const d = decideTutorStrategy(ctx({ wrongStreak: 1, lastTimingRatio: 0.3 }), "review");
    expect(d.strategy).toBe("conceptual_check");
  });

  it("slow + correct -> reinforce the reasoning that worked", () => {
    const d = decideTutorStrategy(ctx({ correctStreak: 1, wrongStreak: 0, lastTimingRatio: 2.2 }), "review");
    expect(d.strategy).toBe("reinforce");
  });

  it("the student's requested mode never overrides a real behavioral signal (misconception still wins over 'next-step')", () => {
    const d = decideTutorStrategy(ctx({ wrongStreak: 2, misconception: { type: "unit_confusion", confidence: 0.7 } }), "next-step");
    expect(d.strategy).toBe("misconception");
  });

  it("explain mode with no strong signal -> a concise concept explanation", () => {
    const d = decideTutorStrategy(ctx(), "explain");
    expect(d.responseType).toBe("explanation");
  });
});
