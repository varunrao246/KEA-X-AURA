import { labsForTopic } from "@/content/labs";
import type { PrerequisiteCheck } from "./curriculum";
import { recordEvent } from "./events";
import { STRUGGLE_THRESHOLDS, type StruggleResult } from "./struggle";
import { wrongStreakOf } from "./tracking";
import type { Attempt, Intervention, InterventionAction, InterventionStatus, Store } from "./types";

/**
 * Human-in-the-loop intervention (PRD sections 2.3, 13 and 18).
 *
 *   AI detects -> AI explains why -> AI recommends an action -> a human facilitator decides.
 *
 * AURA never resolves a case that a facilitator has begun to work on. It only:
 *   - opens a case when the struggle score reaches 60,
 *   - keeps its numbers up to date, and escalates at 80,
 *   - closes it by itself only if nobody has acted and the student is clearly back on track (score under 40).
 *
 * State machine: detected -> recommended -> viewed -> started -> responding -> resolved
 */

export const INTERVENTION_THRESHOLD = STRUGGLE_THRESHOLDS.intervention;
export const RECOVERY_THRESHOLD = STRUGGLE_THRESHOLDS.watch;

export const INTERVENTION_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  detected: ["recommended"],
  recommended: ["viewed", "resolved"],
  viewed: ["started", "resolved"],
  started: ["responding", "resolved"],
  responding: ["resolved"],
  resolved: [],
};

export function canTransition(from: InterventionStatus, to: InterventionStatus): boolean {
  return INTERVENTION_TRANSITIONS[from].includes(to);
}

export function activeInterventionFor(store: Store, studentId: string, topicId: string): Intervention | undefined {
  return store.interventions.find((i) => i.studentId === studentId && i.topicId === topicId && i.status !== "resolved");
}

export function activeInterventionsOf(store: Store, studentId: string): Intervention[] {
  return store.interventions.filter((i) => i.studentId === studentId && i.status !== "resolved");
}

/* ---------- Explanation and recommendation ---------- */

export interface InterventionContext {
  topicId: string;
  topicName: string;
  struggle: StruggleResult;
  prereqCheck: PrerequisiteCheck;
  /** The locked topic this one is holding back, if any. */
  blocks?: { id: string; name: string };
  /** Attempts on this topic, oldest first. */
  attempts: Attempt[];
}

const ISSUE_TITLE: Record<string, string> = {
  errors: "Repeated mistakes",
  accuracy: "Low accuracy",
  time: "Taking much longer than usual",
  prerequisite: "Shaky foundations",
  hints: "Relying on hints",
};

/** Turn the numbers into a specific, human sentence. Never just "your score is low". */
export function explainStruggle(ctx: InterventionContext): { mainIssue: string; reason: string } {
  const { struggle, topicName, prereqCheck, attempts } = ctx;
  const top = [...struggle.signals].filter((s) => s.points > 0).sort((a, b) => b.points - a.points).slice(0, 2);
  const mainKey = top[0]?.key ?? "accuracy";
  let mainIssue = ISSUE_TITLE[mainKey];
  if (mainKey === "prerequisite" && prereqCheck.weakest && !prereqCheck.solid) mainIssue = `${prereqCheck.weakest.name} prerequisite`;

  const streak = wrongStreakOf(attempts);
  const phrases = top.map((s) => {
    switch (s.key) {
      case "errors": return streak >= 2 ? `missed the last ${streak} questions in a row` : "made repeated mistakes";
      case "accuracy": {
        const m = s.detail.match(/^(\d+)% correct over the last (\d+)/);
        if (!m) return "answered few questions correctly lately";
        return m[1] === "0" ? `got none of the last ${m[2]} right` : `got only ${m[1]}% of the last ${m[2]} right`;
      }
      case "time": return "been taking much longer than usual per question";
      case "prerequisite": return s.detail.toLowerCase().includes("basic") ? "missed several basic-level questions" : `shown a shaky foundation in ${prereqCheck.weakest?.name ?? "an earlier topic"}`;
      case "hints": return "needed hints on most questions";
    }
  });
  const lead = phrases.length ? `You've ${phrases.join(" and ")} on ${topicName}.` : `${topicName} is proving difficult.`;
  const cause = prereqCheck.solid ? `${prereqCheck.message} A different explanation or hands-on practice may help.` : prereqCheck.message;
  return { mainIssue, reason: `${lead} ${cause}` };
}

