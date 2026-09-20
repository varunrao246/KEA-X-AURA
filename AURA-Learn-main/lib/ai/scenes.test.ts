import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/questions";
import { validateRetheme } from "./guardrails";
import { INTEREST_IDS } from "./interests";
import { hasScene, sceneFor } from "./scenes";
import { sourceFromQuestion } from "./types";

const numeric = QUESTIONS.filter((q) => q.type === "numeric");

describe("deterministic themes", () => {
  it("cover every numeric question in the bank", () => {
    const missing = numeric.filter((q) => !hasScene(q)).map((q) => q.objective);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("produce, for EVERY numeric question and EVERY interest, a stem that passes the same validator as AI output", () => {
    const problems: string[] = [];
    let n = 0;
    for (const q of numeric) {
      for (const interest of INTEREST_IDS) {
        const themed = sceneFor(q, interest)!;
        const v = validateRetheme(sourceFromQuestion(q, "T"), { stem: themed });
        n++;
        if (!v.passed) problems.push(`${q.id} / ${interest}: ${v.failed.map((c) => `${c.id} (${c.detail})`).join("; ")} :: ${themed}`);
      }
    }
    expect(problems).toEqual([]);
    expect(n).toBe(numeric.length * 7);
  });

  it("actually change the story (never identical to the original)", () => {
    for (const q of numeric) for (const interest of INTEREST_IDS) expect(sceneFor(q, interest)).not.toBe(q.stem);
  });

  it("give each interest its own flavour", () => {
    const q = QUESTIONS.find((x) => x.id === "ohms-law-l2-1")!;
    const stems = INTEREST_IDS.map((i) => sceneFor(q, i)!);
    expect(new Set(stems).size).toBe(7);
    expect(sceneFor(q, "space")).toBe("Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.");
    expect(sceneFor(q, "gaming")).toBe("Picture a gaming console running on 12 V with 6 Ω of resistance. Calculate the current.");
    expect(sceneFor(q, "sports")).toMatch(/stadium scoreboard/);
  });

  it("are deterministic", () => {
    const q = numeric[0];
    expect(sceneFor(q, "space")).toBe(sceneFor(q, "space"));
  });

  it("leave concept (MCQ) questions in their original wording", () => {
    const m = QUESTIONS.find((x) => x.type === "mcq")!;
    expect(sceneFor(m, "space")).toBeNull();
  });
});
