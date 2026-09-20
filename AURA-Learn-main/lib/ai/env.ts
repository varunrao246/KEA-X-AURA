import type { AiMode } from "./types";

/**
 * AI configuration, read from environment variables on the server only.
 * API keys are never sent to the browser: this module is imported by API routes, not by client components.
 *
 * Provider selection (PRD "live AI provider hardening"):
 *   AI_PROVIDER=openrouter|groq|gemini|nvidia   use exactly that provider (unavailable -> falls through
 *                                                to the built-in theme/original, never to a different provider)
 *   AI_PROVIDER=auto (default)                  use the first configured provider in AUTO_PRIORITY
 *   AI_PROVIDER=template                        built-in themes only, no live model ever called
 *   AI_PROVIDER=off                             always show the original question
 *   AI_RETHEME_MODE is kept as a deprecated alias for template/off, for anyone still setting it.
 */
export type ProviderName = "openrouter" | "groq" | "gemini" | "nvidia";
export type ProviderSetting = ProviderName | "auto" | "template" | "off";

const PROVIDER_NAMES: ProviderName[] = ["openrouter", "groq", "gemini", "nvidia"];
/** Priority order when AI_PROVIDER=auto and more than one provider key is configured. */
export const AUTO_PRIORITY: ProviderName[] = ["openrouter", "groq", "gemini", "nvidia"];

function isProviderName(x: string): x is ProviderName {
  return (PROVIDER_NAMES as string[]).includes(x);
}

const DEFAULT_MODEL: Record<ProviderName, string> = {
  openrouter: "openai/gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-1.5-flash",
  nvidia: "meta/llama-3.1-8b-instruct",
};
const DEFAULT_BASE_URL: Record<ProviderName, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  nvidia: "https://integrate.api.nvidia.com/v1",
};
const KEY_ENV: Record<ProviderName, string> = { openrouter: "OPENROUTER_API_KEY", groq: "GROQ_API_KEY", gemini: "GEMINI_API_KEY", nvidia: "NVIDIA_API_KEY" };
const BASE_ENV: Record<ProviderName, string> = { openrouter: "OPENROUTER_BASE_URL", groq: "GROQ_BASE_URL", gemini: "GEMINI_BASE_URL", nvidia: "NVIDIA_BASE_URL" };
const MODEL_ENV: Record<ProviderName, string> = { openrouter: "OPENROUTER_MODEL", groq: "GROQ_MODEL", gemini: "GEMINI_MODEL", nvidia: "NVIDIA_MODEL" };

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl: string;
  model: string;
}

export interface AiConfig {
  mode: AiMode;
  /** Raw AI_PROVIDER setting (normalised), independent of `mode`'s template/off/auto control flow. */
  provider: ProviderSetting;
  /** Kept flat for backward compatibility: OpenRouter's own credentials. */
  apiKey?: string;
  baseUrl: string;
  model: string;
  /** The other three providers, keyed by name. */
  groq: ProviderCredentials;
  gemini: ProviderCredentials;
  nvidia: ProviderCredentials;
  timeoutMs: number;
  maxPerMinute: number;
}

export function readAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const rawProvider = env.AI_PROVIDER?.trim().toLowerCase() ?? "";
  const legacyMode = env.AI_RETHEME_MODE?.trim().toLowerCase();

  let provider: ProviderSetting;
  if (rawProvider === "auto" || rawProvider === "template" || rawProvider === "off" || isProviderName(rawProvider)) provider = rawProvider as ProviderSetting;
  else if (legacyMode === "template" || legacyMode === "off") provider = legacyMode;
  else provider = "auto";

  const mode: AiMode = provider === "template" ? "template" : provider === "off" ? "off" : "auto";
  const sharedModel = env.AI_MODEL?.trim() || undefined;

  const creds = (name: ProviderName): ProviderCredentials => ({
    apiKey: env[KEY_ENV[name]]?.trim() || undefined,
    baseUrl: (env[BASE_ENV[name]]?.trim() || DEFAULT_BASE_URL[name]).replace(/\/+$/, ""),
    model: env[MODEL_ENV[name]]?.trim() || sharedModel || DEFAULT_MODEL[name],
  });
  const openrouter = creds("openrouter");

  return {
    mode,
    provider,
    apiKey: openrouter.apiKey,
    baseUrl: openrouter.baseUrl,
    model: openrouter.model,
    groq: creds("groq"),
    gemini: creds("gemini"),
    nvidia: creds("nvidia"),
    timeoutMs: Math.max(1000, Number(env.AI_TIMEOUT_MS) || 7000),
    maxPerMinute: Math.max(1, Number(env.AI_MAX_CALLS_PER_MINUTE) || 30),
  };
}

function credentialsFor(cfg: AiConfig, name: ProviderName): ProviderCredentials {
  return name === "openrouter" ? { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl, model: cfg.model } : cfg[name];
}

export interface SelectedProvider extends ProviderCredentials {
  name: ProviderName;
  apiKey: string;
}

/**
 * Which provider (if any) a request should use. An explicit AI_PROVIDER=<name> never falls back to
 * a DIFFERENT provider if unconfigured — it simply means no live provider is available for this
 * request (the pipeline then falls to the built-in theme/original). Only AI_PROVIDER=auto searches.
 */
export function selectProvider(cfg: AiConfig): SelectedProvider | null {
  if (cfg.mode !== "auto") return null;
  const candidates: ProviderName[] = cfg.provider === "auto" ? AUTO_PRIORITY : isProviderName(cfg.provider) ? [cfg.provider] : AUTO_PRIORITY;
  for (const name of candidates) {
    const c = credentialsFor(cfg, name);
    if (c.apiKey) return { name, apiKey: c.apiKey, baseUrl: c.baseUrl, model: c.model };
  }
  return null;
}

/** Whether the live model can be called at all. False means the built-in themes are used. */
export function aiConfigured(cfg: AiConfig): boolean {
  return selectProvider(cfg) !== null;
}
