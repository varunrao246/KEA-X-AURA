import { SOLID_THRESHOLD, type PrereqRef } from "./curriculum";
import { wrongStreakOf } from "./tracking";
import type { Attempt, Level, StruggleSignalSnapshot } from "./types";
import { clamp } from "./utils";

/**
 * Struggle detection (PRD section 12): a transparent weighted score from 0 to 100.
 *
 *   Struggle = 25% repeated errors + 25% low accuracy + 20% excessive time
 *            + 15% prerequisite weakness + 15% hint dependency
 *
 * Each signal is first scaled to 0-100 with a simple, documented rule, then weighted.
 * Only the most recent WINDOW attempts on the topic count, so the score rises quickly when a student
 * struggles and falls just as quickly once they recover.
 *
 * Bands: 0-39 Normal, 40-59 Watch, 60-79 Intervention recommended, 80+ Immediate facilitator attention.
 */

export const STRUGGLE_WEIGHTS = { errors: 0.25, accuracy: 0.25, time: 0.2, prerequisite: 0.15, hints: 0.15 } as const;
export const STRUGGLE_THRESHOLDS = { watch: 40, intervention: 60, immediate: 80 } as const;
/** How many of the most recent attempts on a topic are considered. */
export const STRUGGLE_WINDOW = 8;
/** Below this many attempts there is not enough evidence to call anything a struggle. */
export const MIN_EVIDENCE = 3;
/** Typical time (seconds) to answer a question at each level. Slower than this counts towards "excessive time". */
export const EXPECTED_SECONDS: Record<Level, number> = { 1: 30, 2: 45, 3: 75, 4: 120 };

export type StruggleLevel = "normal" | "watch" | "intervention" | "immediate";

export const STRUGGLE_LEVEL_LABEL: Record<StruggleLevel, string> = {
  normal: "On track",
  watch: "Watch",
  intervention: "Intervention recommended",
  immediate: "Immediate attention",
};

export function struggleLevelOf(score: number): StruggleLevel {
  if (score >= STRUGGLE_THRESHOLDS.immediate) return "immediate";
  if (score >= STRUGGLE_THRESHOLDS.intervention) return "intervention";
  if (score >= STRUGGLE_THRESHOLDS.watch) return "watch";
  return "normal";
}

/* ---------- The five signals, each 0-100 ---------- */

/** Repeated errors: how many wrong answers in a row. 1 miss is normal, 4 in a row is a clear pattern. */
const STREAK_SCALE = [0, 25, 60, 85, 100];
export function repeatedErrorsSignal(window: Attempt[]): { value: number; detail: string } {
  const streak = wrongStreakOf(window);
  const value = STREAK_SCALE[Math.min(streak, STREAK_SCALE.length - 1)];
  return { value, detail: streak === 0 ? "No misses in a row" : `${streak} wrong ${streak === 1 ? "answer" : "answers"} in a row` };
}

/** Low accuracy: 70% or better is fine (0). Below that it climbs linearly to 100 at 0% correct. */
export function lowAccuracySignal(window: Attempt[]): { value: number; detail: string } {
  const n = window.length;
  const acc = n ? (window.filter((a) => a.correct).length / n) * 100 : 100;
  const value = clamp(((70 - acc) / 70) * 100);
  return { value, detail: `${Math.round(acc)}% correct over the last ${n}` };
}

/** Excessive time: average time as a multiple of the expected time for each question's level. 1x or less is 0, 2x or more is 100. */
export function excessiveTimeSignal(window: Attempt[]): { value: number; detail: string } {
  const recent = window.slice(-5);
  if (!recent.length) return { value: 0, detail: "No timing yet" };
  const ratio = recent.reduce((s, a) => s + a.timeTakenSec / EXPECTED_SECONDS[a.level], 0) / recent.length;
  const value = clamp((ratio - 1) * 100);
  return { value, detail: ratio <= 1 ? `Within the usual time (${ratio.toFixed(1)}x)` : `${ratio.toFixed(1)}x the usual time per question` };
}

