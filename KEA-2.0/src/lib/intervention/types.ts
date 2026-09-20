/**
 * Types for KEA Struggle Detection & Real-Time Intervention Dispatcher (P0-06 & P0-07)
 */

import { InterventionStatus } from "@/types";

export interface PrescriptiveActionBrief {
  physicalTool: string;
  dialoguePrompt: string;
  verificationStep: string;
}

export interface InterventionRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  conceptId: string;
  conceptTitle: string;
  diagnosedMisconception: string;
  severity: "low" | "medium" | "high";
  prescriptiveAction: PrescriptiveActionBrief;
  status: InterventionStatus;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionType?: "manipulatives_used" | "one_on_one_explained" | "scaffold_assigned";
  facilitatorNotes?: string;
}

export interface StruggleEvaluationResult {
  struggleDetected: boolean;
  ruleMatched?: "consecutive_failures" | "chronic_low_mastery" | "misconception_flagged";
  intervention?: InterventionRecord;
  remediationTargetNodeId?: string;
  remediationTargetTitle?: string;
}
