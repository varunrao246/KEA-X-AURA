import { describe, expect, it } from "vitest";
import { checkPrerequisites } from "./curriculum";
import {
  activeInterventionFor, canTransition, evaluateIntervention, explainStruggle, INTERVENTION_THRESHOLD, INTERVENTION_TRANSITIONS,
  recommendActions, requestHelp, type InterventionContext,
} from "./intervention";
import { computeStruggle } from "./struggle";
import { fresh, NOW, seq } from "./test-helpers";

const solidCheck = checkPrerequisites("Resistance", [{ id: "voltage", name: "Voltage", score: 85, ok: true }]);
const weakCheck = checkPrerequisites("Resistance", [{ id: "voltage", name: "Voltage", score: 40, ok: false }]);

/** A context whose struggle score we control by choosing the attempts. */
function ctx(pattern: string, o: { check?: typeof solidCheck; sec?: number; hints?: number; level?: 1 | 2 | 3 | 4 } = {}): InterventionContext {
  const attempts = seq(pattern, { sec: o.sec ?? 30, hints: o.hints ?? 0, level: o.level ?? 2 });
  const check = o.check ?? solidCheck;
  return {
    topicId: "resistance", topicName: "Resistance",
    struggle: computeStruggle({ attempts, prereqs: check.weakest ? [check.weakest] : [] }),
    prereqCheck: check, blocks: { id: "ohms-law", name: "Ohm's Law" }, attempts,
  };
}
const at = (m: number) => new Date(NOW.getTime() + m * 60_000);
const POOR = "++--------";
const OK = "++++++++";

describe("intervention threshold", () => {
  it("does nothing below 60", () => {
    const store = fresh();
    const c = ctx(OK);
    expect(c.struggle.score).toBeLessThan(INTERVENTION_THRESHOLD);
    expect(evaluateIntervention(store, "u-aarav", c, at(1)).change).toBe("none");
    expect(store.interventions).toHaveLength(0);
  });

  it("opens a case at 60 or more, detected then recommended, with a specific reason", () => {
    const store = fresh();
    const c = ctx(POOR, { sec: 80, hints: 1 });
    expect(c.struggle.score).toBeGreaterThanOrEqual(INTERVENTION_THRESHOLD);
    const out = evaluateIntervention(store, "u-aarav", c, at(1));
    expect(out.change).toBe("created");
    const iv = out.intervention!;
    expect(iv.status).toBe("recommended");
    expect(iv.history.map((h) => h.status)).toEqual(["detected", "recommended"]);
    expect(iv.history.every((h) => h.by === "aura")).toBe(true);
    expect(iv.blocksTopicId).toBe("ohms-law");
    expect(iv.reason).toMatch(/missed the last 8 questions in a row/);
    expect(iv.reason).toContain("Resistance");
    expect(iv.reason).not.toMatch(/your score is low/i);
    expect(store.events.some((e) => e.type === "intervention" && e.tone === "alert")).toBe(true);
  });

  it("never opens a second case for the same student and topic", () => {
    const store = fresh();
    const c = ctx(POOR, { sec: 80, hints: 1 });
    evaluateIntervention(store, "u-aarav", c, at(1));
    expect(evaluateIntervention(store, "u-aarav", c, at(2)).change).toBe("updated");
    expect(store.interventions).toHaveLength(1);
  });

  it("escalates to immediate attention at 80", () => {
    const store = fresh();
    evaluateIntervention(store, "u-aarav", ctx("+++---", { sec: 40 }), at(1));
    const first = activeInterventionFor(store, "u-aarav", "resistance");
    const worse = ctx("--------", { sec: 100, hints: 1, level: 1, check: weakCheck });
    expect(worse.struggle.score).toBeGreaterThanOrEqual(80);
    if (!first) evaluateIntervention(store, "u-aarav", ctx(POOR, { sec: 80, hints: 1 }), at(1));
    const out = evaluateIntervention(store, "u-aarav", worse, at(3));
    expect(out.intervention?.severity).toBe("immediate");
    expect(out.intervention?.peakScore).toBeGreaterThanOrEqual(80);
  });
});

