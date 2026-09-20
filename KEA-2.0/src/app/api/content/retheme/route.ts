/**
 * KEA Content Re-Theming API Route (P0-04)
 * POST /api/content/retheme
 */

import { NextRequest, NextResponse } from "next/server";
import { rethemeQuestion } from "@/lib/retheming";
import { StudentTheme } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { themingSuccess: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { canonicalItemId, targetTheme } = body as {
      canonicalItemId?: string;
      targetTheme?: StudentTheme;
    };

    if (!canonicalItemId) {
      return NextResponse.json(
        { themingSuccess: false, error: "canonicalItemId is required." },
        { status: 400 }
      );
    }

    const validThemes: StudentTheme[] = ["space", "wildlife", "chef", "superhero"];
    const theme = validThemes.includes(targetTheme as StudentTheme)
      ? (targetTheme as StudentTheme)
      : "space";

    const result = await rethemeQuestion(canonicalItemId, theme);

    return NextResponse.json({
      themingSuccess: true,
      thematicContext: result.thematicContext,
      rethemedQuestion: result.questionText,
      options: result.options,
      correctOptionId: result.correctOptionId,
      explanation: result.explanation,
      invariantCheckPassed: result.invariantCheckPassed,
      isFallback: result.isFallback,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to re-theme question";
    return NextResponse.json(
      { themingSuccess: false, error: errorMessage },
      { status: 500 }
    );
  }
}
