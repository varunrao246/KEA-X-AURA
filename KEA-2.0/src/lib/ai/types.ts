/**
 * AI Integration Types & Contracts for KEA Topic Planning
 */

import { TopicCurriculumPlan } from "@/types/topic-path";
import { ExecutionMetadata, ProviderType } from "./ai-provider";

export interface RawAIConcept {
  id: string;
  name: string;
  summary: string;
  difficulty: "foundational" | "intermediate" | "advanced";
  prerequisiteIds: string[];
}

export interface RawAIStage {
  id: string;
  stageNumber: number;
  title: string;
  tagline: string;
  objective: string;
  conceptIds: string[];
  prerequisites: string[];
  learningActivities: string[];
  milestoneAssessment: string;
  masteryCondition: string;
}

export interface RawAITopicPlan {
  topic: string;
  category: string;
  estimatedHours: number;
  overview: string;
  prerequisiteSummary: string;
  stages: RawAIStage[];
  concepts: RawAIConcept[];
}

export interface TopicPlanner {
  readonly name: string;
  planTopic(topic: string, learnerContext?: string): Promise<TopicCurriculumPlan>;
}

export interface TopicPlanResponse {
  success: boolean;
  plan?: TopicCurriculumPlan;
  provider: ProviderType;
  notice?: string;
  error?: string;
  metadata?: ExecutionMetadata;
}
