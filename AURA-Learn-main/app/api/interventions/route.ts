import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getStore, mutate } from "@/lib/db";
import { interventionQueue } from "@/lib/facilitator";
import { activeInterventionsOf, requestHelp, summarizeIntervention } from "@/lib/intervention";

export const dynamic = "force-dynamic";

/**
 * GET  students see their own cases; facilitators see every ACTIVE case, most urgent first.
 * POST { action: "ask-facilitator", topicId }  a student asks their facilitator for help.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in", 401);
  const store = getStore();
  if (user.role === "student") return ok({ interventions: store.interventions.filter((i) => i.studentId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
  return ok({ interventions: interventionQueue(store) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return fail("Only students can ask for help", 401);
  const body = (await request.json().catch(() => null)) as { action?: string; topicId?: string } | null;
  if (body?.action !== "ask-facilitator" || !body.topicId) return fail("Unsupported request");
  const iv = mutate((s) => requestHelp(s, user.id, body.topicId!, new Date()));
  if (!iv) return fail("There is no open case for that topic", 404);
  return ok({ intervention: summarizeIntervention(iv), open: activeInterventionsOf(getStore(), user.id).length });
}
