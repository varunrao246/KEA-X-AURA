/**
 * Master Brain Domain Contracts & Types
 */

import type { Interest } from "@/lib/types";

export type MasterBrainType =
  | "WHY"
  | "WHAT_IF"
  | "PREDICT"
  | "REAL_WORLD"
  | "TRICK_YOUR_BRAIN"
  | "CHALLENGE_ASSUMPTION"
  | "COUNTEREXAMPLE"
  | "TRANSFER"
  | "IMAGINE";

export interface MasterBrainOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanationSnippet?: string;
}

export interface MasterBrainChallenge {
  id: string;
  topicId: string;
  topicName: string;
  conceptName: string;
  type: MasterBrainType;
  promptHeadline: string; // e.g. "🧠 One for your brain..."
  questionText: string;
  options: MasterBrainOption[];
  explanation: string;
  surprisingFact: string;
  realWorldConnection: {
    title: string;
    domain: string;
    description: string;
    sourceUrl?: string;
  };
  recommendedResourceUrl?: string;
  brainXpReward: number; // e.g. 5
  bonusXp: number; // e.g. 5
  interest?: Interest;
}

export interface MasterBrainEvaluationRequest {
  challengeId: string;
  studentId: string;
  selectedOptionId: string;
  freeformThinking?: string;
  timeSpentSec: number;
}

export interface MasterBrainEvaluationResponse {
  correct: boolean;
  headlineFeedback: string; // e.g. "Interesting thought! 👀"
  encouragingFeedback: string;
  fullExplanation: string;
  surprisingFact: string;
  realWorldConnection: {
    title: string;
    domain: string;
    description: string;
    sourceUrl?: string;
  };
  earnedBrainXp: number;
  newBrainStreak: number;
  streakExtendedToday: boolean;
}

export interface MasterBrainState {
  studentId: string;
  brainStreak: number;
  totalBrainXp: number;
  lastBrainActivityDate: string | null;
  completedChallengeIds: string[];
}

export type MasterBrainAnalyticsEventType =
  | "master_brain_shown"
  | "master_brain_started"
  | "master_brain_skipped"
  | "master_brain_answered"
  | "master_brain_correct"
  | "master_brain_incorrect"
  | "master_brain_explanation_viewed"
  | "master_brain_resource_opened";

export interface MasterBrainAnalyticsEvent {
  id: string;
  studentId: string;
  topicId: string;
  challengeId: string;
  eventType: MasterBrainAnalyticsEventType;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
}
