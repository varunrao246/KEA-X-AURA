/**
 * KEA Platform — AI Mock Test Generation API Route
 * 
 * Endpoint: POST /api/assessment/generate
 * Dynamically synthesizes a milestone mock diagnostic exam featuring a balanced
 * mixture of multiple-choice, short-answer, and reasoning questions calibrated
 * to the learner's current mastery level.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { GeneratedMockTestSchema, MOCK_TEST_JSON_TEMPLATE } from "@/lib/ai/schemas";
import { saveAssessmentSession } from "@/lib/assessment/session-store";

export const dynamic = "force-dynamic";

const AssessmentGenerateInputSchema = z.object({
  topic: z.string().min(1).default("General Knowledge"),
  stageNumber: z.number().int().optional().default(1),
  targetConcepts: z
    .array(
      z
        .object({
          id: z.string(),
          title: z.string().optional(),
          name: z.string().optional(),
        })
        .transform((c) => ({
          id: c.id,
          title: c.title || c.name || "Core Concept",
        }))
    )
    .optional()
    .default([]),
  currentMastery: z.number().min(0).max(100).optional().default(60),
  recentMistakes: z.array(z.string()).optional().default([]),
  targetDifficulty: z
    .enum(["foundational", "intermediate", "advanced", "adaptive"])
    .optional()
    .default("adaptive"),
  numQuestions: z.number().min(3).max(10).optional().default(5),
  demoMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = AssessmentGenerateInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      topic,
      stageNumber,
      targetConcepts,
      currentMastery,
      recentMistakes,
      targetDifficulty,
      numQuestions,
      demoMode,
    } = parseResult.data;

    const orchestrator = AIOrchestrator.getInstance();

    const conceptsStr =
      targetConcepts.length > 0
        ? targetConcepts.map((c) => `${c.title} (${c.id})`).join(", ")
        : `Foundations, Core Principles, Intermediate Dynamics, and Advanced Applications of ${topic}`;

    const prompt = `You are KEA's AI Assessment Engineering Service.
Topic: "${topic}"
Stage: ${stageNumber}
Target Concepts: ${conceptsStr}
Learner Current Mastery: ${currentMastery}%
Target Difficulty: ${targetDifficulty}
Recent Identified Mistakes: ${recentMistakes.length > 0 ? recentMistakes.join("; ") : "None"}

Generate a fresh, brand-new mock test containing exactly ${numQuestions} questions:
- Question 1: multiple_choice (foundational or intermediate) testing core definitions, rules, or axioms of ${topic}
- Question 2: multiple_choice (intermediate) testing structural patterns, relationships, or conceptual identification in ${topic}
- Question 3: short_answer (intermediate) requiring a 1-2 sentence conceptual explanation with a rubric
- Question 4: reasoning (advanced) requiring analytical comparison or trade-off evaluation with a rubric
- Question 5: reasoning or short_answer (advanced) connecting underlying theory to practical problem-solving in ${topic} with a rubric

Include clear evaluation rubrics for short_answer and reasoning questions.

You MUST respond strictly with a valid JSON object matching this structure:
${MOCK_TEST_JSON_TEMPLATE}`;

    const result = await orchestrator.generateStructured(
      prompt,
      GeneratedMockTestSchema,
      {
        taskType: "mock_test",
        forceFallback: demoMode,
        temperature: 0.3,
      }
    );

    const clientSafeTest = saveAssessmentSession(result.data);

    return NextResponse.json(
      {
        success: true,
        test: clientSafeTest,
        metadata: result.metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/assessment/generate] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate mock test",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
