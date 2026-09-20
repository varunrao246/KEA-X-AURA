/**
 * KEA Diagnostic Assessment Calibration API Route
 * POST /api/diagnostic/evaluate
 */

import { NextRequest, NextResponse } from "next/server";
import { calibrateDiagnostic } from "@/lib/diagnostic/engine";
import { DiagnosticAnswerSubmission } from "@/lib/diagnostic/types";
import { TopicCurriculumPlan } from "@/types/topic-path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { topicPlan, submissions } = body as {
      topicPlan?: TopicCurriculumPlan;
      submissions?: DiagnosticAnswerSubmission[];
    };

    if (!topicPlan || !Array.isArray(topicPlan.stages)) {
      return NextResponse.json(
        { success: false, error: "Valid topicPlan with stages is required." },
        { status: 400 }
      );
    }

    const safeSubmissions = Array.isArray(submissions) ? submissions : [];
    const calibrationResult = calibrateDiagnostic(topicPlan, safeSubmissions);

    return NextResponse.json({
      success: true,
      calibration: calibrationResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal diagnostic calibration error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
