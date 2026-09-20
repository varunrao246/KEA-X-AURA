import { checkPrerequisites } from "../curriculum";
import { prereqRefsFor, struggleFor, topicAttempts } from "../engine";
import { bandOf } from "../mastery";
import { EXPECTED_SECONDS } from "../struggle";
import { correctStreakOf, wrongStreakOf } from "../tracking";
import type { Attempt, Level, Question, Store } from "../types";
import { LESSONS } from "@/content/lessons";

/** Holds internal question data (the answer, the explanation) — must never reach the browser. */
if (typeof window !== "undefined") throw new Error("lib/ai/tutorContext.ts must never be bundled for the browser");

/**
 * Builds the AI Tutor's context entirely from authoritative, server-held state — the same store
 * the adaptive engine itself reads. A client can only ever choose WHICH topic/question it's asking
 * about; it can never submit its own mastery, struggle, or history and have the tutor trust it.
 *
 * Nothing here is new persisted state: every signal is re-derived on each call from
 * store.attempts / store.mastery / store.serves, exactly like the rest of the engine.
 */

export type MisconceptionType = "formula_confusion" | "unit_confusion" | "arithmetic_error" | "concept_gap";

export interface TutorQuestionContext {
  id: string;
  /** The wording the student is actually looking at right now (may be AI-themed) — for natural reference only. */
  displayedStem: string;
  type: Question["type"];
  options?: string[];
  unit?: string;
  level: Level;
  /** Internal only — used to reason about and validate tutoring output. Never sent to the browser. */
  answer: string;
  numericAnswer?: number;
  explanation: string;
  formula?: string;
}

export interface TutorContext {
  studentId: string;
  topicId: string;
  topicName: string;
  learningObjective: string;
  question: TutorQuestionContext | null;
  recentAttempts: Attempt[];
  recentAccuracy: number;
  wrongStreak: number;
  correctStreak: number;
  attemptsOnTopic: number;
  /** How many progressive hints have already been given for the CURRENT question this serve. */
  hintsGivenForCurrentQuestion: number;
  mastery: { score: number; band: string };
  struggle: { score: number; level: string; mainSignal: string | null };
  prerequisite: { solid: boolean; weakestName: string | null; weakestScore: number | null };
  /** The most recent attempt's time as a multiple of the expected time for its level (>1 = slow). */
  lastTimingRatio: number | null;
  misconception: { type: MisconceptionType; confidence: number } | null;
  lesson: { bigIdea: string; formula?: { expr: string; legend: string } } | null;
}

/**
 * Deterministic misconception heuristic. Only fires with real evidence: at least two *wrong*
 * attempts at the *same* question (a genuine repeat, not just two different misses), and only for
 * numeric questions where the wrong values can be compared against the correct one. This is a
 * best-effort classification, never treated as academic fact — it only steers tutoring language.
 */
function detectMisconception(question: TutorQuestionContext | null, sameQuestionWrongAttempts: Attempt[]): TutorContext["misconception"] {
  if (!question || question.type !== "numeric" || question.numericAnswer === undefined) return null;
  if (sameQuestionWrongAttempts.length < 2) return null;

  const correct = question.numericAnswer;
  const wrongValues = sameQuestionWrongAttempts
    .slice(-2)
    .map((a) => Number(a.answer.replace(/[^\d.\-]/g, "")))
    .filter((n) => Number.isFinite(n) && n !== 0);
  if (wrongValues.length < 2) return null;

  const closeTo = (a: number, b: number, tol = 0.05) => Math.abs(a - b) <= Math.max(tol * Math.abs(b), 1e-9);
  const allMatch = (test: (v: number) => boolean) => wrongValues.every(test);

  if (correct !== 0 && allMatch((v) => closeTo(v, 1 / correct) || (v !== 0 && closeTo(1 / v, correct)))) {
    return { type: "formula_confusion", confidence: 0.75 };
  }
  if (allMatch((v) => closeTo(v, correct * 1000) || closeTo(v, correct / 1000) || closeTo(v, correct * 100) || closeTo(v, correct / 100))) {
    return { type: "unit_confusion", confidence: 0.65 };
  }
  if (allMatch((v) => Math.abs(v - correct) > 1e-9 && Math.abs(v - correct) <= Math.max(0.25 * Math.abs(correct), 1))) {
    return { type: "arithmetic_error", confidence: 0.55 };
  }
  return { type: "concept_gap", confidence: 0.5 };
}

