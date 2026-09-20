import type { Attempt } from "./types";

/**
 * Attempt tracking: turns raw attempts into the numbers the engine and the UI both use.
 * Accuracy, time, hints, skips and streaks are all measured here, in one place.
 */

export interface TrackingStats {
  attempts: number;
  correct: number;
  /** 0-100, skips count as wrong */
  accuracy: number;
  avgSeconds: number;
  /** hints per attempt, 0-1 */
  hintRate: number;
  skipped: number;
  /** Consecutive wrong answers at the end (skips count as wrong). */
  wrongStreak: number;
  /** Consecutive correct answers at the end. */
  correctStreak: number;
}

const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);

export function wrongStreakOf(attempts: Attempt[]): number {
  let n = 0;
  for (let i = attempts.length - 1; i >= 0 && !attempts[i].correct; i--) n++;
  return n;
}

export function correctStreakOf(attempts: Attempt[]): number {
  let n = 0;
  for (let i = attempts.length - 1; i >= 0 && attempts[i].correct; i--) n++;
  return n;
}

export function trackingStats(attempts: Attempt[]): TrackingStats {
  const n = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  return {
    attempts: n,
    correct,
    accuracy: Math.round(pct(correct, n)),
    avgSeconds: n ? Math.round(attempts.reduce((s, a) => s + a.timeTakenSec, 0) / n) : 0,
    hintRate: n ? attempts.reduce((s, a) => s + Math.min(1, a.hintsUsed), 0) / n : 0,
    skipped: attempts.filter((a) => a.skipped).length,
    wrongStreak: wrongStreakOf(attempts),
    correctStreak: correctStreakOf(attempts),
  };
}