/**
 * Prerequisite weakness: is the foundation shaky?
 *   (a) the weakest prerequisite's shortfall against "solid" (80), and
 *   (b) missing basic questions (Level 1-2) on this topic, which suggests the foundations are missing.
 * The larger of the two counts.
 */
export function prerequisiteWeaknessSignal(window: Attempt[], prereqs: PrereqRef[]): { value: number; detail: string } {
  const weakest = prereqs.length ? [...prereqs].sort((a, b) => a.score - b.score)[0] : null;
  const gap = weakest ? clamp(((SOLID_THRESHOLD - weakest.score) / SOLID_THRESHOLD) * 100) : 0;
  const basicsMissed = window.slice(-6).filter((a) => !a.correct && a.level <= 2).length;
  const basics = clamp((basicsMissed / 3) * 100);
  const value = Math.max(gap, basics);
  if (value === 0) return { value, detail: weakest ? `${weakest.name} is solid (${weakest.score}%)` : "No prerequisite concerns" };
  if (gap >= basics) return { value, detail: `${weakest!.name} is at ${weakest!.score}%` };
  return { value, detail: `${basicsMissed} basic-level ${basicsMissed === 1 ? "question" : "questions"} missed recently` };
}

/** Hint dependency: share of recent questions where a hint was used. 60% or more is 100. */
export function hintDependencySignal(window: Attempt[]): { value: number; detail: string } {
  const n = window.length;
  const used = window.filter((a) => a.hintsUsed > 0).length;
  const rate = n ? used / n : 0;
  return { value: clamp((rate / 0.6) * 100), detail: `Hint used on ${used} of the last ${n}` };
}

/* ---------- Score ---------- */

export interface StruggleResult {
  /** 0-100, whole number */
  score: number;
  level: StruggleLevel;
  signals: StruggleSignalSnapshot[];
  /** Attempts considered (max STRUGGLE_WINDOW). */
  evidence: number;
  insufficientEvidence: boolean;
  /** The signal adding the most points. */
  mainSignal: StruggleSignalSnapshot["key"] | null;
}

export interface StruggleInput {
  /** Attempts on ONE topic, oldest first. */
  attempts: Attempt[];
  prereqs: PrereqRef[];
}

export function computeStruggle({ attempts, prereqs }: StruggleInput): StruggleResult {
  const window = attempts.slice(-STRUGGLE_WINDOW);
  const parts: { key: StruggleSignalSnapshot["key"]; label: string; r: { value: number; detail: string } }[] = [
    { key: "errors", label: "Repeated errors", r: repeatedErrorsSignal(window) },
    { key: "accuracy", label: "Low accuracy", r: lowAccuracySignal(window) },
    { key: "time", label: "Excessive time", r: excessiveTimeSignal(window) },
    { key: "prerequisite", label: "Prerequisite weakness", r: prerequisiteWeaknessSignal(window, prereqs) },
    { key: "hints", label: "Hint dependency", r: hintDependencySignal(window) },
  ];
  const signals: StruggleSignalSnapshot[] = parts.map((p) => ({
    key: p.key,
    label: p.label,
    weight: STRUGGLE_WEIGHTS[p.key],
    value: Math.round(p.r.value),
    points: Math.round(p.r.value * STRUGGLE_WEIGHTS[p.key] * 10) / 10,
    detail: p.r.detail,
  }));

  const insufficientEvidence = window.length < MIN_EVIDENCE;
  const raw = parts.reduce((s, p) => s + p.r.value * STRUGGLE_WEIGHTS[p.key], 0);
  const score = insufficientEvidence ? 0 : Math.round(clamp(raw));
  const top = [...signals].sort((a, b) => b.points - a.points)[0];
  return {
    score,
    level: struggleLevelOf(score),
    signals,
    evidence: window.length,
    insufficientEvidence,
    mainSignal: score > 0 && top.points > 0 ? top.key : null,
  };
}
