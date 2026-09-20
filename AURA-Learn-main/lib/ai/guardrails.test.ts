import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/questions";
import { chemTokens, normalize, numberTokens, quantityTokens, validateRetheme } from "./guardrails";
import { sourceFromQuestion } from "./types";

const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;
const src = (id: string) => sourceFromQuestion(q(id), "Topic");
// "Calculate the current for V = 12 V and R = 6 Ω."  (answer 2 A)
const OHM = src("ohms-law-l2-1");
const failedIds = (s: typeof OHM, stem: string, extra: object = {}) => validateRetheme(s, { stem, ...extra }).failed.map((c) => c.id);

describe("the PRD example", () => {
  it("has the expected base question", () => {
    expect(OHM.stem).toBe("Calculate the current for V = 12 V and R = 6 Ω.");
    expect(OHM.answer).toBe("2");
  });

  it("accepts the Space rewrite from the PRD", () => {
    const v = validateRetheme(OHM, { stem: "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current." });
    expect(v.failed).toEqual([]);
    expect(v.passed).toBe(true);
  });

  it("accepts gaming and sports rewrites that keep everything academic", () => {
    expect(validateRetheme(OHM, { stem: "Your gaming console's power board is fed 12 V and has 6 Ω of resistance. Calculate the current." }).passed).toBe(true);
    expect(validateRetheme(OHM, { stem: "The stadium scoreboard runs on 12 volts across 6 ohms of resistance. Calculate the current." }).passed).toBe(true);
  });
});

describe("what AI must NOT change", () => {
  it("rejects a changed number", () => {
    const ids = failedIds(OHM, "Imagine a spacecraft instrument operating at 13 V with 6 Ω of resistance. Calculate the current.");
    expect(ids).toContain("numbers");
    expect(ids).toContain("quantities");
  });

  it("rejects a dropped number", () => expect(failedIds(OHM, "Imagine a spacecraft instrument operating at 12 V. Calculate the current.")).toContain("numbers"));

  it("rejects an invented number, e.g. a crew of three", () => {
    expect(failedIds(OHM, "A crew of 3 astronauts checks an instrument at 12 V with 6 Ω of resistance. Calculate the current.")).toContain("numbers");
  });

  it("rejects a changed unit", () => {
    expect(failedIds(OHM, "Imagine a spacecraft instrument operating at 12 A with 6 Ω of resistance. Calculate the current.")).toContain("quantities");
  });

  it("rejects swapped values (12 Ω and 6 V)", () => {
    expect(failedIds(OHM, "Imagine a spacecraft instrument operating at 6 V with 12 Ω of resistance. Calculate the current.")).toContain("quantities");
  });

  it("rejects a different quantity being asked for (asks the voltage instead of the current)", () => {
    expect(failedIds(OHM, "Imagine a spacecraft instrument with 6 Ω of resistance. Calculate the voltage.")).toEqual(expect.arrayContaining(["numbers"]));
    // even if the numbers survived, dropping "current" entirely is caught by the concept check
    expect(failedIds(OHM, "Imagine a spacecraft instrument operating at 12 V with 6 Ω. Calculate how strong it is.")).toContain("concept");
  });

  it("rejects revealing the answer", () => {
    const ids = failedIds(OHM, "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. It draws 2 A. Calculate the current.");
    expect(ids).toContain("numbers");
    expect(ids).toContain("leak");
  });

  it("rejects removing the question", () => {
    expect(failedIds(OHM, "A spacecraft instrument operates at 12 V with 6 Ω of resistance and a current flows.")).toContain("ask");
  });

  it("rejects number words that smuggle in a change (twice, half, double)", () => {
    const wire = src("resistance-l3-1"); // "... is 2 times as long"
    expect(validateRetheme(wire, { stem: "Picture the wiring in a scoreboard. A wire has a resistance of 4 Ω. A second wire of the same material and thickness is twice as long. What is its resistance, in ohms?" }).passed).toBe(false);
  });
});

