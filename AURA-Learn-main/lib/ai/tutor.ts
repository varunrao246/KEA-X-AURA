import type { AiConfig } from "./env";
import { aiConfigured } from "./env";
import { validateTutorResponse } from "./tutorGuardrails";
import type { TutorContext } from "./tutorContext";
import { buildTutorMessages, parseTutorCandidate, type TutorCandidate } from "./tutorPrompt";
import { decideTutorStrategy, type StrategyDecision, type TutorMode, type TutorNextAction, type TutorResponseType } from "./tutorStrategy";
import type { LlmClient } from "./llm";
import type { CircuitBreaker, RateLimiter } from "./resilience";

/**
 * The AI Tutor pipeline (PRD sections 2-6, 13-14, 21).
 *
 *   1. deterministic strategy   <- ALWAYS decided first, from real adaptive state (never the AI)
 *   2. live provider             (only if configured, breaker closed, rate limit allows)
 *   3. deterministic fallback    <- same strategy, a written-not-generated coaching message
 *
 * There is no cache step here (unlike re-theming): tutoring context changes on every attempt, so
 * reusing yesterday's wording would be actively wrong. The strategy decision and the deterministic
 * message are the same "safety net" pattern as re-theming's built-in templates: authored once,
 * validated by the same guardrail philosophy, and guaranteed to work with zero API keys.
 */

export interface TutorDeps {
  config: AiConfig;
  llm?: LlmClient | null;
  breaker?: CircuitBreaker;
  limiter?: RateLimiter;
  now?: () => number;
}

export interface TutorResult {
  type: TutorResponseType;
  message: string;
  nextAction: TutorNextAction;
  strategy: string;
  source: "ai" | "template";
  model?: string;
  /** Safe-to-show summary of what AURA noticed — no raw student data, no secrets. */
  signals: {
    mastery: number;
    masteryBand: string;
    struggle: number;
    struggleLevel: string;
    recentAccuracy: number;
    wrongStreak: number;
    hintLevel: number;
    misconception: string | null;
  };
  fallbackReason?: "not_configured" | "rate_limited" | "temporarily_unavailable" | "timeout" | "http_error" | "invalid_response" | "validation_failed" | "ai_off";
}

const PREREQ_TEMPLATES = (weakestName: string) => [
  `Before we go further, let's shore up ${weakestName} — that's what's making this harder than it needs to be.`,
  `I think the real gap is a step back, in ${weakestName}. Let's rebuild that first, then this will click faster.`,
];

const MISCONCEPTION_TEMPLATES: Record<string, (topic: string, formula?: string) => string> = {
  formula_confusion: (topic, formula) => `Your last couple of answers look like the relationship might be flipped${formula ? ` — double check which quantity ${formula} puts on top` : ""}. Which variable are we actually solving for here?`,
  unit_confusion: () => `The size of your answers suggests a units slip somewhere — check whether everything is in the same base unit before you calculate.`,
  arithmetic_error: () => `Your approach looks right, just not the final number. Try the calculation step again, slowly, and see if a different answer comes out.`,
  concept_gap: (topic) => `A couple of tries haven't landed the same way, so let's rebuild the idea behind ${topic} before trying again.`,
};

const HINT_TEMPLATES: Record<number, (topic: string, formula?: string) => string> = {
  1: (topic) => `Think about which two quantities are actually related in this ${topic} problem.`,
  2: (topic, formula) => `Start from the relationship${formula ? ` ${formula}` : ""} — which of those values do you already know?`,
  3: (topic, formula) => `Rearrange${formula ? ` ${formula}` : " the formula"} to isolate what the question is asking for, then substitute the numbers you have.`,
};

const EXPLANATION_ANGLES = [
  (topic: string, coreIdea: string, formula?: string) => formula
    ? `Try a relationship-first view of ${topic}. ${coreIdea} Use ${formula} as a map: identify what each symbol represents, then decide which part of the relationship helps you answer the question.`
    : `Try a relationship-first view of ${topic}. ${coreIdea} Identify the relationship in the question before deciding which response fits it.`,
  (topic: string, coreIdea: string) => `Try a cause-and-effect view of ${topic}. ${coreIdea} Ask yourself what would change if each part of the situation increased or decreased, then compare that prediction with the choices.`,
  (topic: string, coreIdea: string, formula?: string) => `Try breaking ${topic} into roles. ${coreIdea} Sort the information into what is known, what is changing, and what the question wants;${formula ? ` then use ${formula} to connect those roles.` : " then use that structure to test each choice."}`,
  (topic: string, coreIdea: string) => `Try explaining ${topic} in plain language first. ${coreIdea} Once the idea makes sense in words, the calculation or choice should follow from the meaning rather than from guessing.`,
  (topic: string, coreIdea: string) => `Try an elimination view of ${topic}. ${coreIdea} Check each possible response against the relationship described in the question and set aside anything that does not match it.`,
  (topic: string, coreIdea: string, formula?: string) => `Try moving between words and symbols for ${topic}. ${coreIdea}${formula ? ` Read ${formula} as a sentence about how the quantities connect, then return to the question with that sentence in mind.` : " Restate the relationship in your own words, then use it to reason through the question."}`,
];

