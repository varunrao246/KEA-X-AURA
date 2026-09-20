import { describe, expect, it } from "vitest";
import { getTopicEngine, struggleFor } from "./engine";
import { activeInterventionFor } from "./intervention";
import { getHint, nextQuestion, submitAttempt } from "./practice";
import { getStudentState, getTopicState } from "./student";
import { driver, fresh, NOW } from "./test-helpers";

const topic = (store: ReturnType<typeof fresh>, id: string) => getTopicState(getStudentState(store, "u-aarav", NOW), id)!;

describe("the full adaptive loop on Aarav's Resistance", () => {
  it("starts on watch, with Ohm's Law locked behind it", () => {
    const store = fresh();
    expect(struggleFor(store, "u-aarav", "resistance").level).toBe("watch");
    expect(topic(store, "resistance").status).toBe("attention");
    expect(topic(store, "ohms-law").locked).toBe(true);
  });

  it("POOR PERFORMANCE: mastery falls, struggle rises, an intervention is recommended, Ohm's Law stays locked", () => {
    const store = fresh();
    const d = driver(store);
    const start = { mastery: topic(store, "resistance").score, struggle: struggleFor(store, "u-aarav", "resistance").score };
    const results = Array.from({ length: 5 }, (_, i) => d.step(false, { sec: 65, hint: i % 2 === 0 }));

    // mastery decreases and stays low
    expect(results.at(-1)!.mastery.after).toBeLessThan(start.mastery);
    expect(results.at(-1)!.mastery.after).toBeLessThan(60);
    for (const r of results) expect(r.mastery.after).toBeLessThanOrEqual(r.mastery.before);

    // struggle score increases, monotonically, and crosses the threshold
    const scores = results.map((r) => r.struggle.after);
    expect(scores[0]).toBeGreaterThan(start.struggle);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    expect(scores.at(-1)).toBeGreaterThanOrEqual(80);

    // intervention: created once, at the moment the score crossed 60, then updated and escalated
    const changes = results.map((r) => r.intervention?.change);
    expect(changes.filter((c) => c === "created")).toHaveLength(1);
    expect(changes).toContain("escalated");
    const iv = activeInterventionFor(store, "u-aarav", "resistance")!;
    expect(iv.status).toBe("recommended");
    expect(iv.severity).toBe("immediate");
    expect(iv.blocksTopicId).toBe("ohms-law");
    expect(iv.reason.length).toBeGreaterThan(40);
    expect(iv.actions.map((a) => a.kind)).toEqual(["simpler", "prerequisite", "lab", "facilitator"]);

    // the prerequisite is NOT mastered, so the next topic stays locked and cannot be practised
    expect(topic(store, "ohms-law").locked).toBe(true);
    expect(() => nextQuestion(store, "u-aarav", "ohms-law")).toThrow(/locked/i);
    expect(results.every((r) => r.unlocked.length === 0)).toBe(true);
  });

  it("difficulty falls after a run of misses, with a prerequisite check", () => {
    const store = fresh();
    const d = driver(store);
    const results = Array.from({ length: 3 }, () => d.step(false));
    const down = results.find((r) => r.level.change === "down")!;
    expect(down.level.after).toBe(down.level.before - 1);
    expect(down.prerequisiteCheck?.message).toContain("Voltage looks solid");
    expect(store.events.some((e) => e.type === "prerequisite")).toBe(true);
  });

  it("IMPROVEMENT: mastery rises, struggle falls, the case closes, Resistance is proficient and Ohm's Law unlocks", () => {
    const store = fresh();
    const d = driver(store);
    for (let i = 0; i < 5; i++) d.step(false, { sec: 65, hint: i % 2 === 0 });
    expect(activeInterventionFor(store, "u-aarav", "resistance")).toBeDefined();
    const low = topic(store, "resistance").score;

    const recovery: ReturnType<typeof d.step>[] = [];
    for (let i = 0; i < 12 && !recovery.some((r) => r.unlocked.length); i++) recovery.push(d.step(true, { sec: 25 }));

    const end = topic(store, "resistance");
    expect(end.score).toBeGreaterThan(low + 15);
    expect(end.score).toBeGreaterThanOrEqual(60);
    expect(end.band).toBe("proficient");
    expect(struggleFor(store, "u-aarav", "resistance").score).toBeLessThan(40);

    const unlockResult = recovery.find((r) => r.unlocked.length)!;
    expect(unlockResult.unlocked.map((u) => u.name)).toEqual(["Ohm's Law"]);
    expect(topic(store, "ohms-law").locked).toBe(false);
    expect(nextQuestion(store, "u-aarav", "ohms-law").question.topicId).toBe("ohms-law");

    // the case was closed automatically because no facilitator had acted
    expect(activeInterventionFor(store, "u-aarav", "resistance")).toBeUndefined();
    expect(store.interventions[0]).toMatchObject({ status: "resolved", resolvedBy: "student" });
    expect(store.events.map((e) => e.type)).toEqual(expect.arrayContaining(["intervention", "unlock", "struggle"]));
  });

  it("IMPROVEMENT with a facilitator involved: the student is 'responding' and a human still resolves it", () => {
    const store = fresh();
    const d = driver(store);
    for (let i = 0; i < 4; i++) d.step(false, { sec: 65, hint: true });
    const iv = activeInterventionFor(store, "u-aarav", "resistance")!;
    iv.status = "started"; // the facilitator started an intervention
    for (let i = 0; i < 7; i++) d.step(true, { sec: 25 });
    expect(iv.status).toBe("responding");
    expect(iv.resolvedAt).toBeNull();
    expect(topic(store, "ohms-law").locked).toBe(false);
  });

  it("logs the prerequisite check once, not on every miss", () => {
    const store = fresh();
    const d = driver(store);
    for (let i = 0; i < 8; i++) d.step(false);
    expect(store.events.filter((e) => e.type === "prerequisite")).toHaveLength(1);
  });

  it("explains the cause in plain words, never just 'your score is low'", () => {
    const store = fresh();
    const d = driver(store);
    for (let i = 0; i < 4; i++) d.step(false, { sec: 65, hint: true });
    const iv = activeInterventionFor(store, "u-aarav", "resistance")!;
    expect(iv.reason).toMatch(/missed the last \d+ questions in a row/);
    expect(iv.reason).toMatch(/got none of the last \d right|got only \d+% of the last \d right/);
    expect(iv.reason).not.toMatch(/correctly lately/);
  });

  it("levels up after 5 correct in a row", () => {
    const store = fresh();
    const d = driver(store);
    const rs = Array.from({ length: 5 }, () => d.step(true));
    expect(rs.slice(0, 4).every((r) => r.level.change === "hold")).toBe(true);
    expect(rs[4].level).toMatchObject({ change: "up", before: 2, after: 3 });
  });

  it("holds the level at 3 of 5", () => {
    const store = fresh();
    const d = driver(store);
    const rs = ["+", "-", "+", "-", "+"].map((c) => d.step(c === "+"));
    expect(rs.every((r) => r.level.change === "hold")).toBe(true);
    expect(rs.at(-1)!.level.after).toBe(2);
  });
});

