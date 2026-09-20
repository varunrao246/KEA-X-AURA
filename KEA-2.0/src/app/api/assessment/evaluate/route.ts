/**
 * KEA Platform — Assessment Evaluation API Route
 * 
 * Endpoint: POST /api/assessment/evaluate
 * Hybrid assessment evaluator:
 * - Authoritative server-side evaluation against trusted assessment session record
 * - Client-submitted answer keys or tampered indices are strictly rejected/ignored
 * - Deterministic checking for multiple-choice questions
 * - AI semantic rubric evaluation for short-answer and reasoning questions
 * - Synthesizes mastery evidence payloads for deterministic MasteryEngine ingestion
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { AssessmentEvaluationSchema } from "@/lib/ai/schemas";
import { getAssessmentSession } from "@/lib/assessment/session-store";

export const dynamic = "force-dynamic";

const SubmissionItemSchema = z.object({
  questionId: z.string(),
  studentAnswer: z.union([z.string(), z.number()]),
  // Discarded/ignored client parameters if sent:
  type: z.string().optional(),
  conceptId: z.string().optional(),
  correctOptionIndex: z.any().optional(),
  prompt: z.string().optional(),
  rubric: z.any().optional(),
  sampleIdealAnswer: z.string().optional(),
});

const AssessmentEvaluateInputSchema = z.object({
  testId: z.string().min(1),
  topic: z.string().optional(),
  responses: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  submissions: z.array(SubmissionItemSchema).optional(),
  demoMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = AssessmentEvaluateInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid evaluation submission",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { testId, topic: requestedTopic, responses, submissions, demoMode } = parseResult.data;

    // Retrieve authoritative server assessment session
    const serverSession = getAssessmentSession(testId);
    if (!serverSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Assessment session not found or expired. Please generate a new test.",
          details: `No active server assessment session found for testId: ${testId}`,
        },
        { status: 404 }
      );
    }

    const topic = serverSession.topic || requestedTopic || "General Topic";

    // Map learner responses by questionId
    const studentAnswerMap = new Map<string, string | number>();
    if (responses) {
      for (const [qId, ans] of Object.entries(responses)) {
        studentAnswerMap.set(qId, ans);
      }
    }
    if (submissions) {
      for (const sub of submissions) {
        studentAnswerMap.set(sub.questionId, sub.studentAnswer);
      }
    }

    const orchestrator = AIOrchestrator.getInstance();
    const evaluations = [];
    const openEndedToEvaluate: Array<{
      questionId: string;
      conceptId: string;
      prompt: string;
      studentAnswer: string | number;
      rubric?: Array<{ criterion: string; weight: number }>;
      sampleIdealAnswer?: string;
    }> = [];

    // 1. Authoritative evaluation using SERVER session questions
    for (const q of serverSession.questions) {
      const studentAns = studentAnswerMap.get(q.id) ?? "";

      if (q.type === "multiple_choice") {
        const studentIndex = typeof studentAns === "number" ? studentAns : parseInt(String(studentAns), 10);
        // Authoritative verification against server-side correctOptionIndex ONLY
        const isCorrect = !isNaN(studentIndex) && studentIndex === q.correctOptionIndex;

        evaluations.push({
          questionId: q.id,
          conceptId: q.conceptId,
          isCorrect,
          score: isCorrect ? 100 : 0,
          understanding: (isCorrect ? "strong" : "weak") as "strong" | "weak",
          rubricHits: isCorrect ? ["Selected correct option"] : [],
          misconceptions: isCorrect ? [] : ["Incorrect choice on conceptual objective question"],
          feedback: isCorrect
            ? `Correct! ${q.explanation || "You identified the proper conceptual principle."}`
            : `Incorrect. ${q.explanation || "Review the core definition and foundational principles."}`,
          confidence: 1.0, // 100% deterministic certainty
        });
      } else {
        openEndedToEvaluate.push({
          questionId: q.id,
          conceptId: q.conceptId,
          prompt: q.prompt,
          studentAnswer: studentAns,
          rubric: q.rubric,
          sampleIdealAnswer: q.sampleIdealAnswer,
        });
      }
    }

    // 2. AI semantic rubric evaluation for open-ended questions using server rubrics
    if (openEndedToEvaluate.length > 0) {
      const openEndedPrompt = `You are KEA's Academic Assessment Evaluator.
Topic: "${topic}"
Evaluate the following student responses against their respective authoritative rubrics and ideal answers:

${openEndedToEvaluate
  .map(
    (q, idx) => `
[Question ${idx + 1}]
ID: ${q.questionId}
Concept ID: ${q.conceptId}
Prompt: ${q.prompt}
Rubric: ${JSON.stringify(q.rubric || [])}
${q.sampleIdealAnswer ? `Ideal Answer: ${q.sampleIdealAnswer}` : ""}
Student Answer: "${q.studentAnswer}"
`
  )
  .join("\n")}

Respond with a JSON object conforming strictly to:
{
  "testId": "${testId}",
  "topic": "${topic}",
  "totalQuestions": ${openEndedToEvaluate.length},
  "overallScore": number between 0 and 100,
  "evaluations": [
    {
      "questionId": string,
      "conceptId": string,
      "isCorrect": boolean,
      "score": number between 0 and 100,
      "understanding": "strong" | "partial" | "weak",
      "rubricHits": string[],
      "misconceptions": string[],
      "feedback": string,
      "confidence": number between 0 and 1
    }
  ],
  "strengths": string[],
  "areasForImprovement": string[],
  "recommendedAction": "advance" | "review" | "remediate"
}`;

      try {
        const aiEval = await orchestrator.generateStructured(
          openEndedPrompt,
          AssessmentEvaluationSchema,
          {
            taskType: "evaluation",
            forceFallback: demoMode,
            temperature: 0.2,
          }
        );

        for (const item of aiEval.data.evaluations) {
          evaluations.push(item);
        }
      } catch (err: unknown) {
        console.warn("[Assessment Evaluate] AI evaluation failed, using fallback heuristic:", err);
        for (const q of openEndedToEvaluate) {
          const ansText = String(q.studentAnswer).toLowerCase();
          const hasLength = ansText.length > 25;
          const score = hasLength ? 80 : 40;
          evaluations.push({
            questionId: q.questionId,
            conceptId: q.conceptId,
            isCorrect: hasLength,
            score,
            understanding: (hasLength ? "strong" : "weak") as "strong" | "weak",
            rubricHits: hasLength ? ["Demonstrated relevant vocabulary and reasoning"] : [],
            misconceptions: hasLength ? [] : ["Answer was brief or lacked supporting chemical detail"],
            feedback: hasLength
              ? "Good articulation of key chemical principles."
              : "Consider expanding on the underlying mechanism.",
            confidence: 0.85,
          });
        }
      }
    }

    // 3. Compute aggregate scores and mastery evidence
    const totalScore = Math.round(
      evaluations.reduce((sum, e) => sum + e.score, 0) / (evaluations.length || 1)
    );

    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    evaluations.forEach((e) => {
      if (e.understanding === "strong") {
        strengths.push(`Solid mastery on concept: ${e.conceptId}`);
      } else {
        areasForImprovement.push(`Needs reinforcement on concept: ${e.conceptId}`);
      }
    });

    const recommendedAction: "advance" | "review" | "remediate" =
      totalScore >= 80 ? "advance" : totalScore >= 60 ? "review" : "remediate";

    // Build evidence payloads formatted for MasteryEngine / W-EMM
    const masteryEvidence = evaluations.map((e) => ({
      conceptId: e.conceptId,
      success: e.isCorrect,
      score: e.score,
      weight: e.questionId.startsWith("mt_q4") || e.questionId.startsWith("mt_q5") ? 1.5 : 1.0,
      understanding: e.understanding,
      confidence: e.confidence,
      misconceptions: e.misconceptions,
      timestamp: Date.now(),
    }));

    return NextResponse.json(
      {
        success: true,
        evaluation: {
          testId,
          topic,
          totalQuestions: evaluations.length,
          overallScore: totalScore,
          evaluations,
          strengths: Array.from(new Set(strengths)),
          areasForImprovement: Array.from(new Set(areasForImprovement)),
          recommendedAction,
        },
        masteryEvidence,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/assessment/evaluate] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to evaluate assessment submission",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