export function buildTutorContext(
  store: Store,
  studentId: string,
  topicId: string,
  opts: { questionId?: string; displayedStem?: string } = {},
  now = new Date(),
): TutorContext {
  const topic = store.topics.find((t) => t.id === topicId);
  if (!topic) throw new Error(`Unknown topic ${topicId}`);

  const attempts = topicAttempts(store, studentId, topicId);
  const recentAttempts = attempts.slice(-8);
  const correctCount = recentAttempts.filter((a) => a.correct).length;
  const recentAccuracy = recentAttempts.length ? Math.round((correctCount / recentAttempts.length) * 100) : 0;

  const mastery = store.mastery.find((m) => m.studentId === studentId && m.topicId === topicId);
  const struggle = struggleFor(store, studentId, topicId);
  const prereqs = prereqRefsFor(store, studentId, topicId);
  const prereqCheck = checkPrerequisites(topic.name, prereqs);
  const weakest = prereqCheck.weakest;

  const last = attempts.at(-1);
  const lastTimingRatio = last ? Math.round((last.timeTakenSec / EXPECTED_SECONDS[last.level]) * 100) / 100 : null;

  let question: TutorQuestionContext | null = null;
  let sameQuestionWrongAttempts: Attempt[] = [];
  let hintsGivenForCurrentQuestion = 0;
  if (opts.questionId) {
    const q = store.questions.find((x) => x.id === opts.questionId && x.topicId === topicId);
    if (q) {
      question = {
        id: q.id, displayedStem: opts.displayedStem?.trim() || q.stem, type: q.type, options: q.options, unit: q.unit, level: q.level,
        answer: q.answer, numericAnswer: q.numericAnswer, explanation: q.explanation, formula: q.formula,
      };
      sameQuestionWrongAttempts = attempts.filter((a) => a.questionId === q.id && !a.correct);
      const serve = store.serves.find((s) => s.studentId === studentId && s.questionId === q.id);
      hintsGivenForCurrentQuestion = serve?.hintsUsed ?? 0;
    }
  }

  const lesson = LESSONS[topicId] ? { bigIdea: LESSONS[topicId].bigIdea, formula: LESSONS[topicId].formula } : null;

  return {
    studentId, topicId, topicName: topic.name, learningObjective: question?.explanation ? topic.description : topic.description,
    question,
    recentAttempts,
    recentAccuracy,
    wrongStreak: wrongStreakOf(attempts),
    correctStreak: correctStreakOf(attempts),
    attemptsOnTopic: attempts.length,
    hintsGivenForCurrentQuestion,
    mastery: { score: mastery?.score ?? 0, band: bandOf(mastery?.score ?? 0) },
    struggle: { score: struggle.score, level: struggle.level, mainSignal: struggle.mainSignal },
    prerequisite: { solid: prereqCheck.solid, weakestName: weakest?.name ?? null, weakestScore: weakest?.score ?? null },
    lastTimingRatio,
    misconception: detectMisconception(question, sameQuestionWrongAttempts),
    lesson,
  };
}

/** Bumps the progressive-hint counter for a question, reusing the existing serve record (no new store collection). */
export function bumpHintLevel(store: Store, studentId: string, questionId: string, now = new Date()): number {
  let serve = store.serves.find((s) => s.studentId === studentId && s.questionId === questionId);
  if (!serve) {
    serve = { studentId, questionId, servedAt: now.toISOString(), hintsUsed: 0 };
    store.serves.push(serve);
  }
  serve.hintsUsed = Math.min(5, serve.hintsUsed + 1);
  return serve.hintsUsed;
}
