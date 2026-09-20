/**
 * KEA Contextual Re-Theming Module (P0-04)
 */

import { StudentTheme } from "@/types";
import { CANONICAL_QUESTIONS } from "./canonical-problems";
import { rethemeWithGemini } from "./gemini-rethemer";
import { CanonicalQuestion, RethemedQuestion } from "./types";

export * from "./types";
export * from "./canonical-problems";
export * from "./invariant-checker";
export * from "./fallback-rethemer";
export * from "./gemini-rethemer";

/**
 * Main entry point for re-theming a question.
 * Always routes through rethemeWithGemini which:
 *  1. Uses Gemini SDK if a valid AIzaSy... key is configured
 *  2. Routes through AIOrchestrator (NVIDIA NIM → Groq) if Gemini key is invalid/missing
 *  3. Falls back to deterministic pre-authored templates as last resort
 */
export async function rethemeQuestion(
  canonicalOrId: CanonicalQuestion | string,
  theme: StudentTheme
): Promise<RethemedQuestion> {
  const canonical =
    typeof canonicalOrId === "string"
      ? CANONICAL_QUESTIONS[canonicalOrId]
      : canonicalOrId;

  if (!canonical) {
    throw new Error(`Canonical question "${canonicalOrId}" not found in question bank.`);
  }

  return rethemeWithGemini(canonical, theme);
}

