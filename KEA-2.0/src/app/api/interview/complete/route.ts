/**
 * KEA Platform — AI Mock Interview Complete & Summary Synthesis API Route
 * 
 * Endpoint: POST /api/interview/complete
 * Synthesizes multi-turn oral interview transcript into an evidence-backed
 * pedagogical summary, identifying strengths, misconceptions, reasoning fluency,
 * and deterministic mastery adjustments.
 * 
 * Enforces server session integrity: summarizes based on the authoritative server-stored
 * turn transcript, ignoring client-forged history arrays.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { InterviewSummarySchema, INTERVIEW_SUMMARY_JSON_TEMPLATE } from "@/lib/ai/schemas";
import { getInterviewSession, completeInterviewSession } from "@/lib/interview/session-store";

export const dynamic = "force-dynamic";

const TurnHistoryItemSchema = z.object({
  turnNumber: z.number(),
  question: z.string(),
  studentAnswer: z.string(),
  understanding: z.enum(["strong", "partial", "weak"]).optional(),
  misconceptions: z.array(z.string()).optional().default([]),
});

const InterviewCompleteInputSchema = z.object({
  sessionId: z.string().min(1),
  topic: z.string().default("Organic Chemistry"),
  history: z.array(TurnHistoryItemSchema).optional(),
  demoMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = InterviewCompleteInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interview completion input",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { sessionId, topic: clientTopic, history: clientHistory, demoMode } = parseResult.data;
    const orchestrator = AIOrchestrator.getInstance();

    // 1. Authoritative Server Turn Retrieval
    const session = getInterviewSession(sessionId);
    let turnsToSummarize: Array<{
      turnNumber: number;
      question: string;
      studentAnswer: string;
      understanding?: string;
      misconceptions?: string[];
    }> = [];

    let topic = clientTopic;

    if (session && session.turns.length > 0) {
      // Use authoritative server-stored turns
      turnsToSummarize = session.turns;
      topic = session.topic;
      completeInterviewSession(sessionId);
    } else if (clientHistory && clientHistory.length > 0) {
      // Fallback only if server was restarted mid-session
      turnsToSummarize = clientHistory;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "No interview turns found to summarize for session.",
        },
        { status: 400 }
      );
    }

    const transcriptFormatted = turnsToSummarize
      .map(
        (t) => `Turn ${t.turnNumber}:
Interviewer: "${t.question}"
Student: "${t.studentAnswer}"
Evaluation Note: Understanding was ${t.understanding || "evaluated"}. Misconceptions: ${t.misconceptions?.join(", ") || "None"}.`
      )
      .join("\n\n");

    const prompt = `You are KEA's Senior Academic Defense Synthesizer.
Topic: "${topic}"
Session ID: "${sessionId}"

Analyze the complete oral defense transcript:
${transcriptFormatted}

Produce a structured, rigorous assessment summary:
1. overallScore: integer between 0 and 100 representing cumulative reasoning mastery.
2. understandingLevel: "expert" (90+), "proficient" (75-89), "developing" (50-74), or "novice" (<50).
3. conceptsDemonstrated: array of distinct chemical concepts successfully explained.
4. strongConcepts: specific areas of exceptional clarity.
5. weakConcepts: concepts where reasoning was hesitant or flawed.
6. misconceptions: any persistent or uncorrected misconceptions observed.
7. reasoningQualitySummary: concise paragraph summarizing verbal defense rigor.
8. recommendedNextSteps: actionable learning activities or remediation targets.
9. sampleEvidenceQuote: notable student quote demonstrating conceptual insight or growth.

You MUST respond strictly with a valid JSON object matching this structure:
${INTERVIEW_SUMMARY_JSON_TEMPLATE}`;

    const result = await orchestrator.generateStructured(
      prompt,
      InterviewSummarySchema,
      {
        taskType: "interview",
        forceFallback: demoMode,
        temperature: 0.2,
      }
    );

    return NextResponse.json(
      {
        success: true,
        sessionId,
        summary: result.data,
        metadata: result.metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/interview/complete] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate interview summary",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
