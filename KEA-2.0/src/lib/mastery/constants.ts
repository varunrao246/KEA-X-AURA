/**
 * Constants for KEA Deterministic Mastery Engine
 * Weighted Exponential Moving Mastery (W-EMM)
 * 
 * Strict rule: All weights, rates, and thresholds must be explicit named constants.
 * Zero magic numbers allowed in mathematical calculations.
 */

import { AssessmentItemType } from "@/types";

/** Default learning rate (alpha) for Exponential Moving Mastery updates */
export const DEFAULT_ALPHA = 0.40;

/** Minimum allowed alpha */
export const MIN_ALPHA = 0.05;

/** Maximum allowed alpha */
export const MAX_ALPHA = 1.00;

/**
 * Weights assigned to each assessment modality based on pedagogical reliability:
 * - Practice (0.25): Rapid multiple-choice / numeric entry (susceptible to guessing)
 * - Written (0.35): Step-by-step procedural breakdown
 * - Oral (0.40): Conceptual explanation / natural language probe
 * 
 * Total sum = 1.00
 */
export const EVIDENCE_WEIGHTS: Readonly<Record<AssessmentItemType, number>> = Object.freeze({
  practice: 0.25,
  written: 0.35,
  oral: 0.40,
});

/** Minimum and maximum bounds for scores */
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

/** Score at or above which a concept is considered mastered */
export const MASTERY_THRESHOLD = 80;

/** Score strictly below which a concept is in remediation danger */
export const REMEDIATION_THRESHOLD = 60;

/** Number of consecutive failed attempts (score < 60) required to trigger remediation */
export const CONSECUTIVE_FAILURES_FOR_REMEDIATION = 2;

/** Initial score assigned to a concept with zero evidence */
export const INITIAL_CONCEPT_SCORE = 0;
