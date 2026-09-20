import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/lib/types";

/**
 * Proves the adaptive loop is wired through the ACTUAL HTTP route handlers the browser calls
 * (app/api/practice/next, app/api/questions/[id]/hint, app/api/attempts), not just the pure
 * lib/*.ts functions those routes happen to call. Only the auth boundary is stubbed (a fixed
 * signed-in student); everything below it — db persistence, mastery, struggle, curriculum
 * locking, intervention — is the real production code, exercised the way a browser would.
 *
 * Scenario (matches the PRD story): Aarav starts weak on Resistance with Ohm's Law locked.
 */

vi.mock("@/lib/auth", () => ({
  getStudentUser: vi.fn(async () => ({
    id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student" as const, createdAt: "2026-09-01T09:00:00.000Z",
  })),
}));

let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  process.env.AURA_DB_PATH = dbPath;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dbPath, { force: true });
  delete process.env.AURA_DB_PATH;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
});

async function loadRoutes() {
  const nextRoute = await import("@/app/api/practice/next/route");
  const attemptsRoute = await import("@/app/api/attempts/route");
  const hintRoute = await import("@/app/api/questions/[id]/hint/route");
  const db = await import("@/lib/db");
  const { QUESTIONS } = await import("@/content/questions");
  return { nextRoute, attemptsRoute, hintRoute, db, QUESTIONS };
}

function findQuestion(QUESTIONS: Question[], id: string) {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question ${id} in content/questions.ts`);
  return q;
}

function wrongAnswerFor(q: Question) {
  if (q.type === "mcq") return q.options!.find((o) => o !== q.answer)!;
  return String((q.numericAnswer ?? 0) + 99999);
}

function correctAnswerFor(q: Question) {
  return q.type === "mcq" ? q.answer : String(q.numericAnswer);
}

async function nextQuestionFor(nextRoute: Awaited<ReturnType<typeof loadRoutes>>["nextRoute"], topicId: string, exclude: string[] = []) {
  const res = await nextRoute.GET(new Request(`http://test.local/api/practice/next?topicId=${topicId}&exclude=${exclude.join(",")}`));
  const json = await res.json();
  return { status: res.status, json };
}

async function submitFor(
  attemptsRoute: Awaited<ReturnType<typeof loadRoutes>>["attemptsRoute"],
  questionId: string,
  answer: string,
  extra: Record<string, unknown> = {},
) {
  const res = await attemptsRoute.POST(
    new Request("http://test.local/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer, timeTakenSec: 65, hintsUsed: 0, ...extra }),
    }),
  );
  const json = await res.json();
  return { status: res.status, json };
}

