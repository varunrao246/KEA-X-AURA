import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePaceMetrics } from "../calculator";
import { AttemptLog } from "../types";

describe("KEA Dynamic Learning Pace & Mascot Test Suite (P1-02)", () => {
  it("1. Returns default steady cheetah mascot on zero prior attempts", () => {
    const pace = calculatePaceMetrics([]);
    assert.equal(pace.mascot, "cheetah");
    assert.equal(pace.tempoCategory, "steady");
    assert.equal(pace.totalAttemptsTracked, 0);
  });

  it("2. Classifies fast tempo (< 25s) with high accuracy as Aero the Falcon", () => {
    const attempts: AttemptLog[] = [
      { conceptId: "NODE_01", secondsSpent: 18, isCorrect: true, timestamp: 1 },
      { conceptId: "NODE_01", secondsSpent: 14, isCorrect: true, timestamp: 2 },
      { conceptId: "NODE_02", secondsSpent: 20, isCorrect: true, timestamp: 3 },
    ];

    const pace = calculatePaceMetrics(attempts);
    assert.equal(pace.mascot, "falcon");
    assert.equal(pace.mascotName, "Aero the Falcon");
    assert.equal(pace.tempoCategory, "accelerated");
    assert.ok(pace.avgSecondsPerProblem < 25);
    assert.equal(pace.recentAccuracy, 100);
    assert.ok(pace.paceIndex > 1.2);
  });

  it("3. Classifies deliberate mindful pace (> 55s) as Bamboo the Panda", () => {
    const attempts: AttemptLog[] = [
      { conceptId: "NODE_03", secondsSpent: 65, isCorrect: true, timestamp: 1 },
      { conceptId: "NODE_03", secondsSpent: 70, isCorrect: false, timestamp: 2 },
      { conceptId: "NODE_03", secondsSpent: 62, isCorrect: true, timestamp: 3 },
    ];

    const pace = calculatePaceMetrics(attempts);
    assert.equal(pace.mascot, "panda");
    assert.equal(pace.mascotName, "Bamboo the Panda");
    assert.equal(pace.tempoCategory, "mindful");
    assert.ok(pace.avgSecondsPerProblem > 55);
    assert.ok(pace.growthMindsetNudge.includes("Mindful Explorer"));
  });

  it("4. Classifies standard rhythm as Dash the Cheetah", () => {
    const attempts: AttemptLog[] = [
      { conceptId: "NODE_02", secondsSpent: 35, isCorrect: true, timestamp: 1 },
      { conceptId: "NODE_02", secondsSpent: 40, isCorrect: true, timestamp: 2 },
    ];

    const pace = calculatePaceMetrics(attempts);
    assert.equal(pace.mascot, "cheetah");
    assert.equal(pace.mascotName, "Dash the Cheetah");
    assert.equal(pace.tempoCategory, "steady");
  });

  it("5. Non-punitive: dynamic adaptation only tracks tempo without penalizing content access", () => {
    // Student transitions from fast to thoughtful
    const mixedAttempts: AttemptLog[] = [
      { conceptId: "NODE_01", secondsSpent: 15, isCorrect: true, timestamp: 1 },
      { conceptId: "NODE_02", secondsSpent: 18, isCorrect: true, timestamp: 2 },
      { conceptId: "NODE_03", secondsSpent: 75, isCorrect: true, timestamp: 3 },
      { conceptId: "NODE_03", secondsSpent: 80, isCorrect: true, timestamp: 4 },
      { conceptId: "NODE_03", secondsSpent: 65, isCorrect: true, timestamp: 5 },
    ];

    const pace = calculatePaceMetrics(mixedAttempts);
    assert.equal(pace.mascot, "panda");
    assert.equal(pace.totalAttemptsTracked, 5);
    // Verified: No locking flags or penalties returned in pace state
    const paceRecord = pace as unknown as Record<string, unknown>;
    assert.equal(paceRecord.locked, undefined);
    assert.equal(paceRecord.penalty, undefined);
  });
});
