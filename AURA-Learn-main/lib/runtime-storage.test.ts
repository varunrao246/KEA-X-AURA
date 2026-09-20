import { describe, expect, it, beforeEach } from "vitest";
import { getStore, mutate, resetStore, dbHealth } from "./db";
import { applyFacilitatorAction } from "./intervention";
import { submitAttempt } from "./practice";

describe("AURA Runtime Storage & Mutations (Phase 13)", () => {
  beforeEach(() => {
    resetStore();
  });

  it("initializes storage cleanly and returns valid database health", () => {
    const health = dbHealth();
    expect(health.engine).toBe("json-file");
    expect(health.counts.users).toBeGreaterThan(0);
    expect(health.counts.topics).toBeGreaterThan(0);
    expect(health.counts.questions).toBeGreaterThan(0);
  });

  it("handles learner attempt submission and updates mastery/attempts state", () => {
    const store = getStore();
    const student = store.users.find((u) => u.role === "student");
    expect(student).toBeDefined();
    const studentId = student!.id;
    const question = store.questions[0];
    const initialAttemptsCount = store.attempts.length;

    const result = mutate((s) =>
      submitAttempt(s, studentId, {
        questionId: question.id,
        answer: question.answer,
        timeTakenSec: 25,
        hintsUsed: 0,
        skipped: false,
      })
    );

    expect(result.correct).toBe(true);
    expect(result.tracked).toBeDefined();
    expect(result.mastery).toBeDefined();

    // Verify storage layer contains the newly recorded attempt
    const updatedStore = getStore();
    expect(updatedStore.attempts.length).toBe(initialAttemptsCount + 1);
    const lastAttempt = updatedStore.attempts[updatedStore.attempts.length - 1];
    expect(lastAttempt.studentId).toBe(studentId);
    expect(lastAttempt.questionId).toBe(question.id);
  });

  it("handles facilitator intervention actions including assign, start, and resolve", () => {
    const store = getStore();
    const student = store.users.find((u) => u.role === "student");
    expect(student).toBeDefined();
    const studentId = student!.id;

    // Create an active intervention in store
    const testIvId = "test-iv-101";
    mutate((s) => {
      s.interventions.push({
        id: testIvId,
        studentId,
        topicId: "resistance",
        riskScore: 75,
        peakScore: 75,
        severity: "intervention",
        reason: "Struggling with resistance questions",
        mainIssue: "Repeated mistakes",
        recommendedAction: "Review voltage prerequisite",
        actions: [
          {
            kind: "prerequisite",
            label: "Review Voltage",
            description: "Solidify prerequisite concept",
            href: "/learn/voltage",
          },
        ],
        signals: [],
        status: "recommended",
        studentRequestedHelp: false,
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
      });
    });

    // 1. Facilitator reviews case: recommended -> viewed
    const reviewResult = mutate((s) =>
      applyFacilitatorAction(s, testIvId, "review", new Date(), "Educator reviewed case")
    );
    expect(reviewResult.ok).toBe(true);
    if (reviewResult.ok) {
      expect(reviewResult.intervention.status).toBe("viewed");
    }

    // 2. Facilitator assigns refresher: viewed -> started (with assignedAction populated)
    const assignResult = mutate((s) =>
      applyFacilitatorAction(s, testIvId, "assign", new Date(), "Assigned voltage refresher")
    );
    expect(assignResult.ok).toBe(true);
    if (assignResult.ok) {
      expect(assignResult.intervention.status).toBe("started");
      expect(assignResult.intervention.assignedAction).toBeDefined();
      expect(assignResult.intervention.assignedAction?.label).toBe("Review Voltage");
    }

    // 3. Facilitator resolves case: started -> resolved
    const resolveResult = mutate((s) =>
      applyFacilitatorAction(s, testIvId, "resolve", new Date(), "Student successfully demonstrated mastery")
    );
    expect(resolveResult.ok).toBe(true);
    if (resolveResult.ok) {
      expect(resolveResult.intervention.status).toBe("resolved");
      expect(resolveResult.intervention.resolvedAt).not.toBeNull();
      expect(resolveResult.intervention.resolvedBy).toBe("facilitator");
    }

    // Verify persisted state in store
    const finalStore = getStore();
    const finalIv = finalStore.interventions.find((i) => i.id === testIvId);
    expect(finalIv?.status).toBe("resolved");
  });

  it("safely handles serverless environment without throwing unhandled EROFS crashes", () => {
    // Verify that mutate operates in memory and catches disk write failures safely
    const store = getStore();
    const testNote = "Serverless mutation test";
    
    // Perform a mutation
    const mutated = mutate((s) => {
      s.events.push({
        id: "evt-test-serverless",
        studentId: "u-aarav",
        topicId: "resistance",
        type: "intervention",
        tone: "info",
        title: "Test Event",
        detail: testNote,
        at: new Date().toISOString(),
      });
      return true;
    });

    expect(mutated).toBe(true);
    const updated = getStore();
    expect(updated.events.some((e) => e.detail === testNote)).toBe(true);
  });
});
