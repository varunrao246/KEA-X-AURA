/**
 * KEA Deterministic Mastery Engine
 * Weighted Exponential Moving Mastery (W-EMM)
 * 
 * Rules:
 * 1. 100% deterministic, auditable, and mathematically sound.
 * 2. Topic-agnostic: operates strictly on conceptId + assessment evidence + score.
 * 3. Never labels learners; only tracks current conceptual mastery states.
 * 4. Zero LLM control over scores, thresholds, or status transitions.
 */

import { NodeMasteryStatus } from "@/types";
import {
  CONSECUTIVE_FAILURES_FOR_REMEDIATION,
  DEFAULT_ALPHA,
  EVIDENCE_WEIGHTS,
  INITIAL_CONCEPT_SCORE,
  MASTERY_THRESHOLD,
  MAX_ALPHA,
  MAX_SCORE,
  MIN_ALPHA,
  MIN_SCORE,
  REMEDIATION_THRESHOLD,
} from "./constants";
import {
  AssessmentEvidence,
  ConceptMasteryState,
  EvidenceSummary,
  MasteryAuditRecord,
  MasteryCalculationOptions,
  MasteryCalculationResult,
} from "./types";

/**
 * Validates a single assessment evidence record.
 * Throws explicit descriptive errors on malformed input.
 */
export function validateEvidence(evidence: AssessmentEvidence): void {
  if (!evidence) {
    throw new Error("Assessment evidence cannot be null or undefined.");
  }

  if (typeof evidence.conceptId !== "string" || evidence.conceptId.trim().length === 0) {
    throw new Error("Assessment evidence must have a valid non-empty conceptId.");
  }

  if (!evidence.assessmentType || !(evidence.assessmentType in EVIDENCE_WEIGHTS)) {
    throw new Error(
      `Invalid assessment type: "${evidence.assessmentType}". Must be one of: ${Object.keys(
        EVIDENCE_WEIGHTS
      ).join(", ")}.`
    );
  }

  if (
    typeof evidence.score !== "number" ||
    !Number.isFinite(evidence.score) ||
    evidence.score < MIN_SCORE ||
    evidence.score > MAX_SCORE
  ) {
    throw new Error(
      `Invalid evidence score: ${evidence.score}. Score must be a finite number between ${MIN_SCORE} and ${MAX_SCORE}.`
    );
  }
}

/**
 * Aggregates a list of assessment evidence records using pedagogical weights:
 * - Practice: 0.25
 * - Written: 0.35
 * - Oral: 0.40
 * 
 * Returns the normalized weighted score in [0, 100] and the summary breakdown.
 */
export function calculateWeightedEvidenceScore(
  evidenceList: AssessmentEvidence[]
): { weightedAverage: number; summary: EvidenceSummary } {
  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    throw new Error("Cannot calculate evidence score for empty or non-array evidence list.");
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let practiceCount = 0;
  let writtenCount = 0;
  let oralCount = 0;

  for (const evidence of evidenceList) {
    validateEvidence(evidence);

    const weight = EVIDENCE_WEIGHTS[evidence.assessmentType];
    totalWeightedScore += evidence.score * weight;
    totalWeight += weight;

    if (evidence.assessmentType === "practice") practiceCount++;
    else if (evidence.assessmentType === "written") writtenCount++;
    else if (evidence.assessmentType === "oral") oralCount++;
  }

  const rawAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const clampedAverage = Math.min(MAX_SCORE, Math.max(MIN_SCORE, rawAverage));
  const roundedAverage = Math.round(clampedAverage * 100) / 100;

  const summary: EvidenceSummary = {
    totalItems: evidenceList.length,
    practiceCount,
    writtenCount,
    oralCount,
    weightedAverage: roundedAverage,
  };

  return { weightedAverage: roundedAverage, summary };
}

/**
 * Calculates new mastery score using Weighted Exponential Moving Mastery (W-EMM):
 * 
 * newMastery = oldMastery + alpha * (evidenceScore - oldMastery)
 * 
 * Clamps result strictly to [0, 100] and rounds to 2 decimal places.
 */
