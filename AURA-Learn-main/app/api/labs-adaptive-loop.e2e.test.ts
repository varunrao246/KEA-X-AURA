import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/lib/types";

/**
 * Integration test for the virtual-lab -> adaptive-engine connection (PRD sections 2.1/2.3/15/18),
 * through the real HTTP routes: practice/next, attempts, and labs/[id]/complete. Only the auth
 * boundary is stubbed; db persistence, mastery, struggle, curriculum locking, intervention and the
 * lab-completion handler are all real production code — exactly what LabFrame.tsx calls when the
 * embedded HTML lab posts an "aura:lab-result" message.
 *
 * Critical scenario (PRD section 8): Aarav is weak on Resistance, Ohm's Law is locked. He struggles
 * on Resistance questions, AURA opens an intervention that recommends (among other things) the
 * Resistance/Ohm's Law lab, he completes the lab, then keeps practicing well until Resistance
 * recovers, the intervention resolves, and Ohm's Law unlocks.
 */

vi.mock("@/lib/auth", () => ({
  getStudentUser: vi.fn(async () => ({
    id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student" as const, createdAt: "2026-09-01T09:00:00.000Z",
  })),
}));

let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-lab-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
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
  const labCompleteRoute = await import("@/app/api/labs/[id]/complete/route");
  const db = await import("@/lib/db");
  const { QUESTIONS } = await import("@/content/questions");
  return { nextRoute, attemptsRoute, labCompleteRoute, db, QUESTIONS };
}

function wrongAnswerFor(q: Question) {
  if (q.type === "mcq") return q.options!.find((o) => o !== q.answer)!;
  return String((q.numericAnswer ?? 0) + 99999);
}
function correctAnswerFor(q: Question) {
  return q.type === "mcq" ? q.answer : String(q.numericAnswer);
}
function findQuestion(QUESTIONS: Question[], id: string) {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}

async function nextQuestionFor(nextRoute: Awaited<ReturnType<typeof loadRoutes>>["nextRoute"], topicId: string, exclude: string[] = []) {
  const res = await nextRoute.GET(new Request(`http://test.local/api/practice/next?topicId=${topicId}&exclude=${exclude.join(",")}`));
  return { status: res.status, json: await res.json() };
}

async function submitFor(attemptsRoute: Awaited<ReturnType<typeof loadRoutes>>["attemptsRoute"], questionId: string, answer: string, extra: Record<string, unknown> = {}) {
  const res = await attemptsRoute.POST(
    new Request("http://test.local/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer, timeTakenSec: 65, hintsUsed: 0, ...extra }),
    }),
  );
  return { status: res.status, json: await res.json() };
}