function deterministicMessage(ctx: TutorContext, mode: TutorMode, decision: StrategyDecision, explanationVariation = 0): TutorCandidate {
  const topic = ctx.topicName;
  const formula = ctx.lesson?.formula?.expr;
  let message: string;

  // This button must be useful even when no live AI provider is configured. Put it ahead of the
  // strategy-specific template so the learner receives a genuinely different angle from the
  // proactive feedback they just saw, without exposing the answer.
  if (mode === "explain") {
    // A topic name, lesson summary, or formula can itself be the exact MCQ answer. Use a neutral
    // framing for those questions so refreshing an explanation can never disclose an option.
    const isMcq = ctx.question?.type === "mcq";
    const safeTopic = isMcq ? "the idea in this question" : topic;
    const coreIdea = isMcq
      ? "Focus on the relationship the question describes, then compare each option with that relationship."
      : ctx.lesson?.bigIdea ?? `${topic} is about the relationship between the quantities in the question.`;
    const safeFormula = isMcq ? undefined : formula;
    const angle = EXPLANATION_ANGLES[Math.abs(explanationVariation) % EXPLANATION_ANGLES.length] ?? EXPLANATION_ANGLES[0];
    message = angle(safeTopic, coreIdea, safeFormula);
    return { type: "explanation", message, nextAction: decision.nextAction };
  }

  switch (decision.strategy) {
    case "prerequisite": {
      const list = PREREQ_TEMPLATES(ctx.prerequisite.weakestName ?? "the earlier topic");
      message = list[0];
      break;
    }
    case "misconception":
      message = (MISCONCEPTION_TEMPLATES[ctx.misconception?.type ?? "concept_gap"])(topic, formula);
      break;
    case "progressive_hint": {
      const level = Math.min(3, Math.max(1, decision.hintLevel)) as 1 | 2 | 3;
      message = HINT_TEMPLATES[level](topic, formula);
      break;
    }
    case "worked_example":
      message = `Let's slow down. ${ctx.lesson?.bigIdea ?? `${topic} comes down to one relationship${formula ? `: ${formula}` : "."}`} Try applying that one step at a time, and check each number as you go.`;
      break;
    case "simplify":
      message = `Let's break ${topic} into a smaller piece. ${ctx.lesson?.bigIdea ?? "Focus on just what each quantity in the question represents before calculating."}`;
      break;
    case "conceptual_check":
      message = `That came back quickly — before trying again, what is the question actually asking you to find?`;
      break;
    case "reinforce":
      message = `That's right, and your reasoning got you there. Once you're comfortable, you'll be able to do that step faster.`;
      break;
    case "reduce_scaffolding":
      message = `Nice — a few in a row now. Try the next one on your own before asking for help.`;
      break;
    case "challenge":
      message = `You're consistently getting this right. Want a harder version of this question?`;
      break;
    case "socratic":
    default:
      message = `One miss isn't a pattern yet — want to try again, or would a small hint help?`;
      break;
  }

  return { type: decision.responseType, message, nextAction: decision.nextAction };
}

export async function generateTutorResponse(ctx: TutorContext, mode: TutorMode, deps: TutorDeps, studentMessage?: string, explanationVariation = 0): Promise<TutorResult> {
  const decision = decideTutorStrategy(ctx, mode);
  const signals = {
    mastery: ctx.mastery.score, masteryBand: ctx.mastery.band, struggle: ctx.struggle.score, struggleLevel: ctx.struggle.level,
    recentAccuracy: ctx.recentAccuracy, wrongStreak: ctx.wrongStreak, hintLevel: decision.hintLevel, misconception: ctx.misconception?.type ?? null,
  };

  const fallback = (fallbackReason: TutorResult["fallbackReason"]): TutorResult => {
    const cand = deterministicMessage(ctx, mode, decision, explanationVariation);
    return { ...cand, strategy: decision.strategy, source: "template", signals, fallbackReason };
  };

  if (deps.config.mode === "off") return fallback("ai_off");
  if (deps.config.mode === "template") return fallback("ai_off");
  if (!aiConfigured(deps.config) || !deps.llm) return fallback("not_configured");
  if (deps.breaker && !deps.breaker.canCall()) return fallback("temporarily_unavailable");
  if (deps.limiter && !deps.limiter.allow(ctx.studentId)) return fallback("rate_limited");

  try {
    const { text } = await deps.llm.complete(buildTutorMessages(ctx, mode, decision, studentMessage, explanationVariation), { timeoutMs: deps.config.timeoutMs });
    deps.breaker?.success();
    const cand = parseTutorCandidate(text, decision.responseType, decision.nextAction);
    if (!cand) return fallback("invalid_response");
    const validation = validateTutorResponse(ctx, cand);
    if (!validation.passed) return fallback("validation_failed");
    return { type: cand.type, message: cand.message, nextAction: cand.nextAction, strategy: decision.strategy, source: "ai", model: deps.llm.model, signals };
  } catch {
    deps.breaker?.failure();
    return fallback("http_error");
  }
}
