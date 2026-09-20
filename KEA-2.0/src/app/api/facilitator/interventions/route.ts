/**
 * Facilitator Interventions API Route (P0-07)
 * GET /api/facilitator/interventions - Fetch active interventions
 * POST /api/facilitator/interventions - Acknowledge or Resolve an intervention
 */

import { NextRequest, NextResponse } from "next/server";
import { InterventionDispatcher } from "@/lib/intervention";

export const dynamic = "force-dynamic";

export async function GET() {
  const dispatcher = InterventionDispatcher.getInstance();
  const allInterventions = dispatcher.getInterventions();
  const pendingInterventions = dispatcher.getPendingInterventions();

  return NextResponse.json({
    success: true,
    totalCount: allInterventions.length,
    pendingCount: pendingInterventions.length,
    interventions: allInterventions,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { action, interventionId, facilitatorId, resolutionType, notes } = body as {
      action: "acknowledge" | "resolve";
      interventionId: string;
      facilitatorId?: string;
      resolutionType?: "manipulatives_used" | "one_on_one_explained" | "scaffold_assigned";
      notes?: string;
    };

    if (!interventionId) {
      return NextResponse.json(
        { success: false, error: "interventionId is required." },
        { status: 400 }
      );
    }

    const dispatcher = InterventionDispatcher.getInstance();

    if (action === "acknowledge") {
      const updated = dispatcher.acknowledgeIntervention(interventionId);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Intervention not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, intervention: updated });
    }

    if (action === "resolve") {
      const updated = dispatcher.resolveIntervention({
        id: interventionId,
        facilitatorId: facilitatorId || "Ms. Priya (Class 4-B Teacher)",
        resolutionType: resolutionType || "manipulatives_used",
        notes: notes || "Resolved with concrete manipulatives.",
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Intervention not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, intervention: updated });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Must be 'acknowledge' or 'resolve'." },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process intervention";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
