import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getStudentProfile } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in", 401);
  const profile = user.role === "student" ? getStudentProfile(user.id) ?? null : null;
  return ok({ user, profile });
}
