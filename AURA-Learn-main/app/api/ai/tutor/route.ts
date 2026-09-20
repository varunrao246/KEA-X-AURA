import { fail, ok } from "@/lib/api";
import { getStudentUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { tutorWithApp } from "@/lib/ai";
import { bumpHintLevel, buildTutorContext } from "@/lib/ai/tutorContext";
import type { TutorMode } from "@/lib/ai/tutorStrategy";

export const dynamic = "force-dynamic";

const MODES: TutorMode[] = ["explain", "hint", "review", "next-step"];

/**
 * The AI Tutor. The client can only choose WHICH topic/question/mode it's asking about — every
 * signal the tutor reasons over (mastery, struggle, prerequisites, attempt history) is rebuilt
 * server-side from the same store the adaptive engine uses. There is no field the client can send
 * to influence mastery/struggle/correctness; the request body has no such fields at all.
 */
export async function POST(request: Request) {
  const user = await getStudentUser();
  if (!user) return fail("Not signed in as a student", 401);

  const body = (await request.json().catch(() => null)) as { topicId?: string; questionId?: string; mode?: string; message?: string; displayedStem?: string; variation?: number } | null;
  if (!body?.topicId) return fail("topicId is required");
  const mode = body.mode as TutorMode;
  if (!MODES.includes(mode)) return fail(`mode must be one of ${MODES.join(", ")}`);

  let ctx;
  try {
    ctx = mutate((store) => {
      // Read "hints already given" BEFORE bumping, so the strategy layer's hintLevel (= hints given
      // so far + 1) is level 1 on the very first request. The bump then prepares the counter for
      // whichever hint comes NEXT, so it never runs the same level twice or skips one.
      const built = buildTutorContext(store, user.id, body.topicId!, { questionId: body.questionId, displayedStem: body.displayedStem });
      if (mode === "hint" && body.questionId) bumpHintLevel(store, user.id, body.questionId, new Date());
      return built;
    });
  } catch {
    return fail("Unknown topic", 404);
  }

  // The variation selects a different explanation angle. It is bounded server-side and never affects
  // mastery, struggle, grading, or any other learning record.
  const variation = Number.isSafeInteger(body.variation) ? Math.max(0, Math.min(999, body.variation!)) : 0;
  const result = await tutorWithApp(ctx, mode, body.message, variation);
  // Never return the question's answer/explanation/formula or any other internal context field —
  // only the tutor's own output and the safe signal summary.
  return ok({ type: result.type, message: result.message, nextAction: result.nextAction, strategy: result.strategy, source: result.source, signals: result.signals });
}
