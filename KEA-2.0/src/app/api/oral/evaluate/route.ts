/**
 * KEA Platform — AI Oral Evaluation API Route (P1-01)
 *
 * Endpoint: POST /api/oral/evaluate
 * Ingests spoken or typed natural language explanation, diagnoses conceptual
 * understanding vs misconceptions, and produces structured evaluation payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateOralResponse } from "@/lib/oral/evaluator";
import { OralEvaluationRequest } from "@/lib/oral/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { studentId, conceptId, conceptTitle, transcript, expectedConceptPrinciple, theme } = body;

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!conceptId || typeof conceptId !== "string") {
      return NextResponse.json(
        { error: "conceptId is required." },
        { status: 400 }
      );
    }

    const evaluationRequest: OralEvaluationRequest = {
      studentId: studentId || "student_guest",
      conceptId,
      conceptTitle: conceptTitle || "Concept Reasoning",
      transcript: transcript.trim(),
      expectedConceptPrinciple,
      theme,
    };

    const result = await evaluateOralResponse(evaluationRequest);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("[API /api/oral/evaluate] Internal error:", err);
    return NextResponse.json(
      {
        error: "Internal server error during oral evaluation.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
