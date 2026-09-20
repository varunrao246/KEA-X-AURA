import { labsForTopic } from "@/content/labs";
import type { AdaptiveEvent, Intervention, Level, LearningPreference, Interest, Store, StudentProfile } from "./types";
import { eventsFor } from "./events";
import { buildPrereqMap, buildUnlockMap, findBlocker, isUnlocked, prerequisitesOf, topicStatus, UNLOCK_THRESHOLD, type PrereqRef, type TopicStatus } from "./curriculum";
import { struggleFor } from "./engine";
import { activeInterventionsOf } from "./intervention";
import { bandOf, buildContext, scoreTopicAt, type MasteryBand, type ScoreResult } from "./mastery";
import { STRUGGLE_LEVEL_LABEL, type StruggleLevel } from "./struggle";

/**
 * The single read model for the student experience. Every student screen renders from this,
 * so the dashboard, path, topic page and profile can never disagree with each other.
 */

const DAY = 86_400_000;

export type { TopicStatus };
export type PrereqState = PrereqRef;

export interface TopicState {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  score: number;
  band: MasteryBand;
  status: TopicStatus;
  started: boolean;
  attempts: number;
  accuracy: number;
  level: Level;
  lastActivity: string | null;
  locked: boolean;
  prereqs: PrereqState[];
  missing: PrereqState[];
  unlocks: { id: string; name: string }[];
  labIds: string[];
  /** Mastery breakdown, so the UI can show exactly how the score was built. */
  parts: ScoreResult["parts"];
  struggle: { score: number; level: StruggleLevel; label: string; insufficientEvidence: boolean };
}

export interface CourseState {
  subjectId: string;
  name: string;
  courseTitle: string;
  accent: "brand" | "accent" | "success";
  goalTopicId: string;
  topics: TopicState[];
  /** Mean mastery across the chain, 0-100. */
  progress: number;
  masteredCount: number;
  /** First unlocked topic that is not yet mastered. */
  currentTopicId: string | null;
  goalLocked: boolean;
}

