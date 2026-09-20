/**
 * KEA Real-Time Intervention Dispatcher & Struggle Detection Engine (P0-06 & P0-07)
 * 
 * Rules:
 * 1. Deterministic trigger: >= 2 consecutive failures on same concept triggers intervention.
 * 2. Reroutes student path to weakest prerequisite ancestor via KnowledgeGraphEngine.
 * 3. Compiles a Prescriptive Action Brief for the classroom teacher.
 */

import { KnowledgeGraphEngine } from "@/lib/knowledge-graph/engine";
import { InterventionRecord, PrescriptiveActionBrief, StruggleEvaluationResult } from "./types";

const PRESCRIPTIVE_MISCONCEPTIONS: Record<string, { misconception: string; brief: PrescriptiveActionBrief }> = {
  NODE_03: {
    misconception: "Whole-Number Denominator Bias & Numerator Inversion",
    brief: {
      physicalTool: "Wooden fraction comparison strips (1-whole, 1/4 tiles, and 1/8 tiles).",
      dialoguePrompt: "Ask the student: 'If you and 7 friends share one cake vs 3 friends sharing one cake, whose slice is bigger?'",
      verificationStep: "Have the student place the 1/4 tile directly on top of the 1/8 tile to verify that 1/4 = 2/8.",
    },
  },
  NODE_02: {
    misconception: "Numerator/Denominator Role Reversal",
    brief: {
      physicalTool: "Two-color counters and blank fraction circle mats.",
      dialoguePrompt: "Ask the student: 'Which number tells us how many equal cuts to make, and which tells us how many to eat?'",
      verificationStep: "Have the student partition the circular mat into the denominator's count before placing numerator counters.",
    },
  },
  NODE_01: {
    misconception: "Unequal Partitioning Confusion",
    brief: {
      physicalTool: "Playdough and plastic dough cutters.",
      dialoguePrompt: "Ask the student: 'If one piece is huge and one piece is tiny, are they fair fractions?'",
      verificationStep: "Student folds paper strips into exactly equal halves and fourths.",
    },
  },
};

export class InterventionDispatcher {
  private static instance: InterventionDispatcher;
  private interventions = new Map<string, InterventionRecord>();

  public static getInstance(): InterventionDispatcher {
    if (!InterventionDispatcher.instance) {
      InterventionDispatcher.instance = new InterventionDispatcher();
    }
    return InterventionDispatcher.instance;
  }

  /**
   * Evaluates student performance on a concept attempt and dispatches an intervention if struggle is detected.
   */
  public evaluateStruggle(params: {
    studentId: string;
    studentName: string;
    grade?: number;
    conceptId: string;
    conceptTitle: string;
    consecutiveFailures: number;
    currentMastery: number;
    totalAttempts: number;
    graphEngine?: KnowledgeGraphEngine;
    masteryScores?: Record<string, number>;
  }): StruggleEvaluationResult {
    const {
      studentId,
      studentName,
      grade = 4,
      conceptId,
      conceptTitle,
      consecutiveFailures,
      currentMastery,
      totalAttempts,
      graphEngine,
      masteryScores = {},
    } = params;

    // Check Rule 1: >= 2 consecutive failures
    const isConsecutiveFailure = consecutiveFailures >= 2;
    // Check Rule 2: Chronic low mastery (>= 4 attempts with < 55%)
    const isChronicLow = totalAttempts >= 4 && currentMastery < 55;

    if (!isConsecutiveFailure && !isChronicLow) {
      return { struggleDetected: false };
    }

    const ruleMatched = isConsecutiveFailure ? "consecutive_failures" : "chronic_low_mastery";

    // Prescriptive Brief
    const matchedBrief = PRESCRIPTIVE_MISCONCEPTIONS[conceptId] || {
      misconception: "Foundational Conceptual Bottleneck",
      brief: {
        physicalTool: "Step-by-step diagnostic breakdown worksheet with concrete manipulatives.",
        dialoguePrompt: `Review with ${studentName}: 'Can you walk me through your reasoning on ${conceptTitle} step by step?'`,
        verificationStep: "Student solves a scaffolded foundational example aloud before proceeding.",
      },
    };

    // Calculate Remediation Target from KnowledgeGraphEngine
    let remediationTargetNodeId: string | undefined;
    let remediationTargetTitle: string | undefined;

    if (graphEngine) {
      const weakestAncestor = graphEngine.getRemediationTarget(conceptId, masteryScores);
      if (weakestAncestor) {
        remediationTargetNodeId = weakestAncestor.id;
        remediationTargetTitle = weakestAncestor.title;
      }
    }

    // Create unique intervention ID
    const interventionId = `intv_${studentId}_${conceptId}_${Date.now()}`;
    const intervention: InterventionRecord = {
      id: interventionId,
      studentId,
      studentName,
      grade,
      conceptId,
      conceptTitle,
      diagnosedMisconception: matchedBrief.misconception,
      severity: isConsecutiveFailure ? "high" : "medium",
      prescriptiveAction: matchedBrief.brief,
      status: "pending",
      createdAt: Date.now(),
    };

    this.interventions.set(interventionId, intervention);

    return {
      struggleDetected: true,
      ruleMatched,
      intervention,
      remediationTargetNodeId,
      remediationTargetTitle,
    };
  }

  /**
   * Retrieves all active/pending interventions.
   */
  public getInterventions(): InterventionRecord[] {
    return Array.from(this.interventions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Retrieves pending interventions requiring facilitator attention.
   */
  public getPendingInterventions(): InterventionRecord[] {
    return this.getInterventions().filter(i => i.status === "pending" || i.status === "acknowledged");
  }

  /**
   * Facilitator marks an intervention as acknowledged.
   */
  public acknowledgeIntervention(id: string): InterventionRecord | undefined {
    const record = this.interventions.get(id);
    if (record) {
      record.status = "acknowledged";
      this.interventions.set(id, record);
    }
    return record;
  }

  /**
   * Facilitator resolves an intervention with applied pedagogical action.
   */
  public resolveIntervention(params: {
    id: string;
    facilitatorId?: string;
    resolutionType: "manipulatives_used" | "one_on_one_explained" | "scaffold_assigned";
    notes?: string;
  }): InterventionRecord | undefined {
    const record = this.interventions.get(params.id);
    if (record) {
      record.status = "resolved";
      record.resolvedAt = Date.now();
      record.resolvedBy = params.facilitatorId || "Ms. Priya (Class 4-B Teacher)";
      record.resolutionType = params.resolutionType;
      record.facilitatorNotes = params.notes;
      this.interventions.set(params.id, record);
    }
    return record;
  }

  /**
   * Clear for test isolation.
   */
  public clear(): void {
    this.interventions.clear();
  }
}
