import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { aiStatus } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** Whether the AI service is available. Contains no secrets: the key is never returned. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in", 401);
  return ok(aiStatus());
}
