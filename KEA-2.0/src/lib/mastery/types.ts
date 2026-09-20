/**
 * Type Contracts for KEA Deterministic Mastery Engine
 * Weighted Exponential Moving Mastery (W-EMM)
 */

import { AssessmentItemType, NodeMasteryStatus } from "@/types";

/**
 * A single piece of assessment evidence for a concept.
 * Clean, structured, and auditable.
 */
export interface AssessmentEvidence {
  /** Target concept identifier (e.g. 'py_variables', 'math_fractions_01') */
  conceptId: string;
  /** Modality tier */
  assessmentType: AssessmentItemType;
  /** Score normalized to [0, 100] */
  score: number;
  /** Optional attempt metadata for debugging or pedagogical context */
  metadata?: {
    isCorrect?: boolean;
    durationSeconds?: number;
    difficultyTier?: "foundational" | "intermediate" | "advanced";
  };
  /** Unix timestamp in milliseconds */
  timestamp?: number;
}

/**
 * Summary of evidence used in a calculation batch.
 */
export interface EvidenceSummary {
  totalItems: number;
  practiceCount: number;
  writtenCount: number;
  oralCount: number;
  weightedAverage: number;
}

/**
 * Audit record of a single mastery score update.
 */
export interface MasteryAuditRecord {
  timestamp: number;
  previousScore: number;
  evidenceScore: number;
  newScore: number;
  status: NodeMasteryStatus;
  evidenceCount: number;
  alphaUsed: number;
}

/**
 * Structured, explainable output of a mastery calculation.
 * Contains full auditability details for teachers and debugging.
 */
export interface MasteryCalculationResult {
  conceptId: string;
  previousScore: number;
  evidenceScore: number;
  newScore: number;
  status: NodeMasteryStatus;
  evidenceSummary: EvidenceSummary;
  transitionedToMastered: boolean;
  transitionedToRemediation: boolean;
}

/**
 * In-memory concept mastery profile for a learner.
 */
export interface ConceptMasteryState {
  conceptId: string;
  currentScore: number;
  status: NodeMasteryStatus;
  attemptCount: number;
  consecutiveFailures: number;
  lastUpdated: number;
  history: MasteryAuditRecord[];
}

/**
 * Options for configuring mastery updates.
 */
export interface MasteryCalculationOptions {
  /** Override default learning rate alpha */
  alpha?: number;
  /** Prerequisite satisfaction flag (from KnowledgeGraphEngine) */
  isUnlocked?: boolean;
  /** Force timestamp for deterministic replay in tests */
  timestamp?: number;
}
