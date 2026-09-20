/**
 * KEA Platform — AI Provider Abstraction Interface
 * 
 * Defines vendor-neutral provider capabilities:
 * - Text generation
 * - Schema-enforced structured generation
 * - Multi-turn conversational interview turns
 * - Provider health probing
 */

import { z } from "zod";

export type ProviderType = "gemini" | "groq" | "nvidia" | "fallback";

export type ProviderOperationalStatus =
  | "healthy"
  | "degraded"
  | "disabled_due_to_auth"
  | "unavailable";

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  systemPrompt?: string;
  taskType?: "learning" | "mock_test" | "evaluation" | "interview" | "health";
}

export interface ProviderHealthResult {
  provider: ProviderType;
  configured: boolean;
  reachable: boolean;
  model: string;
  structuredOutputWorking: boolean;
  latencyMs: number;
  operationalStatus?: ProviderOperationalStatus;
  error?: string;
}

export interface ExecutionMetadata {
  provider: ProviderType;
  model: string;
  taskType: string;
  latencyMs: number;
  fallbackUsed: boolean;
  retryCount: number;
  schemaValid: boolean;
  timestamp: string;
}

export interface OrchestratedResult<T> {
  data: T;
  metadata: ExecutionMetadata;
}

export interface AIProvider {
  readonly id: ProviderType;
  readonly displayName: string;
  readonly modelName: string;

  isConfigured(): boolean;

  healthCheck(): Promise<ProviderHealthResult>;

  generateText(prompt: string, options?: GenerationOptions): Promise<string>;

  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: GenerationOptions
  ): Promise<T>;
}