export interface StudentState {
  student: { id: string; name: string; firstName: string; grade?: number; school?: string };
  profile: StudentProfile;
  topics: TopicState[];
  courses: CourseState[];
  overall: {
    mastery: number;
    weeklyDelta: number;
    streak: number;
    /** Last 7 days, oldest first. */
    activity: { date: string; label: string; count: number; today: boolean }[];
    accuracy: number;
    questionsThisWeek: number;
    trend: { date: string; label: string; value: number }[];
  };
  currentTopicId: string | null;
  attention: TopicState[];
  labCompleted: Record<string, number>;
  /** Open intervention cases for this student (status is not "resolved"). */
  interventions: Intervention[];
  /** Latest adaptive decisions, newest first. */
  events: AdaptiveEvent[];
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const round = (n: number) => Math.round(n);

export function getStudentState(store: Store, studentId: string, now = new Date()): StudentState {
  const user = store.users.find((u) => u.id === studentId);
  const profile = store.studentProfiles.find((p) => p.studentId === studentId);
  if (!user || !profile) throw new Error(`Unknown student ${studentId}`);

  const ctx = buildContext(store, studentId);
  const memo = new Map();
  const nameOf = new Map(store.topics.map((t) => [t.id, t.name]));

  const prereqMap = buildPrereqMap(store.prerequisites);
  const unlockMap = buildUnlockMap(store.prerequisites);
  const scores = new Map(store.mastery.filter((m) => m.studentId === studentId).map((m) => [m.topicId, m.score]));

  const topicStates: TopicState[] = store.topics.map((t) => {
    const row = store.mastery.find((m) => m.studentId === studentId && m.topicId === t.id);
    const score = row?.score ?? 0;
    const prereqs = prerequisitesOf(t.id, prereqMap, scores, nameOf);
    const missing = prereqs.filter((p) => !p.ok);
    const locked = !isUnlocked(prereqs);
    const attempts = row?.attempts ?? 0;
    const accuracy = row?.accuracy ?? 0;
    const struggle = struggleFor(store, studentId, t.id);
    const status = topicStatus({ locked, score, attempts, accuracy, struggling: struggle.level === "intervention" || struggle.level === "immediate" });
    return {
      id: t.id, subjectId: t.subjectId, name: t.name, description: t.description, order: t.order,
      score, band: bandOf(score), status, started: attempts > 0, attempts, accuracy,
      level: row?.level ?? 1, lastActivity: row?.lastActivity ?? null, locked, prereqs, missing,
      unlocks: (unlockMap.get(t.id) ?? []).map((id) => ({ id, name: nameOf.get(id) ?? id })),
      labIds: labsForTopic(t.id).map((l) => l.id),
      parts: scoreTopicAt(ctx, t.id, now, memo).parts,
      struggle: { score: struggle.score, level: struggle.level, label: STRUGGLE_LEVEL_LABEL[struggle.level], insufficientEvidence: struggle.insufficientEvidence },
    };
  });

  const courses: CourseState[] = store.subjects.map((s) => {
    const ts = topicStates.filter((t) => t.subjectId === s.id).sort((a, b) => a.order - b.order);
    const goal = ts.find((t) => t.id === s.goalTopicId);
    return {
      subjectId: s.id, name: s.name, courseTitle: s.courseTitle, accent: s.accent, goalTopicId: s.goalTopicId,
      topics: ts,
      progress: round(ts.reduce((sum, t) => sum + t.score, 0) / Math.max(1, ts.length)),
      masteredCount: ts.filter((t) => t.status === "mastered").length,
      currentTopicId: ts.find((t) => !t.locked && t.status !== "mastered")?.id ?? null,
      goalLocked: goal?.locked ?? false,
    };
  });

  /* ---- overall metrics ---- */
  const overallAt = (d: Date) => {
    const m = new Map();
    const scores = store.topics.map((t) => scoreTopicAt(ctx, t.id, d, m)).filter((r) => r.attempts > 0).map((r) => r.score);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };
  const mastery = round(overallAt(now));
  const weeklyDelta = mastery - round(overallAt(new Date(now.getTime() - 7 * DAY)));

  const activeDays = new Set<string>();
  const perDay = new Map<string, number>();
  for (const a of ctx.attempts) {
    const k = dayKey(new Date(a.createdAt));
    activeDays.add(k);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  for (const l of ctx.labEvents) activeDays.add(dayKey(new Date(l.createdAt)));

  // Streak: consecutive active days ending today, or yesterday if today has no activity yet.
  let streak = 0;
  let cursor = new Date(now);
  if (!activeDays.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
  while (activeDays.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY);
  }

  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * DAY);
    return { date: dayKey(d), label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), count: perDay.get(dayKey(d)) ?? 0, today: i === 6 };
  });

  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * DAY);
    return { date: dayKey(d), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), value: round(overallAt(d)) };
  });

  const recent = ctx.attempts.slice(-20);
  const accuracy = recent.length ? round((recent.filter((a) => a.correct).length / recent.length) * 100) : 0;
  const weekAgo = now.getTime() - 7 * DAY;
  const questionsThisWeek = ctx.attempts.filter((a) => new Date(a.createdAt).getTime() > weekAgo).length;

  /* ---- current topic: most recent unlocked, unmastered topic; else the first open one ---- */
  let currentTopicId: string | null = null;
  for (let i = ctx.attempts.length - 1; i >= 0 && !currentTopicId; i--) {
    const t = topicStates.find((x) => x.id === ctx.attempts[i].topicId);
    if (t && !t.locked && t.status !== "mastered") currentTopicId = t.id;
  }
  currentTopicId ??= courses.find((c) => c.currentTopicId)?.currentTopicId ?? null;

  return {
    student: { id: user.id, name: user.name, firstName: user.name.split(" ")[0], grade: user.grade, school: user.school },
    profile,
    topics: topicStates,
    courses,
    overall: { mastery, weeklyDelta, streak, activity, accuracy, questionsThisWeek, trend },
    currentTopicId,
    attention: topicStates.filter((t) => t.status === "attention"),
    labCompleted: Object.fromEntries(
      ctx.labEvents.reduce((m, e) => m.set(e.labId, Math.max(m.get(e.labId) ?? 0, e.score)), new Map<string, number>()),
    ),
    interventions: activeInterventionsOf(store, studentId),
    events: eventsFor(store, studentId, { limit: 12 }),
  };
}

export function getTopicState(state: StudentState, topicId: string) {
  return state.topics.find((t) => t.id === topicId);
}

/* ================= Recommendations ================= */

