import { NextResponse } from "next/server";
import { generateMasterBrainChallenge } from "@/lib/mastery-brain/generator";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireUser("student").catch(() => null);
    const body = await req.json().catch(() => ({}));

    const topicId = String(body.topicId || "photosynthesis");
    const topicName = String(body.topicName || topicId);
    const conceptName = body.conceptName ? String(body.conceptName) : undefined;
    const masteryScore = Number(body.masteryScore ?? 75);
    const detectedMisconception = body.detectedMisconception ? String(body.detectedMisconception) : null;
    const studentInterests = Array.isArray(body.studentInterests) ? body.studentInterests : undefined;
    const previousChallengeIds = Array.isArray(body.previousChallengeIds) ? body.previousChallengeIds : [];

    const challenge = await generateMasterBrainChallenge({
      topicId,
      topicName,
      conceptName,
      masteryScore,
      detectedMisconception,
      studentInterests,
      previousChallengeIds,
    });

    return NextResponse.json({
      ok: true,
      data: challenge,
    });
  } catch (err) {
    console.error("[MasterBrain API] Challenge generation failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to generate Master Brain challenge" },
      { status: 500 }
    );
  }
}
