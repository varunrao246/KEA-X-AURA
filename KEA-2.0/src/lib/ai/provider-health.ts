/**
 * KEA Platform — Provider Health Service
 * 
 * Inspects all AI providers, probes them safely without leaking credentials,
 * and reports status, latencies, and operational readiness.
 */

import { AIOrchestrator } from "./ai-orchestrator";
import { ProviderHealthResult } from "./ai-provider";

export interface AIHealthReport {
  timestamp: string;
  status: "healthy" | "degraded" | "offline_fallback";
  primaryProvider: string;
  configuredCount: number;
  totalProviders: number;
  providers: ProviderHealthResult[];
}

export async function getAIProvidersHealth(): Promise<AIHealthReport> {
  const orchestrator = AIOrchestrator.getInstance();
  const providerResults = await orchestrator.checkHealth();

  const configuredCount = providerResults.filter((p) => p.configured && p.provider !== "fallback").length;
  const reachableCount = providerResults.filter((p) => p.reachable && p.provider !== "fallback").length;

  let overallStatus: "healthy" | "degraded" | "offline_fallback" = "offline_fallback";
  if (reachableCount >= 1) {
    overallStatus = "healthy";
  } else if (configuredCount >= 1 && reachableCount === 0) {
    overallStatus = "degraded";
  }

  const primary = (process.env.AI_PRIMARY_PROVIDER || "gemini").toLowerCase();

  return {
    timestamp: new Date().toISOString(),
    status: overallStatus,
    primaryProvider: primary,
    configuredCount,
    totalProviders: providerResults.length,
    providers: providerResults,
  };
}
