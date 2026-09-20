/**
 * KEA Platform — Oral Comprehension Probe Types (P1-01)
 *
 * Types for browser-native speech transcription, structured AI evaluation,
 * misconception extraction, and W-EMM oral evidence integration.
 */

import { StudentTheme } from "@/types";

export interface OralEvaluationRequest {
  studentId: string;
  conceptId: string;
  conceptTitle: string;
  transcript: string;
  expectedConceptPrinciple?: string;
  theme?: StudentTheme;
}

export type KnownMisconception =
  | "whole_number_denominator_bias"
  | "numerator_denominator_inversion"
  | "procedural_guessing"
  | "incomplete_reasoning"
  | "none";

export interface OralEvaluationResult {
  conceptualUnderstandingScore: number; // 0.00 to 1.00
  articulatesKeyPrinciple: boolean;
  identifiedMisconception: KnownMisconception;
  misconceptionDescription?: string;
  evidenceQuote: string;
  encouragingChildFeedback: string;
  suggestedCorrection?: string;
  isFallback: boolean;
  evaluationLatencyMs: number;
}
