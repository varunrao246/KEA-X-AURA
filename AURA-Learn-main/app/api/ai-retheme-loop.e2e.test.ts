import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration test for AI-driven context re-theming (PRD section 2.2 / 14), through the real
 * HTTP routes a browser calls: POST /api/ai/retheme and POST /api/attempts. Only the auth
 * boundary is stubbed; db persistence, the re-theme pipeline, the guardrail validator, and the
 * adaptive engine are all real production code.
 *
 * Scenario: student interest = Space, base question = "Calculate the current for V = 12 V and
 * R = 6 Ω." (Ohm's Law, answer 2 A) — the exact PRD example.
 *
 *   student interest -> AI re-theme request -> validated question -> displayed question
 *   -> student submits an answer -> the adaptive engine grades and updates mastery
 *
 * The academic answer must be identical no matter which interest re-themed the wording, and the
 * feature must degrade to a usable question when the AI is unconfigured, failing, or wrong.
 */

vi.mock("@/lib/auth", () => ({
  getStudentUser: vi.fn(async () => ({
    id: "u-aarav", name: "Aarav Sharma", email: "aarav@aura.demo", role: "student" as const, createdAt: "2026-09-01T09:00:00.000Z",
  })),
}));

const OHM_ID = "ohms-law-l2-1"; // "Calculate the current for V = 12 V and R = 6 Ω." answer "2"
let dbPath: string;

