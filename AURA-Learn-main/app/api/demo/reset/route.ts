import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { resetStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Restore the seeded demo story. This wipes every student's attempts, mastery and interventions
 * back to the seed, so it is restricted to the demo accounts (Aarav, Ms. Rao) rather than any
 * signed-in user — a real student/facilitator account must never be able to reset the whole class.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in", 401);
  if (!user.demo) return fail("Demo reset is only available for demo accounts", 403);
  const store = resetStore();
  return ok({ reset: true, users: store.users.length });
}
