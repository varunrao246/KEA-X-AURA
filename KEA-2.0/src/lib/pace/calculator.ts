/**
 * KEA Platform — Dynamic Learning Pace Calculator (P1-02)
 *
 * Rules:
 * 1. Non-punitive: Pace never gates, locks, or reduces student mastery scores.
 * 2. Asset-based framing: Every pace is celebrated (Falcon = Swift Insight,
 *    Cheetah = Agile Rhythm, Panda = Mindful Deep Thinker).
 * 3. Responsive: Adapts dynamically across the last 5 attempts.
 */

import { AttemptLog, PaceState } from "./types";

export const DEFAULT_PACE_STATE: PaceState = {
  mascot: "cheetah",
  mascotName: "Dash the Cheetah",
  mascotIcon: "🐆",
  tempoCategory: "steady",
  avgSecondsPerProblem: 35,
  paceIndex: 1.0,
  recentAccuracy: 100,
  growthMindsetNudge: "Smooth and agile rhythm! You're balancing speed with thoughtful analysis.",
  totalAttemptsTracked: 0,
};

/**
 * Calculates current pace state based on recent attempt history.
 */
export function calculatePaceMetrics(history: AttemptLog[]): PaceState {
  if (!history || history.length === 0) {
    return { ...DEFAULT_PACE_STATE };
  }

  // Look at up to the last 3 attempts for responsive tempo tracking
  const recentAttempts = history.slice(-3);
  const totalSeconds = recentAttempts.reduce((sum, a) => sum + Math.max(1, a.secondsSpent), 0);
  const avgSeconds = Math.round((totalSeconds / recentAttempts.length) * 10) / 10;

  const correctCount = recentAttempts.filter(a => a.isCorrect).length;
  const recentAccuracy = Math.round((correctCount / recentAttempts.length) * 100);

  // Baseline standard time is 35 seconds per problem
  // Higher pace index means faster problem resolution
  const paceIndex = Math.round((35 / Math.max(10, avgSeconds)) * 100) / 100;

  // Classification Logic:
  // Falcon: Swift resolution (< 25s) with high accuracy (>= 70%)
  if (avgSeconds < 25 && recentAccuracy >= 70) {
    return {
      mascot: "falcon",
      mascotName: "Aero the Falcon",
      mascotIcon: "🦅",
      tempoCategory: "accelerated",
      avgSecondsPerProblem: avgSeconds,
      paceIndex,
      recentAccuracy,
      growthMindsetNudge: "Flying high! You're cruising through concepts with incredible swiftness and clarity.",
      totalAttemptsTracked: history.length,
    };
  }

  // Panda / Sloth: Mindful Explorer (> 55s) or deliberate problem solving
  if (avgSeconds > 55) {
    return {
      mascot: "panda",
      mascotName: "Bamboo the Panda",
      mascotIcon: "🐼",
      tempoCategory: "mindful",
      avgSecondsPerProblem: avgSeconds,
      paceIndex,
      recentAccuracy,
      growthMindsetNudge: "Mindful Explorer! Taking your time to reflect and understand each step builds the deepest neural connections.",
      totalAttemptsTracked: history.length,
    };
  }

  // Cheetah: Steady & Agile
  return {
    mascot: "cheetah",
    mascotName: "Dash the Cheetah",
    mascotIcon: "🐆",
    tempoCategory: "steady",
    avgSecondsPerProblem: avgSeconds,
    paceIndex,
    recentAccuracy,
    growthMindsetNudge: "Smooth and agile rhythm! You're balancing speed with thoughtful analysis.",
    totalAttemptsTracked: history.length,
  };
}
