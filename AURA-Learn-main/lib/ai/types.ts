import type { Interest, Level, Question, ThemeCacheEntry, ThemeCheck } from "../types";

export type { ThemeCacheEntry };

/**
 * Structured question representation for AI re-theming (PRD section 14).
 *
 * The model only ever sees this structure, and it can only return a new `stem`. Everything academic
 * (variables, unit, answer, formula, objective, level) is owned by the server and copied from the original
 * question, so the AI has no way to change it. The validator then checks the returned text still agrees.
 */
export interface ThemeSource {
  questionId: string;
  topic: string;
  type: "mcq" | "numeric";
  stem: string;
  /** MCQ only. Never rewritten. */
  options?: string[];
  /** Canonical correct answer. Sent to the model only so it can avoid revealing it. */
  answer: string;
  unit?: string;
  /** The numbers behind the stem. Must survive re-theming exactly. */
  variables?: Record<string, number>;
  formula?: string;
  learningObjective: string;
  difficulty: Level;
}

export function sourceFromQuestion(q: Question, topicName: string): ThemeSource {
  return {
    questionId: q.id, topic: topicName, type: q.type, stem: q.stem, options: q.options, answer: q.answer,
    unit: q.unit, variables: q.variables, formula: q.formula, learningObjective: q.objective, difficulty: q.level,
  };
}

export type Check = ThemeCheck;

export interface ValidationResult {
  passed: boolean;
  checks: Check[];
  failed: Check[];
}

/** What the model echoes back so we can cross-check it understood what must not change. */
export interface ModelEcho {
  numbers?: (number | string)[];
  unit?: string;
  difficulty?: number;
  learningObjective?: string;
  answerUnchanged?: boolean;
}

export interface Candidate {
  stem: string;
  options?: string[];
  echo?: ModelEcho;
}

export type ThemeSourceKind = "ai" | "template" | "original";

/** Why the pipeline moved on from a step. Shown to the user so nothing fails silently. */
export type FallbackReason =
  | "ai_off"
  | "not_configured"
  | "rate_limited"
  | "temporarily_unavailable"
  | "timeout"
  | "http_error"
  | "invalid_response"
  | "validation_failed"
  | "no_theme_available";

export interface PipelineStep {
  step: "cache" | "ai" | "template" | "original";
  outcome: "used" | "skipped" | "failed" | "rejected";
  detail: string;
  failedChecks?: string[];
}

export interface RethemeResult {
  questionId: string;
  interest: Interest;
  stem: string;
  options?: string[];
  source: ThemeSourceKind;
  /** True when the stem differs from the original. */
  themed: boolean;
  model?: string;
  cached: boolean;
  fallbackReason?: FallbackReason;
  validation: ValidationResult;
  /** Facts the server guarantees are unchanged. Deliberately does NOT include the answer. */
  preserved: { numbers: string[]; quantities: string[]; unit?: string; difficulty: Level; learningObjective: string; answerKeyUnchanged: true };
  pipeline: PipelineStep[];
  latencyMs: number;
}

export type AiMode = "auto" | "template" | "off";
