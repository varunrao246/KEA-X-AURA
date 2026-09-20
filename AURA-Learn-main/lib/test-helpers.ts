import { getHint, nextQuestion, submitAttempt } from "./practice";
import { buildSeed } from "./seed";
import type { Attempt, Level, Store } from "./types";

/** Shared helpers for the adaptive-engine tests. */

export const NOW = new Date("2026-09-26T10:00:00Z");
export const fresh = () => buildSeed(NOW);

let n = 0;
export function att(correct: boolean, o: { level?: Level; sec?: number; hints?: number; topicId?: string; minutesAgo?: number; skipped?: boolean } = {}): Attempt {
  n++;
  return {
    id: `t-${n}`, studentId: "u-test", questionId: `q-${n}`, topicId: o.topicId ?? "resistance", level: o.level ?? 2,
    answer: correct ? "ok" : "no", correct, skipped: !!o.skipped, timeTakenSec: o.sec ?? 30, hintsUsed: o.hints ?? 0,
    createdAt: new Date(NOW.getTime() - (o.minutesAgo ?? 100 - n % 100) * 60_000).toISOString(),
  };
}

/** Build a chronological list from a string like "++-+-" (+ correct, - wrong). */
export function seq(pattern: string, o: Parameters<typeof att>[1] = {}): Attempt[] {
  return [...pattern.replace(/\s/g, "")].map((c, i, all) => att(c === "+", { ...o, minutesAgo: all.length - i }));
}

/** Drives the real server-side flow (serve question -> optional hint -> submit) on one topic with a simulated clock. */
export function driver(store: Store, topicId = "resistance", studentId = "u-aarav") {
  let t = 0;
  const seen: string[] = [];
  return {
    store,
    step(right: boolean, o: { hint?: boolean; sec?: number } = {}) {
      t++;
      const sec = o.sec ?? 25;
      const submitAt = new Date(NOW.getTime() + t * 120_000);
      const serveAt = new Date(submitAt.getTime() - sec * 1000);
      const { question } = nextQuestion(store, studentId, topicId, seen, serveAt);
      seen.push(question.id);
      if (o.hint) getHint(store, studentId, question.id, new Date(serveAt.getTime() + 2000));
      const q = store.questions.find((x) => x.id === question.id)!;
      const answer = right ? q.answer : q.type === "mcq" ? q.options!.find((x) => x !== q.answer)! : "9999";
      return submitAttempt(store, studentId, { questionId: q.id, answer }, submitAt);
    },
  };
}