export function calculateEMMUpdate(
  oldMastery: number,
  evidenceScore: number,
  alpha: number = DEFAULT_ALPHA
): number {
  if (
    typeof oldMastery !== "number" ||
    !Number.isFinite(oldMastery) ||
    oldMastery < MIN_SCORE ||
    oldMastery > MAX_SCORE
  ) {
    throw new Error(
      `Invalid oldMastery: ${oldMastery}. Must be a finite number between ${MIN_SCORE} and ${MAX_SCORE}.`
    );
  }

  if (
    typeof evidenceScore !== "number" ||
    !Number.isFinite(evidenceScore) ||
    evidenceScore < MIN_SCORE ||
    evidenceScore > MAX_SCORE
  ) {
    throw new Error(
      `Invalid evidenceScore: ${evidenceScore}. Must be a finite number between ${MIN_SCORE} and ${MAX_SCORE}.`
    );
  }

  if (
    typeof alpha !== "number" ||
    !Number.isFinite(alpha) ||
    alpha < MIN_ALPHA ||
    alpha > MAX_ALPHA
  ) {
    throw new Error(
      `Invalid alpha: ${alpha}. Alpha must be a finite number between ${MIN_ALPHA} and ${MAX_ALPHA}.`
    );
  }

  const delta = evidenceScore - oldMastery;
  const rawUpdated = oldMastery + alpha * delta;
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, rawUpdated));
  return Math.round(clamped * 100) / 100;
}

/**
 * Determines concept learning status deterministically based on:
 * - Current mastery score
 * - Prerequisite unlock state
 * - Consecutive failure count
 * - Attempt history
 */
export function determineStatus(params: {
  score: number;
  isUnlocked?: boolean;
  consecutiveFailures: number;
  hasAttempted: boolean;
}): NodeMasteryStatus {
  const { score, isUnlocked = true, consecutiveFailures, hasAttempted } = params;

  if (!isUnlocked) {
    return "locked";
  }

  if (!hasAttempted) {
    return "unlocked";
  }

  if (score >= MASTERY_THRESHOLD) {
    return "mastered";
  }

  if (
    score < REMEDIATION_THRESHOLD &&
    consecutiveFailures >= CONSECUTIVE_FAILURES_FOR_REMEDIATION
  ) {
    return "remediation";
  }

  return "in_progress";
}

/**
 * Main Deterministic Mastery Engine class.
 * Tracks concept profiles, applies W-EMM updates, and ensures auditability.
 */
export class MasteryEngine {
  private readonly stateMap = new Map<string, ConceptMasteryState>();

  constructor(initialStates?: Record<string, Partial<ConceptMasteryState>>) {
    if (initialStates) {
      for (const [conceptId, partialState] of Object.entries(initialStates)) {
        this.stateMap.set(conceptId, {
          conceptId,
          currentScore: partialState.currentScore ?? INITIAL_CONCEPT_SCORE,
          status: partialState.status ?? "unlocked",
          attemptCount: partialState.attemptCount ?? 0,
          consecutiveFailures: partialState.consecutiveFailures ?? 0,
          lastUpdated: partialState.lastUpdated ?? Date.now(),
          history: partialState.history ? [...partialState.history] : [],
        });
      }
    }
  }

  /**
   * Retrieves or initializes the state for a concept.
   */
  public getConceptState(conceptId: string, isUnlocked = true): ConceptMasteryState {
    let state = this.stateMap.get(conceptId);
    if (!state) {
      state = {
        conceptId,
        currentScore: INITIAL_CONCEPT_SCORE,
        status: isUnlocked ? "unlocked" : "locked",
        attemptCount: 0,
        consecutiveFailures: 0,
        lastUpdated: Date.now(),
        history: [],
      };
      this.stateMap.set(conceptId, state);
    }
    return { ...state, history: [...state.history] };
  }

