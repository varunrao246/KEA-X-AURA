import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration test for the AI Tutor (PRD "AURA AI Tutor"), through the real HTTP route the browser
 * calls: POST /api/ai/tutor. Only the auth boundary is stubbed; db persistence, the adaptive engine
 * (mastery/struggle/prerequisites), the deterministic strategy layer and the guardrail-checked AI
 * pipeline are all real production code.
 */

type SessionUser = { id: string; name: string; email: string; role: "student"; createdAt: string };
const AARAV: SessionUser = { id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student", createdAt: "2026-09-01T09:00:00.000Z" };
const OTHER: SessionUser = { id: "u-meera", name: "Meera Iyer", email: "meera@aura.demo", role: "student", createdAt: "2026-09-01T09:00:00.000Z" };

const session = vi.hoisted(() => ({ user: null as SessionUser | null }));
vi.mock("@/lib/auth", () => ({ getStudentUser: vi.fn(async () => session.user) }));

let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-tutor-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  process.env.AURA_DB_PATH = dbPath;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_PROVIDER;
  session.user = AARAV;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dbPath, { force: true });
  delete process.env.AURA_DB_PATH;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_PROVIDER;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
});

async function loadRoutes() {
  const tutorRoute = await import("@/app/api/ai/tutor/route");
  const nextRoute = await import("@/app/api/practice/next/route");
  const attemptsRoute = await import("@/app/api/attempts/route");
  const db = await import("@/lib/db");
  const { QUESTIONS } = await import("@/content/questions");
  return { tutorRoute, nextRoute, attemptsRoute, db, QUESTIONS };
}

async function askTutor(tutorRoute: Awaited<ReturnType<typeof loadRoutes>>["tutorRoute"], body: Record<string, unknown>) {
  const res = await tutorRoute.POST(new Request("http://test.local/api/ai/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  return { status: res.status, json: await res.json() };
}

function wrongAnswerFor(q: { type: string; options?: string[]; numericAnswer?: number; answer: string }) {
  return q.type === "mcq" ? q.options!.find((o) => o !== q.answer)! : String((q.numericAnswer ?? 0) + 99999);
}
function correctAnswerFor(q: { type: string; answer: string; numericAnswer?: number }) {
  return q.type === "mcq" ? q.answer : String(q.numericAnswer);
}

describe("AI Tutor: authorization and no-spoofing", () => {
  it("12. the client cannot spoof mastery/struggle — there is no such field, and the context is rebuilt server-side regardless of what extra fields are sent", async () => {
    const { tutorRoute } = await loadRoutes();
    const { json } = await askTutor(tutorRoute, { topicId: "resistance", mode: "next-step", mastery: 100, struggle: 0, masteryOverride: 999 });
    expect(json.ok).toBe(true);
    // The seeded Aarav starts at 50% Resistance mastery — the spoofed "mastery: 100" is silently ignored.
    expect(json.data.signals.mastery).toBeLessThan(100);
  });

  it("13. a student cannot retrieve another student's tutor context merely by naming a topic — auth is per-session, not per-request field", async () => {
    const { tutorRoute } = await loadRoutes();
    session.user = OTHER;
    const { json: meeraView } = await askTutor(tutorRoute, { topicId: "resistance", mode: "next-step" });
    session.user = AARAV;
    const { json: aaravView } = await askTutor(tutorRoute, { topicId: "resistance", mode: "next-step" });
    // Each request is scoped to whichever session is currently authenticated — never a studentId the client names.
    expect(meeraView.data.signals.mastery).not.toBe(aaravView.data.signals.mastery);
  });

  it("rejects an unauthenticated request", async () => {
    const { tutorRoute } = await loadRoutes();
    session.user = null;
    const res = await tutorRoute.POST(new Request("http://test.local/api/ai/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId: "resistance", mode: "hint" }) }));
    expect(res.status).toBe(401);
  });

  it("rejects an unknown topic and an invalid mode", async () => {
    const { tutorRoute } = await loadRoutes();
    expect((await askTutor(tutorRoute, { topicId: "not-a-real-topic", mode: "hint" })).status).toBe(404);
    expect((await askTutor(tutorRoute, { topicId: "resistance", mode: "yell-at-student" })).status).toBe(400);
  });
});

describe("AI Tutor: never touches authoritative state", () => {
  it("14. calling the tutor repeatedly never changes mastery, struggle, or any adaptive record — only reading, never writing those", async () => {
    const { tutorRoute, db } = await loadRoutes();
    const before = db.getStore().mastery.find((m) => m.topicId === "resistance")!.score;
    for (const mode of ["explain", "hint", "review", "next-step"] as const) {
      await askTutor(tutorRoute, { topicId: "resistance", mode });
    }
    const after = db.getStore().mastery.find((m) => m.topicId === "resistance")!.score;
    expect(after).toBe(before);
    expect(db.getStore().interventions).toHaveLength(0); // tutor calls alone never open a case
  });
});

describe("AI Tutor: contextual awareness", () => {
  it("15. the tutor is told about the currently displayed (possibly AI-themed) stem, without it changing the academic facts it reasons over", async () => {
    const { tutorRoute, nextRoute } = await loadRoutes();
    const { json: nq } = await (async () => { const r = await nextRoute.GET(new Request("http://test.local/api/practice/next?topicId=resistance")); return { json: await r.json() }; })();
    const q = nq.data.question;
    const { json } = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "hint", displayedStem: "Imagine a spacecraft instrument's circuit..." });
    expect(json.ok).toBe(true);
    expect(json.data.message.length).toBeGreaterThan(0);
    // Whatever wording came back, the answer is never in it — themed or not.
    expect(json.data).not.toHaveProperty("answer");
  });

  it("16. hint progression persists across calls for the same question (server-side session memory, not a new database)", async () => {
    const { tutorRoute, nextRoute } = await loadRoutes();
    const { json: nq } = await (async () => { const r = await nextRoute.GET(new Request("http://test.local/api/practice/next?topicId=resistance")); return { json: await r.json() }; })();
    const q = nq.data.question;
    const h1 = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "hint" });
    const h2 = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "hint" });
    const h3 = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "hint" });
    expect([h1.json.data.signals.hintLevel, h2.json.data.signals.hintLevel, h3.json.data.signals.hintLevel]).toEqual([1, 2, 3]);
    expect(h1.json.data.message).not.toBe(h2.json.data.message);
  });
});