export interface Recommendation {
  id: string;
  kind: "practice" | "learn" | "lab" | "continue" | "explore" | "intervention";
  title: string;
  reason: string;
  href: string;
  cta: string;
  topicId: string;
  priority: number;
}

export function recommend(state: StudentState, limit = 4): Recommendation[] {
  const pref: LearningPreference | undefined = state.profile.learningPreference;
  const out: Recommendation[] = [];
  const byId = new Map(state.topics.map((t) => [t.id, t]));

  // 0. AURA's own intervention for a struggling topic goes first, with its reason.
  for (const iv of state.interventions) {
    const step = iv.actions.find((a) => a.kind === "prerequisite") ?? iv.actions.find((a) => a.href);
    if (!step?.href) continue;
    out.push({ id: `iv-${iv.id}`, kind: "intervention", topicId: iv.topicId, title: step.label, reason: iv.reason.split(". ")[0].replace(/\.$/, "") + ".", href: step.href, cta: "Take the suggested step", priority: 200 });
  }

  // 1. The gap that blocks a course goal.
  for (const c of state.courses) {
    if (!c.goalLocked) continue;
    const goal = byId.get(c.goalTopicId)!;
    const blocker = c.topics.find((t) => !t.locked && t.status !== "mastered" && goal.missing.some((m) => m.id === t.id)) ?? c.topics.find((t) => !t.locked && t.status !== "mastered");
    if (!blocker) continue;
    out.push({
      id: `gap-${blocker.id}`, kind: "practice", topicId: blocker.id,
      title: `Practice ${blocker.name}`,
      reason: !blocker.started
        ? `${blocker.name} is your next step towards ${goal.name}.`
        : blocker.id === goal.missing[0]?.id
          ? `${blocker.name} is what's holding back ${goal.name}. You're at ${blocker.score}%; reach ${UNLOCK_THRESHOLD}% to unlock it.`
          : `Build up ${blocker.name} to move towards ${goal.name}.`,
      href: `/student/learn/${blocker.id}?tab=practice`, cta: "Start practice",
      priority: 100 + (blocker.status === "attention" ? 25 : 0) + (blocker.started ? 5 : 0) + (pref === "practice-first" ? 15 : 0),
    });
    if (pref === "explanation-first") {
      out.push({ id: `learn-${blocker.id}`, kind: "learn", topicId: blocker.id, title: `Revisit ${blocker.name}`, reason: "You like to understand it first. Read the short explanation before practising.", href: `/student/learn/${blocker.id}?tab=learn`, cta: "Read the concept", priority: 105 });
    }
  }

  // 2. Other weak topics.
  for (const t of state.attention) {
    if (out.some((r) => r.topicId === t.id && r.kind === "practice")) continue;
    out.push({ id: `weak-${t.id}`, kind: "practice", topicId: t.id, title: `Strengthen ${t.name}`, reason: `You're at ${t.score}% with ${t.accuracy}% accuracy. A short session will help.`, href: `/student/learn/${t.id}?tab=practice`, cta: "Start practice", priority: 80 });
  }

  // 3. A virtual lab for the topic being worked on.
  const focusId = out.find((r) => r.kind === "practice")?.topicId ?? state.currentTopicId;
  const focus = focusId ? byId.get(focusId) : undefined;
  if (focus) {
    const labId = focus.labIds.find((id) => state.labCompleted[id] === undefined);
    if (labId) {
      const boost = pref === "interactive" ? 40 : pref === "visual" ? 20 : 0;
      out.push({
        id: `lab-${labId}`, kind: "lab", topicId: focus.id, title: "Try the virtual lab",
        reason: pref === "interactive" ? `Hands-on suits you. Experiment with ${focus.name} and see it happen.` : `Labs count for part of your mastery and make ${focus.name} click.`,
        href: `/student/labs/${labId}`, cta: "Open lab", priority: 70 + boost,
      });
    }
  }

  // 4. Continue where you left off.
  if (state.currentTopicId && !out.some((r) => r.topicId === state.currentTopicId && r.kind === "practice")) {
    const t = byId.get(state.currentTopicId)!;
    out.push({ id: `continue-${t.id}`, kind: "continue", topicId: t.id, title: `Continue ${t.name}`, reason: t.started ? `You're ${t.score}% of the way there.` : "Ready when you are.", href: `/student/learn/${t.id}`, cta: "Continue", priority: 60 });
  }

  // 5. Something new in another course.
  for (const c of state.courses) {
    if (c.topics.some((t) => t.id === focusId)) continue;
    const next = c.topics.find((t) => !t.locked && t.status !== "mastered");
    if (next) out.push({ id: `explore-${next.id}`, kind: "explore", topicId: next.id, title: `${next.started ? "Keep going with" : "Start"} ${next.name}`, reason: `Part of ${c.courseTitle}. It's unlocked and ready.`, href: `/student/learn/${next.id}`, cta: next.started ? "Continue" : "Start", priority: 40 });
  }

  const seen = new Set<string>();
  return out
    .sort((a, b) => b.priority - a.priority)
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .slice(0, limit);
}

