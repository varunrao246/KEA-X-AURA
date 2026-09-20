import { gradeAnswer, pickQuestion, type LevelChange } from "./adaptive";
import type { PrerequisiteCheck } from "./curriculum";
import { runAdaptiveCycle, snapshot, topicAttempts } from "./engine";
import { recordEvent } from "./events";
import { getMasteryRow, recomputeStudentMastery } from "./mastery";
import type { StruggleLevel } from "./struggle";
import { getStudentState, getTopicState } from "./student";
import { summarizeIntervention, type InterventionSummary } from "./intervention";
import type { AdaptiveEvent, Attempt, Level, Question, Store, StruggleSignalSnapshot } from "./types";
export type { InterventionSummary };
import { UNLOCK_THRESHOLD } from "./curriculum";

/** What the browser is allowed to see about a question. Never the answer or explanation. */
export type PublicQuestion = Pick<Question, "id" | "topicId" | "level" | "type" | "stem" | "options" | "unit">;

export function toPublic(q: Question): PublicQuestion {
  return { id: q.id, topicId: q.topicId, level: q.level, type: q.type, stem: q.stem, options: q.options, unit: q.unit };
}

export class PracticeError extends Error {
  constructor(message: string, public status: number, public code: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

function assertOpen(store: Store, studentId: string, topicId: string) {
  const state = getStudentState(store, studentId);
  const topic = getTopicState(state, topicId);
  if (!topic) throw new PracticeError("Unknown topic", 404, "not_found");
  if (topic.locked) {
    throw new PracticeError(`${topic.name} is locked until ${topic.missing.map((m) => m.name).join(", ")} reaches ${UNLOCK_THRESHOLD}%.`, 403, "locked", { missing: topic.missing });
  }
  return topic;
}

/* ---------- Server-side time and hint tracking ---------- */

function upsertServe(store: Store, studentId: string, questionId: string, now: Date) {
  const existing = store.serves.find((s) => s.studentId === studentId && s.questionId === questionId);
  if (existing) return existing;
  const serve = { studentId, questionId, servedAt: now.toISOString(), hintsUsed: 0 };
  store.serves.push(serve);
  // Keep the table small: drop anything older than an hour.
  const cutoff = now.getTime() - 3_600_000;
  store.serves = store.serves.filter((s) => new Date(s.servedAt).getTime() > cutoff);
  return serve;
}

export function nextQuestion(store: Store, studentId: string, topicId: string, exclude: string[] = [], now = new Date()) {
  const topic = assertOpen(store, studentId, topicId);
  const q = pickQuestion({
    questions: store.questions.filter((x) => x.topicId === topicId),
    level: topic.level,
    history: store.attempts.filter((a) => a.studentId === studentId && a.topicId === topicId),
    exclude,
  });
  if (!q) throw new PracticeError("No questions available for this topic yet", 404, "empty");
  // A fresh serve restarts the clock for this question.
  store.serves = store.serves.filter((s) => !(s.studentId === studentId && s.questionId === q.id));
  upsertServe(store, studentId, q.id, now);
  // pickQuestion only returns an already-shown id once every fresh option at a workable level is used up
  // (see its own priority comment) — surface that here so the UI can say so instead of repeating silently.
  return { question: toPublic(q), level: topic.level, repeat: exclude.includes(q.id) };
}

export function getHint(store: Store, studentId: string, questionId: string, now = new Date()) {
  const q = store.questions.find((x) => x.id === questionId);
  if (!q) throw new PracticeError("Unknown question", 404, "not_found");
  assertOpen(store, studentId, q.topicId);
  upsertServe(store, studentId, questionId, now).hintsUsed = 1;
  return q.hint;
}

/* ---------- Submitting an answer ---------- */

export interface AttemptInput {
  questionId: string;
  answer: string;
  /** Used only when the server has no record of serving the question (e.g. in tests). */
  timeTakenSec?: number;
  hintsUsed?: number;
  skipped?: boolean;
  /** Which re-themed wording the student saw (for evaluating theming). Never affects grading. */
  theme?: Attempt["theme"];
}

export interface AttemptResult {
  correct: boolean;
  skipped: boolean;
  correctAnswer: string;
  explanation: string;
  formula?: string;
  tracked: { timeTakenSec: number; hintsUsed: number };
  mastery: { before: number; after: number; band: string };
  level: { before: Level; after: Level; change: LevelChange; reason: string; checkPrerequisites: boolean };
  struggle: { before: number; after: number; level: StruggleLevel; levelBefore: StruggleLevel; signals: StruggleSignalSnapshot[]; mainSignal: string | null };
  prerequisiteCheck: PrerequisiteCheck | null;
  /** The active case for this topic after this answer, or null. "change" says what just happened to it. */
  intervention: InterventionSummary | null;
  unlocked: { id: string; name: string }[];
  mastered: { id: string; name: string }[];
  events: AdaptiveEvent[];
  topicName: string;
}

export function submitAttempt(store: Store, studentId: string, input: AttemptInput, now = new Date()): AttemptResult {
  const q = store.questions.find((x) => x.id === input.questionId);
  if (!q) throw new PracticeError("Unknown question", 404, "not_found");
  assertOpen(store, studentId, q.topicId);

  // Time and hints come from the server's own record when it has one.
  const serve = store.serves.find((s) => s.studentId === studentId && s.questionId === q.id);
  const timeTaken = serve ? (now.getTime() - new Date(serve.servedAt).getTime()) / 1000 : Number(input.timeTakenSec) || 0;
  const hints = serve ? serve.hintsUsed : Number(input.hintsUsed) || 0;
  if (serve) store.serves = store.serves.filter((s) => s !== serve);

  const before = snapshot(store, studentId, q.topicId);
  const skipped = !!input.skipped;
  const correct = !skipped && gradeAnswer(q, input.answer);
  const attempt: Attempt = {
    id: `att-${now.getTime()}-${store.attempts.length}`,
    studentId, questionId: q.id, topicId: q.topicId, level: q.level,
    answer: skipped ? "(skipped)" : input.answer.slice(0, 200), correct, skipped,
    timeTakenSec: Math.max(0, Math.min(3600, Math.round(timeTaken))),
    hintsUsed: Math.max(0, Math.min(5, Math.round(hints))),
    createdAt: now.toISOString(),
    ...(input.theme ? { theme: input.theme } : {}),
  };
  store.attempts.push(attempt);

  const cycle = runAdaptiveCycle(store, studentId, q.topicId, before, now, "attempt");
  const topicName = store.topics.find((t) => t.id === q.topicId)?.name ?? q.topicId;
  const iv = cycle.intervention.intervention;

  return {
    correct, skipped,
    correctAnswer: q.type === "numeric" ? `${q.answer}${q.unit ? ` ${q.unit}` : ""}` : q.answer,
    explanation: q.explanation, formula: q.formula,
    tracked: { timeTakenSec: attempt.timeTakenSec, hintsUsed: attempt.hintsUsed },
    mastery: cycle.mastery,
    level: { before: cycle.level.before, after: cycle.level.after, change: cycle.level.change, reason: cycle.level.reason, checkPrerequisites: cycle.level.checkPrerequisites },
    struggle: {
      before: cycle.struggle.before.score, after: cycle.struggle.after.score,
      level: cycle.struggle.after.level, levelBefore: cycle.struggle.before.level,
      signals: cycle.struggle.after.signals, mainSignal: cycle.struggle.after.mainSignal,
    },
    prerequisiteCheck: cycle.prerequisiteCheck,
    intervention: iv && iv.status !== "resolved" ? summarizeIntervention(iv, cycle.intervention.change) : null,
    unlocked: cycle.unlocked, mastered: cycle.mastered, events: cycle.events, topicName,
  };
}

export interface LabResult {
  labId: string;
  score: number;
  mastery: { topicId: string; name: string; before: number; after: number; started: boolean }[];
  unlocked: { id: string; name: string }[];
}

export function recordLab(store: Store, studentId: string, labId: string, topicIds: string[], score: number, mistakes: number, now = new Date()): LabResult {
  const beforeState = getStudentState(store, studentId, now);
  const primary = topicIds.find((id) => !getTopicState(beforeState, id)?.locked) ?? topicIds[0];
  const before = snapshot(store, studentId, primary);
  store.labEvents.push({ id: `lab-${now.getTime()}-${store.labEvents.length}`, studentId, labId, score: Math.max(0, Math.min(100, Math.round(score))), mistakes: Math.max(0, Math.round(mistakes)), createdAt: now.toISOString() });
  recordEvent(store, { studentId, topicId: primary, type: "lab", tone: "good", title: `Lab completed: ${Math.round(score)}%`, detail: mistakes ? `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"} along the way. The result counts towards mastery.` : "No mistakes. The result counts towards mastery." }, now);
  const cycle = runAdaptiveCycle(store, studentId, primary, before, now, "lab");
  const after = getStudentState(store, studentId, now);
  return {
    labId, score: Math.round(score),
    mastery: topicIds.map((id) => ({ topicId: id, name: after.topics.find((t) => t.id === id)?.name ?? id, before: beforeState.topics.find((t) => t.id === id)?.score ?? 0, after: after.topics.find((t) => t.id === id)?.score ?? 0, started: after.topics.find((t) => t.id === id)?.started ?? false })),
    unlocked: cycle.unlocked,
  };
}

/** Mastery is stored per topic; keep this export for callers that need a fresh recompute. */
export { recomputeStudentMastery, getMasteryRow, topicAttempts };
