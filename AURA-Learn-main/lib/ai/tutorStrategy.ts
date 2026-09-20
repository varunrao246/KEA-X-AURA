import type { TutorContext } from "./tutorContext";

/**
 * The deterministic "how should we teach right now" decision (PRD section 4/22).
 *
 * This is a pure function over TutorContext: no AI call, no randomness, fully unit-testable.
 * The LLM (or the deterministic fallback message library) only ever supplies WORDING for the
 * strategy this function already chose — it never gets to pick the strategy itself, and it never
 * gets to decide mastery/struggle/correctness.
 */

export type TutorMode = "explain" | "hint" | "review" | "next-step";

export type TutorStrategyName =
  | "prerequisite" | "misconception" | "worked_example" | "simplify" | "progressive_hint"
  | "conceptual_check" | "reinforce" | "reduce_scaffolding" | "challenge" | "socratic" | "encouragement";

export type TutorResponseType = "hint" | "misconception" | "explanation" | "prerequisite" | "encouragement" | "challenge";
export type TutorNextAction = "retry" | "check_understanding" | "learn_prerequisite" | "continue" | "attempt";

export interface StrategyDecision {
  strategy: TutorStrategyName;
  responseType: TutorResponseType;
  nextAction: TutorNextAction;
  /** How much detail the wording is allowed to include for this call — used by both the prompt and the guardrail. */
  maxAssistLevel: "minimal" | "moderate" | "full-explanation" | "worked-example";
  /** Only meaningful for responseType "hint": which progressive hint this is (1, 2, 3...). */
  hintLevel: number;
  /** Human-readable, safe-to-log reason this strategy was chosen. */
  reason: string;
}

const HIGH_STRUGGLE = new Set(["intervention", "immediate"]);

/**
 * Priority-ordered rules. First match wins. Order matters: a shaky prerequisite or a repeated
 * misconception should take priority over a shallower "you're doing great" read of raw mastery.
 */
export function decideTutorStrategy(ctx: TutorContext, mode: TutorMode): StrategyDecision {
  const { struggle, mastery, prerequisite, wrongStreak, correctStreak, recentAccuracy, attemptsOnTopic, lastTimingRatio, misconception } = ctx;
  const highStruggle = HIGH_STRUGGLE.has(struggle.level);

  // 1. A genuinely weak prerequisite, under real struggle — teach the foundation, not this topic.
  if (!prerequisite.solid && highStruggle) {
    return {
      strategy: "prerequisite", responseType: "prerequisite", nextAction: "learn_prerequisite", maxAssistLevel: "full-explanation", hintLevel: 0,
      reason: `${prerequisite.weakestName ?? "a prerequisite"} is only at ${prerequisite.weakestScore ?? 0}%, which is likely the real gap.`,
    };
  }

  // 2. The student has made the same mistake more than once on this question — name the pattern.
  if (misconception && wrongStreak >= 2) {
    return {
      strategy: "misconception", responseType: "misconception", nextAction: "retry", maxAssistLevel: "moderate", hintLevel: 0,
      reason: `Repeated wrong answers on the same question suggest a ${misconception.type.replace("_", " ")} (confidence ${misconception.confidence}).`,
    };
  }

  // 3. The student explicitly asked for a hint — give the next hint in the progression, never the answer.
  if (mode === "hint") {
    const level = ctx.hintsGivenForCurrentQuestion + 1;
    return {
      strategy: "progressive_hint", responseType: "hint", nextAction: "retry",
      maxAssistLevel: level >= 3 ? "moderate" : "minimal", hintLevel: level,
      reason: `Hint #${level} for this question.`,
    };
  }

  // 4. High struggle generally — reduce cognitive load with a worked example before asking again.
  if (highStruggle) {
    return {
      strategy: "worked_example", responseType: "explanation", nextAction: "check_understanding", maxAssistLevel: "worked-example", hintLevel: 0,
      reason: `Struggle score is ${struggle.score} (${struggle.level}) — a full worked example first will reduce load.`,
    };
  }

  // 5. Low recent accuracy with enough evidence — simplify before going further.
  if (attemptsOnTopic >= 3 && recentAccuracy < 50) {
    return {
      strategy: "simplify", responseType: "explanation", nextAction: "check_understanding", maxAssistLevel: "full-explanation", hintLevel: 0,
      reason: `Only ${recentAccuracy}% correct recently — break the concept into a smaller piece.`,
    };
  }

  // 6. Answered quickly but wrong — likely misread or jumped to a familiar-but-wrong idea, not a
  //    knowledge gap. A conceptual check surfaces that without re-teaching from scratch.
  if (lastTimingRatio !== null && lastTimingRatio < 0.6 && wrongStreak >= 1) {
    return {
      strategy: "conceptual_check", responseType: "explanation", nextAction: "check_understanding", maxAssistLevel: "moderate", hintLevel: 0,
      reason: `Answered in ${lastTimingRatio}x the expected time and got it wrong — check what's actually being asked.`,
    };
  }

  // 7. Slow but correct — the reasoning worked, reinforce it and note a faster path exists.
  if (lastTimingRatio !== null && lastTimingRatio > 1.5 && correctStreak >= 1) {
    return {
      strategy: "reinforce", responseType: "encouragement", nextAction: "continue", maxAssistLevel: "moderate", hintLevel: 0,
      reason: `Took ${lastTimingRatio}x the expected time but got it right — reinforce the reasoning.`,
    };
  }

  // 8. A wrong streak just broke — the student is recovering. Step back, don't over-help.
  if (correctStreak >= 2 && attemptsOnTopic >= 3) {
    return {
      strategy: "reduce_scaffolding", responseType: "encouragement", nextAction: "attempt", maxAssistLevel: "minimal", hintLevel: 0,
      reason: `${correctStreak} correct in a row — reduce scaffolding and encourage independent solving.`,
    };
  }

  // 9. High mastery — confirm briefly, then offer more challenge instead of re-explaining basics.
  if (mastery.band === "mastered" || mastery.score >= 80) {
    return {
      strategy: "challenge", responseType: "challenge", nextAction: "attempt", maxAssistLevel: "minimal", hintLevel: 0,
      reason: `Mastery is ${mastery.score}% — offer a harder application instead of more basics.`,
    };
  }

  // 10. Low struggle, one wrong answer only — a small hint is enough, no full re-teach.
  if (wrongStreak === 1 && !highStruggle) {
    return {
      strategy: "socratic", responseType: "hint", nextAction: "retry", maxAssistLevel: "minimal", hintLevel: 1,
      reason: "A single miss with otherwise normal performance — a small nudge, not a full explanation.",
    };
  }

  // 11. Default: on track. Concise Socratic check-in, mode-dependent framing.
  if (mode === "explain") {
    return { strategy: "socratic", responseType: "explanation", nextAction: "check_understanding", maxAssistLevel: "moderate", hintLevel: 0, reason: "Explicit request to explain the concept." };
  }
  if (mode === "next-step") {
    return { strategy: "encouragement", responseType: "encouragement", nextAction: "continue", maxAssistLevel: "minimal", hintLevel: 0, reason: "Steady performance — confirm and move on." };
  }
  return { strategy: "socratic", responseType: "encouragement", nextAction: "continue", maxAssistLevel: "minimal", hintLevel: 0, reason: "On track: low struggle, reasonable accuracy." };
}