export function recommendActions(ctx: InterventionContext): { actions: InterventionAction[]; recommendedAction: string } {
  const { topicId, topicName, prereqCheck } = ctx;
  const lab = labsForTopic(topicId)[0];
  const weak = prereqCheck.weakest && !prereqCheck.solid ? prereqCheck.weakest : null;

  const actions: InterventionAction[] = [
    { kind: "simpler", label: "Try a simpler explanation", description: "See the idea in plain words, with an example." },
    weak
      ? { kind: "prerequisite", label: `Practice ${weak.name}`, description: `${weak.name} is at ${weak.score}%. A short refresher can help.`, href: `/student/learn/${weak.id}?tab=practice` }
      : { kind: "prerequisite", label: `Review the basics of ${topicName}`, description: "Revisit the key ideas before more practice.", href: `/student/learn/${topicId}?tab=learn` },
  ];
  if (lab) actions.push({ kind: "lab", label: "Open the virtual lab", description: `Try it hands-on: ${lab.title}.`, href: `/student/labs/${lab.id}` });
  actions.push({ kind: "facilitator", label: "Ask your facilitator", description: "Let your teacher know you'd like help." });

  const recommendedAction = `${weak ? `Assign ${weak.name} refresher` : `Assign a ${topicName} concept refresher`}${lab ? " + virtual lab" : ""}`;
  return { actions, recommendedAction };
}

/* ---------- The state machine ---------- */

export type InterventionChange = "created" | "escalated" | "updated" | "resolved" | "responding" | "none";

export interface InterventionOutcome {
  change: InterventionChange;
  intervention: Intervention | null;
}

export function push(iv: Intervention, status: InterventionStatus, by: "aura" | "student" | "facilitator", now: Date, note?: string) {
  iv.status = status;
  iv.updatedAt = now.toISOString();
  iv.history.push({ status, at: now.toISOString(), by, note });
}

/**
 * Apply the struggle result to the case for this student and topic. Mutates the store.
 * Hysteresis: a case opens at 60 but only closes below 40, so it does not flicker.
 */
export function evaluateIntervention(store: Store, studentId: string, ctx: InterventionContext, now: Date): InterventionOutcome {
  const { struggle } = ctx;
  const active = activeInterventionFor(store, studentId, ctx.topicId);
  const score = struggle.score;

  if (score >= INTERVENTION_THRESHOLD) {
    const severity = score >= STRUGGLE_THRESHOLDS.immediate ? "immediate" : "intervention";
    const { mainIssue, reason } = explainStruggle(ctx);
    const { actions, recommendedAction } = recommendActions(ctx);

    if (!active) {
      const iv: Intervention = {
        id: `int-${now.getTime()}-${store.interventions.length}`,
        studentId, topicId: ctx.topicId, riskScore: score, peakScore: score, severity, reason, mainIssue,
        blocksTopicId: ctx.blocks?.id, recommendedAction, actions, signals: struggle.signals,
        status: "detected", studentRequestedHelp: false, history: [], createdAt: now.toISOString(), updatedAt: now.toISOString(), resolvedAt: null,
      };
      iv.history.push({ status: "detected", at: now.toISOString(), by: "aura" });
      push(iv, "recommended", "aura", now, "Reason and next steps generated");
      store.interventions.push(iv);
      recordEvent(store, { studentId, topicId: ctx.topicId, type: "intervention", tone: "alert", title: `Intervention recommended: ${ctx.topicName}`, detail: `Struggle score ${score}. ${mainIssue}.` }, now);
      return { change: "created", intervention: iv };
    }

    const escalated = severity === "immediate" && active.severity !== "immediate";
    Object.assign(active, { riskScore: score, peakScore: Math.max(active.peakScore, score), severity, reason, mainIssue, actions, recommendedAction, signals: struggle.signals, updatedAt: now.toISOString() });
    if (escalated) {
      active.history.push({ status: active.status, at: now.toISOString(), by: "aura", note: "Escalated to immediate attention" });
      recordEvent(store, { studentId, topicId: ctx.topicId, type: "intervention", tone: "alert", title: `Escalated: ${ctx.topicName} needs immediate attention`, detail: `Struggle score reached ${score}.` }, now);
    }
    return { change: escalated ? "escalated" : "updated", intervention: active };
  }

  if (!active) return { change: "none", intervention: null };

  active.riskScore = score;
  active.updatedAt = now.toISOString();

  if (score < RECOVERY_THRESHOLD) {
    if (active.status === "detected" || active.status === "recommended") {
      // Nobody has looked at this case and the student has clearly recovered: close it.
      // Once a facilitator has viewed it, a human decides how it ends.
      push(active, "resolved", "aura", now, "Student recovered before an intervention began");
      active.resolvedAt = now.toISOString();
      active.resolvedBy = "student";
      recordEvent(store, { studentId, topicId: ctx.topicId, type: "intervention", tone: "good", title: `Back on track in ${ctx.topicName}`, detail: `Struggle score fell to ${score}. The case was closed.` }, now);
      return { change: "resolved", intervention: active };
    }
    if (active.status === "started") {
      // A facilitator is already working with the student, so a human still closes it; we just note the improvement.
      push(active, "responding", "aura", now, "Student is responding to the intervention");
      recordEvent(store, { studentId, topicId: ctx.topicId, type: "intervention", tone: "good", title: `Responding well in ${ctx.topicName}`, detail: `Struggle score fell to ${score}. Waiting for the facilitator to resolve.` }, now);
      return { change: "responding", intervention: active };
    }
  }
  return { change: "updated", intervention: active };
}

