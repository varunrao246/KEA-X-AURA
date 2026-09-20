/**
 * Official Google Gemini Topic Planning Provider
 * 
 * Uses the official @google/genai SDK with structured output constraints
 * to synthesize topic-to-mastery curricula for arbitrary user learning goals.
 */

import { GoogleGenAI } from "@google/genai";
import { TopicPlanner } from "@/lib/ai/types";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { validateAndNormalizeAITopicPlan } from "@/lib/ai/topic-plan-validator";

const TOPIC_PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    category: { type: "string" },
    estimatedHours: { type: "integer" },
    overview: { type: "string" },
    prerequisiteSummary: { type: "string" },
    stages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          stageNumber: { type: "integer" },
          title: { type: "string" },
          tagline: { type: "string" },
          objective: { type: "string" },
          conceptIds: {
            type: "array",
            items: { type: "string" },
          },
          prerequisites: {
            type: "array",
            items: { type: "string" },
          },
          learningActivities: {
            type: "array",
            items: { type: "string" },
          },
          milestoneAssessment: { type: "string" },
          masteryCondition: { type: "string" },
        },
        required: ["id", "stageNumber", "title", "objective", "conceptIds"],
      },
    },
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          summary: { type: "string" },
          difficulty: {
            type: "string",
            enum: ["foundational", "intermediate", "advanced"],
          },
          prerequisiteIds: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["id", "name", "summary", "difficulty", "prerequisiteIds"],
      },
    },
  },
  required: [
    "topic",
    "category",
    "estimatedHours",
    "overview",
    "prerequisiteSummary",
    "stages",
    "concepts",
  ],
};

export class GeminiTopicPlanner implements TopicPlanner {
  public readonly name = "GeminiTopicPlanner";

  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async planTopic(topic: string, learnerContext?: string): Promise<TopicCurriculumPlan> {
    if (!this.isConfigured()) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const systemPrompt = `You are KEA's Curriculum Architecture Engine.
A learner wants to master the requested topic. Deconstruct this topic into a coherent, prerequisite-gated learning structure.

Strict Rules:
1. Generate between 2 and 5 sequential stages, from foundational concepts to practical mastery.
2. Generate between 4 and 12 atomic concept nodes.
3. Assign each concept to exactly one stage.
4. Concept prerequisiteIds must ONLY reference earlier concept IDs that are strictly necessary to understand before learning that concept.
5. The prerequisite graph MUST be a valid Directed Acyclic Graph (DAG) with ZERO cycles or circular dependencies.
6. Do NOT assume a fixed school grade or age unless specified.
7. Return only pure JSON adhering strictly to the response schema.`;

    const userPrompt = `Topic to decompose: "${topic}"${
      learnerContext ? `\nLearner Context: ${learnerContext}` : ""
    }`;

    // Call Gemini with structured output and bounded 25s timeout
    let timerId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => reject(new Error("Gemini Topic Planner timed out after 25000ms")), 25000);
    });

    let response;
    try {
      response = await Promise.race([
        ai.models.generateContent({
          model: this.modelName,
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: TOPIC_PLAN_JSON_SCHEMA,
          },
        }),
        timeoutPromise,
      ]);
    } finally {
      if (timerId) clearTimeout(timerId);
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error(`Failed to parse Gemini output as JSON: ${responseText.slice(0, 150)}`);
    }

    // Validate schema and DAG structure through KnowledgeGraphEngine
    const validation = validateAndNormalizeAITopicPlan(parsed);
    if (!validation.isValid || !validation.plan) {
      throw new Error(
        `Gemini generated an invalid curriculum plan: ${validation.errors?.join("; ")}`
      );
    }

    return validation.plan;
  }
}
