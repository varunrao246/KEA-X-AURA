/** Shared domain types. These mirror the PRD schema (section 25) and are the contract for the store. */

export type Role = "student" | "facilitator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  grade?: number;
  school?: string;
  /** Shown as a one-click account on the demo login screen. */
  demo?: boolean;
  createdAt: string;
}

export type LearningPreference = "visual" | "practice-first" | "explanation-first" | "interactive";
export type Interest = "space" | "sports" | "gaming" | "animals" | "technology" | "environment" | "art";

export interface StudentProfile {
  studentId: string;
  onboarded: boolean;
  /** 0-100 */
  learningPace: number;
  confidence: number;
  engagement: number;
  interests: Interest[];
  learningPreference?: LearningPreference;
  classId: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
  accent: "brand" | "accent" | "success";
  /** The demonstration course shown to students, e.g. "Ohm's Law". */
  courseTitle: string;
  /** The topic a student is working towards in this course. */
  goalTopicId: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  /** 1-4, matches adaptive difficulty levels. */
  difficulty: number;
  order: number;
}

export interface Prerequisite {
  topicId: string;
  prerequisiteId: string;
}

export type Level = 1 | 2 | 3 | 4;
export type QuestionType = "mcq" | "numeric";

export interface Question {
  id: string;
  topicId: string;
  level: Level;
  type: QuestionType;
  stem: string;
  /** MCQ only. */
  options?: string[];
  /** Correct option text (mcq) or the canonical numeric answer as text (numeric). */
  answer: string;
  numericAnswer?: number;
  unit?: string;
  /** Absolute tolerance for numeric answers. */
  tolerance?: number;
  hint: string;
  explanation: string;
  /** What the question is testing. AI re-theming must never change this. */
  objective: string;
  /** Structured numbers behind the stem. AI re-theming must never change these. */
  variables?: Record<string, number>;
  formula?: string;
}

export interface Mastery {
  studentId: string;
  topicId: string;
  /** 0-100 */
  score: number;
  attempts: number;
  accuracy: number;
  lastActivity: string | null;
  /** Current adaptive difficulty level, 1-4. */
  level: Level;
  /** When the level last changed; the adaptive window only looks at attempts after this. */
  levelChangedAt: string;
}

export interface Attempt {
  id: string;
  studentId: string;
  questionId: string;
  topicId: string;
  level: Level;
  answer: string;
  correct: boolean;
  skipped: boolean;
  timeTakenSec: number;
  hintsUsed: number;
  createdAt: string;
  /** Which re-themed wording the student saw, if any. For evaluating whether theming helps. */
  theme?: { interest: Interest; source: "ai" | "template" | "original" };
}

export type InterventionStatus =
  | "detected"
  | "recommended"
  | "viewed"
  | "started"
  | "responding"
  | "resolved";

export type InterventionActionKind = "simpler" | "prerequisite" | "lab" | "facilitator";

export interface InterventionAction {
  kind: InterventionActionKind;
  label: string;
  description: string;
  /** Where the button goes. Absent for actions handled in place (simpler explanation, ask facilitator). */
  href?: string;
}

export interface StruggleSignalSnapshot {
  key: "errors" | "accuracy" | "time" | "prerequisite" | "hints";
  label: string;
  weight: number;
  /** 0-100 */
  value: number;
  /** weight x value, the points this signal adds to the score */
  points: number;
  detail: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  topicId: string;
  /** Struggle score at the last evaluation, 0-100. */
  riskScore: number;
  peakScore: number;
  /** "intervention" (60-79) or "immediate" (80+). */
  severity: "intervention" | "immediate";
  /** Plain-language cause, e.g. "Missed the last 4 questions in a row". */
  reason: string;
  mainIssue: string;
  /** Topic that stays locked until this one improves. */
  blocksTopicId?: string;
  recommendedAction: string;
  actions: InterventionAction[];
  assignedAction?: InterventionAction;
  signals: StruggleSignalSnapshot[];
  status: InterventionStatus;
  studentRequestedHelp: boolean;
  history: { status: InterventionStatus; at: string; by: "aura" | "student" | "facilitator"; note?: string }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy?: "aura" | "student" | "facilitator";
}

export type AdaptiveEventType = "level" | "struggle" | "intervention" | "unlock" | "mastered" | "lab" | "prerequisite";

/** An audit trail of what the engine decided and why. The UI timeline and the facilitator view read from this. */
export interface AdaptiveEvent {
  id: string;
  studentId: string;
  topicId: string;
  type: AdaptiveEventType;
  tone: "good" | "info" | "warn" | "alert";
  title: string;
  detail: string;
  at: string;
}

/** Server-side record that a question was shown, so time-on-question and hint use cannot be under-reported by the browser. */
export interface QuestionServe {
  studentId: string;
  questionId: string;
  servedAt: string;
  hintsUsed: number;
}

export interface LabEvent {
  id: string;
  studentId: string;
  labId: string;
  score: number;
  mistakes: number;
  createdAt: string;
}

/** One line of the re-theming checklist (see lib/ai/guardrails.ts). */
export interface ThemeCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  /** "validated": checked against the returned text. "by-construction": owned by the server, never model-editable. */
  kind: "validated" | "by-construction";
}

/** A validated AI re-theme, remembered so the same question is never sent to the model twice. */
export interface ThemeCacheEntry {
  key: string;
  questionId: string;
  interest: Interest;
  stem: string;
  options?: string[];
  model: string;
  createdAt: string;
  checks: ThemeCheck[];
}

export interface Store {
  version: number;
  users: User[];
  studentProfiles: StudentProfile[];
  subjects: Subject[];
  topics: Topic[];
  prerequisites: Prerequisite[];
  questions: Question[];
  mastery: Mastery[];
  attempts: Attempt[];
  interventions: Intervention[];
  labEvents: LabEvent[];
  events: AdaptiveEvent[];
  serves: QuestionServe[];
  themeCache: ThemeCacheEntry[];
}