beforeEach(() => {
  dbPath = path.join(os.tmpdir(), `aura-ai-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  process.env.AURA_DB_PATH = dbPath;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_RETHEME_MODE;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
  delete (globalThis as unknown as { __auraAi?: unknown }).__auraAi;
  vi.resetModules();
  vi.unstubAllGlobals();
});

afterEach(() => {
  fs.rmSync(dbPath, { force: true });
  delete process.env.AURA_DB_PATH;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.AI_RETHEME_MODE;
  delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
  delete (globalThis as unknown as { __auraAi?: unknown }).__auraAi;
  vi.unstubAllGlobals();
});

async function loadRoutes() {
  const rethemeRoute = await import("@/app/api/ai/retheme/route");
  const attemptsRoute = await import("@/app/api/attempts/route");
  const db = await import("@/lib/db");
  return { rethemeRoute, attemptsRoute, db };
}

/**
 * The seeded demo story has Aarav stuck on Resistance with Ohm's Law still locked (see lib/seed.ts
 * and the adaptive-loop audit). That locking behaviour is already covered by
 * app/api/adaptive-loop.e2e.test.ts, so here we unlock Ohm's Law directly to isolate what THIS
 * test is about: re-theming + grading + the adaptive engine, not the prerequisite gate.
 */
function unlockOhmsLaw(db: Awaited<ReturnType<typeof loadRoutes>>["db"]) {
  db.mutate((s) => {
    const row = s.mastery.find((m) => m.studentId === "u-aarav" && m.topicId === "resistance");
    if (row) row.score = 90;
  });
}

function fetchJsonResponse(status: number, body: unknown, text?: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => text ?? JSON.stringify(body),
  } as Response;
}

/** A minimal fake OpenRouter server: the test tells it what content string to reply with, or to fail. */
function stubOpenRouterFetch(behaviour: { content?: string; httpStatus?: number; garbage?: boolean }) {
  const fetchMock = vi.fn(async () => {
    if (behaviour.httpStatus) return fetchJsonResponse(behaviour.httpStatus, {}, "upstream error");
    if (behaviour.garbage) return fetchJsonResponse(200, "not json", "not json");
    return fetchJsonResponse(200, { choices: [{ message: { content: behaviour.content } }] });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function retheme(rethemeRoute: Awaited<ReturnType<typeof loadRoutes>>["rethemeRoute"], interest: string) {
  const res = await rethemeRoute.POST(
    new Request("http://test.local/api/ai/retheme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: OHM_ID, interest }),
    }),
  );
  return { status: res.status, json: await res.json() };
}

async function submit(attemptsRoute: Awaited<ReturnType<typeof loadRoutes>>["attemptsRoute"], answer: string, theme?: { interest: string; source: string }) {
  const res = await attemptsRoute.POST(
    new Request("http://test.local/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: OHM_ID, answer, timeTakenSec: 20, hintsUsed: 0, theme }),
    }),
  );
  return { status: res.status, json: await res.json() };
}

describe("AI re-theming end to end: interest -> retheme -> validated question -> attempt -> adaptive engine", () => {
  it("no AI configured: falls back to the built-in Space theme, and the attempt still updates mastery normally", async () => {
    const { rethemeRoute, attemptsRoute, db } = await loadRoutes();
    unlockOhmsLaw(db);

    const { json: r } = await retheme(rethemeRoute, "space");
    expect(r.ok).toBe(true);
    expect(r.data.source).toBe("template"); // no API key -> deterministic built-in theme
    expect(r.data.fallbackReason).toBe("not_configured");
    expect(r.data.validation.passed).toBe(true);
    expect(r.data.stem).toMatch(/spacecraft/i);
    expect(r.data.stem).toMatch(/12 V/);
    expect(r.data.stem).toMatch(/6 Ω/);
    // the API response never carries the answer anywhere
    expect(JSON.stringify(r.data)).not.toMatch(/"2 A"|"answer"/);

    const { json: attempt } = await submit(attemptsRoute, "2", { interest: "space", source: r.data.source });
    expect(attempt.ok).toBe(true);
    expect(attempt.data.correct).toBe(true); // graded against the ORIGINAL answer, not the themed text
    expect(attempt.data.mastery.after).toBeGreaterThanOrEqual(attempt.data.mastery.before);

    const stored = db.getStore().attempts.at(-1)!;
    expect(stored.correct).toBe(true);
    expect(stored.theme).toEqual({ interest: "space", source: "template" });
  });

  it("AI configured and well-behaved: the model's rewrite is used, validated, and answers identically across interests", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test-not-a-real-key";
    const spaceReply = JSON.stringify({
      stem: "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current.",
      echo: { numbers: [12, 6], unit: "A", difficulty: 2, learningObjective: "Apply Ohm's Law to find current", answerUnchanged: true },
    });
    const sportsReply = JSON.stringify({
      stem: "A stadium scoreboard runs on 12 V across 6 Ω of resistance. Calculate the current.",
      echo: { numbers: [12, 6], unit: "A", difficulty: 2, learningObjective: "Apply Ohm's Law to find current", answerUnchanged: true },
    });

    { // Space
      const { rethemeRoute, attemptsRoute, db } = await loadRoutes();
      unlockOhmsLaw(db);
      stubOpenRouterFetch({ content: spaceReply });
      const { json: r } = await retheme(rethemeRoute, "space");
      expect(r.data.source).toBe("ai");
      expect(r.data.validation.passed).toBe(true);
      expect(r.data.stem).toMatch(/spacecraft/i);
      const { json: attempt } = await submit(attemptsRoute, "2 A", { interest: "space", source: "ai" });
      expect(attempt.data.correct).toBe(true);
    }

    // Fresh store for a clean before/after comparison with the second interest.
    delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
    fs.rmSync(dbPath, { force: true });
    vi.resetModules();

    { // Sports
      const { rethemeRoute, attemptsRoute, db } = await loadRoutes();
      unlockOhmsLaw(db);
      stubOpenRouterFetch({ content: sportsReply });
      const { json: r } = await retheme(rethemeRoute, "sports");
      expect(r.data.source).toBe("ai");
      expect(r.data.stem).toMatch(/stadium/i);
      const { json: attempt } = await submit(attemptsRoute, "2", { interest: "sports", source: "ai" });
      // Same academic answer (2 A) regardless of which story the student saw.
      expect(attempt.data.correct).toBe(true);
    }
  });

  it("AI returns a validation-failing rewrite (changes a number): rejected, falls back to a safe question, attempt still works", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test-not-a-real-key";
    const badReply = JSON.stringify({ stem: "Imagine a spacecraft instrument operating at 13 V with 6 Ω of resistance. Calculate the current." });
    const { rethemeRoute, attemptsRoute, db } = await loadRoutes();
    unlockOhmsLaw(db);
    stubOpenRouterFetch({ content: badReply });

    const { json: r } = await retheme(rethemeRoute, "space");
    expect(r.ok).toBe(true);
    expect(r.data.source).not.toBe("ai"); // the bad rewrite (13 V) was thrown away
    expect(r.data.fallbackReason).toBe("validation_failed");
    expect(r.data.stem).not.toMatch(/13 V/);
    expect(r.data.validation.passed).toBe(true);

    const { json: attempt } = await submit(attemptsRoute, "2", { interest: "space", source: r.data.source });
    expect(attempt.data.correct).toBe(true);
  });

  it("AI is down (HTTP 500) or returns garbage: the question is still usable and grading is unaffected", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test-not-a-real-key";

    const { rethemeRoute: r1, attemptsRoute: a1, db: db1 } = await loadRoutes();
    unlockOhmsLaw(db1);
    stubOpenRouterFetch({ httpStatus: 500 });
    const down = await retheme(r1, "space");
    expect(down.json.ok).toBe(true);
    expect(down.json.data.fallbackReason).toBe("http_error");
    expect((await submit(a1, "2", { interest: "space", source: down.json.data.source })).json.data.correct).toBe(true);

    delete (globalThis as unknown as { __auraStore?: unknown }).__auraStore;
    delete (globalThis as unknown as { __auraAi?: unknown }).__auraAi;
    fs.rmSync(dbPath, { force: true });
    vi.resetModules();

    const { rethemeRoute: r2, attemptsRoute: a2, db: db2 } = await loadRoutes();
    unlockOhmsLaw(db2);
    stubOpenRouterFetch({ garbage: true });
    const garbage = await retheme(r2, "space");
    expect(garbage.json.ok).toBe(true);
    expect(garbage.json.data.fallbackReason).toBe("invalid_response");
    expect((await submit(a2, "2", { interest: "space", source: garbage.json.data.source })).json.data.correct).toBe(true);
  });

  it("rejects a request with no interest and no profile fallback available (no chatbot free-text path)", async () => {
    const { rethemeRoute } = await loadRoutes();
    const res = await rethemeRoute.POST(
      new Request("http://test.local/api/ai/retheme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: OHM_ID }) }),
    );
    const json = await res.json();
    // Aarav's seeded profile has not chosen interests yet, so the route must not guess or free-associate.
    expect(json.ok).toBe(false);
  });

  it("never leaks the API key: not in the response body, and never sent anywhere but the Authorization header", async () => {
    process.env.OPENROUTER_API_KEY = "sk-test-super-secret-value";
    const { rethemeRoute } = await loadRoutes();
    const fetchMock = stubOpenRouterFetch({ content: JSON.stringify({ stem: "Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance. Calculate the current." }) });

    const { json: r } = await retheme(rethemeRoute, "space");
    expect(JSON.stringify(r)).not.toContain("sk-test-super-secret-value");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test-super-secret-value");
    expect(JSON.stringify(init.body)).not.toContain("sk-test-super-secret-value");
  });
});