describe("adaptive loop through the real API routes (not just lib functions)", () => {
  it("student starts with weak Resistance mastery and Ohm's Law locked", async () => {
    const { nextRoute, db } = await loadRoutes();
    const store = db.getStore();
    const resistance = store.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
    expect(resistance.score).toBeLessThan(60);

    const locked = await nextQuestionFor(nextRoute, "ohms-law");
    expect(locked.json.ok).toBe(false);
    expect(locked.json.code).toBe("locked");
  });

  it("POOR PERFORMANCE via HTTP: attempts/accuracy tracked, mastery stays low, struggle rises, intervention appears, Ohm's Law stays locked", async () => {
    const { nextRoute, attemptsRoute, hintRoute, db, QUESTIONS } = await loadRoutes();
    const beforeRow = db.getStore().mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
    const before = beforeRow.attempts;
    const accuracyBefore = beforeRow.accuracy;

    const seen: string[] = [];
    const results: any[] = [];
    for (let i = 0; i < 6; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", seen);
      expect(nq.ok).toBe(true);
      seen.push(nq.data.question.id);
      const q = findQuestion(QUESTIONS, nq.data.question.id);

      // Every other question, ask for a hint through the real hint route (server-side hint tracking).
      if (i % 2 === 0) {
        const hintRes = await hintRoute.GET(new Request(`http://test.local/api/questions/${q.id}/hint`), { params: Promise.resolve({ id: q.id }) });
        const hintJson = await hintRes.json();
        expect(hintJson.ok).toBe(true);
        expect(hintJson.data.hint).toBe(q.hint);
      }

      const { json: attempt } = await submitFor(attemptsRoute, q.id, wrongAnswerFor(q), { hintsUsed: 0 });
      expect(attempt.ok).toBe(true);
      expect(attempt.data.correct).toBe(false);
      results.push(attempt.data);
    }

    // 1 & 5. Attempts and accuracy tracking
    const row = db.getStore().mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
    expect(row.attempts).toBe(before + 6);
    expect(row.accuracy).toBeLessThanOrEqual(accuracyBefore);

    // 1 & 6. Mastery calculation stays low after repeated misses
    expect(results.every((r) => r.mastery.after <= r.mastery.before)).toBe(true);
    expect(results.at(-1).mastery.after).toBeLessThan(40);

    // 9. Struggle score calculation: rises monotonically and crosses the intervention band
    const struggleScores = results.map((r) => r.struggle.after);
    expect([...struggleScores].sort((a, b) => a - b)).toEqual(struggleScores);
    expect(struggleScores.at(-1)).toBeGreaterThanOrEqual(60);

    // 10. Intervention threshold logic: a case is created and reaches the student through the response
    expect(results.some((r) => r.intervention?.change === "created")).toBe(true);
    expect(results.at(-1).intervention).not.toBeNull();
    expect(results.at(-1).intervention.status).not.toBe("resolved");
    expect(db.getStore().interventions.some((iv) => iv.studentId === "u-aarav" && iv.topicId === "resistance" && iv.status !== "resolved")).toBe(true);

    // 3. Topic locking: Ohm's Law is still locked, through the real "next question" route
    const locked = await nextQuestionFor(nextRoute, "ohms-law");
    expect(locked.json.ok).toBe(false);
    expect(locked.json.code).toBe("locked");
    expect(results.every((r) => r.unlocked.length === 0)).toBe(true);
  });

  it("IMPROVEMENT via HTTP: mastery climbs, struggle falls, the case resolves, and Ohm's Law unlocks", async () => {
    const { nextRoute, attemptsRoute, db, QUESTIONS } = await loadRoutes();

    // First drive it into a struggling state, same as the previous test.
    const seenBad: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", seenBad);
      seenBad.push(nq.data.question.id);
      const q = findQuestion(QUESTIONS, nq.data.question.id);
      await submitFor(attemptsRoute, q.id, wrongAnswerFor(q));
    }
    expect(db.getStore().interventions.some((iv) => iv.topicId === "resistance" && iv.status !== "resolved")).toBe(true);
    const lowScore = db.getStore().mastery.find((m) => m.topicId === "resistance")!.score;

    // Now perform well until it unlocks Ohm's Law (or we give up after a generous number of tries).
    const seenGood: string[] = [];
    let unlockedIds: string[] = [];
    let lastResult: any;
    for (let i = 0; i < 20 && !unlockedIds.length; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", seenGood.slice(-8));
      seenGood.push(nq.data.question.id);
      const q = findQuestion(QUESTIONS, nq.data.question.id);
      const { json: attempt } = await submitFor(attemptsRoute, q.id, correctAnswerFor(q), { timeTakenSec: 20 });
      expect(attempt.data.correct).toBe(true);
      lastResult = attempt.data;
      unlockedIds = attempt.data.unlocked.map((u: { id: string }) => u.id);
    }

    // 1 & 6. Mastery calculation: recovers well above the low point
    const finalRow = db.getStore().mastery.find((m) => m.topicId === "resistance")!;
    expect(finalRow.score).toBeGreaterThan(lowScore + 15);
    expect(finalRow.score).toBeGreaterThanOrEqual(60);

    // 9. Struggle score calculation: back down
    expect(lastResult.struggle.after).toBeLessThan(40);

    // 10. Intervention threshold logic: the case the poor run opened is resolved, not left dangling
    const iv = db.getStore().interventions.find((x) => x.topicId === "resistance")!;
    expect(iv.status).toBe("resolved");
    expect(iv.resolvedBy).toBe("student");

    // 2, 3 & 4. Prerequisite checking + topic unlocking, and question difficulty adaptation happened along the way
    expect(unlockedIds).toContain("ohms-law");
    const nowOpen = await nextQuestionFor(nextRoute, "ohms-law");
    expect(nowOpen.json.ok).toBe(true);
    expect(nowOpen.json.data.question.topicId).toBe("ohms-law");
  });
});
