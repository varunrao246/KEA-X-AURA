import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/lib/types";

/**
 * Cross-role integration test for the facilitator dashboard (PRD "facilitator dashboard + actionable
 * intervention loop"). Through the real HTTP routes both roles call: GET/POST /api/interventions,
 * PATCH /api/interventions/[id], plus practice/next and attempts to actually produce a struggling
 * student. Only the auth boundary is stubbed (a switchable current user); db persistence, the
 * struggle/intervention engine, and the new facilitator action all run as production code.
 *
 * Story: Aarav struggles on Resistance -> AURA opens a case -> a facilitator (Ms. Rao) sees it in
 * the queue with the reason and recommended action -> she reviews, starts helping, then resolves it
 * -> Aarav's own view of his case reflects that, read back through the SAME persisted store.
 */

type SessionUser = { id: string; name: string; email: string; role: "student" | "facilitator"; createdAt: string };
const AARAV: SessionUser = { id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student", createdAt: "2026-09-01T09:00:00.000Z" };
const FACILITATOR: SessionUser = { id: "u-rao", name: "Ms. Priya Rao", email: "priya.rao@aura.demo", role: "facilitator", createdAt: "2026-09-01T09:00:00.000Z" };

const session = vi.hoisted(() => ({ user: null as SessionUser | null }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => session.user),
  getStudentUser: vi.fn(async () => (session.user?.role === "student" ? session.user : null)),
}));

let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-facilitator-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  process.env.AURA_DB_PATH = dbPath;
  session.user = null;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
  vi.resetModules();
});

afterEach(() => {
  fs.rmSync(dbPath, { force: true });
  delete process.env.AURA_DB_PATH;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
});

async function loadRoutes() {
  const interventionsRoute = await import("@/app/api/interventions/route");
  const interventionActionRoute = await import("@/app/api/interventions/[id]/route");
  const nextRoute = await import("@/app/api/practice/next/route");
  const attemptsRoute = await import("@/app/api/attempts/route");
  const db = await import("@/lib/db");
  const facilitatorLib = await import("@/lib/facilitator");
  const { QUESTIONS } = await import("@/content/questions");
  return { interventionsRoute, interventionActionRoute, nextRoute, attemptsRoute, db, facilitatorLib, QUESTIONS };
}

function wrongAnswerFor(q: Question) {
  return q.type === "mcq" ? q.options!.find((o) => o !== q.answer)! : String((q.numericAnswer ?? 0) + 99999);
}

/** Drives real wrong answers on Resistance until AURA opens an intervention. Returns the intervention id. */
async function makeAaravStruggle(routes: Awaited<ReturnType<typeof loadRoutes>>) {
  const { nextRoute, attemptsRoute, QUESTIONS, db } = routes;
  session.user = AARAV;
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    const nq = await (await nextRoute.GET(new Request(`http://test.local/api/practice/next?topicId=resistance&exclude=${seen.join(",")}`))).json();
    seen.push(nq.data.question.id);
    const q = QUESTIONS.find((x) => x.id === nq.data.question.id)!;
    await attemptsRoute.POST(new Request("http://test.local/api/attempts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: q.id, answer: wrongAnswerFor(q), timeTakenSec: 65, hintsUsed: 0 }),
    }));
  }
  const iv = db.getStore().interventions.find((i) => i.studentId === "u-aarav" && i.topicId === "resistance" && i.status !== "resolved");
  expect(iv).toBeDefined();
  return iv!.id;
}

