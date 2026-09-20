import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState, recommend } from "@/lib/student";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const state = getStudentState(getStore(), user.id);
  return ok({ state, recommendations: recommend(state) });
}