/* ================= Learning profile insights ================= */

export interface Insight { title: string; detail: string }

export function profileInsights(store: Store, studentId: string, state: StudentState): { strengths: Insight[]; attention: Insight[] } {
  const attempts = store.attempts.filter((a) => a.studentId === studentId);
  const questionType = new Map(store.questions.map((q) => [q.id, q.type]));
  const acc = (xs: typeof attempts) => (xs.length ? Math.round((xs.filter((a) => a.correct).length / xs.length) * 100) : null);
  const basics = attempts.filter((a) => a.level <= 2);
  const hard = attempts.filter((a) => a.level >= 3);
  const numeric = attempts.filter((a) => questionType.get(a.questionId) === "numeric");
  const concept = attempts.filter((a) => questionType.get(a.questionId) === "mcq");
  const hintRate = attempts.length ? attempts.reduce((s, a) => s + a.hintsUsed, 0) / attempts.length : 0;
  const labs = Object.values(state.labCompleted);

  const strengths: Insight[] = [];
  const attention: Insight[] = [];

  const basicsAcc = acc(basics);
  if (basicsAcc !== null && basics.length >= 5 && basicsAcc >= 75) strengths.push({ title: "Core concepts", detail: `${basicsAcc}% correct on identify and apply questions` });
  const mastered = state.topics.filter((t) => t.status === "mastered");
  if (mastered.length) strengths.push({ title: `Strong in ${mastered.slice(0, 2).map((t) => t.name).join(" and ")}`, detail: `${mastered.length} topic${mastered.length > 1 ? "s" : ""} mastered so far` });
  if (labs.length && labs.reduce((a, b) => a + b, 0) / labs.length >= 75) strengths.push({ title: "Hands-on experiments", detail: `Average lab score ${Math.round(labs.reduce((a, b) => a + b, 0) / labs.length)}%` });
  if (attempts.length >= 8 && hintRate < 0.25) strengths.push({ title: "Works independently", detail: "Rarely needs hints to get to an answer" });
  if (state.overall.streak >= 3) strengths.push({ title: "Consistent learner", detail: `${state.overall.streak}-day learning streak` });
  if (state.profile.learningPreference === "visual") strengths.push({ title: "Visual learner", detail: "AURA leads with diagrams, graphs and labs" });

  const hardAcc = acc(hard);
  if (hardAcc !== null && hard.length >= 5 && hardAcc < 65) attention.push({ title: "Multi-step problems", detail: `${hardAcc}% correct at Solve and Challenge level` });
  const numAcc = acc(numeric);
  const conAcc = acc(concept);
  if (numAcc !== null && conAcc !== null && numeric.length >= 4 && numAcc < conAcc - 8) attention.push({ title: "Mathematical application", detail: `${numAcc}% on calculations vs ${conAcc}% on concept questions` });
  for (const t of state.attention.slice(0, 2)) attention.push({ title: t.name, detail: `${t.score}% mastery${t.unlocks[0] ? `, needed for ${t.unlocks[0].name}` : ""}` });
  if (attempts.length >= 8 && hintRate >= 0.4) attention.push({ title: "Leans on hints", detail: "Try one more attempt before opening a hint" });

  return { strengths: strengths.slice(0, 4), attention: attention.slice(0, 4) };
}

export const INTEREST_LABELS: Record<Interest, string> = {
  space: "Space", sports: "Sports", gaming: "Gaming", animals: "Animals", technology: "Technology", environment: "Environment", art: "Art",
};
export const PREFERENCE_LABELS: Record<LearningPreference, string> = {
  visual: "Visual", "practice-first": "Practice-first", "explanation-first": "Explanation-first", interactive: "Interactive",
};