async function patchIntervention(routes: Awaited<ReturnType<typeof loadRoutes>>, id: string, action: string) {
  const res = await routes.interventionActionRoute.PATCH(
    new Request(`http://test.local/api/interventions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }),
    { params: Promise.resolve({ id }) },
  );
  return { status: res.status, json: await res.json() };
}

describe("facilitator dashboard: WHO / WHY / WHAT NEXT, and a real facilitator action", () => {
  it("TEST 1 — an active intervention appears in the facilitator queue with student, topic, reason and recommendation", async () => {
    const routes = await loadRoutes();
    await makeAaravStruggle(routes);

    session.user = FACILITATOR;
    const res = await routes.interventionsRoute.GET();
    const json = await res.json();
    expect(json.ok).toBe(true);
    const item = json.data.interventions.find((i: { studentId: string; topicId: string }) => i.studentId === "u-aarav" && i.topicId === "resistance");
    expect(item).toBeDefined();
    expect(item.studentName).toBe("Aarav Sharma");
    expect(item.topicName).toBe("Resistance");
    expect(item.reason.length).toBeGreaterThan(10);
    expect(item.recommendedAction.length).toBeGreaterThan(5);
    expect(item.status).not.toBe("resolved");
  });

  it("TEST 2 — student detail exposes only real, existing data (no fabricated metrics)", async () => {
    const routes = await loadRoutes();
    await makeAaravStruggle(routes);
    const store = routes.db.getStore();

    const detail = routes.facilitatorLib.studentDetail(store, "u-aarav");
    const resistanceRow = store.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
    const resistanceInDetail = detail.state.topics.find((t) => t.id === "resistance")!;

    // The exact same numbers as the store's own mastery row — no second/independent scoring.
    expect(resistanceInDetail.score).toBe(resistanceRow.score);
    expect(resistanceInDetail.attempts).toBe(resistanceRow.attempts);
    expect(resistanceInDetail.accuracy).toBe(resistanceRow.accuracy);
    // Insights and recommendations are grounded in real state (may legitimately be empty, but never invented).
    expect(Array.isArray(detail.insights.attention)).toBe(true);
    expect(Array.isArray(detail.recommended)).toBe(true);
    for (const r of detail.recommended) expect(store.topics.some((t) => t.id === r.topicId)).toBe(true);
  });

  it("TEST 3 — a facilitator action persists through the real state machine (review -> start -> resolve)", async () => {
    const routes = await loadRoutes();
    const ivId = await makeAaravStruggle(routes);

    session.user = FACILITATOR;
    const reviewed = await patchIntervention(routes, ivId, "review");
    expect(reviewed.json.ok).toBe(true);
    expect(reviewed.json.data.intervention.status).toBe("viewed");

    const started = await patchIntervention(routes, ivId, "start");
    expect(started.json.data.intervention.status).toBe("started");

    const resolved = await patchIntervention(routes, ivId, "resolve");
    expect(resolved.json.ok).toBe(true);
    expect(resolved.json.data.intervention.status).toBe("resolved");

    const stored = routes.db.getStore().interventions.find((i) => i.id === ivId)!;
    expect(stored.status).toBe("resolved");
    expect(stored.resolvedBy).toBe("facilitator");
    expect(stored.resolvedAt).not.toBeNull();
    // History changed through the same push() the AURA-automatic transitions use.
    expect(stored.history.filter((h) => h.by === "facilitator")).toHaveLength(3);
    expect(stored.history.map((h) => h.status)).toEqual(expect.arrayContaining(["viewed", "started", "resolved"]));
  });

  it("TEST 4 — after a facilitator action, the student's own view reads the same updated, persisted state", async () => {
    const routes = await loadRoutes();
    const ivId = await makeAaravStruggle(routes);

    session.user = FACILITATOR;
    await patchIntervention(routes, ivId, "review");
    await patchIntervention(routes, ivId, "resolve");

    session.user = AARAV;
    const res = await routes.interventionsRoute.GET();
    const json = await res.json();
    const mine = json.data.interventions.find((i: { id: string }) => i.id === ivId);
    expect(mine).toBeDefined();
    expect(mine.status).toBe("resolved"); // not a client-only flag — read back from the shared store
  });

  it("TEST 5 — authorization: students cannot act on interventions or see another student's case", async () => {
    const routes = await loadRoutes();
    const ivId = await makeAaravStruggle(routes);

    // A synthetic case for a different student, to prove cross-student isolation.
    routes.db.mutate((s) => {
      s.interventions.push({
        id: "int-test-meera", studentId: "u-meera", topicId: "voltage", riskScore: 70, peakScore: 70, severity: "intervention",
        reason: "test case", mainIssue: "test", recommendedAction: "test", actions: [], signals: [],
        status: "recommended", studentRequestedHelp: false, history: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), resolvedAt: null,
      });
    });

    // Unauthenticated.
    session.user = null;
    expect((await routes.interventionsRoute.GET()).status).toBe(401);
    expect((await patchIntervention(routes, ivId, "resolve")).status).toBe(401);

    // A student cannot use the facilitator action endpoint, even on their own case.
    session.user = AARAV;
    const studentPatch = await patchIntervention(routes, ivId, "resolve");
    expect(studentPatch.status).toBe(401);
    expect(routes.db.getStore().interventions.find((i) => i.id === ivId)!.status).not.toBe("resolved");

    // A student's own GET never includes another student's case.
    const mine = await (await routes.interventionsRoute.GET()).json();
    expect(mine.data.interventions.every((i: { studentId: string }) => i.studentId === "u-aarav")).toBe(true);
    expect(mine.data.interventions.some((i: { id: string }) => i.id === "int-test-meera")).toBe(false);

    // The facilitator queue legitimately sees both students.
    session.user = FACILITATOR;
    const all = await (await routes.interventionsRoute.GET()).json();
    const studentIds = new Set(all.data.interventions.map((i: { studentId: string }) => i.studentId));
    expect(studentIds.has("u-aarav")).toBe(true);
    expect(studentIds.has("u-meera")).toBe(true);
  });
});
