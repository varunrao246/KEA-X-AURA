import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/content/questions";
import { AUTO_PRIORITY, readAiConfig, selectProvider } from "./env";
import { createGeminiClient, createGroqClient, createNvidiaClient, createOpenRouterClient, LlmError, redact } from "./llm";
import { rethemeQuestion, type RethemeDeps } from "./retheme";

const OHM = QUESTIONS.find((q) => q.id === "ohms-law-l2-1")!; // "Calculate the current for V = 12 V and R = 6 Ω." answer "2"
const MCQ = QUESTIONS.find((q) => q.id === "voltage-l1-1")!;
const SPACE_OK = "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.";

function memoryCache() {
  const entries = new Map<string, any>();
  return { get: (k: string) => entries.get(k), put: (e: any) => void entries.set(e.key, e) };
}

/** A fake fetch that answers like a real OpenAI-compatible endpoint (Groq/NVIDIA/OpenRouter) or Gemini. */
function fakeFetch(behaviour: {
  shape?: "openai" | "gemini";
  content?: string;
  httpStatus?: number;
  garbage?: boolean;
  slowMs?: number;
  seen?: { url: string; init: RequestInit }[];
}) {
  return (async (url: string, init: RequestInit) => {
    behaviour.seen?.push({ url, init });
    if (behaviour.slowMs) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, behaviour.slowMs);
        init.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
    }
    const respond = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) }) as Response;
    if (behaviour.httpStatus) return respond(behaviour.httpStatus, { error: "upstream error" });
    if (behaviour.garbage) return respond(200, "not-json-shaped-correctly");
    if (behaviour.shape === "gemini") return respond(200, { candidates: [{ content: { parts: [{ text: behaviour.content }] } }] });
    return respond(200, { choices: [{ message: { content: behaviour.content } }] });
  }) as unknown as typeof fetch;
}

const reply = (stem: string) => JSON.stringify({ stem, echo: { numbers: [12, 6], unit: "A", difficulty: 2, learningObjective: OHM.objective, answerUnchanged: true } });

describe("provider selection (AI_PROVIDER)", () => {
  it("selects the explicitly named provider when its key is configured", () => {
    const cfg = readAiConfig({ AI_PROVIDER: "groq", GROQ_API_KEY: "gsk_test123456789" });
    expect(selectProvider(cfg)).toMatchObject({ name: "groq", apiKey: "gsk_test123456789" });
  });

  it("an explicit provider with no key configured is simply unavailable — it never falls back to a different provider", () => {
    const cfg = readAiConfig({ AI_PROVIDER: "groq", OPENROUTER_API_KEY: "sk-openrouter-key-1234567" });
    expect(selectProvider(cfg)).toBeNull();
  });

  it("auto mode tries providers in the documented priority order", () => {
    expect(AUTO_PRIORITY).toEqual(["openrouter", "groq", "gemini", "nvidia"]);
    const cfg = readAiConfig({ AI_PROVIDER: "auto", GEMINI_API_KEY: "gem-key-123456789", NVIDIA_API_KEY: "nvapi-123456789" });
    expect(selectProvider(cfg)?.name).toBe("gemini"); // gemini precedes nvidia when openrouter/groq are unset
  });

  it("no key anywhere: auto mode selects nothing (template/original will be used)", () => {
    expect(selectProvider(readAiConfig({}))).toBeNull();
  });

  it("AI_PROVIDER=template or off never selects a provider, regardless of configured keys", () => {
    expect(selectProvider(readAiConfig({ AI_PROVIDER: "template", GROQ_API_KEY: "gsk_x12345678" }))).toBeNull();
    expect(selectProvider(readAiConfig({ AI_PROVIDER: "off", GROQ_API_KEY: "gsk_x12345678" }))).toBeNull();
  });

  it("the deprecated AI_RETHEME_MODE alias still works for template/off", () => {
    expect(readAiConfig({ AI_RETHEME_MODE: "template" }).mode).toBe("template");
    expect(readAiConfig({ AI_RETHEME_MODE: "off" }).mode).toBe("off");
  });

  it("AI_MODEL sets a shared default model, overridden by a provider-specific *_MODEL", () => {
    const cfg = readAiConfig({ AI_MODEL: "shared/model", GROQ_MODEL: "groq/specific", GROQ_API_KEY: "gsk_x12345678" });
    expect(cfg.groq.model).toBe("groq/specific");
    expect(cfg.gemini.model).toBe("shared/model");
  });
});