/** The student asks their facilitator for help. Does not change status; flags the case so it sorts first. */
export function requestHelp(store: Store, studentId: string, topicId: string, now: Date): Intervention | null {
  const iv = activeInterventionFor(store, studentId, topicId);
  if (!iv) return null;
  if (!iv.studentRequestedHelp) {
    iv.studentRequestedHelp = true;
    iv.updatedAt = now.toISOString();
    iv.history.push({ status: iv.status, at: now.toISOString(), by: "student", note: "Student asked the facilitator for help" });
    recordEvent(store, { studentId, topicId, type: "intervention", tone: "info", title: "You asked your facilitator for help", detail: "They will see this at the top of their list." }, now);
  }
  return iv;
}

/**
 * The human side of "AI detects, AI recommends, a human decides" (PRD sections 2.3, 18).
 * A facilitator moves a case through the SAME state machine AURA itself uses — no separate model.
 *   review  -> "viewed"    (the facilitator has looked at it)
 *   start   -> "started"   (the facilitator is actively helping)
 *   resolve -> "resolved"  (closed by a human, not by AURA)
 */
export type FacilitatorAction = "review" | "assign" | "start" | "resolve";
const FACILITATOR_ACTION_STATUS: Record<FacilitatorAction, InterventionStatus> = { review: "viewed", assign: "started", start: "started", resolve: "resolved" };

export type FacilitatorActionResult =
  | { ok: true; intervention: Intervention }
  | { ok: false; reason: "not_found" | "invalid_transition" };

export function applyFacilitatorAction(store: Store, interventionId: string, action: FacilitatorAction, now: Date, note?: string): FacilitatorActionResult {
  const iv = store.interventions.find((i) => i.id === interventionId);
  if (!iv) return { ok: false, reason: "not_found" };
  const to = FACILITATOR_ACTION_STATUS[action];
  if (!canTransition(iv.status, to)) return { ok: false, reason: "invalid_transition" };
  if (action === "assign" && !iv.assignedAction) {
    const refresher = iv.actions.find((a) => a.kind === "prerequisite" || a.kind === "simpler" || a.kind === "lab") || iv.actions[0];
    if (refresher) {
      iv.assignedAction = refresher;
    }
  }
  push(iv, to, "facilitator", now, note);
  if (to === "resolved") {
    iv.resolvedAt = now.toISOString();
    iv.resolvedBy = "facilitator";
  }
  const topicName = store.topics.find((t) => t.id === iv.topicId)?.name ?? iv.topicId;
  const title = to === "resolved" ? `Your facilitator resolved this: ${topicName}` : to === "started" ? `Your facilitator is helping with ${topicName}` : `Your facilitator has seen this: ${topicName}`;
  recordEvent(store, { studentId: iv.studentId, topicId: iv.topicId, type: "intervention", tone: to === "resolved" ? "good" : "info", title, detail: note || "Reviewed by a facilitator, not AURA." }, now);
  return { ok: true, intervention: iv };
}

/** The slice of a case the student UI needs. */
export interface InterventionSummary {
  id: string;
  topicId: string;
  status: InterventionStatus;
  severity: "intervention" | "immediate";
  change: string;
  reason: string;
  mainIssue: string;
  riskScore: number;
  actions: InterventionAction[];
  assignedAction?: InterventionAction;
  studentRequestedHelp: boolean;
  blocksTopicId?: string;
}

export function summarizeIntervention(iv: Intervention, change: string = "updated"): InterventionSummary {
  return {
    id: iv.id, topicId: iv.topicId, status: iv.status, severity: iv.severity, change, reason: iv.reason, mainIssue: iv.mainIssue, riskScore: iv.riskScore,
    actions: iv.actions, assignedAction: iv.assignedAction, studentRequestedHelp: iv.studentRequestedHelp, blocksTopicId: iv.blocksTopicId,
  };
}
