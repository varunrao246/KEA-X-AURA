import { describe, expect, it } from "vitest";
import { gradeAnswer } from "./adaptive";
import { nextQuestion, PracticeError, submitAttempt, recordLab } from "./practice";
import { buildSeed } from "./seed";
import { getStudentState, getTopicState, profileInsights, recommend } from "./student";
import type { Question } from "./types";

const NOW = new Date("2026-09-26T10:00:00Z");
const fresh = () => buildSeed(NOW);
const answerFor = (store: ReturnType<typeof fresh>, id: string, right: boolean) => {
  const q = store.questions.find((x) => x.id === id)!;
  return right ? q.answer : q.type === "mcq" ? q.options!.find((o) => o !== q.answer)! : "9999";
};

describe("Aarav's starting story", () => {
  const store = fresh();
  const state = getStudentState(store, "u-aarav", NOW);
  const t = (id: string) => getTopicState(state, id)!;

  it("has strong Current and Voltage, weak Resistance, locked Ohm's Law", () => {
    expect(t("electric-current").status).toBe("mastered");
    expect(t("voltage").status).toBe("mastered");
    expect(t("resistance").status).toBe("attention");
    expect(t("resistance").score).toBeGreaterThanOrEqual(40);
    expect(t("resistance").score).toBeLessThan(60);
    expect(t("ohms-law").status).toBe("locked");
    expect(t("ohms-law").missing.map((m) => m.id)).toEqual(["resistance"]);
  });

  it("locks and unlocks the other courses from real prerequisite state", () => {
    expect(t("indicators").locked).toBe(false); // pH is proficient
    expect(t("titration").locked).toBe(true);
    expect(t("sensory-receptors").locked).toBe(false);
    expect(t("brain-response").locked).toBe(true);
  });

  it("derives believable dashboard numbers", () => {
    expect(state.overall.mastery).toBeGreaterThan(65);
    expect(state.overall.mastery).toBeLessThan(85);
    expect(state.overall.weeklyDelta).toBeGreaterThan(0);
    expect(state.overall.streak).toBe(6);
    expect(state.currentTopicId).toBe("resistance");
  });

  it("recommends the blocking gap first, with a reason", () => {
    const recs = recommend(state);
    expect(recs[0].topicId).toBe("resistance");
    expect(recs[0].reason).toContain("Ohm's Law");
  });

  it("derives strengths and needs-attention from behaviour", () => {
    const ins = profileInsights(store, "u-aarav", state);
    expect(ins.strengths.length).toBeGreaterThan(0);
    expect(ins.attention.some((a) => a.title === "Resistance")).toBe(true);
  });
});

describe("locked topics are actually blocked", () => {
  it("refuses questions and attempts on a locked topic", () => {
    const store = fresh();
    expect(() => nextQuestion(store, "u-aarav", "ohms-law")).toThrow(PracticeError);
    const q = store.questions.find((x) => x.topicId === "ohms-law")!;
    expect(() => submitAttempt(store, "u-aarav", { questionId: q.id, answer: q.answer, timeTakenSec: 5, hintsUsed: 0 }, NOW)).toThrow(/locked/i);
  });
});

describe("practising Resistance unlocks Ohm's Law", () => {
  it("raises mastery, adapts the level and unlocks the next topic", () => {
    const store = fresh();
    const start = getTopicState(getStudentState(store, "u-aarav", NOW), "resistance")!;
    let unlocked: string[] = [];
    let correctCount = 0;
    const seen: string[] = [];
    for (let i = 0; i < 14 && !unlocked.length; i++) {
      const { question } = nextQuestion(store, "u-aarav", "resistance", seen);
      seen.push(question.id);
      const r = submitAttempt(store, "u-aarav", { questionId: question.id, answer: answerFor(store, question.id, true), timeTakenSec: 20, hintsUsed: 0 }, new Date(NOW.getTime() + i * 60_000));
      correctCount++;
      unlocked = r.unlocked.map((u) => u.id);
    }
    const end = getTopicState(getStudentState(store, "u-aarav", NOW), "resistance")!;
    expect(end.score).toBeGreaterThan(start.score);
    expect(end.score).toBeGreaterThanOrEqual(60);
    expect(unlocked).toContain("ohms-law");
    // Must take real effort: not a one-click unlock, but not a slog either.
    expect(correctCount).toBeGreaterThanOrEqual(3);
    expect(correctCount).toBeLessThanOrEqual(10);
  });

  it("lowers the level after repeated mistakes and never below 1", () => {
    const store = fresh();
    const seen: string[] = [];
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const { question } = nextQuestion(store, "u-aarav", "resistance", seen);
      seen.push(question.id);
      const r = submitAttempt(store, "u-aarav", { questionId: question.id, answer: answerFor(store, question.id, false), timeTakenSec: 60, hintsUsed: 1 }, new Date(NOW.getTime() + i * 60_000));
      last = r.level.after;
      expect(r.correct).toBe(false);
    }
    expect(last).toBeGreaterThanOrEqual(1);
    expect(last).toBeLessThanOrEqual(2);
  });

  it("records a lab and feeds it into mastery", () => {
    const store = fresh();
    const r = recordLab(store, "u-aarav", "ohms-law-lab", ["resistance", "ohms-law"], 90, 1, NOW);
    expect(r.mastery.find((m) => m.topicId === "resistance")!.after).toBeGreaterThan(r.mastery.find((m) => m.topicId === "resistance")!.before);
  });
});

describe("grading", () => {
  const num = { type: "numeric", numericAnswer: 2, tolerance: 0.01, answer: "2" } as Question;
  it("accepts numeric answers with units and whitespace, rejects wrong ones", () => {
    for (const a of ["2", "2.0", "2 A", " 2A ", "2.00 amperes"]) expect(gradeAnswer(num, a), a).toBe(true);
    for (const a of ["3", "", "abc", "2.5"]) expect(gradeAnswer(num, a), a).toBe(false);
  });
  it("matches MCQ text exactly", () => {
    const q = { type: "mcq", answer: "Copper" } as Question;
    expect(gradeAnswer(q, "Copper")).toBe(true);
    expect(gradeAnswer(q, "Rubber")).toBe(false);
  });
});
