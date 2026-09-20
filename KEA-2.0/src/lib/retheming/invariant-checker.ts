/**
 * Academic Invariant Checker for KEA Re-Theming Engine (P0-04)
 * 
 * Verifies that AI re-theming preserves mathematical invariants:
 * 1. Number Bag Invariant: Exact fractions and integers are preserved.
 * 2. Option Count & Key Invariant: Option count and correct answer index remain identical.
 * 3. Non-Empty Narrative Invariant: Valid narrative context is provided.
 */

import { CanonicalQuestion, InvariantValidationResult, RethemedQuestion } from "./types";

/**
 * Extracts numbers, fractions, and percentages from a text string.
 * Example matches: "3/8", "5/8", "42", "3.14", "25%"
 */
export function extractNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(?:\/\d+|\.\d+)?%?(?!\w)/g) || [];
  return matches.map(m => m.trim());
}

/**
 * Validates a candidate re-themed question against its canonical definition.
 */
export function validateInvariants(
  canonical: CanonicalQuestion,
  candidate: Partial<RethemedQuestion>
): InvariantValidationResult {
  const errors: string[] = [];
  const preservedNumbers: string[] = [];
  const missingNumbers: string[] = [];

  // 1. Structure checks
  if (!candidate.questionText || candidate.questionText.trim().length === 0) {
    errors.push("Candidate re-themed question is missing questionText.");
  }

  if (!Array.isArray(candidate.options) || candidate.options.length !== canonical.options.length) {
    errors.push(
      `Option count mismatch: expected ${canonical.options.length}, got ${
        candidate.options?.length ?? 0
      }.`
    );
  }

  if (!candidate.correctOptionId || candidate.correctOptionId !== canonical.correctOptionId) {
    errors.push(
      `Correct answer key mismatch: expected "${canonical.correctOptionId}", got "${
        candidate.correctOptionId ?? ""
      }".`
    );
  }

  // 2. Number Bag Invariant:
  // Combine all candidate text (question + options)
  const allCandidateText = [
    candidate.questionText ?? "",
    ...(candidate.options ?? []).map(o => o.text),
  ].join(" ");

  const candidateNumbers = extractNumbers(allCandidateText);
  const candidateNumberSet = new Set(candidateNumbers);

  for (const expectedNum of canonical.canonicalNumbers) {
    // Check if expected number exists in candidate text (either exact match in token or substring)
    const exists = candidateNumberSet.has(expectedNum) || allCandidateText.includes(expectedNum);
    if (exists) {
      preservedNumbers.push(expectedNum);
    } else {
      missingNumbers.push(expectedNum);
      errors.push(`Missing mandatory invariant number: "${expectedNum}".`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    preservedNumbers,
    missingNumbers,
  };
}
