import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { rethemeWithApp } from "@/lib/ai";
import { isInterest } from "@/lib/ai/interests";
import { getStore } from "@/lib/db";
import { getStudentProfile } from "@/lib/repo";
import type { AiMode } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

/**
 * Re-theme a question around a student's interest.
 *   body: { questionId, interest?, mode?: "auto" | "template" | "off" }
 * Always answers with a usable question: if the AI is missing, slow, or produces something that fails the
 * guardrails, the built-in theme or the original is returned, and `source` and `pipeline` say which and why.
 * The response never contains the answer, and the API key never leaves the server.
 */
export async function POST(request: Request) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const body = (await request.json().catch(() => null)) as { questionId?: string; interest?: string; mode?: string } | null;
  if (!body?.questionId) return fail("questionId is required");

  const store = getStore();
  const question = store.questions.find((q) => q.id === body.questionId);
  if (!question) return fail("Unknown question", 404);

  const interest = body.interest ?? getStudentProfile(user.id)?.interests[0];
  if (!isInterest(interest)) return fail("Choose an interest to theme this question around.");
  const mode: AiMode | undefined = body.mode === "auto" || body.mode === "template" || body.mode === "off" ? body.mode : undefined;

  const topicName = store.topics.find((t) => t.id === question.topicId)?.name ?? question.topicId;
  const result = await rethemeWithApp({ question, topicName, interest, requester: user.id, mode });
  return ok(result);
}
