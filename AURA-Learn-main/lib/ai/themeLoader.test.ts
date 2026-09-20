import { describe, expect, it } from "vitest";
import { createThemeLoadState, loadTheme } from "./themeLoader";
import type { RethemeResult } from "./types";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function fakeResult(over: Partial<RethemeResult> = {}): RethemeResult {
  return {
    questionId: "q1", interest: "space", stem: "themed", source: "ai", themed: true, cached: false,
    validation: { passed: true, checks: [], failed: [] },
    preserved: { numbers: [], quantities: [], difficulty: 1, learningObjective: "", answerKeyUnchanged: true },
    pipeline: [], latencyMs: 10,
    ...over,
  };
}

function callbacks() {
  const busy: boolean[] = [];
  const phases: string[] = [];
  const results: (RethemeResult | null)[] = [];
  const resolved: unknown[] = [];
  const errors: string[] = [];
  return {
    busy, phases, results, resolved, errors,
    cb: {
      onPhase: (p: "loading" | "ready" | "error") => phases.push(p),
      onResult: (r: RethemeResult | null) => results.push(r),
      onError: (m: string) => errors.push(m),
      onBusyChange: (b: boolean) => busy.push(b),
      onResolved: (info: unknown) => resolved.push(info),
    },
  };
}

describe("loadTheme busy-flag lifecycle", () => {
  it("normal path: busy goes true then false once the fetch resolves", async () => {
    const state = createThemeLoadState();
    const { cb, busy, results } = callbacks();
    await loadTheme("q1", "space", state, async () => fakeResult(), cb);
    expect(busy).toEqual([true, false]);
    expect(results[0]?.themed).toBe(true);
  });

  it("picking 'original' with nothing in flight resolves busy to false", async () => {
    const state = createThemeLoadState();
    const { cb, busy, results } = callbacks();
    await loadTheme("q1", "original", state, async () => fakeResult(), cb);
    expect(busy).toEqual([false]);
    expect(results).toEqual([null]);
  });

  it("REGRESSION: switching to 'original' while a themed fetch is still in flight must not leave busy stuck true", async () => {
    const state = createThemeLoadState();
    const { cb, busy } = callbacks();
    const pending = deferred<RethemeResult>();

    const first = loadTheme("q1", "space", state, () => pending.promise, cb); // starts, busy -> true, awaits
    expect(busy).toEqual([true]);

    // Before the space fetch resolves, the student switches to "original".
    await loadTheme("q1", "original", state, async () => fakeResult(), cb);
    expect(busy).toEqual([true, false]); // "original" must reset busy itself

    // The stale, superseded "space" fetch finally resolves — it must NOT flip busy back to true or leave it in a bad state.
    pending.resolve(fakeResult());
    await first;
    expect(busy).toEqual([true, false]); // no further changes from the stale response
  });

  it("REGRESSION: a cache hit while an earlier fetch is still in flight must not leave busy stuck true", async () => {
    const state = createThemeLoadState();
    const { cb, busy } = callbacks();
    const pending = deferred<RethemeResult>();

    const first = loadTheme("q1", "space", state, () => pending.promise, cb);
    expect(busy).toEqual([true]);

    // Warm the cache for "sports" directly, then request it — this must hit the cache branch.
    state.cache.set("q1:sports", fakeResult({ interest: "sports" }));
    await loadTheme("q1", "sports", state, async () => { throw new Error("should not fetch — should be a cache hit"); }, cb);
    expect(busy).toEqual([true, false]);

    pending.resolve(fakeResult());
    await first;
    expect(busy).toEqual([true, false]);
  });

  it("switching between two real interests before the first resolves: only the latest one's result is applied", async () => {
    const state = createThemeLoadState();
    const { cb, busy, results, resolved } = callbacks();
    const spacePending = deferred<RethemeResult>();

    const first = loadTheme("q1", "space", state, () => spacePending.promise, cb);
    const second = loadTheme("q1", "sports", state, async () => fakeResult({ interest: "sports" }), cb);
    await second;
    expect(busy).toEqual([true, true, false]); // sports finished and correctly owns the flag

    // The stale "space" response arrives after — it must be ignored entirely.
    spacePending.resolve(fakeResult({ interest: "space" }));
    await first;
    expect(busy).toEqual([true, true, false]);
    expect(results).toHaveLength(1);
    expect(resolved).toEqual([{ interest: "sports", source: "ai" }]);
  });

  it("a fetch error resolves busy to false and reports the failure", async () => {
    const state = createThemeLoadState();
    const { cb, busy, phases, errors } = callbacks();
    await loadTheme("q1", "space", state, async () => { throw new Error("boom"); }, cb);
    expect(busy).toEqual([true, false]);
    expect(phases).toEqual(["loading", "error"]);
    expect(errors.at(-1)).toMatch(/couldn't theme/i);
  });

  it("an aborted (timed-out) fetch reports a distinct message", async () => {
    const state = createThemeLoadState();
    const { cb, errors } = callbacks();
    await loadTheme("q1", "space", state, async () => { throw new DOMException("aborted", "AbortError"); }, cb);
    expect(errors.at(-1)).toMatch(/took too long/i);
  });
});