describe("explanation and recommendation", () => {
  it("explains the likely cause: gap inside the topic when prerequisites are solid", () => {
    const c = ctx(POOR, { sec: 80, hints: 1 });
    const { mainIssue, reason } = explainStruggle(c);
    expect(mainIssue).toBe("Repeated mistakes");
    expect(reason).toContain("Voltage looks solid at 85%");
    expect(reason).toContain("inside Resistance");
  });

  it("points at the prerequisite when it is weak", () => {
    const c = ctx("--------", { level: 1, sec: 90, hints: 1, check: weakCheck });
    const { reason } = explainStruggle(c);
    expect(reason).toContain("Voltage is only at 40%");
    const { actions, recommendedAction } = recommendActions(c);
    expect(actions.find((a) => a.kind === "prerequisite")).toMatchObject({ label: "Practice Voltage", href: "/student/learn/voltage?tab=practice" });
    expect(recommendedAction).toBe("Assign Voltage refresher + virtual lab");
  });

  it("always offers the four PRD actions (lab only when the topic has one)", () => {
    const withLab = recommendActions(ctx(POOR)).actions.map((a) => a.kind);
    expect(withLab).toEqual(["simpler", "prerequisite", "lab", "facilitator"]);
    const noLab = recommendActions({ ...ctx(POOR), topicId: "electric-current", topicName: "Electric Current" }).actions.map((a) => a.kind);
    expect(noLab).toEqual(["simpler", "prerequisite", "facilitator"]);
  });
});

describe("recovery and the human in the loop", () => {
  const open = (store: ReturnType<typeof fresh>) => {
    evaluateIntervention(store, "u-aarav", ctx(POOR, { sec: 80, hints: 1 }), at(1));
    return activeInterventionFor(store, "u-aarav", "resistance")!;
  };
  const recovered = ctx("+++++++++", { sec: 20 });
  const middling = ctx("+-+-+---", { sec: 30 }); // scores 48: on watch

  it("keeps the case open while the score is between 40 and 59 (no flicker)", () => {
    const store = fresh();
    open(store);
    expect(middling.struggle.score).toBeGreaterThanOrEqual(40);
    expect(middling.struggle.score).toBeLessThan(60);
    expect(evaluateIntervention(store, "u-aarav", middling, at(2)).change).toBe("updated");
    expect(activeInterventionFor(store, "u-aarav", "resistance")).toBeDefined();
  });

  it("closes an unattended case by itself once the score is under 40", () => {
    const store = fresh();
    const iv = open(store);
    const out = evaluateIntervention(store, "u-aarav", recovered, at(3));
    expect(out.change).toBe("resolved");
    expect(iv.status).toBe("resolved");
    expect(iv.resolvedBy).toBe("student");
    expect(iv.resolvedAt).not.toBeNull();
    expect(activeInterventionFor(store, "u-aarav", "resistance")).toBeUndefined();
  });

  it("opens a NEW case if the student struggles again after recovering", () => {
    const store = fresh();
    open(store);
    evaluateIntervention(store, "u-aarav", recovered, at(3));
    expect(evaluateIntervention(store, "u-aarav", ctx(POOR, { sec: 80, hints: 1 }), at(5)).change).toBe("created");
    expect(store.interventions).toHaveLength(2);
  });

  it("does not close a case a facilitator has started: the student is 'responding' and a human resolves it", () => {
    const store = fresh();
    const iv = open(store);
    iv.status = "started"; // set by the facilitator
    const out = evaluateIntervention(store, "u-aarav", recovered, at(3));
    expect(out.change).toBe("responding");
    expect(iv.status).toBe("responding");
    expect(iv.resolvedAt).toBeNull();
    expect(activeInterventionFor(store, "u-aarav", "resistance")).toBeDefined();
  });

  it("leaves a case the facilitator has only viewed for the facilitator to close", () => {
    const store = fresh();
    const iv = open(store);
    iv.status = "viewed";
    evaluateIntervention(store, "u-aarav", recovered, at(3));
    expect(iv.status).toBe("viewed");
  });

  it("lets the student ask the facilitator for help, once", () => {
    const store = fresh();
    const iv = open(store);
    requestHelp(store, "u-aarav", "resistance", at(2));
    requestHelp(store, "u-aarav", "resistance", at(3));
    expect(iv.studentRequestedHelp).toBe(true);
    expect(iv.history.filter((h) => h.by === "student")).toHaveLength(1);
    expect(requestHelp(store, "u-aarav", "voltage", at(4))).toBeNull();
  });
});

describe("intervention state machine (PRD 18)", () => {
  it("only allows the documented transitions", () => {
    expect(Object.keys(INTERVENTION_TRANSITIONS)).toEqual(["detected", "recommended", "viewed", "started", "responding", "resolved"]);
    expect(canTransition("recommended", "viewed")).toBe(true);
    expect(canTransition("viewed", "started")).toBe(true);
    expect(canTransition("started", "responding")).toBe(true);
    expect(canTransition("responding", "resolved")).toBe(true);
    expect(canTransition("recommended", "started")).toBe(false);
    expect(canTransition("resolved", "recommended")).toBe(false);
  });
});
