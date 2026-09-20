import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getTopicEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";

/**
 * Everything the adaptive engine currently believes about one topic: mastery breakdown, difficulty window,
 * struggle signals, prerequisite check, unlock rule, tracking stats and the decision log.
 */
export async function GET(request: Request) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const topicId = new URL(request.url).searchParams.get("topicId");
  if (!topicId) return fail("topicId is required");
  const engine = getTopicEngine(getStore(), user.id, topicId);
  if (!engine) return fail("Unknown topic", 404);
  return ok(engine);
}
