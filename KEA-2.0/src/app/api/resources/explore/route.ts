import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exploreConceptResources } from "@/lib/resources";

export const dynamic = "force-dynamic";

const ExploreRequestSchema = z.object({
  topic: z.string().trim().min(1, "Topic cannot be empty").max(200),
  conceptTitle: z.string().trim().min(1, "Concept title cannot be empty").max(200),
  misconception: z.string().trim().max(300).optional(),
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

    const parseResult = ExploreRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid explore parameters.";
      return NextResponse.json(
        { success: false, error: issue },
        { status: 400 }
      );
    }

    const { topic, conceptTitle, misconception } = parseResult.data;

    const result = await exploreConceptResources({
      topic,
      conceptTitle,
      misconception,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[POST /api/resources/explore] Server error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
