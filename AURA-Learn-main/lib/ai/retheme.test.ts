import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/questions";
import { gradeAnswer } from "../adaptive";
import type { ThemeCacheEntry } from "../types";
import { readAiConfig, type AiConfig } from "./env";
import { INTEREST_IDS } from "./interests";
import { LlmError, type ChatMessage, type LlmClient } from "./llm";
import { buildMessages, parseCandidate } from "./prompt";
import { CircuitBreaker, RateLimiter } from "./resilience";
import { rethemeQuestion, type RethemeDeps, type ThemeCache } from "./retheme";
import { sourceFromQuestion } from "./types";

const OHM = QUESTIONS.find((q) => q.id === "ohms-law-l2-1")!; // "Calculate the current for V = 12 V and R = 6 Ω."  answer 2 A
const MCQ = QUESTIONS.find((q) => q.id === "voltage-l1-1")!;
const cfg = (o: Partial<AiConfig> = {}): AiConfig => ({ ...readAiConfig({}), apiKey: "sk-test-secret-123456", mode: "auto", ...o });

function memoryCache(): ThemeCache & { entries: Map<string, ThemeCacheEntry> } {
  const entries = new Map<string, ThemeCacheEntry>();
  return { entries, get: (k) => entries.get(k), put: (e) => void entries.set(e.key, e) };
}

function fakeLlm(reply: (m: ChatMessage[]) => string | Error | Promise<string>) {
  const calls: ChatMessage[][] = [];
  const llm: LlmClient = {
    model: "fake/model",
    async complete(messages) {
      calls.push(messages);
      const r = await reply(messages);
      if (r instanceof Error) throw r;
      return { text: r };
    },
  };
  return { llm, calls };
}

const reply = (stem: string, echo: object = { numbers: [12, 6], unit: "A", difficulty: 2, learningObjective: OHM.objective, answerUnchanged: true }) => JSON.stringify({ stem, echo });
const SPACE_OK = "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.";

const run = (deps: Partial<RethemeDeps>, o: { question?: typeof OHM; interest?: (typeof INTEREST_IDS)[number]; mode?: "auto" | "template" | "off" } = {}) =>
  rethemeQuestion({ question: o.question ?? OHM, topicName: "Ohm's Law", interest: o.interest ?? "space", requester: "u-aarav", mode: o.mode }, { config: cfg(), cache: memoryCache(), ...deps });

describe("AI succeeds", () => {
  it("uses the model's rewrite when every guardrail passes, and reports it", async () => {
    const { llm, calls } = fakeLlm(() => reply(SPACE_OK));
    const r = await run({ llm });
    expect(r).toMatchObject({ source: "ai", themed: true, model: "fake/model", cached: false, stem: SPACE_OK });
    expect(r.validation.passed).toBe(true);
    expect(r.pipeline.at(-1)).toMatchObject({ step: "ai", outcome: "used" });
    expect(calls).toHaveLength(1);
    // the model was told the interest and what must not change
    const user = calls[0][1].content;
    expect(user).toContain("Space");
    expect(user).toContain("12 V");
    expect(calls[0][0].content).toMatch(/Never state, hint at or calculate the answer/);
  });

  it("caches a validated rewrite so the same question is never sent twice", async () => {
    const { llm, calls } = fakeLlm(() => reply(SPACE_OK));
    const cache = memoryCache();
    await run({ llm, cache });
    const again = await run({ llm, cache });
    expect(calls).toHaveLength(1);
    expect(again).toMatchObject({ source: "ai", cached: true, stem: SPACE_OK });
    // a different interest is a different cache entry
    await run({ llm, cache }, { interest: "sports" });
    expect(calls).toHaveLength(2);
  });
});

