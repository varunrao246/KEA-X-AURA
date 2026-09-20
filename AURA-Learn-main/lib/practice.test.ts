import { describe, expect, it } from "vitest";
import { nextQuestion, submitAttempt } from "./practice";
import { fresh, NOW } from "./test-helpers";

/**
 * Regression coverage for the practice-loop bug report: the adaptive engine intentionally repeats
 * the least-recently-seen question once a level's own pool is exhausted (see pickQuestion's doc
 * comment in adaptive.ts) — that's correct, tested behaviour, not a bug. What was missing is any
 * signal that this happened, so the UI could not tell a genuine repeat apart from a fresh question.
 */
describe("nextQuestion reports genuine repeats (session-scoped uniqueness, PRD bug-fix section 3/9)", () => {
  it("marks fresh questions as not-a-repeat, then flags it once the topic runs out of unseen questions", () => {
    const store = fresh();
    // acids-bases has exactly 2 questions at level 3 (the level Aarav starts this topic at).
    const seen: string[] = [];
    const rows: { repeat: boolean; questionId: string }[] = [];
    let t = NOW.getTime();
    for (let i = 0; i < 5; i++) {
      t += 60_000;
      const { question, repeat } = nextQuestion(store, "u-aarav", "acids-bases", seen, new Date(t));
      rows.push({ repeat, questionId: question.id });
      seen.push(question.id);
      t += 30_000;
      const full = store.questions.find((q) => q.id === question.id)!;
      submitAttempt(store, "u-aarav", { questionId: question.id, answer: full.answer }, new Date(t));
    }
    // The first two serves are the topic's only two level-3 questions — genuinely fresh.
    expect(rows[0].repeat).toBe(false);
    expect(rows[1].repeat).toBe(false);
    expect(rows[0].questionId).not.toBe(rows[1].questionId);
    // From the third serve on, the level-3 pool is exhausted, so every serve re-shows one of the
    // same two questions — and must now say so.
    expect(rows.slice(2).every((r) => r.repeat)).toBe(true);
    expect(rows.slice(2).map((r) => r.questionId)).toEqual(expect.arrayContaining([rows[0].questionId, rows[1].questionId]));
  });

  it("never marks a genuinely unseen question as a repeat, even on the very first serve of a session", () => {
    const store = fresh();
    const { repeat } = nextQuestion(store, "u-aarav", "resistance", [], NOW);
    expect(repeat).toBe(false);
  });

  it("does not affect grading, mastery or the adaptive cycle — it is purely informational", () => {
    const store = fresh();
    const seen: string[] = [];
    let t = NOW.getTime();
    let lastMastery = -1;
    for (let i = 0; i < 4; i++) {
      t += 60_000;
      const { question } = nextQuestion(store, "u-aarav", "acids-bases", seen, new Date(t));
      seen.push(question.id);
      t += 30_000;
      const full = store.questions.find((q) => q.id === question.id)!;
      const r = submitAttempt(store, "u-aarav", { questionId: question.id, answer: full.answer }, new Date(t));
      expect(r.correct).toBe(true); // grading is unaffected by whether the serve was a repeat
      expect(r.mastery.after).toBeGreaterThanOrEqual(lastMastery);
      lastMastery = r.mastery.after;
    }
  });
});
