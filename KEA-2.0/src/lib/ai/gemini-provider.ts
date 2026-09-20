/**
 * KEA Platform — Google Gemini Provider Implementation
 * 
 * Uses official @google/genai SDK with structured output constraints,
 * timeout safeguards, and vendor-neutral interface compliance.
 */

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AIProvider, GenerationOptions, ProviderHealthResult, ProviderType } from "./ai-provider";

export class GeminiProvider implements AIProvider {
  public readonly id: ProviderType = "gemini";
  public readonly displayName = "Google Gemini";
  public readonly modelName: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
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
        error: "GEMINI_API_KEY is not configured.",
      };
    }

    try {
      const pingSchema = z.object({ status: z.string(), ping: z.literal("pong") });
      const res = await this.generateStructured(
        "Return a JSON object with status 'ok' and ping 'pong'.",
        pingSchema,
        { timeoutMs: 8000 }
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
      throw new Error("Gemini API key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const timeoutMs = options?.timeoutMs || 8000;

    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const apiPromise = ai.models.generateContent({
      model: this.modelName,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty response.");
    }
    return text;
  }

  public async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    const timeoutMs = options?.timeoutMs || 8000;

    const systemDirective = options?.systemPrompt
      ? `${options.systemPrompt}\n\n`
      : "";

    const jsonInstructions = `
CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON object matching the requested schema.
Do NOT enclose in markdown code fences or backticks (e.g. no \`\`\`json).
Do NOT include any commentary, greetings, or explanations before or after the JSON.
`;

    const apiPromise = ai.models.generateContent({
      model: this.modelName,
      contents: [{ role: "user", parts: [{ text: `${systemDirective}${jsonInstructions}\n\n${prompt}` }] }],
      config: {
        responseMimeType: "application/json",
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty text response.");
    }

    // Clean potential markdown code blocks if the LLM outputted them despite responseMimeType
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  }
}
