import { NextResponse } from "next/server";
import { evaluateMasterBrainAnswer, getOrCreateBrainState } from "@/lib/mastery-brain/generator";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser("student").catch(() => null);
    const body = await req.json().catch(() => ({}));

    if (!body.challenge || !body.selectedOptionId) {
      return NextResponse.json(
        { ok: false, error: "Missing challenge or selected option" },
        { status: 400 }
      );
    }

    const studentId = user?.id || body.studentId || "demo-student";

    const response = evaluateMasterBrainAnswer({
      challenge: body.challenge,
      studentId,
      selectedOptionId: String(body.selectedOptionId),
      freeformThinking: body.freeformThinking ? String(body.freeformThinking) : undefined,
    });

    return NextResponse.json({
      ok: true,
      data: response,
    });
  } catch (err) {
    console.error("[MasterBrain API] Answer evaluation failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to evaluate Master Brain answer" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireUser("student").catch(() => null);
    const { searchParams } = new URL(req.url);
    const studentId = user?.id || searchParams.get("studentId") || "demo-student";
    const state = getOrCreateBrainState(studentId);

    return NextResponse.json({
      ok: true,
      data: state,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve Master Brain state" },
      { status: 500 }
    );
  }
}
