import type { Interest, Question, ThemeCacheEntry } from "../types";
import { aiConfigured, type AiConfig } from "./env";
import { constructionChecks, numberTokens, quantityTokens, validateRetheme } from "./guardrails";
import type { LlmClient } from "./llm";
import { buildMessages, parseCandidate } from "./prompt";
import type { CircuitBreaker, RateLimiter } from "./resilience";
import { sceneFor } from "./scenes";
import { sourceFromQuestion, type AiMode, type FallbackReason, type PipelineStep, type RethemeResult, type ThemeSource, type ValidationResult } from "./types";

/**
 * The re-theming pipeline. It NEVER throws and NEVER returns unvalidated text.
 *
 *   1. cache          a previously validated AI rewrite
 *   2. AI             ask the model, then run every guardrail on what comes back
 *   3. built-in theme deterministic rewrite, validated by the same guardrails
 *   4. original       the question exactly as authored
 *
 * The core learning engine does not call this. If anything here fails, the student still gets a question.
 */

export interface ThemeCache {
  get(key: string): ThemeCacheEntry | undefined;
  put(entry: ThemeCacheEntry): void;
}

export interface RethemeDeps {
  config: AiConfig;
  cache: ThemeCache;
  /** Absent when no API key is configured. */
  llm?: LlmClient | null;
  breaker?: CircuitBreaker;
  limiter?: RateLimiter;
  now?: () => number;
}

export interface RethemeInput {
  question: Question;
  topicName: string;
  interest: Interest;
  /** Who is asking, for rate limiting. */
  requester: string;
  /** Override the configured mode (used by the AI studio to compare built-in themes with the model). */
  mode?: AiMode;
}

export const cacheKey = (questionId: string, interest: Interest) => `${questionId}:${interest}`;

function preserved(src: ThemeSource): RethemeResult["preserved"] {
  return {
    numbers: numberTokens(src.stem).map((n) => (n.startsWith("^") ? `10${n.replace("^", "")}` : n)),
    quantities: quantityTokens(src.stem),
    unit: src.unit,
    difficulty: src.difficulty,
    learningObjective: src.learningObjective,
    answerKeyUnchanged: true,
  };
}

function withConstruction(v: ValidationResult, src: ThemeSource): ValidationResult {
  return { ...v, checks: [...v.checks, ...constructionChecks(src)] };
}

export async function rethemeQuestion(input: RethemeInput, deps: RethemeDeps): Promise<RethemeResult> {
  const clock = deps.now ?? Date.now;
  const started = clock();
  const { question, interest } = input;
  const src = sourceFromQuestion(question, input.topicName);
  const mode: AiMode = input.mode ?? deps.config.mode;
  const pipeline: PipelineStep[] = [];
  let aiReason: FallbackReason | undefined;

  const done = (r: Omit<RethemeResult, "questionId" | "interest" | "preserved" | "pipeline" | "latencyMs">): RethemeResult => ({
    questionId: question.id, interest, preserved: preserved(src), pipeline, latencyMs: Math.max(0, clock() - started), ...r,
  });

  if (mode === "off") {
    pipeline.push({ step: "ai", outcome: "skipped", detail: "Re-theming is switched off" });
    aiReason = "ai_off";
  } else {
    /* 1. cache */
    if (mode === "auto") {
      const hit = deps.cache.get(cacheKey(question.id, interest));
      if (hit) {
        const v = validateRetheme(src, { stem: hit.stem, options: hit.options });
        if (v.passed) {
          pipeline.push({ step: "cache", outcome: "used", detail: "Reused a validated rewrite" });
          return done({ stem: hit.stem, options: hit.options, source: "ai", themed: hit.stem !== src.stem, model: hit.model, cached: true, validation: withConstruction(v, src) });
        }
        pipeline.push({ step: "cache", outcome: "rejected", detail: "The saved rewrite no longer passes the checks", failedChecks: v.failed.map((c) => c.id) });
      }
    }

    /* 2. AI */
    if (mode === "template") {
      pipeline.push({ step: "ai", outcome: "skipped", detail: "Built-in themes only" });
      aiReason = "ai_off";
    } else if (!aiConfigured(deps.config) || !deps.llm) {
      pipeline.push({ step: "ai", outcome: "skipped", detail: "No AI service is configured, so built-in themes are used" });
      aiReason = "not_configured";
    } else if (deps.breaker && !deps.breaker.canCall()) {
      pipeline.push({ step: "ai", outcome: "skipped", detail: "The AI service failed repeatedly, so it is paused for a minute" });
      aiReason = "temporarily_unavailable";
    } else if (deps.limiter && !deps.limiter.allow(input.requester)) {
      pipeline.push({ step: "ai", outcome: "skipped", detail: "Too many AI requests just now" });
      aiReason = "rate_limited";
    } else {
      try {
        const { text } = await deps.llm.complete(buildMessages(src, interest), { timeoutMs: deps.config.timeoutMs });
        deps.breaker?.success();
        const cand = parseCandidate(text);
        if (!cand) {
          pipeline.push({ step: "ai", outcome: "failed", detail: "The model's reply was not in the expected format" });
          aiReason = "invalid_response";
        } else {
          const v = validateRetheme(src, cand);
          if (v.passed) {
            pipeline.push({ step: "ai", outcome: "used", detail: `${deps.llm.model} rewrote it and every check passed` });
            deps.cache.put({ key: cacheKey(question.id, interest), questionId: question.id, interest, stem: cand.stem.trim(), options: cand.options, model: deps.llm.model, createdAt: new Date(clock()).toISOString(), checks: v.checks });
            return done({ stem: cand.stem.trim(), options: cand.options, source: "ai", themed: cand.stem.trim() !== src.stem, model: deps.llm.model, cached: false, validation: withConstruction(v, src) });
          }
          pipeline.push({ step: "ai", outcome: "rejected", detail: `Rejected: ${v.failed.map((c) => `${c.label.toLowerCase()} (${c.detail})`).join("; ")}`, failedChecks: v.failed.map((c) => c.id) });
          aiReason = "validation_failed";
        }
      } catch (e) {
        deps.breaker?.failure();
        const kind = (e as { kind?: string }).kind;
        aiReason = kind === "timeout" ? "timeout" : kind === "invalid_response" ? "invalid_response" : "http_error";
        pipeline.push({ step: "ai", outcome: "failed", detail: kind === "timeout" ? "The AI service took too long" : "The AI service is unavailable" });
      }
    }
  }

  /* 3. built-in deterministic theme */
  if (mode !== "off") {
    const themed = sceneFor(question, interest);
    if (themed) {
      const v = validateRetheme(src, { stem: themed });
      if (v.passed) {
        pipeline.push({ step: "template", outcome: "used", detail: "Built-in theme, checked by the same guardrails" });
        return done({ stem: themed, source: "template", themed: true, cached: false, fallbackReason: aiReason, validation: withConstruction(v, src) });
      }
      pipeline.push({ step: "template", outcome: "rejected", detail: "The built-in theme failed a check", failedChecks: v.failed.map((c) => c.id) });
    } else {
      pipeline.push({ step: "template", outcome: "skipped", detail: "No built-in theme for this kind of question" });
    }
  }

  /* 4. the original, exactly as authored */
  pipeline.push({ step: "original", outcome: "used", detail: "Showing the original question" });
  const v = validateRetheme(src, { stem: src.stem, options: src.options });
  return done({ stem: src.stem, options: src.options, source: "original", themed: false, cached: false, fallbackReason: aiReason ?? "no_theme_available", validation: withConstruction(v, src) });
}
