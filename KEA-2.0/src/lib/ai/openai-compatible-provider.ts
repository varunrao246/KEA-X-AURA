/**
 * KEA Platform — OpenAI-Compatible Provider Implementation
 * 
 * Reusable provider supporting Groq and NVIDIA NIM using standard
 * OpenAI REST chat completion format with JSON mode, bounded timeouts,
 * and schema parsing.
 */

import { z } from "zod";
import { AIProvider, GenerationOptions, ProviderHealthResult, ProviderType } from "./ai-provider";

export interface OpenAICompatibleConfig {
  id: ProviderType;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  public readonly id: ProviderType;
  public readonly displayName: string;
  public readonly modelName: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.modelName = config.defaultModel;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        provider: this.id,
        configured: false,
        reachable: false,
        model: this.modelName,
        structuredOutputWorking: false,
        latencyMs: 0,
        error: `${this.displayName} API key is not configured.`,
      };
    }

    try {
      const pingSchema = z.object({ status: z.string(), ping: z.literal("pong") });
      const res = await this.generateStructured(
        "Respond with a pure JSON object: {\"status\": \"ok\", \"ping\": \"pong\"}",
        pingSchema,
        { timeoutMs: 5000 }
      );

      return {
        provider: this.id,
        configured: true,
        reachable: true,
        model: this.modelName,
        structuredOutputWorking: res.ping === "pong",
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        provider: this.id,
        configured: true,
        reachable: false,
        model: this.modelName,
        structuredOutputWorking: false,
        latencyMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(`${this.displayName} API key is not configured.`);
    }

    const timeoutMs = options?.timeoutMs || 35000;
    const url = `${this.baseUrl}/chat/completions`;

    const messages = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `${this.displayName} HTTP ${response.status} ${response.statusText}: ${errorText.slice(0, 200)}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`${this.displayName} returned an empty choice.`);
    }

    return content;
  }

  public async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error(`${this.displayName} API key is not configured.`);
    }

    const timeoutMs = options?.timeoutMs || 35000;
    const url = `${this.baseUrl}/chat/completions`;

    const systemInstruction = `You are an educational AI assistant for KEA.
CRITICAL FORMATTING INSTRUCTION:
You MUST respond ONLY with a valid, parseable JSON object matching the requested schema.
Do NOT include markdown code blocks, backticks, or conversational preamble/postscript.
Output pure JSON starting with { and ending with }.`;

    const fullSystemPrompt = options?.systemPrompt
      ? `${systemInstruction}\n\n${options.systemPrompt}`
      : systemInstruction;

    const messages = [
      { role: "system", content: fullSystemPrompt },
      { role: "user", content: prompt },
    ];

    const bodyPayload: Record<string, unknown> = {
      model: this.modelName,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 4096,
    };

    // Include response_format json_object for supported endpoints
    bodyPayload.response_format = { type: "json_object" };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `${this.displayName} HTTP ${response.status} ${response.statusText}: ${errorText.slice(0, 200)}`
      );
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error(`${this.displayName} returned empty content.`);
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  }
}

/**
 * Pre-configured Factory for Groq
 */
export function createGroqProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    id: "groq",
    displayName: "Groq LPU",
    baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "",
    defaultModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
}

/**
 * Pre-configured Factory for NVIDIA NIM
 */
export function createNvidiaNimProvider(): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    id: "nvidia",
    displayName: "NVIDIA NIM",
    baseUrl: process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_NIM_API_KEY || "",
    defaultModel: process.env.NVIDIA_NIM_MODEL || "meta/llama-3.2-11b-vision-instruct",
  });
}
