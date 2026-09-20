import { getStudentState, profileInsights, recommend, type StudentState } from "./student";
import type { Intervention, Store } from "./types";

/**
 * The facilitator read model. Every number here is derived from the SAME store the student
 * experience reads (lib/student.ts, lib/intervention.ts) — no second mastery/struggle/risk score,
 * no invented metrics. This module only aggregates and joins names for display.
 */

export interface QueueItem extends Intervention {
  studentName: string;
  topicName: string;
}

/** Active (not resolved) interventions, most urgent first. Same ranking the student-facing GET already used. */
export function interventionQueue(store: Store): QueueItem[] {
  const names = new Map(store.users.map((u) => [u.id, u.name]));
  const topics = new Map(store.topics.map((t) => [t.id, t.name]));
  const rank = { immediate: 2, intervention: 1 } as const;
  return store.interventions
    .filter((i) => i.status !== "resolved")
    .sort((a, b) => Number(b.studentRequestedHelp) - Number(a.studentRequestedHelp) || rank[b.severity] - rank[a.severity] || b.riskScore - a.riskScore)
    .map((i) => ({ ...i, studentName: names.get(i.studentId) ?? i.studentId, topicName: topics.get(i.topicId) ?? i.topicId }));
}

export interface FacilitatorOverview {
  studentsNeedingAttention: number;
  activeInterventions: number;
  recentlyResolved: number;
  /** One real, derived observation, or null when nothing is concentrated enough to be worth saying. */
  topicInsight: string | null;
}

const DAY = 86_400_000;

/** Counts and a single grounded insight, never a fabricated risk score. */
export function facilitatorOverview(store: Store, now = new Date()): FacilitatorOverview {
  const active = store.interventions.filter((i) => i.status !== "resolved");
  const dayAgo = now.getTime() - DAY;
  const recentlyResolved = store.interventions.filter((i) => i.status === "resolved" && i.resolvedAt && new Date(i.resolvedAt).getTime() >= dayAgo).length;

  const byTopic = new Map<string, number>();
  for (const iv of active) byTopic.set(iv.topicId, (byTopic.get(iv.topicId) ?? 0) + 1);
  let topTopicId: string | null = null;
  let topCount = 0;
  for (const [id, count] of byTopic) if (count > topCount) { topTopicId = id; topCount = count; }
  const topicName = topTopicId ? (store.topics.find((t) => t.id === topTopicId)?.name ?? topTopicId) : null;

  return {
    studentsNeedingAttention: new Set(active.map((i) => i.studentId)).size,
    activeInterventions: active.length,
    recentlyResolved,
    topicInsight: topicName && topCount >= 2 ? `${topicName} is currently generating the most active interventions (${topCount} student${topCount === 1 ? "" : "s"}).` : null,
  };
}

export interface StudentRow {
  id: string;
  name: string;
  grade?: number;
  mastery: number;
  masteredCount: number;
  topicCount: number;
  activeInterventions: number;
  status: "ok" | "attention";
}

/** One row per student, for the class roster. Mastery/attention come straight from getStudentState. */
export function studentsOverview(store: Store, now = new Date()): StudentRow[] {
  return store.users
    .filter((u) => u.role === "student")
    .map((u) => {
      const state = getStudentState(store, u.id, now);
      const active = store.interventions.filter((i) => i.studentId === u.id && i.status !== "resolved").length;
      return {
        id: u.id, name: u.name, grade: u.grade, mastery: state.overall.mastery,
        masteredCount: state.courses.reduce((s, c) => s + c.masteredCount, 0),
        topicCount: state.topics.length, activeInterventions: active,
        status: active > 0 ? "attention" as const : "ok" as const,
      };
    })
    .sort((a, b) => b.activeInterventions - a.activeInterventions || a.name.localeCompare(b.name));
}

export interface StudentDetail {
  state: StudentState;
  insights: { strengths: { title: string; detail: string }[]; attention: { title: string; detail: string }[] };
  recommended: ReturnType<typeof recommend>;
}

/** Everything a facilitator's student-detail view needs, assembled from the existing read models. */
export function studentDetail(store: Store, studentId: string, now = new Date()): StudentDetail {
  const state = getStudentState(store, studentId, now);
  return { state, insights: profileInsights(store, studentId, state), recommended: recommend(state, 3) };
}