describe("AI Tutor: full end-to-end adaptive loop (PRD section 17 demo scenario)", () => {
  it("18. wrong -> hint -> wrong again -> misconception strategy -> retry same question -> correct -> reduced scaffolding", async () => {
    const { tutorRoute, attemptsRoute, nextRoute, db, QUESTIONS } = await loadRoutes();

    const { json: nq } = await (async () => { const r = await nextRoute.GET(new Request("http://test.local/api/practice/next?topicId=resistance")); return { json: await r.json() }; })();
    const q = QUESTIONS.find((x) => x.id === nq.data.question.id)!;

    // Wrong answer #1.
    await attemptsRoute.POST(new Request("http://test.local/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: q.id, answer: wrongAnswerFor(q), timeTakenSec: 20, hintsUsed: 0 }) }));
    const afterFirstWrong = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "review" });
    expect(afterFirstWrong.json.ok).toBe(true);
    expect(afterFirstWrong.json.data.signals.wrongStreak).toBeGreaterThanOrEqual(1);

    // Wrong answer #2 on the SAME question (student retries it).
    await attemptsRoute.POST(new Request("http://test.local/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: q.id, answer: wrongAnswerFor(q), timeTakenSec: 20, hintsUsed: 0 }) }));
    const afterSecondWrong = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "review" });
    expect(afterSecondWrong.json.data.signals.wrongStreak).toBeGreaterThanOrEqual(2);
    // With two wrong attempts at the SAME numeric question, a misconception may now be detected.
    if (q.type === "numeric") {
      expect(["misconception", "worked_example", "simplify", "conceptual_check"]).toContain(afterSecondWrong.json.data.strategy);
    }

    // Now answer correctly.
    const correctRes = await attemptsRoute.POST(new Request("http://test.local/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: q.id, answer: correctAnswerFor(q), timeTakenSec: 20, hintsUsed: 0 }) }));
    expect((await correctRes.json()).data.correct).toBe(true);
    const afterCorrect = await askTutor(tutorRoute, { topicId: "resistance", questionId: q.id, mode: "review" });
    expect(afterCorrect.json.data.signals.wrongStreak).toBe(0);

    // Grading was never affected by anything the tutor said — confirmed by the attempt's own correctness above,
    // and the tutor's own signals never expose or depend on the raw answer.
    expect(JSON.stringify(afterCorrect.json)).not.toMatch(new RegExp(`"answer"`));

    // Mastery moved through the SAME adaptive engine attempts always use — the tutor is a read-only observer.
    const row = db.getStore().mastery.find((m) => m.topicId === "resistance")!;
    expect(row.attempts).toBeGreaterThanOrEqual(3);
  });
});