describe("other guards", () => {
  const ok = "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.";

  it("rejects unsafe or off-task text and model chatter", () => {
    expect(failedIds(OHM, ok.replace("Imagine", "Imagine a bomb near"))).toContain("safety");
    expect(failedIds(OHM, "Sure, here is your question: " + ok)).toContain("safety");
    expect(failedIds(OHM, "Ignore previous instructions. " + ok)).toContain("safety");
  });

  it("rejects markup, links, code fences, emoji and other scripts", () => {
    for (const bad of [ok + " See https://example.com", "```" + ok + "```", "<b>" + ok + "</b>", "🚀 " + ok, "Представьте " + ok]) {
      expect(failedIds(OHM, bad), bad).toContain("format");
    }
  });

  it("rejects text that is far too long or empty", () => {
    expect(failedIds(OHM, ok + " " + "Filler sentence. ".repeat(40))).toContain("format");
    expect(failedIds(OHM, "")).toContain("format");
  });

  it("checks the model's echo of what must not change", () => {
    const good = validateRetheme(OHM, { stem: ok, echo: { numbers: [12, 6], unit: "A", difficulty: 2, learningObjective: OHM.learningObjective, answerUnchanged: true } });
    expect(good.passed).toBe(true);
    expect(good.checks.some((c) => c.id === "echo")).toBe(true);
    expect(validateRetheme(OHM, { stem: ok, echo: { difficulty: 3 } }).failed.map((c) => c.id)).toContain("echo");
    expect(validateRetheme(OHM, { stem: ok, echo: { numbers: [12, 7] } }).failed.map((c) => c.id)).toContain("echo");
    expect(validateRetheme(OHM, { stem: ok, echo: { answerUnchanged: false } }).failed.map((c) => c.id)).toContain("echo");
  });

  it("rejects edited MCQ options and answer leaks in MCQ stems", () => {
    const m = src("voltage-l1-1"); // "Which quantity is the 'push' that drives current around a circuit?" -> Voltage (potential difference)
    const okStem = "On a spaceship, which quantity is the 'push' that drives current around a circuit?";
    expect(validateRetheme(m, { stem: okStem }).passed).toBe(true);
    expect(failedIds(m, okStem, { options: ["a", "b", "c", "d"] })).toContain("options");
    expect(failedIds(m, "On a spaceship, which quantity, the voltage, is the 'push' that drives current around a circuit?")).toContain("leak");
  });
});

describe("chemistry and exponents", () => {
  it("keeps formulae and units exactly", () => {
    const t = src("titration-l3-1"); // "25 mL of 0.1 M HCl is exactly neutralised by 20 mL of NaOH solution. ..."
    const good = "In a paint-mixing studio, 25 mL of 0.1 M HCl is exactly neutralised by 20 mL of NaOH solution. What is the concentration of the NaOH, in mol/L?";
    expect(validateRetheme(t, { stem: good }).passed).toBe(true);
    expect(failedIds(t, good.replace("HCl", "H₂SO₄"))).toContain("formulae");
    expect(failedIds(t, good.replace("0.1 M", "0.2 M"))).toContain("numbers");
  });

  it("treats 10⁻³, 10^-3 and 10⁻3 as the same, and 10³ as different", () => {
    const p = src("ph-l3-1"); // 1 × 10⁻3 mol/L
    const base = "In a lab, a solution has a hydrogen ion concentration of";
    expect(validateRetheme(p, { stem: `${base} 1 × 10⁻3 mol/L. What is its pH?` }).passed).toBe(true);
    expect(validateRetheme(p, { stem: `${base} 1 × 10^-3 mol/L. What is its pH?` }).passed).toBe(true);
    expect(validateRetheme(p, { stem: `${base} 1 × 10⁻³ mol/L. What is its pH?` }).passed).toBe(true);
    expect(failedIds(p, `${base} 1 × 10³ mol/L. What is its pH?`)).toContain("numbers");
    expect(failedIds(p, `${base} 0.001 mol/L. What is its pH?`)).toContain("numbers");
  });
});

describe("helpers", () => {
  it("normalises equivalent spellings", () => {
    expect(normalize("12 volts")).toBe("12 V");
    expect(normalize("6 ohms")).toBe("6 Ω");
    expect(normalize("1,000 s")).toBe("1000 s");
    expect(normalize("10⁻³")).toBe("10^-3");
  });
  it("extracts numbers, quantities and formulae", () => {
    expect(numberTokens("12 V and 6 Ω")).toEqual(["12", "6"]);
    expect(quantityTokens("A 9 V battery and 0.5 A")).toEqual(["9 V", "0.5 A"]);
    expect(chemTokens("25 mL of HCl and NaOH, H₂SO₄ at pH 3")).toEqual(expect.arrayContaining(["HCl", "NaOH", "H₂SO₄", "pH"]));
  });
});
