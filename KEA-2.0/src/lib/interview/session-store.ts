/**
 * KEA Platform — Server-Side Interview Session Store
 * 
 * Enforces session integrity for multi-turn AI oral defense sessions.
 * Prevents client-forged history, arbitrary score inflation, or skipped questions.
 * Server is authoritative for session state, turn history, and completed evidence.
 */

export interface ServerTurnRecord {
  turnNumber: number;
  question: string;
  conceptId: string;
  studentAnswer: string;
  understanding?: "strong" | "partial" | "weak";
  misconceptions?: string[];
  feedback?: string;
  confidence?: number;
  timestamp: number;
}

export interface ServerInterviewSession {
  sessionId: string;
  topic: string;
  stageNumber?: number;
  targetConcepts: Array<{ id: string; title: string }>;
  learnerMastery: number;
  currentQuestion: string;
  currentConceptId: string;
  turns: ServerTurnRecord[];
  status: "active" | "completed";
  maxTurns: number;
  createdAt: number;
  lastUpdatedAt: number;
}

const MAX_SESSIONS = 200;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const interviewStore = new Map<string, ServerInterviewSession>();

function cleanupSessions(): void {
  const now = Date.now();
  for (const [id, session] of interviewStore.entries()) {
    if (now - session.lastUpdatedAt > SESSION_TTL_MS) {
      interviewStore.delete(id);
    }
  }

  if (interviewStore.size > MAX_SESSIONS) {
    const sorted = Array.from(interviewStore.entries()).sort(
      (a, b) => a[1].lastUpdatedAt - b[1].lastUpdatedAt
    );
    const removeCount = interviewStore.size - MAX_SESSIONS;
    for (let i = 0; i < removeCount; i++) {
      interviewStore.delete(sorted[i][0]);
    }
  }
}

/**
 * Initializes and stores a new interview session.
 */
export function createInterviewSession(params: {
  sessionId: string;
  topic: string;
  stageNumber?: number;
  targetConcepts?: Array<{ id: string; title: string }>;
  learnerMastery?: number;
  currentQuestion: string;
  currentConceptId: string;
  maxTurns?: number;
}): ServerInterviewSession {
  cleanupSessions();

  const now = Date.now();
  const session: ServerInterviewSession = {
    sessionId: params.sessionId,
    topic: params.topic,
    stageNumber: params.stageNumber ?? 3,
    targetConcepts: params.targetConcepts ?? [],
    learnerMastery: params.learnerMastery ?? 60,
    currentQuestion: params.currentQuestion,
    currentConceptId: params.currentConceptId,
    turns: [],
    status: "active",
    maxTurns: params.maxTurns ?? 4,
    createdAt: now,
    lastUpdatedAt: now,
  };

  interviewStore.set(params.sessionId, session);
  return session;
}

/**
 * Retrieves an active interview session.
 */
export function getInterviewSession(sessionId: string): ServerInterviewSession | undefined {
  return interviewStore.get(sessionId);
}

/**
 * Appends a verified turn evaluation to the session's authoritative history
 * and updates the current active question and concept.
 */
export function recordInterviewTurn(params: {
  sessionId: string;
  turnNumber: number;
  question: string;
  conceptId: string;
  studentAnswer: string;
  understanding: "strong" | "partial" | "weak";
  misconceptions: string[];
  feedback?: string;
  confidence?: number;
  nextQuestion?: string;
  nextConceptId?: string;
  isFinished?: boolean;
}): ServerInterviewSession | undefined {
  const session = interviewStore.get(params.sessionId);
  if (!session) return undefined;

  const now = Date.now();
  session.turns.push({
    turnNumber: params.turnNumber,
    question: params.question,
    conceptId: params.conceptId,
    studentAnswer: params.studentAnswer,
    understanding: params.understanding,
    misconceptions: params.misconceptions,
    feedback: params.feedback,
    confidence: params.confidence,
    timestamp: now,
  });

  if (params.nextQuestion) {
    session.currentQuestion = params.nextQuestion;
  }
  if (params.nextConceptId) {
    session.currentConceptId = params.nextConceptId;
  }
  if (params.isFinished) {
    session.status = "completed";
  }
  session.lastUpdatedAt = now;

  return session;
}

/**
 * Marks session as complete and retrieves the authoritative turn history.
 */
export function completeInterviewSession(sessionId: string): ServerInterviewSession | undefined {
  const session = interviewStore.get(sessionId);
  if (!session) return undefined;

  session.status = "completed";
  session.lastUpdatedAt = Date.now();
  return session;
}

/**
 * Clears all interview sessions (useful for testing).
 */
export function clearInterviewSessions(): void {
  interviewStore.clear();
}
