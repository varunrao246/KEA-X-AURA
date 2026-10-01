import { describe, it, expect } from "vitest";
import {
  generateMasterBrainChallenge,
  evaluateMasterBrainAnswer,
  getOrCreateBrainState,
} from "./generator";
import { getOrGenerateTopicIntelligencePack } from "../serpapi/intelligence-pack";
import { sanitizeSearchQuery, getSerpApiUsageStats } from "../serpapi/service";

describe("🧠 Master Brain Core Intelligence & Experience Suite", () => {
  it("1. Generates curriculum-aligned bonus challenges for core topics", async () => {
    const challenge = await generateMasterBrainChallenge({
      topicId: "photosynthesis",
      topicName: "Photosynthesis",
      masteryScore: 75,
    });

    expect(challenge).toBeDefined();
    expect(challenge.topicId).toBe("photosynthesis");
    expect(challenge.options.length).toBeGreaterThanOrEqual(2);
    expect(challenge.options.some((o) => o.isCorrect)).toBe(true);
    expect(challenge.explanation).toBeTruthy();
    expect(challenge.realWorldConnection).toBeDefined();
    expect(challenge.realWorldConnection.title).toBeTruthy();
  });

  it("2. Personalizes question type based on student's detected misconception", async () => {
    const challenge = await generateMasterBrainChallenge({
      topicId: "photosynthesis",
      topicName: "Photosynthesis",
      conceptName: "Plant Nutrition",
      masteryScore: 50,
      detectedMisconception: "Plants get food from soil",
    });

    expect(challenge.type).toBe("CHALLENGE_ASSUMPTION");
    expect(challenge.questionText.toLowerCase()).toContain("food");
  });

  it("3. Non-punitive evaluation: incorrect answer receives encouraging feedback & awards base Brain XP", () => {
    const studentId = `test_student_${Date.now()}`;
    const mockChallenge = {
      id: "mb_test_1",
      topicId: "electric-current",
      topicName: "Electric Current",
      conceptName: "Current Flow",
      type: "REAL_WORLD" as const,
      promptHeadline: "🧠 One for your brain...",
      questionText: "Why can birds sit on power lines?",
      options: [
        { id: "opt_correct", text: "Zero potential difference", isCorrect: true },
        { id: "opt_wrong", text: "Rubber feathers", isCorrect: false },
      ],
      explanation: "Current requires a voltage difference across two contact points.",
      surprisingFact: "Linemen wear stainless-steel suits.",
      realWorldConnection: {
        title: "High-Voltage Linemen",
        domain: "Power Grid",
        description: "Equipotential bonding keeps maintenance crews safe.",
      },
      brainXpReward: 5,
      bonusXp: 5,
    };

    const res = evaluateMasterBrainAnswer({
      challenge: mockChallenge,
      studentId,
      selectedOptionId: "opt_wrong",
    });

    expect(res.correct).toBe(false);
    expect(res.headlineFeedback).toBe("Interesting thought! 👀");
    expect(res.encouragingFeedback).toContain("surprising part");
    expect(res.earnedBrainXp).toBe(5); // Non-punitive: still earned 5 Brain XP for thinking!
    expect(res.newBrainStreak).toBeGreaterThanOrEqual(1);
  });

  it("4. Correct answer with reasoning awards bonus Brain XP", () => {
    const studentId = `test_student_bonus_${Date.now()}`;
    const mockChallenge = {
      id: "mb_test_2",
      topicId: "ohms-law",
      topicName: "Ohm's Law",
      conceptName: "V = IR",
      type: "TRANSFER" as const,
      promptHeadline: "🌎 Here's where this gets interesting...",
      questionText: "Why do racing tires have huge surface area?",
      options: [
        { id: "opt_correct", text: "Disperse thermal heat and grip", isCorrect: true },
        { id: "opt_wrong", text: "Make car heavy", isCorrect: false },
      ],
      explanation: "Like thicker wires reducing overheating, wide tires distribute friction heat.",
      surprisingFact: "F1 brakes hit 1000°C.",
      realWorldConnection: {
        title: "Supercomputer Busbars",
        domain: "Hardware Engineering",
        description: "Massive copper area prevents overheating.",
      },
      brainXpReward: 5,
      bonusXp: 5,
    };

    const res = evaluateMasterBrainAnswer({
      challenge: mockChallenge,
      studentId,
      selectedOptionId: "opt_correct",
      freeformThinking: "Because surface area lowers resistance to heat buildup like thick wires.",
    });

    expect(res.correct).toBe(true);
    expect(res.headlineFeedback).toContain("Brilliant reasoning");
    expect(res.earnedBrainXp).toBe(10); // 5 base + 5 reasoning bonus
  });

  it("5. Topic Intelligence Pack provides SerpApi discovery with research and real-world connections", async () => {
    const pack = await getOrGenerateTopicIntelligencePack("photosynthesis");

    expect(pack).toBeDefined();
    expect(pack.topic).toBe("Photosynthesis");
    expect(pack.commonQuestions.length).toBeGreaterThan(0);
    expect(pack.whyQuestions.length).toBeGreaterThan(0);
    expect(pack.realWorldConnections.length).toBeGreaterThan(0);
    expect(pack.researchResources.length).toBeGreaterThan(0);
    expect(pack.researchResources[0].whyThisMatters).toBeTruthy();
    expect(pack.videoResources.length).toBeGreaterThan(0);
  });

  it("6. Sanitizes user search queries against script injection", () => {
    const raw = "<script>alert('hack')</script> photosynthesis & electricity!";
    const clean = sanitizeSearchQuery(raw);

    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert");
    expect(clean).toContain("photosynthesis");
  });

  it("7. Tracks developer usage stats and quota estimates", () => {
    const stats = getSerpApiUsageStats();

    expect(stats).toBeDefined();
    expect(typeof stats.requestsToday).toBe("number");
    expect(typeof stats.estimatedQuotaRemaining).toBe("number");
    expect(stats.estimatedQuotaRemaining).toBeLessThanOrEqual(250);
  });
});