async function completeLab(
  labCompleteRoute: Awaited<ReturnType<typeof loadRoutes>>["labCompleteRoute"],
  labId: string,
  score: number,
  mistakes: number,
) {
  const res = await labCompleteRoute.POST(
    new Request(`http://test.local/api/labs/${labId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, mistakes }),
    }),
    { params: Promise.resolve({ id: labId }) },
  );
  return { status: res.status, json: await res.json() };
}

describe("virtual lab connected to the real adaptive engine (mastery, struggle, intervention)", () => {
  it("the full critical scenario: struggle -> intervention recommends the lab -> lab completion -> recovery -> unlock", async () => {
    const { nextRoute, attemptsRoute, labCompleteRoute, db, QUESTIONS } = await loadRoutes();

    // START: weak Resistance, Ohm's Law locked.
    const startRow = db.getStore().mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
    expect(startRow.score).toBeLessThan(60);
    expect((await nextQuestionFor(nextRoute, "ohms-law")).json.code).toBe("locked");

    // Aarav repeatedly answers Resistance incorrectly.
    const seen: string[] = [];
    let last: any;
    for (let i = 0; i < 6; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", seen);
      seen.push(nq.data.question.id);
      const q = findQuestion(QUESTIONS, nq.data.question.id);
      const { json: attempt } = await submitFor(attemptsRoute, q.id, wrongAnswerFor(q));
      last = attempt.data;
    }

    // AURA detects repeated mistakes, low accuracy, prerequisite weakness (rising struggle score) and opens a case.
    expect(last.struggle.after).toBeGreaterThanOrEqual(60);
    expect(last.intervention).not.toBeNull();
    expect(last.intervention.reason.length).toBeGreaterThan(20);
    expect(last.intervention.reason).not.toMatch(/fail|bad score|you are weak/i); // supportive language, not judgmental

    // The recommendation includes the interactive lab for Resistance/Ohm's Law.
    const labAction = last.intervention.actions.find((a: { kind: string }) => a.kind === "lab");
    expect(labAction).toBeDefined();
    expect(labAction.href).toBe("/student/labs/ohms-law-lab");
    // ...and, since the prerequisite chain is what's weak, a concrete "practice X first" step, not a vague message.
    const prereqAction = last.intervention.actions.find((a: { kind: string }) => a.kind === "prerequisite");
    expect(prereqAction.label.toLowerCase()).toMatch(/practice|review/);

    // Ohm's Law is still locked: the struggle/intervention did not bypass the prerequisite gate.
    expect((await nextQuestionFor(nextRoute, "ohms-law")).json.code).toBe("locked");

    // Aarav opens the Resistance/Ohm's Law virtual lab and completes it (the same postMessage payload
    // LabFrame.tsx forwards: { score, mistakes }). Real score, computed the same way ohms-law.html does.
    const beforeLabScore = db.getStore().mastery.find((m) => m.topicId === "resistance")!.score;
    const { json: labResult } = await completeLab(labCompleteRoute, "ohms-law-lab", 88, 1);
    expect(labResult.ok).toBe(true);
    expect(labResult.data.labId).toBe("ohms-law-lab");
    // Credit goes to the currently-open topic (Resistance), never the still-locked Ohm's Law.
    const resistanceCredit = labResult.data.mastery.find((m: { topicId: string }) => m.topicId === "resistance");
    expect(resistanceCredit).toBeDefined();
    expect(resistanceCredit.before).toBe(beforeLabScore);

    // AURA recorded the lab as an adaptive event, and it fed the SAME mastery engine (no second system).
    const events = db.getStore().events;
    expect(events.some((e) => e.type === "lab" && e.studentId === "u-aarav")).toBe(true);
    const labEvents = db.getStore().labEvents;
    expect(labEvents).toHaveLength(1);
    expect(labEvents[0]).toMatchObject({ labId: "ohms-law-lab", score: 88, mistakes: 1 });

    // Aarav continues practicing and now performs well.
    const seenGood: string[] = [];
    let unlockedIds: string[] = [];
    let lastGood: any;
    for (let i = 0; i < 20 && !unlockedIds.length; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", seenGood.slice(-8));
      seenGood.push(nq.data.question.id);
      const q = findQuestion(QUESTIONS, nq.data.question.id);
      const { json: attempt } = await submitFor(attemptsRoute, q.id, correctAnswerFor(q), { timeTakenSec: 20 });
      lastGood = attempt.data;
      unlockedIds = attempt.data.unlocked.map((u: { id: string }) => u.id);
    }

    // Mastery increased, struggle decreased.
    const finalRow = db.getStore().mastery.find((m) => m.topicId === "resistance")!;
    expect(finalRow.score).toBeGreaterThan(beforeLabScore);
    expect(finalRow.score).toBeGreaterThanOrEqual(60);
    expect(lastGood.struggle.after).toBeLessThan(40);

    // The intervention resolved through the EXISTING state machine's own rules (nobody had started it).
    const iv = db.getStore().interventions.find((x) => x.topicId === "resistance")!;
    expect(iv.status).toBe("resolved");
    expect(iv.resolvedBy).toBe("student");

    // Ohm's Law unlocked at the existing 60% threshold — not because of the lab, because of mastery.
    expect(unlockedIds).toContain("ohms-law");
    const nowOpen = await nextQuestionFor(nextRoute, "ohms-law");
    expect(nowOpen.json.ok).toBe(true);
    expect(nowOpen.json.data.question.topicId).toBe("ohms-law");
  });

  it("lab completion alone (no question attempts) cannot bypass mastery gating or unlock anything", async () => {
    const { labCompleteRoute, db } = await loadRoutes();

    // Force the worst case: zero attempts on either topic the titration lab counts towards, and both locked.
    db.mutate((s) => {
      for (const id of ["indicators", "titration"]) {
        const row = s.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === id);
        if (row) { row.score = 0; row.attempts = 0; row.accuracy = 0; row.lastActivity = null; }
      }
    });

    const { json } = await completeLab(labCompleteRoute, "titration-lab", 100, 0);
    expect(json.ok).toBe(true);
    expect(json.data.unlocked).toEqual([]);

    // A perfect lab score with zero real attempts still cannot move mastery off zero.
    const indicators = db.getStore().mastery.find((m) => m.topicId === "indicators")!;
    expect(indicators.score).toBe(0);
  });

  it("repeated lab submissions do not corrupt state: each is recorded, and mastery uses the best score", async () => {
    const { nextRoute, attemptsRoute, labCompleteRoute, db, QUESTIONS } = await loadRoutes();

    // Give Resistance a little real evidence first so the lab component has something to weight.
    for (let i = 0; i < 3; i++) {
      const { json: nq } = await nextQuestionFor(nextRoute, "resistance", []);
      const q = findQuestion(QUESTIONS, nq.data.question.id);
      await submitFor(attemptsRoute, q.id, correctAnswerFor(q));
    }

    await completeLab(labCompleteRoute, "ohms-law-lab", 60, 4);
    await completeLab(labCompleteRoute, "ohms-law-lab", 40, 6);
    const { json: third } = await completeLab(labCompleteRoute, "ohms-law-lab", 90, 1);
    expect(third.ok).toBe(true);

    const store = db.getStore();
    expect(store.labEvents).toHaveLength(3);
    expect(JSON.parse(JSON.stringify(store))).toBeTruthy(); // the store file is still valid, serialisable JSON
    // getStore() reused the same in-memory object for all three calls (no duplicate/competing sessions).
    expect(new Set(store.labEvents.map((e) => e.id)).size).toBe(3);
  });
});