describe("Groq and NVIDIA clients (OpenAI-compatible wire format)", () => {
  it("Groq: posts to api.groq.com/openai/v1, Bearer auth, parses choices[0].message.content", async () => {
    const seen: any[] = [];
    const fetchImpl = fakeFetch({ content: reply(SPACE_OK), seen });
    const client = createGroqClient({ apiKey: "gsk_test123456789", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" }, 5000, fetchImpl);
    const { text } = await client.complete([{ role: "user", content: "hi" }]);
    expect(JSON.parse(text).stem).toBe(SPACE_OK);
    expect(seen[0].url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(seen[0].init.headers.Authorization).toBe("Bearer gsk_test123456789");
  });

  it("NVIDIA NIM: posts to integrate.api.nvidia.com/v1, Bearer auth, same response shape", async () => {
    const seen: any[] = [];
    const fetchImpl = fakeFetch({ content: reply(SPACE_OK), seen });
    const client = createNvidiaClient({ apiKey: "nvapi-test123456789", baseUrl: "https://integrate.api.nvidia.com/v1", model: "meta/llama-3.1-8b-instruct" }, 5000, fetchImpl);
    const { text } = await client.complete([{ role: "user", content: "hi" }]);
    expect(JSON.parse(text).stem).toBe(SPACE_OK);
    expect(seen[0].url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    expect(seen[0].init.headers.Authorization).toBe("Bearer nvapi-test123456789");
  });

  it("refuses to run without a key, naming the right env var", () => {
    expect(() => createGroqClient({ baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 1000)).toThrow(/GROQ_API_KEY/);
    expect(() => createNvidiaClient({ baseUrl: "https://integrate.api.nvidia.com/v1", model: "m" }, 1000)).toThrow(/NVIDIA_API_KEY/);
  });
});

describe("Gemini client (different wire format)", () => {
  it("posts systemInstruction + contents, auth via x-goog-api-key header (never a URL query param), parses candidates[0].content.parts[0].text", async () => {
    const seen: any[] = [];
    const fetchImpl = fakeFetch({ shape: "gemini", content: reply(SPACE_OK), seen });
    const client = createGeminiClient({ apiKey: "gem-test123456789", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-1.5-flash" }, 5000, fetchImpl);
    const { text } = await client.complete([{ role: "system", content: "You are a rewriter." }, { role: "user", content: "rewrite this" }]);
    expect(JSON.parse(text).stem).toBe(SPACE_OK);

    expect(seen[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
    expect(seen[0].url).not.toContain("gem-test123456789"); // key is not in the URL
    expect(seen[0].init.headers["x-goog-api-key"]).toBe("gem-test123456789");
    const body = JSON.parse(seen[0].init.body);
    expect(body.systemInstruction.parts[0].text).toBe("You are a rewriter.");
    expect(body.contents[0].parts[0].text).toBe("rewrite this");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("refuses to run without a key", () => {
    expect(() => createGeminiClient({ baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-1.5-flash" }, 1000)).toThrow(/GEMINI_API_KEY/);
  });

  it("flags a malformed response and times out instead of hanging", async () => {
    const garbage = createGeminiClient({ apiKey: "k", baseUrl: "https://x", model: "m" }, 1000, fakeFetch({ shape: "gemini", garbage: true }));
    await expect(garbage.complete([])).rejects.toMatchObject({ kind: "invalid_response" });

    const slow = createGeminiClient({ apiKey: "k", baseUrl: "https://x", model: "m" }, 50, fakeFetch({ shape: "gemini", slowMs: 500 }));
    await expect(slow.complete([])).rejects.toMatchObject({ kind: "timeout" });
  });
});

/* ---------- End-to-end through the real re-theme pipeline, per provider ---------- */

// The pipeline gates on `aiConfigured(deps.config)`, independent of which client answers it — so,
// exactly like the existing OpenRouter tests, the config only needs SOME provider key set to open
// the gate; the actual response comes from whichever `llm` client is passed in.
const gateOpenConfig = () => ({ ...readAiConfig({}), mode: "auto" as const, apiKey: "sk-fake-gate-key-1234567" });
const run = (llm: RethemeDeps["llm"], o: { question?: typeof OHM } = {}) =>
  rethemeQuestion({ question: o.question ?? OHM, topicName: "Ohm's Law", interest: "space", requester: "u-test" }, { config: gateOpenConfig(), cache: memoryCache() as any, llm });

describe("the guardrail chain behaves identically no matter which provider answered", () => {
  it("Groq succeeds and every guardrail passes", async () => {
    const llm = createGroqClient({ apiKey: "gsk_x", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" }, 5000, fakeFetch({ content: reply(SPACE_OK) }));
    const r = await run(llm);
    expect(r).toMatchObject({ source: "ai", themed: true, stem: SPACE_OK });
    expect(r.validation.passed).toBe(true);
    // the answer is never sent to the browser, whichever provider answered
    expect(JSON.stringify(r)).not.toMatch(/"2 A"|"answer"/);
  });

  it("a provider that changes a number is rejected by the SAME guardrails and falls back to a built-in theme", async () => {
    const bad = "Imagine a spacecraft instrument operating at 13 V with 6 Ω of resistance. Calculate the current.";
    const llm = createNvidiaClient({ apiKey: "nvapi-x", baseUrl: "https://integrate.api.nvidia.com/v1", model: "m" }, 5000, fakeFetch({ content: reply(bad) }));
    const r = await run(llm);
    expect(r.source).toBe("template");
    expect(r.fallbackReason).toBe("validation_failed");
    expect(r.stem).not.toMatch(/13 V/);
    expect(r.validation.passed).toBe(true); // the template that replaced it still passes every check
  });

  it("formula/variables/answer choices are never altered by re-theming, checked via the MCQ path", async () => {
    const okStem = "On a spaceship, which quantity is the 'push' that drives current around a circuit?";
    // A well-behaved model either omits options (never displayed from the theme result — the UI always
    // renders the original question's own options) or echoes them back unchanged; either way the
    // guardrail requires them to match the source exactly if present at all.
    const llm = createGeminiClient({ apiKey: "gem-x", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-1.5-flash" }, 5000, fakeFetch({ shape: "gemini", content: JSON.stringify({ stem: okStem, options: MCQ.options }) }));
    const r = await run(llm, { question: MCQ });
    expect(r.source).toBe("ai");
    expect(r.options).toEqual(MCQ.options);
    expect(r.validation.passed).toBe(true);
  });

  it("malformed provider response falls back safely; the question stays usable", async () => {
    const llm = createGroqClient({ apiKey: "gsk_x", baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 5000, fakeFetch({ garbage: true }));
    const r = await run(llm);
    expect(r.fallbackReason).toBe("invalid_response");
    expect(r.stem.length).toBeGreaterThan(0);
  });

  it("provider timeout falls back safely", async () => {
    // The pipeline always passes deps.config.timeoutMs to complete(), overriding the client's own
    // default, so the short timeout must be set on the config here, not just on the client.
    const llm = createNvidiaClient({ apiKey: "nvapi-x", baseUrl: "https://integrate.api.nvidia.com/v1", model: "m" }, 30, fakeFetch({ slowMs: 400 }));
    const r = await rethemeQuestion(
      { question: OHM, topicName: "Ohm's Law", interest: "space", requester: "u-test" },
      { config: { ...gateOpenConfig(), timeoutMs: 30 }, cache: memoryCache() as any, llm },
    );
    expect(r.fallbackReason).toBe("timeout");
    expect(r.stem.length).toBeGreaterThan(0);
  });

  it("provider 5xx and 4xx fall back safely", async () => {
    for (const status of [500, 401, 429]) {
      const llm = createGroqClient({ apiKey: "gsk_x", baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 5000, fakeFetch({ httpStatus: status }));
      const r = await run(llm);
      expect(r.fallbackReason).toBe("http_error");
      expect(r.stem.length).toBeGreaterThan(0);
    }
  });

  it("no provider configured at all (llm: null): the original question is still fully usable", async () => {
    const r = await run(null);
    expect(["template", "original"]).toContain(r.source);
    expect(r.stem.length).toBeGreaterThan(0);
    expect(r.validation.passed).toBe(true);
  });

  it("AI_PROVIDER=template with zero API keys: deterministic themes still work end to end", async () => {
    const cfg = readAiConfig({ AI_PROVIDER: "template" });
    expect(selectProvider(cfg)).toBeNull();
    const r = await rethemeQuestion({ question: OHM, topicName: "Ohm's Law", interest: "space", requester: "u-test" }, { config: cfg, cache: memoryCache() as any });
    expect(r.source).toBe("template");
    expect(r.themed).toBe(true);
    expect(r.stem).toMatch(/spacecraft/i);
  });
});

describe("no secret ever leaks, for any provider", () => {
  it("a provider HTTP error's message is redacted even when it echoes the key", async () => {
    const secretKey = "gsk_super_secret_value_123456";
    const fetchImpl = (async () => ({ ok: false, status: 500, text: async () => `upstream said: key was ${secretKey}` }) as Response) as unknown as typeof fetch;
    const client = createGroqClient({ apiKey: secretKey, baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 5000, fetchImpl);
    const err: LlmError = await client.complete([]).then(
      () => { throw new Error("expected complete() to reject"); },
      (e) => e,
    );
    expect(err).toBeInstanceOf(LlmError);
    expect(err.message).not.toContain(secretKey);
  });

  it("redact() strips Groq/NVIDIA-shaped key literals as well as an explicit secret", () => {
    expect(redact("token gsk_abc12345678 and nvapi-xyz98765432")).toBe("token [redacted] and [redacted]");
    expect(redact("plain-secret-value appears here", "plain-secret-value")).toBe("[redacted] appears here");
  });

  it("the full retheme pipeline result never contains a configured key, for a rejected OR successful AI answer", async () => {
    const secretKey = "gsk_leak_check_1234567890";
    const okLlm = createGroqClient({ apiKey: secretKey, baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 5000, fakeFetch({ content: reply(SPACE_OK) }));
    const okResult = await run(okLlm);
    expect(JSON.stringify(okResult)).not.toContain(secretKey);

    const failLlm = createGroqClient({ apiKey: secretKey, baseUrl: "https://api.groq.com/openai/v1", model: "m" }, 5000, fakeFetch({ httpStatus: 500 }));
    const failResult = await run(failLlm);
    expect(JSON.stringify(failResult)).not.toContain(secretKey);
  });

  it("createOpenRouterClient (existing provider) is unaffected by the refactor: same behaviour, same error message", () => {
    expect(() => createOpenRouterClient(readAiConfig({}))).toThrow(/OPENROUTER_API_KEY/);
  });
});
