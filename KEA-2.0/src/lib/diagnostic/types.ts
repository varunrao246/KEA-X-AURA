/**
 * Types for KEA Diagnostic & Prerequisite Assessment Calibration (P0-03B)
 */

import { NodeMasteryStatus } from "@/types";
import { LearningStage } from "@/types/topic-path";

export interface DiagnosticAnswerSubmission {
  questionId: string;
  selectedOptionId: string;
}

export interface QuestionEvaluationResult {
  questionId: string;
  questionText: string;
  conceptTested: string;
  targetConceptId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
}

export interface DiagnosticCalibrationResult {
  topic: string;
  totalQuestions: number;
  correctCount: number;
  accuracyPercentage: number;
  questionResults: QuestionEvaluationResult[];
  masteredConceptIds: string[];
  unlockedConceptIds: string[];
  conceptMasteryScores: Record<string, number>;
  conceptStatuses: Record<string, NodeMasteryStatus>;
  recommendedStartingNodeId: string;
  recommendedStartingNodeTitle: string;
  calibratedStages: LearningStage[];
}
