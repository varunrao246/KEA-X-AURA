/**
 * KEA Platform — Server-Side Assessment Session Store
 * 
 * Enforces strict security separation between client-facing assessment payloads
 * and authoritative server-side answer keys.
 * 
 * Invariant: correctOptionIndex, sampleIdealAnswer, and explanation NEVER leave
 * the server before evaluation. Client submissions cannot forge answer keys.
 */

import { GeneratedMockTest } from "@/lib/ai/schemas";

export interface ServerQuestionRecord {
  id: string;
  type: "multiple_choice" | "short_answer" | "reasoning";
  conceptId: string;
  prompt: string;
  options?: string[];
  difficulty: "foundational" | "intermediate" | "advanced";
  // Authoritative server-side secrets
  correctOptionIndex?: number;
  sampleIdealAnswer?: string;
  explanation?: string;
  rubric?: Array<{ criterion: string; weight: number }>;
}

export interface ServerAssessmentSession {
  testId: string;
  topic: string;
  difficulty: "foundational" | "intermediate" | "advanced" | "adaptive";
  questions: ServerQuestionRecord[];
  createdAt: number;
}

export interface ClientSafeQuestion {
  id: string;
  type: "multiple_choice" | "short_answer" | "reasoning";
  conceptId: string;
  prompt: string;
  options?: string[];
  difficulty: "foundational" | "intermediate" | "advanced";
}

export interface ClientSafeMockTest {
  id: string;
  topic: string;
  difficulty: "foundational" | "intermediate" | "advanced" | "adaptive";
  questions: ClientSafeQuestion[];
  totalQuestions: number;
}

const MAX_SESSIONS = 200;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// In-memory bounded session store
const sessionStore = new Map<string, ServerAssessmentSession>();

/**
 * Removes expired or overflow sessions to maintain a bounded memory footprint.
 */
function cleanupSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessionStore.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessionStore.delete(id);
    }
  }

  if (sessionStore.size > MAX_SESSIONS) {
    const sorted = Array.from(sessionStore.entries()).sort(
      (a, b) => a[1].createdAt - b[1].createdAt
    );
    const removeCount = sessionStore.size - MAX_SESSIONS;
    for (let i = 0; i < removeCount; i++) {
      sessionStore.delete(sorted[i][0]);
    }
  }
}

/**
 * Persists an authoritative server-side assessment session and returns
 * a strictly scrubbed client-safe version with all answer keys removed.
 */
export function saveAssessmentSession(rawTest: GeneratedMockTest): ClientSafeMockTest {
  cleanupSessions();

  const serverQuestions: ServerQuestionRecord[] = rawTest.questions.map((q) => ({
    id: q.id,
    type: q.type,
    conceptId: q.conceptId,
    prompt: q.prompt,
    options: q.options ? [...q.options] : undefined,
    difficulty: q.difficulty,
    correctOptionIndex: q.correctOptionIndex,
    sampleIdealAnswer: q.sampleIdealAnswer,
    explanation: q.explanation,
    rubric: q.rubric ? [...q.rubric] : undefined,
  }));

  const session: ServerAssessmentSession = {
    testId: rawTest.id,
    topic: rawTest.topic,
    difficulty: rawTest.targetDifficulty,
    questions: serverQuestions,
    createdAt: Date.now(),
  };

  sessionStore.set(rawTest.id, session);

  // Return strictly scrubbed client payload (NO correctOptionIndex, NO sampleIdealAnswer, NO explanation)
  return {
    id: rawTest.id,
    topic: rawTest.topic,
    difficulty: rawTest.targetDifficulty,
    totalQuestions: rawTest.questions.length,
    questions: rawTest.questions.map((q) => ({
      id: q.id,
      type: q.type,
      conceptId: q.conceptId,
      prompt: q.prompt,
      options: q.options ? [...q.options] : undefined,
      difficulty: q.difficulty,
    })),
  };
}

/**
 * Retrieves the trusted server assessment session by testId.
 */
export function getAssessmentSession(testId: string): ServerAssessmentSession | undefined {
  return sessionStore.get(testId);
}

/**
 * Clears all sessions (useful for test isolation).
 */
export function clearAssessmentSessions(): void {
  sessionStore.clear();
}
