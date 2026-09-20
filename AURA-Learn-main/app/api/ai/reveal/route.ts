import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { getStore } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DEMO ONLY. Lets the AI studio show that every re-themed version has the same answer key.
 * Switch it off for real use with AURA_ALLOW_ANSWER_REVEAL=false, since it would otherwise spoil practice questions.
 */
export async function GET(request: Request) {
  if (process.env.AURA_ALLOW_ANSWER_REVEAL === "false") return fail("Answer reveal is disabled", 403);
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const id = new URL(request.url).searchParams.get("questionId");
  const q = getStore().questions.find((x) => x.id === id);
  if (!q) return fail("Unknown question", 404);
  return ok({ answer: q.type === "numeric" ? `${q.answer}${q.unit ? " " + q.unit : ""}` : q.answer });
}
