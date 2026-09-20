import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { getHint, PracticeError } from "@/lib/practice";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const { id } = await ctx.params;
  try {
    return ok({ hint: mutate((s) => getHint(s, user.id, id)) });
  } catch (e) {
    if (e instanceof PracticeError) return fail(e.message, e.status);
    throw e;
  }
}
