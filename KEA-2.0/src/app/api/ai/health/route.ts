/**
 * KEA Platform — AI Health & Provider Status API Route
 * 
 * Endpoint: GET /api/ai/health
 * Probes all registered AI providers (Gemini, Groq, NVIDIA NIM, Fallback),
 * reporting readiness, reachability, and latencies without leaking any keys.
 */

import { NextResponse } from "next/server";
import { getAIProvidersHealth } from "@/lib/ai/provider-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getAIProvidersHealth();
    return NextResponse.json(health, { status: 200 });
  } catch (err: unknown) {
    console.error("[API /api/ai/health] Health check failed:", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Health check failed",
      },
      { status: 500 }
    );
  }
}
