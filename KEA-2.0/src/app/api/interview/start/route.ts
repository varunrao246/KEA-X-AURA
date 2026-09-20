/**
 * KEA Platform — AI Mock Interview Start API Route
 * 
 * Endpoint: POST /api/interview/start
 * Initializes a dynamic, multi-turn adaptive oral defense session.
 * Generates an opening probing question contextualized to the learner's mastery profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { FallbackProvider } from "@/lib/ai/fallback-provider";
import { createInterviewSession } from "@/lib/interview/session-store";

export const dynamic = "force-dynamic";

const InterviewStartInputSchema = z.object({
  topic: z.string().min(1).default("General Studies"),
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
  learnerMastery: z.number().min(0).max(100).optional().default(60),
  recentMistakes: z.array(z.string()).optional().default([]),
  demoMode: z.boolean().optional().default(false),
});

const OpeningQuestionSchema = z.object({
  openingQuestion: z.string().min(15),
  targetConceptId: z.string(),
  reasoning: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = InterviewStartInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interview start parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { topic, stageNumber, targetConcepts, learnerMastery, recentMistakes, demoMode } =
      parseResult.data;

    const sessionId = `int_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orchestrator = AIOrchestrator.getInstance();

    const conceptsDesc =
      targetConcepts.length > 0
        ? targetConcepts.map((c) => `${c.title} (${c.id})`).join(", ")
        : `Foundations, Core Principles, Analytical Methods, and Applied Problem-Solving in ${topic}`;

    const prompt = `You are a supportive, rigorous Academic Defense Interviewer at KEA.
Topic: "${topic}" (Stage ${stageNumber})
Core Concepts: ${conceptsDesc}
Learner Mastery: ${learnerMastery}%
Known Recent Mistakes: ${recentMistakes.length > 0 ? recentMistakes.join("; ") : "None"}

Your goal is to conduct a multi-turn verbal/text conceptual interview.
Generate an engaging, open-ended opening question that prompts the student to explain the core mechanism or principle behind the topic.

Do NOT ask a multiple choice question. Ask for verbal or written conceptual reasoning.
Adhere strictly to this JSON schema:
{
  "openingQuestion": "The clear, thought-provoking question to start the interview",
  "targetConceptId": "ID of the concept being probed",
  "reasoning": "Why this question tests foundational understanding"
}`;

    const fallbackProvider = new FallbackProvider();
    const fallbackOpening = fallbackProvider.generateFallbackOpeningQuestion(prompt) as {
      openingQuestion: string;
      targetConceptId: string;
      reasoning: string;
    };

    let question = fallbackOpening.openingQuestion;
    let conceptId = targetConcepts[0]?.id || fallbackOpening.targetConceptId;
    let metadata: unknown;

    try {
      const res = await orchestrator.generateStructured(prompt, OpeningQuestionSchema, {
        taskType: "interview",
        forceFallback: demoMode,
        temperature: 0.3,
        timeoutMs: 15000,
      });
      question = res.data.openingQuestion;
      conceptId = res.data.targetConceptId;
      metadata = res.metadata;
    } catch {
      // Offline fallback defaults - strictly topic-aware
      question = fallbackOpening.openingQuestion;
      conceptId = targetConcepts[0]?.id || fallbackOpening.targetConceptId;
      metadata = {
        provider: "fallback",
        model: "kea-deterministic-v1",
        taskType: "interview",
        latencyMs: 1,
        fallbackUsed: true,
        retryCount: 0,
        schemaValid: true,
        timestamp: new Date().toISOString(),
      };
    }

    createInterviewSession({
      sessionId,
      topic,
      stageNumber,
      targetConcepts,
      learnerMastery,
      currentQuestion: question,
      currentConceptId: conceptId,
      maxTurns: 4,
    });

    return NextResponse.json(
      {
        success: true,
        sessionId,
        topic,
        currentQuestion: question,
        currentConceptId: conceptId,
        targetConcepts,
        status: "active",
        turnIndex: 1,
        metadata,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[API /api/interview/start] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize interview session",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
