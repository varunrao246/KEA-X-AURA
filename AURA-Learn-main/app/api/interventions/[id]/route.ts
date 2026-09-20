import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { mutate, getStore } from "@/lib/db";
import { applyFacilitatorAction, type FacilitatorAction } from "@/lib/intervention";

export const dynamic = "force-dynamic";

const ACTIONS: FacilitatorAction[] = ["review", "assign", "start", "resolve"];

/**
 * A facilitator moves a case forward: review it, start helping, or resolve it.
 * Facilitator-only, enforced here (not just by hiding the buttons in the UI).
 * body: { action: "review" | "assign" | "start" | "resolve", note?: string }
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "facilitator") return fail("Only a facilitator can update an intervention", 401);
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { action?: string; note?: string } | null;
  if (!body?.action || !ACTIONS.includes(body.action as FacilitatorAction)) return fail(`action must be one of ${ACTIONS.join(", ")}`);

  const result = mutate((s) => applyFacilitatorAction(s, id, body.action as FacilitatorAction, new Date(), body.note?.slice(0, 300)));
  if (!result.ok) {
    return result.reason === "not_found" ? fail("Unknown intervention", 404) : fail("That case can't move to this step from where it is right now", 409);
  }
  const store = getStore();
  const studentName = store.users.find((u) => u.id === result.intervention.studentId)?.name ?? result.intervention.studentId;
  const topicName = store.topics.find((t) => t.id === result.intervention.topicId)?.name ?? result.intervention.topicId;
  return ok({ intervention: { ...result.intervention, studentName, topicName } });
}
