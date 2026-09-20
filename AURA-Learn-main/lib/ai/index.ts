import { getStore, mutate } from "../db";
import type { ThemeCache } from "./retheme";
import { readAiConfig, aiConfigured, selectProvider, type AiConfig, type SelectedProvider } from "./env";
import { createGeminiClient, createGroqClient, createNvidiaClient, createOpenRouterClient, type LlmClient } from "./llm";
import { CircuitBreaker, RateLimiter } from "./resilience";
import { rethemeQuestion, type RethemeInput } from "./retheme";
import { generateTutorResponse, type TutorResult } from "./tutor";
import type { TutorContext } from "./tutorContext";
import type { TutorMode } from "./tutorStrategy";
import type { RethemeResult } from "./types";

/**
 * Wiring for the running app: config from env, the model client, and the shared breaker and limiter.
 * API routes call rethemeWithApp(); tests build their own deps and call rethemeQuestion() directly.
 */

const g = globalThis as unknown as { __auraAi?: { breaker: CircuitBreaker; limiter: RateLimiter; limiterMax: number } };

function shared(cfg: AiConfig) {
  if (!g.__auraAi || g.__auraAi.limiterMax !== cfg.maxPerMinute) {
    g.__auraAi = { breaker: new CircuitBreaker({ threshold: 3, cooldownMs: 60_000 }), limiter: new RateLimiter({ max: cfg.maxPerMinute }), limiterMax: cfg.maxPerMinute };
  }
  return g.__auraAi;
}

const storeCache: ThemeCache = {
  get: (key) => getStore().themeCache.find((e) => e.key === key),
  put: (entry) =>
    mutate((s) => {
      s.themeCache = [...s.themeCache.filter((e) => e.key !== entry.key), entry].slice(-300);
    }),
};

function createClientFor(selected: SelectedProvider, cfg: AiConfig): LlmClient {
  switch (selected.name) {
    case "openrouter": return createOpenRouterClient({ ...cfg, apiKey: selected.apiKey, baseUrl: selected.baseUrl, model: selected.model });
    case "groq": return createGroqClient(selected, cfg.timeoutMs);
    case "nvidia": return createNvidiaClient(selected, cfg.timeoutMs);
    case "gemini": return createGeminiClient(selected, cfg.timeoutMs);
  }
}

let client: { key: string; llm: LlmClient } | null = null;
function llmFor(cfg: AiConfig): LlmClient | null {
  const selected = selectProvider(cfg);
  if (!selected) return null;
  const id = `${selected.name}|${selected.baseUrl}|${selected.model}|${selected.apiKey}`;
  if (!client || client.key !== id) client = { key: id, llm: createClientFor(selected, cfg) };
  return client.llm;
}

export async function rethemeWithApp(input: RethemeInput): Promise<RethemeResult> {
  try {
    const config = readAiConfig();
    const { breaker, limiter } = shared(config);
    return await rethemeQuestion(input, { config, cache: storeCache, llm: llmFor(config), breaker, limiter });
  } catch {
    // Belt and braces: whatever went wrong, the student still gets the original question.
    return rethemeQuestion({ ...input, mode: "off" }, { config: { ...readAiConfig(), mode: "off" }, cache: { get: () => undefined, put: () => undefined } });
  }
}

export async function tutorWithApp(ctx: TutorContext, mode: TutorMode, studentMessage?: string, explanationVariation = 0): Promise<TutorResult> {
  try {
    const config = readAiConfig();
    const { breaker, limiter } = shared(config);
    const result = await generateTutorResponse(ctx, mode, { config, llm: llmFor(config), breaker, limiter }, studentMessage, explanationVariation);
    if (process.env.NODE_ENV !== "production") {
      // Dev-only observability (PRD section 20). No prompts, no secrets, no free-text student message.
      console.log(
        `[TUTOR] student=${ctx.studentId} topic=${ctx.topicId} mastery=${ctx.mastery.score} struggle=${ctx.struggle.score} ` +
        `recentAccuracy=${ctx.recentAccuracy} strategy=${result.strategy} responseType=${result.type} source=${result.source}` +
        (result.fallbackReason ? ` fallbackReason=${result.fallbackReason}` : ""),
      );
    }
    return result;
  } catch {
    return generateTutorResponse(ctx, mode, { config: { ...readAiConfig(), mode: "off" } }, studentMessage, explanationVariation);
  }
}

/** Non-secret status for the UI/demo. Never includes an API key, header, or any secret value. */
export function aiStatus() {
  const config = readAiConfig();
  const { breaker } = shared(config);
  const selected = selectProvider(config);
  const configured = !!selected;
  return {
    mode: config.mode,
    provider: selected?.name ?? null,
    configured,
    apiKeyPresent: configured,
    model: selected?.model ?? null,
    /** The deterministic built-in theme + original question are always available, regardless of AI state. */
    fallbackAvailable: true,
    serviceState: !configured ? ("not_configured" as const) : breaker.state === "open" ? ("paused" as const) : ("ready" as const),
    label: config.mode === "off" ? "Re-theming is off" : selected ? `AI re-theming ready (${selected.name} · ${selected.model})` : "Built-in themes (no AI key configured)",
  };
}
