/**
 * KEA Platform — AI Orchestrator & Multi-Provider Fallback Cascade
 * 
 * Implements resilient orchestration across providers:
 * Priority Cascade: Gemini -> Groq -> NVIDIA NIM -> Local Deterministic Fallback
 * 
 * Features:
 * - Configurable timeouts (AI_TIMEOUT_MS)
 * - Single-repair retry on malformed JSON / schema parse errors
 * - Execution telemetry & observability (latency, provider, model, retryCount, fallbackUsed)
 * - Pure server-side execution with zero client secret leakage
 */

import { z } from "zod";
import {
  AIProvider,
  GenerationOptions,
  OrchestratedResult,
  ProviderHealthResult,
  ProviderOperationalStatus,
  ProviderType,
} from "./ai-provider";
import { GeminiProvider } from "./gemini-provider";
import { createGroqProvider, createNvidiaNimProvider } from "./openai-compatible-provider";
import { FallbackProvider } from "./fallback-provider";

export interface OrchestratorOptions extends GenerationOptions {
  forceFallback?: boolean;
  maxRetries?: number;
  preferredProvider?: ProviderType;
}

export class AIOrchestrator {
  private static instance: AIOrchestrator | null = null;

  private providers: Map<ProviderType, AIProvider> = new Map();
  private primaryProviderId: ProviderType;
  private fallbackChain: ProviderType[];
  private defaultTimeoutMs: number;
  private providerStatus: Map<
    ProviderType,
    { status: ProviderOperationalStatus; lastChecked: number; lastError?: string }
  > = new Map();

