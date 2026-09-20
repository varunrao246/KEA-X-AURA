import type { Prerequisite, Topic } from "./types";

/**
 * Curriculum graph logic: prerequisites, mastery gating and unlocking.
 * Pure functions over plain data, so they are easy to test and reuse on server and client.
 *
 * Rule: a topic is unlocked only when EVERY prerequisite has mastery >= UNLOCK_THRESHOLD (60, "Proficient").
 */

export const UNLOCK_THRESHOLD = 60;
export const MASTERED_THRESHOLD = 80;
/** A prerequisite below this is "solid enough" to build on comfortably; used by the struggle model. */
export const SOLID_THRESHOLD = 80;

export type TopicStatus = "mastered" | "learning" | "attention" | "locked";

export interface PrereqRef {
  id: string;
  name: string;
  score: number;
  ok: boolean;
}

export function buildPrereqMap(edges: Prerequisite[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) m.set(e.topicId, [...(m.get(e.topicId) ?? []), e.prerequisiteId]);
  return m;
}

export function buildUnlockMap(edges: Prerequisite[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) m.set(e.prerequisiteId, [...(m.get(e.prerequisiteId) ?? []), e.topicId]);
  return m;
}

/** Prerequisites of a topic with their current scores and whether each meets the unlock bar. */
export function prerequisitesOf(topicId: string, prereqs: Map<string, string[]>, scores: Map<string, number>, names: Map<string, string>): PrereqRef[] {
  return (prereqs.get(topicId) ?? []).map((id) => {
    const score = scores.get(id) ?? 0;
    return { id, name: names.get(id) ?? id, score, ok: score >= UNLOCK_THRESHOLD };
  });
}

export function isUnlocked(prereqRefs: PrereqRef[]): boolean {
  return prereqRefs.every((p) => p.ok);
}

export interface StatusInput {
  locked: boolean;
  score: number;
  attempts: number;
  accuracy: number;
  /** True when the struggle engine has flagged this topic (score >= 60). */
  struggling?: boolean;
}

/**
 * Status shown on the path.
 *  locked     a prerequisite is below 60
 *  mastered   score >= 80
 *  attention  started, under 60, and either accuracy under 60% or the struggle engine flagged it
 *  learning   everything else
 */
export function topicStatus(i: StatusInput): TopicStatus {
  if (i.locked) return "locked";
  if (i.score >= MASTERED_THRESHOLD) return "mastered";
  if (i.attempts >= 4 && i.score < UNLOCK_THRESHOLD && (i.accuracy < 60 || i.struggling)) return "attention";
  if (i.struggling && i.attempts >= 3) return "attention";
  return "learning";
}

export interface BlockerNode {
  id: string;
  locked: boolean;
  missing: { id: string }[];
}

/**
 * The topic a student should practise to get past a locked one: walk back through the missing
 * prerequisites until we reach one that is itself open.
 */
export function findBlocker<T extends BlockerNode>(topics: T[], topicId: string, seen = new Set<string>()): T | null {
  const topic = topics.find((t) => t.id === topicId);
  if (!topic || seen.has(topicId)) return null;
  seen.add(topicId);
  for (const m of topic.missing) {
    const prereq = topics.find((t) => t.id === m.id);
    if (!prereq) continue;
    if (!prereq.locked) return prereq;
    const deeper = findBlocker(topics, prereq.id, seen);
    if (deeper) return deeper;
  }
  return null;
}

/** Topics that were locked before and are open now. This is what "unlocking" means, computed rather than announced. */
export function newlyUnlocked(before: { id: string; locked: boolean }[], after: { id: string; locked: boolean }[]): string[] {
  const wasLocked = new Set(before.filter((t) => t.locked).map((t) => t.id));
  return after.filter((t) => !t.locked && wasLocked.has(t.id)).map((t) => t.id);
}

export interface PrerequisiteCheck {
  /** True when every prerequisite is at least SOLID_THRESHOLD, so the gap must be inside this topic. */
  solid: boolean;
  weakest: PrereqRef | null;
  message: string;
}

/**
 * The prerequisite check that runs when the adaptive engine lowers difficulty or the struggle score is high.
 * It answers: is the problem the foundation, or this topic itself?
 */
export function checkPrerequisites(topicName: string, prereqRefs: PrereqRef[]): PrerequisiteCheck {
  if (prereqRefs.length === 0) return { solid: true, weakest: null, message: `${topicName} has no prerequisites, so the gap is in the topic itself.` };
  const weakest = [...prereqRefs].sort((a, b) => a.score - b.score)[0];
  if (weakest.score < UNLOCK_THRESHOLD) {
    return { solid: false, weakest, message: `${weakest.name} is only at ${weakest.score}%. Strengthening it is likely to help with ${topicName}.` };
  }
  if (weakest.score < SOLID_THRESHOLD) {
    return { solid: false, weakest, message: `${weakest.name} is at ${weakest.score}%, passable but not solid. A quick refresher could help.` };
  }
  return { solid: true, weakest, message: `${weakest.name} looks solid at ${weakest.score}%, so the gap is inside ${topicName}.` };
}

/** Order topics so every prerequisite comes before the topics that need it (also detects cycles). */
export function topologicalOrder(topics: Pick<Topic, "id">[], edges: Prerequisite[]): string[] {
  const prereqs = buildPrereqMap(edges);
  const out: string[] = [];
  const state = new Map<string, 1 | 2>();
  const visit = (id: string) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) throw new Error(`Prerequisite cycle at ${id}`);
    state.set(id, 1);
    (prereqs.get(id) ?? []).forEach(visit);
    state.set(id, 2);
    out.push(id);
  };
  topics.forEach((t) => visit(t.id));
  return out;
}
