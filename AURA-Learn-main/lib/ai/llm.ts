import type { AiConfig } from "./env";

/**
 * Chat-completion clients for every AI provider AURA can re-theme with.
 * SERVER ONLY: these hold API keys. Nothing in components/ imports this file.
 *
 * OpenRouter, Groq and NVIDIA NIM all speak the same OpenAI-compatible /chat/completions wire
 * format, so they share one implementation (createOpenAiCompatClient). Gemini's REST API has a
 * different shape (systemInstruction/contents/candidates), so it gets its own. Every client still
 * returns the exact same LlmClient interface, so retheme.ts never needs to know which provider
 * answered — it only sees { model, complete() }.
 */
if (typeof window !== "undefined") throw new Error("lib/ai/llm.ts must never be bundled for the browser");

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type LlmErrorKind = "timeout" | "http_error" | "invalid_response" | "network";

export class LlmError extends Error {
  constructor(public kind: LlmErrorKind, message: string, public status?: number) {
    super(message);
    this.name = "LlmError";
  }
}

export interface LlmClient {
  readonly model: string;
  complete(messages: ChatMessage[], opts?: { timeoutMs?: number }): Promise<{ text: string }>;
}

/** Remove anything that looks like a secret from text that might be logged or returned. */
export function redact(text: string, secret?: string): string {
  let out = text.replace(/(?:sk|or|gsk|nvapi)[-_][A-Za-z0-9_\-]{8,}/g, "[redacted]");
  if (secret) out = out.split(secret).join("[redacted]");
  return out;
}

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl: string;
  model: string;
}

interface OpenAiCompatOpts extends ProviderCredentials {
  timeoutMs: number;
  /** Name shown in the "not configured" error, e.g. "GROQ_API_KEY". */
  keyEnvName: string;
  /** Extra headers a specific provider wants (e.g. OpenRouter's attribution headers). */
  extraHeaders?: Record<string, string>;
}

/** Shared client for any OpenAI-compatible /chat/completions endpoint (OpenRouter, Groq, NVIDIA NIM). */
function createOpenAiCompatClient(opts: OpenAiCompatOpts, fetchImpl: typeof fetch = fetch): LlmClient {
  const { apiKey, baseUrl, model, timeoutMs, keyEnvName, extraHeaders } = opts;
  if (!apiKey) throw new Error(`${keyEnvName} is not set`);
  return {
    model,
    async complete(messages, callOpts = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), callOpts.timeoutMs ?? timeoutMs);
      try {
        const res = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...extraHeaders },
          body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 400, response_format: { type: "json_object" } }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new LlmError("http_error", `Model API returned ${res.status}: ${redact(body.slice(0, 160), apiKey)}`, res.status);
        }
        const json = (await res.json().catch(() => null)) as { choices?: { message?: { content?: unknown } }[] } | null;
        const text = json?.choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) throw new LlmError("invalid_response", "Model API returned no text");
        return { text };
      } catch (e) {
        if (e instanceof LlmError) throw e;
        if (e instanceof Error && e.name === "AbortError") throw new LlmError("timeout", "Model API timed out");
        throw new LlmError("network", redact(e instanceof Error ? e.message : "Network error", apiKey));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createOpenRouterClient(cfg: AiConfig, fetchImpl: typeof fetch = fetch): LlmClient {
  return createOpenAiCompatClient(
    { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model, timeoutMs: cfg.timeoutMs, keyEnvName: "OPENROUTER_API_KEY", extraHeaders: { "HTTP-Referer": "https://aura-learn.local", "X-Title": "AURA Learn" } },
    fetchImpl,
  );
}

/** Groq Cloud: OpenAI-compatible API at api.groq.com/openai/v1. */
export function createGroqClient(creds: ProviderCredentials, timeoutMs: number, fetchImpl: typeof fetch = fetch): LlmClient {
  return createOpenAiCompatClient({ ...creds, timeoutMs, keyEnvName: "GROQ_API_KEY" }, fetchImpl);
}

/** NVIDIA NIM (integrate.api.nvidia.com): OpenAI-compatible API, same wire format as OpenRouter/Groq. */
export function createNvidiaClient(creds: ProviderCredentials, timeoutMs: number, fetchImpl: typeof fetch = fetch): LlmClient {
  return createOpenAiCompatClient({ ...creds, timeoutMs, keyEnvName: "NVIDIA_API_KEY" }, fetchImpl);
}

/**
 * Google Gemini: a different REST shape (generateContent), not OpenAI-compatible.
 * System/user messages map to systemInstruction/contents; the key goes in the x-goog-api-key
 * header (not a URL query param, so it never ends up in server access logs).
 */
export function createGeminiClient(creds: ProviderCredentials, timeoutMs: number, fetchImpl: typeof fetch = fetch): LlmClient {
  const { apiKey, baseUrl, model } = creds;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return {
    model,
    async complete(messages, callOpts = {}) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), callOpts.timeoutMs ?? timeoutMs);
      try {
        const system = messages.find((m) => m.role === "system")?.content;
        const user = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n");
        const res = await fetchImpl(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { responseMimeType: "application/json", maxOutputTokens: 400, temperature: 0.7 },
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new LlmError("http_error", `Model API returned ${res.status}: ${redact(body.slice(0, 160), apiKey)}`, res.status);
        }
        const json = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null;
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== "string" || !text.trim()) throw new LlmError("invalid_response", "Model API returned no text");
        return { text };
      } catch (e) {
        if (e instanceof LlmError) throw e;
        if (e instanceof Error && e.name === "AbortError") throw new LlmError("timeout", "Model API timed out");
        throw new LlmError("network", redact(e instanceof Error ? e.message : "Network error", apiKey));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
