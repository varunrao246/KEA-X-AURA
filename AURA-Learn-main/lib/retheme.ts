import type { Interest, Question } from "./types";

/**
 * Hook for AI contextual re-theming (PRD section 14). Today it returns the original stem, so the
 * practice screen already flows through this seam. The AI layer will replace the body, and must
 * keep `question.variables`, the answer, formula, objective and level exactly as they are.
 */
export function displayStem(question: Pick<Question, "stem">, _interests: Interest[]): { text: string; themed: boolean } {
  return { text: question.stem, themed: false };
}
