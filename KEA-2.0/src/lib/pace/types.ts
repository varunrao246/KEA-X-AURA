/**
 * KEA Platform — Dynamic Learning Pace Calculator Types (P1-02)
 *
 * Provides non-punitive, asset-based pacing metrics and playful mascots
 * that adapt to the child's attempt velocity and contemplation style.
 */

export type PaceMascotType = "falcon" | "cheetah" | "panda";

export type TempoCategory = "accelerated" | "steady" | "mindful";

export interface AttemptLog {
  conceptId: string;
  secondsSpent: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface PaceState {
  mascot: PaceMascotType;
  mascotName: string;
  mascotIcon: string;
  tempoCategory: TempoCategory;
  avgSecondsPerProblem: number;
  paceIndex: number; // 1.0 is baseline steady tempo
  recentAccuracy: number; // 0 to 100 percentage
  growthMindsetNudge: string;
  totalAttemptsTracked: number;
}
