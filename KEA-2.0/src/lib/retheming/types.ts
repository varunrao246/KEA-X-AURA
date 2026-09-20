/**
 * Types for KEA Contextual Re-Theming & Invariant Preservation Engine (P0-04)
 */

import { StudentTheme } from "@/types";

export interface CanonicalQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface CanonicalQuestion {
  id: string;
  conceptId: string;
  title: string;
  questionText: string;
  options: CanonicalQuestionOption[];
  correctOptionId: string;
  /** Explicit number strings that must be preserved (e.g. ["3/8", "5/8"] or ["4", "12"]) */
  canonicalNumbers: string[];
  explanation: string;
  visualModel?: string;
}

export interface RethemedQuestion {
  canonicalId: string;
  conceptId: string;
  theme: StudentTheme;
  thematicContext: string;
  questionText: string;
  options: CanonicalQuestionOption[];
  correctOptionId: string;
  explanation: string;
  isFallback: boolean;
  invariantCheckPassed: boolean;
}

export interface InvariantValidationResult {
  passed: boolean;
  errors: string[];
  preservedNumbers: string[];
  missingNumbers: string[];
}