  constructor() {
    // Instantiate all available providers
    const gemini = new GeminiProvider();
    const groq = createGroqProvider();
    const nvidia = createNvidiaNimProvider();
    const fallback = new FallbackProvider();

    this.providers.set("gemini", gemini);
    this.providers.set("groq", groq);
    this.providers.set("nvidia", nvidia);
    this.providers.set("fallback", fallback);

    // Primary provider for content generation is Gemini by default
    const envPrimary = (process.env.AI_PRIMARY_PROVIDER || "gemini").toLowerCase() as ProviderType;
    this.primaryProviderId = this.providers.has(envPrimary) ? envPrimary : "gemini";

    const envFallbacks = process.env.AI_FALLBACK_PROVIDERS
      ? (process.env.AI_FALLBACK_PROVIDERS.split(",").map((s) => s.trim().toLowerCase()) as ProviderType[])
      : ["nvidia", "fallback"];

    // Ensure fallback is always the last safety net
    this.fallbackChain = Array.from(new Set([...envFallbacks, "fallback"])).filter(
      (id): id is ProviderType => this.providers.has(id as ProviderType)
    );

    this.defaultTimeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "25000", 10);
  }

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  public getProvider(id: ProviderType): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getProviderStatus(id: ProviderType): ProviderOperationalStatus | undefined {
    return this.providerStatus.get(id)?.status;
  }

  /**
   * Resolves the ordered candidate provider sequence according to task architecture:
   * - Content generation / learning ("learning", topic planning, retheming):
   *     PRIMARY: Gemini -> SECONDARY: NVIDIA NIM -> FALLBACK: Deterministic fallback.
   *     (Strictly NEVER routes through Groq).
   * - Mock interviews ("interview"):
   *     PRIMARY: Groq -> FALLBACK: Deterministic fallback.
   *     (Strictly NEVER routes to Gemini or NVIDIA).
   * - Other AI tasks (mock tests, evaluation):
   *     PRIMARY: Gemini -> SECONDARY: NVIDIA NIM -> FALLBACK: Deterministic fallback.
   */
  public getCandidateProviders(
    taskType?: string,
    preferredProvider?: ProviderType
  ): ProviderType[] {
    if (preferredProvider && this.providers.has(preferredProvider)) {
      if (taskType === "interview") {
        return [preferredProvider, "fallback"];
      }
      return Array.from(new Set([preferredProvider, "nvidia", "fallback"]));
    }

    if (taskType === "interview") {
      // Mock interview generation, questions, flow, follow-up:
      // Keep Groq primary; if unavailable/failing, fallback to deterministic interview engine.
      return ["groq", "fallback"];
    }

    // Content generation, topic planning, retheming, learning materials, assessments:
    // PRIMARY: Gemini -> SECONDARY: NVIDIA NIM -> FALLBACK: Deterministic fallback.
    const primary = this.primaryProviderId === "groq" ? "gemini" : this.primaryProviderId;
    return Array.from(new Set([primary, "nvidia", "fallback"]));
  }

  private isAuthError(errMsg: string): boolean {
    const lower = errMsg.toLowerCase();
    return (
      lower.includes("401") ||
      lower.includes("unauthenticated") ||
      lower.includes("invalid_api_key") ||
      lower.includes("invalid api key") ||
      lower.includes("access_token") ||
      lower.includes("unauthorized") ||
      lower.includes("forbidden") ||
      lower.includes("403")
    );
  }

  private sanitizeErrorMessage(errMsg: string): string {
    // Scrub sensitive credential patterns without fabricating error types
    const sanitized = errMsg
      .replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED_API_KEY]")
      .replace(/AQ\.[0-9A-Za-z-_]{30,}/g, "[REDACTED_API_KEY]")
      .replace(/gsk_[0-9A-Za-z]{30,}/g, "[REDACTED_API_KEY]")
      .replace(/nvapi-[0-9A-Za-z-_]{30,}/g, "[REDACTED_API_KEY]")
      .replace(/Bearer\s+[^ "']+/gi, "Bearer [REDACTED_TOKEN]")
      .replace(/key=[^ &"']+/gi, "key=[REDACTED_KEY]");

    return sanitized.slice(0, 160);
  }

  /**
   * Health check across all registered providers
   */
  public async checkHealth(): Promise<ProviderHealthResult[]> {
    const results: ProviderHealthResult[] = [];
    for (const [, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        let operationalStatus: ProviderOperationalStatus = "healthy";

        if (!health.configured) {
          operationalStatus = "unavailable";
        } else if (!health.reachable) {
          if (health.error && this.isAuthError(health.error)) {
            operationalStatus = "disabled_due_to_auth";
          } else {
            operationalStatus = "degraded";
          }
        }

        const sanitizedError = health.error
          ? this.sanitizeErrorMessage(health.error)
          : undefined;

        const enrichedHealth: ProviderHealthResult = {
          ...health,
          operationalStatus,
          error: sanitizedError,
        };

        this.providerStatus.set(provider.id, {
          status: operationalStatus,
          lastChecked: Date.now(),
          lastError: sanitizedError,
        });

        results.push(enrichedHealth);
      } catch (err: unknown) {
        const rawErr = err instanceof Error ? err.message : String(err);
        const operationalStatus: ProviderOperationalStatus = this.isAuthError(rawErr)
          ? "disabled_due_to_auth"
          : "unavailable";
        const sanitizedError = this.sanitizeErrorMessage(rawErr);

        this.providerStatus.set(provider.id, {
          status: operationalStatus,
          lastChecked: Date.now(),
          lastError: sanitizedError,
        });

        results.push({
          provider: provider.id,
          configured: provider.isConfigured(),
          reachable: false,
          model: provider.modelName,
          structuredOutputWorking: false,
          latencyMs: 0,
          operationalStatus,
          error: sanitizedError,
        });
      }
    }
    return results;
  }

  /**
   * Generates schema-enforced structured output with multi-provider fallback & repair retry
   */
  public async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: OrchestratorOptions
  ): Promise<OrchestratedResult<T>> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const taskType = options?.taskType || "learning";

    // If explicit offline/fallback requested, skip directly to deterministic provider
    if (options?.forceFallback) {
      const fallbackProvider = this.providers.get("fallback")!;
      const data = await fallbackProvider.generateStructured(prompt, schema, options);
      return {
        data,
        metadata: {
          provider: "fallback",
          model: fallbackProvider.modelName,
          taskType,
          latencyMs: Date.now() - startTime,
          fallbackUsed: true,
          retryCount: 0,
          schemaValid: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Assemble ordered sequence of candidate providers based on task architecture
    const candidatesToTry = this.getCandidateProviders(
      taskType,
      options?.preferredProvider
    );

    let retryCount = 0;
    const errorsEncountered: string[] = [];

    for (let i = 0; i < candidatesToTry.length; i++) {
      const providerId = candidatesToTry[i];
      const provider = this.providers.get(providerId);

      if (!provider) continue;

      // Skip providers that have no configured key (except fallback which is always configured)
      if (providerId !== "fallback" && !provider.isConfigured()) {
        continue;
      }

      // Skip providers disabled due to persistent authentication failure
      const statusInfo = this.providerStatus.get(providerId);
      if (statusInfo?.status === "disabled_due_to_auth") {
        continue;
      }

      const attemptStartTime = Date.now();

      try {
        // Primary attempt
        const data = await provider.generateStructured(prompt, schema, {
          ...options,
          timeoutMs,
        });

        const isFallback = providerId === "fallback";

        return {
          data,
          metadata: {
            provider: providerId,
            model: provider.modelName,
            taskType,
            latencyMs: isFallback ? Date.now() - startTime : Date.now() - attemptStartTime,
            fallbackUsed: isFallback,
            retryCount,
            schemaValid: true,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (this.isAuthError(errMsg)) {
          this.providerStatus.set(providerId, {
            status: "disabled_due_to_auth",
            lastChecked: Date.now(),
            lastError: this.sanitizeErrorMessage(errMsg),
          });
        }
        errorsEncountered.push(`${provider.displayName}: ${this.sanitizeErrorMessage(errMsg)}`);

        // Only attempt 1 repair retry if the error is a JSON parse error or schema validation failure
        const isSchemaOrParseError =
          errMsg.toLowerCase().includes("json") ||
          errMsg.toLowerCase().includes("parse") ||
          errMsg.toLowerCase().includes("zod") ||
          errMsg.toLowerCase().includes("schema") ||
          errMsg.toLowerCase().includes("syntax");

        if (providerId !== "fallback" && !options?.forceFallback && isSchemaOrParseError) {
          try {
            retryCount++;
            const repairPrompt = `${prompt}
            
ATTENTION: Your previous response failed schema validation.
Error: ${errMsg.slice(0, 180)}
Please output ONLY a clean, valid JSON object strictly matching the expected format with no enclosing text or extra properties.`;

            const repairedData = await provider.generateStructured(repairPrompt, schema, {
              ...options,
              timeoutMs,
            });

            return {
              data: repairedData,
              metadata: {
                provider: providerId,
                model: provider.modelName,
                taskType,
                latencyMs: Date.now() - attemptStartTime,
                fallbackUsed: false,
                retryCount,
                schemaValid: true,
                timestamp: new Date().toISOString(),
              },
            };
          } catch (retryErr: unknown) {
            const retryErrMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
            errorsEncountered.push(`${provider.displayName} (repair attempt): ${this.sanitizeErrorMessage(retryErrMsg)}`);
          }
        }
      }
    }

    // Ultimate fallback if all configured providers failed
    if (errorsEncountered.length > 0) {
      console.warn(`[AIOrchestrator] Providers failed for task "${taskType}": ${errorsEncountered.join(" | ")}`);
    }
    const fallbackProvider = this.providers.get("fallback")!;
    const fallbackData = await fallbackProvider.generateStructured(prompt, schema, options);

    return {
      data: fallbackData,
      metadata: {
        provider: "fallback",
        model: fallbackProvider.modelName,
        taskType,
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        retryCount,
        schemaValid: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Generates plain text with fallback cascade
   */
  public async generateText(
    prompt: string,
    options?: OrchestratorOptions
  ): Promise<OrchestratedResult<string>> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const taskType = options?.taskType || "learning";

    if (options?.forceFallback) {
      const fallbackProvider = this.providers.get("fallback")!;
      const text = await fallbackProvider.generateText(prompt, options);
      return {
        data: text,
        metadata: {
          provider: "fallback",
          model: fallbackProvider.modelName,
          taskType,
          latencyMs: Date.now() - startTime,
          fallbackUsed: true,
          retryCount: 0,
          schemaValid: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const candidates = this.getCandidateProviders(
      taskType,
      options?.preferredProvider
    );
    for (const providerId of candidates) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;
      if (providerId !== "fallback" && !provider.isConfigured()) continue;

      const statusInfo = this.providerStatus.get(providerId);
      if (statusInfo?.status === "disabled_due_to_auth") continue;

      try {
        const text = await provider.generateText(prompt, { ...options, timeoutMs });
        return {
          data: text,
          metadata: {
            provider: providerId,
            model: provider.modelName,
            taskType,
            latencyMs: Date.now() - startTime,
            fallbackUsed: providerId === "fallback",
            retryCount: 0,
            schemaValid: true,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (textErr: unknown) {
        const errMsg = textErr instanceof Error ? textErr.message : String(textErr);
        if (this.isAuthError(errMsg)) {
          this.providerStatus.set(providerId, {
            status: "disabled_due_to_auth",
            lastChecked: Date.now(),
            lastError: this.sanitizeErrorMessage(errMsg),
          });
        }
        // Continue down fallback chain
      }
    }

    const fallbackProvider = this.providers.get("fallback")!;
    const text = await fallbackProvider.generateText(prompt, options);
    return {
      data: text,
      metadata: {
        provider: "fallback",
        model: fallbackProvider.modelName,
        taskType,
        latencyMs: Date.now() - startTime,
        fallbackUsed: true,
        retryCount: 0,
        schemaValid: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