describe("attempt, time and hint tracking is server-side", () => {
  it("records time-on-question from when the server served it, ignoring the browser's claim", () => {
    const store = fresh();
    const t0 = new Date(NOW.getTime());
    const { question } = nextQuestion(store, "u-aarav", "resistance", [], t0);
    const q = store.questions.find((x) => x.id === question.id)!;
    const r = submitAttempt(store, "u-aarav", { questionId: q.id, answer: q.answer, timeTakenSec: 1, hintsUsed: 0 }, new Date(t0.getTime() + 47_000));
    expect(r.tracked.timeTakenSec).toBe(47);
    expect(store.attempts.at(-1)!.timeTakenSec).toBe(47);
  });

  it("counts a hint only when the hint endpoint was actually used", () => {
    const store = fresh();
    const t0 = NOW;
    const a = nextQuestion(store, "u-aarav", "resistance", [], t0).question;
    expect(submitAttempt(store, "u-aarav", { questionId: a.id, answer: "x", hintsUsed: 1 }, new Date(t0.getTime() + 5000)).tracked.hintsUsed).toBe(0);
    const b = nextQuestion(store, "u-aarav", "resistance", [a.id], new Date(t0.getTime() + 10_000)).question;
    getHint(store, "u-aarav", b.id, new Date(t0.getTime() + 12_000));
    expect(submitAttempt(store, "u-aarav", { questionId: b.id, answer: "x", hintsUsed: 0 }, new Date(t0.getTime() + 20_000)).tracked.hintsUsed).toBe(1);
  });

  it("tracks accuracy and attempts on the mastery record", () => {
    const store = fresh();
    const before = store.mastery.find((m) => m.topicId === "resistance")!.attempts;
    const d = driver(store);
    d.step(true); d.step(false);
    const row = store.mastery.find((m) => m.topicId === "resistance")!;
    expect(row.attempts).toBe(before + 2);
    expect(row.accuracy).toBeGreaterThan(0);
    expect(row.lastActivity).not.toBeNull();
  });
});

describe("insights read model", () => {
  it("exposes every number the UI shows: mastery parts, struggle signals, level window and unlock rule", () => {
    const store = fresh();
    driver(store).step(false, { sec: 60, hint: true });
    const e = getTopicEngine(store, "u-aarav", "resistance", NOW)!;
    expect(Object.keys(e.mastery.parts)).toEqual(expect.arrayContaining(["quiz", "recent", "prereq", "retention", "lab"]));
    expect(e.struggle.signals).toHaveLength(5);
    expect(e.level.window.dots.length).toBeLessThanOrEqual(5);
    expect(e.unlock.unlocks[0]).toMatchObject({ id: "ohms-law", locked: true });
    expect(e.unlock.threshold).toBe(60);
    expect(e.prerequisiteCheck.solid).toBe(true);
  });
});
