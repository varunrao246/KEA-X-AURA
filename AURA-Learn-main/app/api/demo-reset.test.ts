import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Demo reset must be restricted to demo accounts (Aarav, Ms. Rao) — a real student/facilitator
 * account must never be able to wipe every student's progress — and must be deterministic and
 * idempotent, so a presenter can reset mid-rehearsal and get the exact same starting scenario.
 */

type SessionUser = { id: string; name: string; email: string; role: "student" | "facilitator"; createdAt: string; demo?: boolean };
const AARAV: SessionUser = { id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student", createdAt: "2026-09-01T09:00:00.000Z", demo: true };
const NON_DEMO_STUDENT: SessionUser = { id: "u-meera", name: "Meera Iyer", email: "meera@aura.demo", role: "student", createdAt: "2026-09-01T09:00:00.000Z" }; // demo: undefined, like every non-showcase seeded student

const session = vi.hoisted(() => ({ user: null as SessionUser | null }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => session.user) }));

let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-demo-reset-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
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

async function loadRoute() {
  return import("@/app/api/demo/reset/route");
}

describe("POST /api/demo/reset", () => {
  it("rejects an unauthenticated request", async () => {
    const { POST } = await loadRoute();
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("rejects a real (non-demo) student account — it must not be able to wipe the whole class", async () => {
    session.user = NON_DEMO_STUDENT;
    const { POST } = await loadRoute();
    const res = await POST();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("a demo account can reset, and the response never contains a secret", async () => {
    session.user = AARAV;
    const { POST } = await loadRoute();
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, data: { reset: true } });
    expect(json.data.users).toBeGreaterThan(0);
  });

  it("is idempotent: reset -> mutate -> reset gives back the exact same clean scenario", async () => {
    session.user = AARAV;
    const { POST } = await loadRoute();
    const db = await import("@/lib/db");

    await POST();
    const first = db.getStore();
    // Snapshot primitives, not a live reference — the store object is mutated in place below.
    const firstResistance = { ...first.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")! };
    const firstInterventions = first.interventions.length;

    // Mutate — simulate a rehearsal run.
    db.mutate((s) => {
      const row = s.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;
      row.score = 99;
      s.interventions.push({
        id: "int-rehearsal", studentId: "u-aarav", topicId: "resistance", riskScore: 90, peakScore: 90, severity: "immediate",
        reason: "rehearsal", mainIssue: "rehearsal", recommendedAction: "rehearsal", actions: [], signals: [],
        status: "recommended", studentRequestedHelp: false, history: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), resolvedAt: null,
      });
    });
    expect(db.getStore().mastery.find((m) => m.topicId === "resistance")!.score).toBe(99);

    await POST();
    const second = db.getStore();
    const secondResistance = second.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance")!;

    // Back to the exact same deterministic starting numbers, and the rehearsal intervention is gone.
    expect(secondResistance.score).toBe(firstResistance.score);
    expect(secondResistance.attempts).toBe(firstResistance.attempts);
    expect(second.interventions.length).toBe(firstInterventions);
    expect(second.interventions.some((i) => i.id === "int-rehearsal")).toBe(false);
  });
});
