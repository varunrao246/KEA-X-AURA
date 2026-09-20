import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { nextQuestion, PracticeError } from "@/lib/practice";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const url = new URL(request.url);
  const topicId = url.searchParams.get("topicId");
  if (!topicId) return fail("topicId is required");
  const exclude = (url.searchParams.get("exclude") ?? "").split(",").filter(Boolean);
  try {
    return ok(mutate((s) => nextQuestion(s, user.id, topicId, exclude)));
  } catch (e) {
    if (e instanceof PracticeError) return Response.json({ ok: false, error: e.message, code: e.code, ...e.extra }, { status: e.status });
    throw e;
  }
}
