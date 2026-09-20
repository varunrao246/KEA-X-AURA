/**
 * Unified AI Topic Planning Service for KEA
 * 
 * Coordinates across Google Gemini, Groq, NVIDIA NIM, and FallbackTopicPlanner (resilience provider)
 * with strict schema and DAG validation.
 */

import { TopicPlanResponse } from "@/lib/ai/types";
import { GeminiTopicPlanner } from "@/lib/ai/gemini-topic-planner";
import { FallbackTopicPlanner } from "@/lib/ai/fallback-topic-planner";
import { validateTopicInput, validateAndNormalizeAITopicPlan } from "@/lib/ai/topic-plan-validator";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";
import { RawAITopicPlanSchema, TOPIC_PLAN_JSON_TEMPLATE } from "@/lib/ai/schemas";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { ExecutionMetadata, ProviderType } from "@/lib/ai/ai-provider";

async function planTopicWithOrchestrator(
  topic: string,
  learnerContext?: string
): Promise<{ plan: TopicCurriculumPlan; provider: ProviderType; metadata?: ExecutionMetadata } | null> {
  const orchestrator = AIOrchestrator.getInstance();
  const prompt = `You are KEA's AI Curriculum Architect and Learning Scientist.
Topic: "${topic}"
${learnerContext ? `Learner Context: ${learnerContext}` : ""}

Deconstruct this topic into a comprehensive 3-to-5 stage topic-to-mastery curriculum.
Requirements:
1. "topic": "${topic}"
2. "category": Academic domain (e.g. Computer Science, Chemistry, Biology, Mathematics)
3. "estimatedHours": total hours needed (number between 5 and 30)
4. "overview": 2-sentence summary of the curriculum
5. "prerequisiteSummary": foundational prerequisites needed
6. "stages": 3 to 5 sequential stages. Each stage must have id, stageNumber, title, tagline, objective, conceptIds, prerequisites, learningActivities, milestoneAssessment, masteryCondition.
7. "concepts": 6 to 12 distinct concepts across the stages. Each concept must have id (e.g. c1, c2, ...), name, summary, difficulty (foundational, intermediate, or advanced), and prerequisiteIds.
8. PREREQUISITE DAG INVARIANT: Prerequisite dependencies must form a strictly acyclic Directed Acyclic Graph (DAG) with zero circular dependencies.
9. REFERENTIAL INTEGRITY: Every conceptId in stages must exist in concepts, and every prerequisiteId in concepts must refer to another concept.

JSON TEMPLATE:
${TOPIC_PLAN_JSON_TEMPLATE}

Respond strictly with valid JSON conforming to this schema.`;

  const result = await orchestrator.generateStructured(prompt, RawAITopicPlanSchema, {
    taskType: "learning",
    temperature: 0.2,
    timeoutMs: 25000,
  });

  if (result.metadata.provider === "fallback") {
    return null;
  }

  const rawData = {
    ...result.data,
    topic: result.data.topic && result.data.topic !== "Curriculum Plan" && result.data.topic !== "Topic Name" ? result.data.topic : topic,
  };

  const validation = validateAndNormalizeAITopicPlan(rawData);
  if (validation.isValid && validation.plan) {
    return {
      plan: validation.plan,
      provider: result.metadata.provider,
      metadata: result.metadata,
    };
  }
  return null;
}

export async function getTopicPlan(
  rawTopic: unknown,
  learnerContext?: string,
  options?: { forceFallback?: boolean }
): Promise<TopicPlanResponse> {
  // 1. Validate Input
  const inputValidation = validateTopicInput(rawTopic);
  if (!inputValidation.isValid) {
    return {
      success: false,
      provider: "fallback",
      error: inputValidation.error || "Invalid topic input.",
    };
  }

  const topic = inputValidation.sanitizedTopic;
  const fallbackPlanner = new FallbackTopicPlanner();

  // 2. Primary Path: Multi-Provider Cascade via AIOrchestrator (Gemini -> NVIDIA NIM -> Fallback)
  if (!options?.forceFallback) {
    try {
      const orchestrated = await planTopicWithOrchestrator(topic, learnerContext);
      if (orchestrated) {
        return {
          success: true,
          plan: orchestrated.plan,
          provider: orchestrated.provider,
          metadata: orchestrated.metadata,
        };
      }
    } catch (orchErr: unknown) {
      const errText = orchErr instanceof Error ? orchErr.message : String(orchErr);
      console.warn(`[KEA AI Service] Orchestrated topic planning cascade failed: ${errText}. Falling back to local curriculum engine.`);
    }
  }

  // 3. Fallback Path: Gemini Direct (only if configured and not disabled due to auth)
  const geminiStatus = AIOrchestrator.getInstance().getProviderStatus("gemini");
  const geminiPlanner = new GeminiTopicPlanner();
  if (geminiPlanner.isConfigured() && geminiStatus !== "disabled_due_to_auth" && !options?.forceFallback) {
    try {
      const plan = await geminiPlanner.planTopic(topic, learnerContext);
      return {
        success: true,
        plan,
        provider: "gemini",
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[KEA AI Service] Gemini direct topic planning failed: ${errorMsg}.`);
    }
  }

  // 4. Resilience Path: Fallback Topic Planner
  try {
    const plan = await fallbackPlanner.planTopic(topic);
    return {
      success: true,
      plan,
      provider: "fallback",
      notice: "Loaded via KEA verified curriculum engine.",
    };
  } catch (fallbackErr: unknown) {
    const errText = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
    console.error(`[KEA AI Service] Fallback planner also failed: ${errText}`);
    return {
      success: false,
      provider: "fallback",
      error: "KEA couldn't build the learning path right now. Try again.",
    };
  }
}

