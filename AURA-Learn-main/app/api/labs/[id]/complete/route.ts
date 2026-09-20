import { getLab } from "@/content/labs";
import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { recordLab } from "@/lib/practice";

export const dynamic = "force-dynamic";

/** Called by the lab page when an embedded lab reports a result. Records the event and updates mastery. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const { id } = await ctx.params;
  const lab = getLab(id);
  if (!lab) return fail("Unknown lab", 404);
  const body = (await request.json().catch(() => null)) as { score?: number; mistakes?: number } | null;
  const score = Number(body?.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) return fail("score must be a number from 0 to 100");
  const result = mutate((s) => recordLab(s, user.id, lab.id, lab.topicIds, score, Number(body?.mistakes) || 0));
  return ok(result);
}
