import { describe, expect, it } from "vitest";
import {
  buildPrereqMap, checkPrerequisites, findBlocker, isUnlocked, newlyUnlocked, prerequisitesOf, topicStatus, topologicalOrder, UNLOCK_THRESHOLD,
} from "./curriculum";
import { fresh } from "./test-helpers";

const names = new Map([["a", "Alpha"], ["b", "Beta"], ["c", "Gamma"]]);
const edges = [{ topicId: "b", prerequisiteId: "a" }, { topicId: "c", prerequisiteId: "b" }];
const refs = (scores: Record<string, number>, topic: string) => prerequisitesOf(topic, buildPrereqMap(edges), new Map(Object.entries(scores)), names);

describe("prerequisite gating", () => {
  it("unlocks a topic only when every prerequisite is at 60 or more", () => {
    expect(UNLOCK_THRESHOLD).toBe(60);
    expect(isUnlocked(refs({ a: 59 }, "b"))).toBe(false);
    expect(isUnlocked(refs({ a: 60 }, "b"))).toBe(true);
    expect(isUnlocked(refs({}, "a"))).toBe(true); // no prerequisites
  });

  it("requires ALL prerequisites when there are several", () => {
    const multi = buildPrereqMap([{ topicId: "c", prerequisiteId: "a" }, { topicId: "c", prerequisiteId: "b" }]);
    const r = (a: number, b: number) => prerequisitesOf("c", multi, new Map([["a", a], ["b", b]]), names);
    expect(isUnlocked(r(90, 59))).toBe(false);
    expect(isUnlocked(r(90, 61))).toBe(true);
  });

  it("classifies topic status", () => {
    const s = (o: Partial<Parameters<typeof topicStatus>[0]>) => topicStatus({ locked: false, score: 50, attempts: 6, accuracy: 70, ...o });
    expect(s({ locked: true })).toBe("locked");
    expect(s({ score: 85 })).toBe("mastered");
    expect(s({ accuracy: 50 })).toBe("attention");
    expect(s({ accuracy: 70, struggling: true })).toBe("attention");
    expect(s({})).toBe("learning");
    expect(s({ attempts: 0, score: 0 })).toBe("learning");
    expect(s({ score: 65, accuracy: 40 })).toBe("learning"); // above the unlock bar
  });
});

describe("blockers and unlocking", () => {
  const node = (id: string, locked: boolean, missing: string[] = []) => ({ id, locked, missing: missing.map((m) => ({ id: m })) });

  it("finds the earliest open topic that must be practised", () => {
    const topics = [node("a", false), node("b", true, ["a"]), node("c", true, ["b"])];
    expect(findBlocker(topics, "b")?.id).toBe("a");
    expect(findBlocker(topics, "c")?.id).toBe("a"); // b is itself locked, so walk back to a
    expect(findBlocker(topics, "a")).toBeNull();
  });

  it("computes newly unlocked topics from before and after", () => {
    const before = [{ id: "a", locked: false }, { id: "b", locked: true }, { id: "c", locked: true }];
    const after = [{ id: "a", locked: false }, { id: "b", locked: false }, { id: "c", locked: true }];
    expect(newlyUnlocked(before, after)).toEqual(["b"]);
    expect(newlyUnlocked(after, after)).toEqual([]);
  });

  it("orders topics so prerequisites come first, and rejects cycles", () => {
    expect(topologicalOrder([{ id: "c" }, { id: "b" }, { id: "a" }], edges)).toEqual(["a", "b", "c"]);
    expect(() => topologicalOrder([{ id: "a" }, { id: "b" }], [{ topicId: "a", prerequisiteId: "b" }, { topicId: "b", prerequisiteId: "a" }])).toThrow(/cycle/i);
  });

  it("has an acyclic graph in the seed, with every topic reachable in order", () => {
    const s = fresh();
    expect(topologicalOrder(s.topics, s.prerequisites)).toHaveLength(s.topics.length);
  });
});

describe("prerequisite check", () => {
  it("blames the foundation when a prerequisite is weak", () => {
    const c = checkPrerequisites("Beta", refs({ a: 40 }, "b"));
    expect(c.solid).toBe(false);
    expect(c.weakest?.id).toBe("a");
    expect(c.message).toContain("Alpha is only at 40%");
  });
  it("says the gap is in the topic itself when prerequisites are solid", () => {
    const c = checkPrerequisites("Beta", refs({ a: 85 }, "b"));
    expect(c.solid).toBe(true);
    expect(c.message).toContain("inside Beta");
  });
  it("flags a prerequisite that is passable but not solid", () => {
    const c = checkPrerequisites("Beta", refs({ a: 70 }, "b"));
    expect(c.solid).toBe(false);
    expect(c.message).toContain("not solid");
  });
  it("handles topics with no prerequisites", () => {
    expect(checkPrerequisites("Alpha", []).solid).toBe(true);
  });
});