describe("AI misbehaves: the answer to every failure is a safe fallback", () => {
  const bad: [string, string, string][] = [
    ["changes a number", "Imagine a spacecraft instrument operating at 13 V with 6 Ω of resistance. Calculate the current.", "numbers"],
    ["changes a unit", "Imagine a spacecraft instrument operating at 12 A with 6 Ω of resistance. Calculate the current.", "quantities"],
    ["swaps the values", "Imagine a spacecraft instrument operating at 6 V with 12 Ω of resistance. Calculate the current.", "quantities"],
    ["invents a number", "A crew of 3 astronauts test an instrument at 12 V with 6 Ω of resistance. Calculate the current.", "numbers"],
    ["invents a quantity in words", "Three astronauts test an instrument at 12 V with 6 Ω of resistance. Calculate the current.", "numberwords"],
    ["reveals the answer", "Imagine a spacecraft instrument at 12 V with 6 Ω of resistance drawing 2 A. Calculate the current.", "leak"],
    ["asks for something else", "Imagine a spacecraft instrument operating at 12 V with 6 Ω. Describe how it feels.", "concept"],
    ["adds markup", "<b>Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance.</b> Calculate the current.", "format"],
    ["adds chatter", "Sure, here is your question: Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.", "safety"],
  ];
  for (const [name, stem, failing] of bad) {
    it(`falls back to the built-in theme when the model ${name}`, async () => {
      const { llm } = fakeLlm(() => reply(stem));
      const r = await run({ llm });
      expect(r.source).toBe("template");
      expect(r.fallbackReason).toBe("validation_failed");
      expect(r.stem).not.toBe(stem);
      expect(r.validation.passed).toBe(true);
      const rejected = r.pipeline.find((p) => p.outcome === "rejected");
      expect(rejected?.failedChecks).toContain(failing);
    });
  }

  it("rejects a model that lies in its echo (says the difficulty changed)", async () => {
    const { llm } = fakeLlm(() => reply(SPACE_OK, { difficulty: 4 }));
    const r = await run({ llm });
    expect(r.source).toBe("template");
    expect(r.pipeline.find((p) => p.outcome === "rejected")?.failedChecks).toContain("echo");
  });

  it("copes with a reply that is not JSON, or JSON in a code fence", async () => {
    expect((await run({ llm: fakeLlm(() => "Here you go!").llm })).fallbackReason).toBe("invalid_response");
    expect((await run({ llm: fakeLlm(() => "```json\n" + reply(SPACE_OK) + "\n```").llm })).source).toBe("ai");
    expect(parseCandidate("no braces")).toBeNull();
    expect(parseCandidate('{"stem": 5}')).toBeNull();
  });

  it("falls back on timeout, HTTP errors and network errors", async () => {
    for (const [err, reason] of [[new LlmError("timeout", "slow"), "timeout"], [new LlmError("http_error", "500", 500), "http_error"], [new LlmError("network", "down"), "http_error"]] as const) {
      const r = await run({ llm: fakeLlm(() => err).llm });
      expect(r.source).toBe("template");
      expect(r.fallbackReason).toBe(reason);
      expect(r.validation.passed).toBe(true);
    }
  });

  it("never throws, even if the model client throws a non-Error", async () => {
    const llm: LlmClient = { model: "x", complete: () => Promise.reject("boom") };
    const r = await run({ llm });
    expect(r.source).toBe("template");
  });
});

