/**
 * KEA Platform — AI Mock Interview Respond & Adaptive Turn Route
 * 
 * Endpoint: POST /api/interview/respond
 * Ingests student's verbal/speech transcript or typed explanation.
 * Evaluates conceptual rigor, detects specific misconceptions, and adaptively
 * determines the next probing question, follow-up, remediation, or completion.
 * 
 * Enforces server-side session integrity: client cannot rewrite previous turns,
 * forge scores, or skip targeted probing questions.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { InterviewTurnEvaluationSchema, INTERVIEW_TURN_JSON_TEMPLATE } from "@/lib/ai/schemas";
import {
  getInterviewSession,
  recordInterviewTurn,
  createInterviewSession,
} from "@/lib/interview/session-store";

export const dynamic = "force-dynamic";

const TurnHistoryItemSchema = z.object({
  turnNumber: z.number(),
  question: z.string(),
  studentAnswer: z.string(),
  understanding: z.enum(["strong", "partial", "weak"]).optional(),
});

const InterviewRespondInputSchema = z.object({
  sessionId: z.string().min(1),
  topic: z.string().default("General Studies"),
  currentQuestion: z.string().min(5).optional(),
  currentConceptId: z.string().default("concept_foundations").optional(),
  studentResponse: z.string().min(1),
  history: z.array(TurnHistoryItemSchema).optional().default([]),
  turnCount: z.number().int().optional().default(1),
  maxTurns: z.number().int().optional().default(4),
  demoMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = InterviewRespondInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interview turn response",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      sessionId,
      topic: requestedTopic,
      currentQuestion: clientQuestion,
      currentConceptId: clientConceptId,
      studentResponse,
      demoMode,
    } = parseResult.data;

    // 1. Authoritative Server Session Resolution
    let session = getInterviewSession(sessionId);
    if (!session) {
      // Create session if missing (e.g. server restarted between start & respond)
      session = createInterviewSession({
        sessionId,
        topic: requestedTopic,
        currentQuestion: clientQuestion || `Explain the core principles of ${requestedTopic}.`,
        currentConceptId: clientConceptId || "concept_foundations",
        maxTurns: 4,
      });
    }

    // Authoritative state from server record
    const turnCount = session.turns.length + 1;
    const maxTurns = session.maxTurns;
    const isNearEnd = turnCount >= maxTurns;
    const activeQuestion = session.currentQuestion;
    const activeConceptId = session.currentConceptId;
    const trustedHistory = session.turns;

    const orchestrator = AIOrchestrator.getInstance();

    const prompt = `You are a supportive, rigorous Academic Defense Interviewer at KEA.
Topic: "${session.topic}"
Turn Number: ${turnCount} of max ${maxTurns}

Conversation Context So Far (Authoritative Transcript):
${trustedHistory.length > 0 ? trustedHistory.map((h) => `Q${h.turnNumber}: "${h.question}"\nA${h.turnNumber}: "${h.studentAnswer}"`).join("\n") : "Opening turn."}

Current Question Asked: "${activeQuestion}"
Current Concept Under Evaluation: "${activeConceptId}"
Student's Natural Response (Transcribed Voice or Typed): "${studentResponse}"

Evaluate the student's conceptual response:
1. Determine understanding: "strong" | "partial" | "weak".
2. Identify covered concepts.
3. Identify any specific misconceptions (e.g. confusing definitions, mixing up cause and effect, or missing scope constraints).
4. Decide next action:
   - If response was incomplete or revealed a misconception: "follow_up" or "remediate" with a targeted counter-probe.
   - If response was strong and we have not reached max turns: "advance" to a deeper concept.
   - If turn count is ${turnCount} >= ${maxTurns}: "finish" the interview.
5. Formulate the next question or concluding remark.

You MUST respond strictly with a valid JSON object matching this structure:
${INTERVIEW_TURN_JSON_TEMPLATE}`;

    const result = await orchestrator.generateStructured(
      prompt,
      InterviewTurnEvaluationSchema,
      {
        taskType: "interview",
        forceFallback: demoMode,
        temperature: 0.3,
      }
    );

    // If reached max turns, override nextAction to finish if not already
    const evaluation = result.data;
    if (isNearEnd && evaluation.nextAction !== "finish") {
      evaluation.nextAction = "finish";
      evaluation.nextQuestion = "Thank you. We have completed all stages of the oral defense. Click 'View Interview Summary' to review your comprehensive evaluation and evidence.";
    }

    // Persist authoritative turn to server session store
    recordInterviewTurn({
      sessionId,
      turnNumber: turnCount,
      question: activeQuestion,
      conceptId: activeConceptId,
      studentAnswer: studentResponse,
      understanding: evaluation.understanding,
      misconceptions: evaluation.misconceptions,
      feedback: evaluation.feedbackToStudent || evaluation.reasoningQuality,
      confidence: evaluation.confidence,
      nextQuestion: evaluation.nextQuestion,
      nextConceptId: evaluation.nextConceptId,
      isFinished: evaluation.nextAction === "finish",
    });

    // Synthesize MasteryEngine evidence item
    const masteryEvidence = {
      conceptId: activeConceptId,
      understanding: evaluation.understanding,
      score: evaluation.understanding === "strong" ? 95 : evaluation.understanding === "partial" ? 65 : 30,
      misconceptions: evaluation.misconceptions,
      confidence: evaluation.confidence,
      source: "ai_mock_interview",
      timestamp: Date.now(),
    };

    return NextResponse.json(
      {
        success: true,
        sessionId,
        turnNumber: turnCount + 1,
        evaluation,
        masteryEvidence,
        metadata: result.metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/interview/respond] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to evaluate interview response",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
