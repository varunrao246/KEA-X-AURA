import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { isInterest } from "@/lib/ai/interests";
import { mutate } from "@/lib/db";
import type { Interest } from "@/lib/types";
import { PracticeError, submitAttempt } from "@/lib/practice";

export const dynamic = "force-dynamic";

/** Grade an answer on the server. The browser never receives the answer before submitting. */
export async function POST(request: Request) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);
  const body = (await request.json().catch(() => null)) as { questionId?: string; answer?: string; timeTakenSec?: number; hintsUsed?: number; skipped?: boolean; theme?: { interest?: string; source?: string } } | null;
  if (!body?.questionId) return fail("questionId is required");
  if (!body.skipped && typeof body.answer !== "string") return fail("answer is required");

  try {
    const result = mutate((s) =>
      submitAttempt(s, user.id, {
        questionId: body.questionId!, answer: body.answer ?? "", timeTakenSec: Number(body.timeTakenSec) || 0,
        hintsUsed: Number(body.hintsUsed) || 0, skipped: !!body.skipped,
        theme: isInterest(body.theme?.interest) && ["ai", "template", "original"].includes(body.theme?.source ?? "") ? { interest: body.theme!.interest as Interest, source: body.theme!.source as "ai" | "template" | "original" } : undefined,
      }),
    );
    return ok(result);
  } catch (e) {
    if (e instanceof PracticeError) return Response.json({ ok: false, error: e.message, code: e.code, ...e.extra }, { status: e.status });
    throw e;
  }
}