describe("AI unavailable: the app still works", () => {
  it("uses the built-in theme when no key is configured", async () => {
    const r = await run({ llm: null, config: cfg({ apiKey: undefined }) });
    expect(r).toMatchObject({ source: "template", themed: true, fallbackReason: "not_configured" });
    expect(r.stem).toBe(SPACE_OK);
  });

  it("uses only built-in themes in template mode, without calling the model", async () => {
    const { llm, calls } = fakeLlm(() => reply(SPACE_OK));
    const r = await run({ llm }, { mode: "template" });
    expect(r.source).toBe("template");
    expect(calls).toHaveLength(0);
  });

  it("shows the original question when re-theming is off", async () => {
    const { llm, calls } = fakeLlm(() => reply(SPACE_OK));
    const r = await run({ llm }, { mode: "off" });
    expect(r).toMatchObject({ source: "original", themed: false, stem: OHM.stem, fallbackReason: "ai_off" });
    expect(calls).toHaveLength(0);
  });

  it("shows the original when there is no theme for a question and no AI", async () => {
    const r = await run({ llm: null, config: cfg({ apiKey: undefined }) }, { question: MCQ as typeof OHM });
    expect(r).toMatchObject({ source: "original", themed: false, stem: MCQ.stem });
    expect(r.options).toEqual(MCQ.options);
  });

  it("stops calling a failing AI (circuit breaker) and recovers after the cooldown", async () => {
    let t = 0;
    const breaker = new CircuitBreaker({ threshold: 3, cooldownMs: 60_000, now: () => t });
    let mode: "fail" | "ok" = "fail";
    const { llm, calls } = fakeLlm(() => (mode === "fail" ? new LlmError("http_error", "500", 500) : reply(SPACE_OK)));
    for (let i = 0; i < 3; i++) await run({ llm, breaker, now: () => t });
    expect(calls).toHaveLength(3);
    const paused = await run({ llm, breaker, now: () => t });
    expect(calls).toHaveLength(3); // not called
    expect(paused).toMatchObject({ source: "template", fallbackReason: "temporarily_unavailable" });
    mode = "ok"; t = 61_000;
    expect((await run({ llm, breaker, now: () => t })).source).toBe("ai");
  });

  it("rate-limits AI calls per student", async () => {
    let t = 0;
    const limiter = new RateLimiter({ max: 2, now: () => t });
    const { llm, calls } = fakeLlm(() => reply(SPACE_OK));
    const rs = [];
    for (const i of INTEREST_IDS.slice(0, 4)) rs.push(await run({ llm, limiter }, { interest: i }));
    expect(calls).toHaveLength(2);
    expect(rs[2].fallbackReason).toBe("rate_limited");
    expect(rs[2].source).toBe("template");
  });
});

describe("the academic problem never changes", () => {
  it("leaves the original question untouched and keeps grading on the original", async () => {
    const before = JSON.stringify(OHM);
    const { llm } = fakeLlm(() => reply(SPACE_OK));
    await run({ llm });
    await run({ llm: null }, { interest: "gaming" });
    expect(JSON.stringify(OHM)).toBe(before);
    expect(gradeAnswer(OHM, "2 A")).toBe(true);
    expect(gradeAnswer(OHM, "3")).toBe(false);
  });

  it("never sends the answer back to the browser", async () => {
    const r = await run({ llm: null });
    expect(Object.keys(r.preserved)).not.toContain("answer");
    expect(JSON.stringify(r)).not.toMatch(/"answer"/);
    expect(r.preserved).toMatchObject({ numbers: ["12", "6"], quantities: ["12 V", "6 Ω"], unit: "A", difficulty: 2, answerKeyUnchanged: true });
  });

  it("themes the same question differently for Space, Gaming and Sports while every guarantee holds", async () => {
    const results = await Promise.all((["space", "gaming", "sports"] as const).map((i) => run({ llm: null }, { interest: i })));
    expect(new Set(results.map((r) => r.stem)).size).toBe(3);
    for (const r of results) {
      expect(r.validation.passed).toBe(true);
      expect(r.preserved.numbers).toEqual(["12", "6"]);
      expect(r.stem).toMatch(/12 V/);
      expect(r.stem).toMatch(/6 Ω/);
      expect(r.stem).toMatch(/current/i);
    }
    expect(results[0].stem).toMatch(/spacecraft/);
    expect(results[1].stem).toMatch(/gaming/);
    expect(results[2].stem).toMatch(/stadium/);
  });

  it("lists the by-construction guarantees next to the validated checks", async () => {
    const r = await run({ llm: null });
    const byConstruction = r.validation.checks.filter((c) => c.kind === "by-construction").map((c) => c.id);
    expect(byConstruction).toEqual(["answer-key", "objective", "difficulty"]);
    expect(r.validation.checks.filter((c) => c.kind === "validated").length).toBeGreaterThanOrEqual(9);
  });
});

describe("prompt", () => {
  it("carries the structured question (PRD 14) and names the interest", () => {
    const m = buildMessages(sourceFromQuestion(OHM, "Ohm's Law"), "gaming");
    const payload = JSON.parse(m[1].content.slice(m[1].content.indexOf("{")));
    expect(payload).toMatchObject({ topic: "Ohm's Law", question: OHM.stem, correctAnswer: "2 A", difficulty: 2, learningObjective: OHM.objective, studentInterest: "Gaming", variables: { V: 12, R: 6 } });
    expect(payload.mustPreserve.quantitiesWithUnits).toEqual(["12 V", "6 Ω"]);
  });
});
