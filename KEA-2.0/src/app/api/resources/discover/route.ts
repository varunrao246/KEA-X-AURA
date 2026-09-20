/**
 * Server-Side Route Handler: POST /api/resources/discover
 * 
 * Secure API boundary for SERP-backed educational resource discovery.
 * Aggressively enforces ONE SERP SEARCH PER NEW TOPIC and server-side caching.
 * Protects SERP API keys from client leakage.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { discoverResources } from "@/lib/resources";

export const dynamic = "force-dynamic";

const DiscoverRequestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, "Topic cannot be empty")
    .max(250, "Topic is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parseResult = DiscoverRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid topic provided.";
      return NextResponse.json(
        { success: false, error: issue },
        { status: 400 }
      );
    }

    const { topic } = parseResult.data;
    const result = await discoverResources(topic);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to discover resources." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resourcePool: result.resourcePool,
      fromCache: result.fromCache,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[POST /api/resources/discover] Unexpected server error:", message);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during resource discovery." },
      { status: 500 }
    );
  }
}
