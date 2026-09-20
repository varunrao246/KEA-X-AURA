/**
 * KEA Platform — Real AI Learning Generation API Route
 * 
 * Endpoint: POST /api/learning/generate
 * Generates personalized explanations, worked examples, misconception alerts,
 * interactive practice questions, hints, and stretch challenges for any concept.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { GeneratedLearningContentSchema, LEARNING_CONTENT_JSON_TEMPLATE } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

const LearningGenerateInputSchema = z.object({
  topic: z.string().min(1).default("General Topic"),
  stage: z.union([z.number(), z.string()]).default(1),
  concept: z
    .object({
      id: z.string(),
      title: z.string().optional(),
      name: z.string().optional(),
      summary: z.string().optional(),
    })
    .transform((c) => ({
      id: c.id,
      title: c.title || c.name || "Core Concept",
      summary: c.summary,
    })),
  learnerState: z.record(z.string(), z.unknown()).optional(),
  mastery: z.number().min(0).max(100).optional().default(50),
  recentMistakes: z.array(z.string()).optional().default([]),
  pace: z.string().optional().default("steady"),
  theme: z.string().optional().default("default"),
  demoMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = LearningGenerateInputSchema.safeParse(rawBody);

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

    const { topic, stage, concept, mastery, recentMistakes, pace, theme, demoMode } =
      parseResult.data;

    const orchestrator = AIOrchestrator.getInstance();

    const isAdvanced = mastery >= 80;
    const hasMistakes = recentMistakes.length > 0;

    const adaptiveDirective = isAdvanced
      ? "Learner demonstrates advanced mastery (>=80%) with fast pace. Emphasize rigorous extension-oriented depth, mechanistic nuance, and advanced stretch challenges."
      : hasMistakes
      ? `Learner has recorded misconceptions: ${recentMistakes.join("; ")}. Emphasize targeted remediation, supportive analogies resolving the specific misconception, step-by-step scaffolding, and confidence-building practice.`
      : "Learner is establishing baseline competency. Provide supportive structural analogies and clear step-by-step worked demonstrations.";

    const prompt = `You are KEA's AI Adaptive Learning Engine.
Topic: "${topic}"
Current Stage: ${stage}
Target Concept ID: "${concept.id}"
Target Concept Title: "${concept.title}"
${concept.summary ? `Concept Summary: "${concept.summary}"` : ""}
Learner Mastery: ${mastery}%
Learner Pace: ${pace}
Learner Interest/Theme: ${theme}
Recent Mistakes/Gaps: ${hasMistakes ? recentMistakes.join("; ") : "None recorded"}
Adaptive Pedagogical Directive: ${adaptiveDirective}

Generate NEW, customized educational content for this learner:
1. A rich, intuitive, personalized conceptual explanation (at least 20 words, engaging and tailored to the theme and mastery).
2. A 3-step worked example demonstrating concrete reasoning.
3. A common misconception alert explaining the pitfall and how to avoid it (specifically targeting recorded mistakes if any).
4. A brand new 4-option multiple-choice practice question testing conceptual understanding calibrated to the learner's mastery.
5. A progressive hint.
6. A stretch challenge to test deeper mastery.
7. A recommended next step.

You MUST respond strictly with a valid JSON object matching this structure:
${LEARNING_CONTENT_JSON_TEMPLATE}`;

    const result = await orchestrator.generateStructured(
      prompt,
      GeneratedLearningContentSchema,
      {
        taskType: "learning",
        forceFallback: demoMode,
        temperature: 0.3,
      }
    );

    return NextResponse.json(
      {
        success: true,
        content: result.data,
        metadata: result.metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/learning/generate] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate learning content",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
