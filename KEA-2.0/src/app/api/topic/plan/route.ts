/**
 * Server-Side Route Handler: POST /api/topic/plan
 * 
 * Secure API boundary for topic planning.
 * Keeps Gemini API keys strictly server-side and validates all requests.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTopicPlan } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { topic, learnerContext, forceFallback } = body;

    const result = await getTopicPlan(topic, learnerContext, { forceFallback: Boolean(forceFallback) });

    if (!result.success) {
      const isInputError = result.error?.includes("empty") || result.error?.includes("characters");
      return NextResponse.json(
        { success: false, error: result.error || "Failed to generate topic plan." },
        { status: isInputError ? 400 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: result.plan,
      provider: result.provider,
      notice: result.notice,
      metadata: result.metadata,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[POST /api/topic/plan] Unexpected server error:", message);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while generating the learning path." },
      { status: 500 }
    );
  }
}