  /**
   * Ingests one or more assessment evidence items for a concept and updates its mastery state.
   */
  public recordEvidence(
    evidenceInput: AssessmentEvidence | AssessmentEvidence[],
    options?: MasteryCalculationOptions
  ): MasteryCalculationResult {
    const evidenceList = Array.isArray(evidenceInput) ? evidenceInput : [evidenceInput];

    if (evidenceList.length === 0) {
      throw new Error("Cannot record empty assessment evidence.");
    }

    const targetConceptId = evidenceList[0].conceptId;
    for (const item of evidenceList) {
      if (item.conceptId !== targetConceptId) {
        throw new Error(
          `Batch evidence contains mismatched concept IDs: "${targetConceptId}" vs "${item.conceptId}".`
        );
      }
    }

    const isUnlocked = options?.isUnlocked ?? true;
    const currentState = this.getConceptState(targetConceptId, isUnlocked);
    const previousScore = currentState.currentScore;
    const previousStatus = currentState.status;

    // Calculate aggregated evidence score
    const { weightedAverage: evidenceScore, summary: evidenceSummary } =
      calculateWeightedEvidenceScore(evidenceList);

    // Calculate new EMM score
    const alpha = options?.alpha ?? DEFAULT_ALPHA;
    const newScore = calculateEMMUpdate(previousScore, evidenceScore, alpha);

    // Update consecutive failures:
    // If the evidence score was below the remediation threshold (<60), increment failure streak.
    // If performance is adequate (>=60), reset failure streak.
    const isFailedAttempt = evidenceScore < REMEDIATION_THRESHOLD;
    const consecutiveFailures = isFailedAttempt ? currentState.consecutiveFailures + 1 : 0;
    const attemptCount = currentState.attemptCount + evidenceList.length;

    // Determine new status
    const newStatus = determineStatus({
      score: newScore,
      isUnlocked,
      consecutiveFailures,
      hasAttempted: attemptCount > 0,
    });

    const timestamp = options?.timestamp ?? Date.now();

    // Create audit record
    const auditRecord: MasteryAuditRecord = {
      timestamp,
      previousScore,
      evidenceScore,
      newScore,
      status: newStatus,
      evidenceCount: evidenceList.length,
      alphaUsed: alpha,
    };

    // Commit updated state
    const updatedState: ConceptMasteryState = {
      conceptId: targetConceptId,
      currentScore: newScore,
      status: newStatus,
      attemptCount,
      consecutiveFailures,
      lastUpdated: timestamp,
      history: [...currentState.history, auditRecord],
    };
    this.stateMap.set(targetConceptId, updatedState);

    return {
      conceptId: targetConceptId,
      previousScore,
      evidenceScore,
      newScore,
      status: newStatus,
      evidenceSummary,
      transitionedToMastered: previousStatus !== "mastered" && newStatus === "mastered",
      transitionedToRemediation: previousStatus !== "remediation" && newStatus === "remediation",
    };
  }

  /**
   * Returns a set of all concept IDs that have attained 'mastered' status.
   * Useful for passing directly into KnowledgeGraphEngine.isUnlocked().
   */
  public getMasteredConceptIds(): Set<string> {
    const mastered = new Set<string>();
    for (const [id, state] of this.stateMap.entries()) {
      if (state.status === "mastered") {
        mastered.add(id);
      }
    }
    return mastered;
  }

  /**
   * Returns a map of concept IDs to their current mastery scores [0 - 100].
   * Useful for passing directly into KnowledgeGraphEngine.getRemediationTarget().
   */
  public getMasteryScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const [id, state] of this.stateMap.entries()) {
      scores[id] = state.currentScore;
    }
    return scores;
  }

  /**
   * Resets a concept's score and status back to baseline.
   */
  public resetConcept(conceptId: string, isUnlocked = true): void {
    this.stateMap.set(conceptId, {
      conceptId,
      currentScore: INITIAL_CONCEPT_SCORE,
      status: isUnlocked ? "unlocked" : "locked",
      attemptCount: 0,
      consecutiveFailures: 0,
      lastUpdated: Date.now(),
      history: [],
    });
  }

  // Static Utility Proxies
  public static validateEvidence = validateEvidence;
  public static calculateWeightedEvidenceScore = calculateWeightedEvidenceScore;
  public static calculateEMMUpdate = calculateEMMUpdate;
  public static determineStatus = determineStatus;
}
