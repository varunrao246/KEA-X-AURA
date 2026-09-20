import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";

describe("seed data", () => {
  const s = buildSeed();

  it("has both roles and demo accounts for each", () => {
    const demo = s.users.filter((u) => u.demo);
    expect(demo.map((u) => u.role).sort()).toEqual(["facilitator", "student"]);
  });

  it("has a valid, acyclic prerequisite graph", () => {
    const ids = new Set(s.topics.map((t) => t.id));
    for (const p of s.prerequisites) {
      expect(ids.has(p.topicId)).toBe(true);
      expect(ids.has(p.prerequisiteId)).toBe(true);
    }
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string) => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`cycle at ${id}`);
      visiting.add(id);
      s.prerequisites.filter((p) => p.topicId === id).forEach((p) => visit(p.prerequisiteId));
      visiting.delete(id);
      done.add(id);
    };
    expect(() => ids.forEach(visit)).not.toThrow();
  });

  it("starts Aarav with a weak Resistance prerequisite", () => {
    const score = (t: string) => s.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === t)?.score;
    expect(score("electric-current")).toBeGreaterThanOrEqual(80);
    expect(score("voltage")).toBeGreaterThanOrEqual(80);
    expect(score("resistance")).toBeLessThan(60);
    expect(score("ohms-law")).toBe(0);
  });
});
