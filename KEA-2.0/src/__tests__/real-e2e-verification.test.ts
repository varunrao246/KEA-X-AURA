/**
 * KEA Platform — Real End-to-End API & Provider Cascade Verification Suite
 * 
 * Verifies all 5 mandatory real-world test scenarios:
 * TEST 1: Topic/Content Generation (Expected: Gemini)
 * TEST 2: Forced Gemini Failure -> NVIDIA NIM Fallback (Expected: NVIDIA NIM, strictly NOT Groq)
 * TEST 3: Mock Interview (Expected: Groq as primary, fallback to deterministic interview engine, NOT Gemini/NVIDIA)
 * TEST 4: Interview Follow-Up/Evaluation (Expected: Groq as primary, fallback to deterministic interview engine)
 * TEST 5: Oral Comprehension Probe with real Gemini evaluation
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Safely load .env.local without exposing secrets
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

import { AIOrchestrator } from "../lib/ai/ai-orchestrator";
import { GeminiProvider } from "../lib/ai/gemini-provider";
import {
  GeneratedLearningContentSchema,
  LEARNING_CONTENT_JSON_TEMPLATE,
  InterviewTurnEvaluationSchema,
  INTERVIEW_TURN_JSON_TEMPLATE,
} from "../lib/ai/schemas";
import { evaluateOralResponse } from "../lib/oral/evaluator";
import { rethemeQuestion } from "../lib/retheming";
import { z } from "zod";

describe("KEA Real End-to-End API & Provider Verification", () => {
  it("TEST 1: Topic/Content Generation routes to Gemini with NVIDIA NIM secondary", async () => {
    const orchestrator = new AIOrchestrator();
    
    // Check candidate chain for taskType: "learning"
    const candidates = orchestrator.getCandidateProviders("learning");
    assert.deepEqual(candidates, ["gemini", "nvidia", "fallback"]);
    assert.equal(candidates.includes("groq"), false, "Groq must NEVER be in content generation candidate chain");

    const prompt = `You are KEA's AI Adaptive Learning Engine.
Topic: "Organic Chemistry"
Current Stage: 3
Target Concept ID: "concept_functional_groups"
Target Concept Title: "Functional Groups & Intermolecular Polarity"
Learner Mastery: 70%
Learner Pace: steady
Learner Interest/Theme: default
Recent Mistakes/Gaps: None
Adaptive Pedagogical Directive: Provide clear step-by-step worked demonstrations.

You MUST respond strictly with a valid JSON object matching this structure:
${LEARNING_CONTENT_JSON_TEMPLATE}`;

    const res = await orchestrator.generateStructured(prompt, GeneratedLearningContentSchema, {
      taskType: "learning",
      temperature: 0.2,
      timeoutMs: 25000,
    });

    console.log(`[TEST 1] Provider actually used: ${res.metadata.provider}, Model: ${res.metadata.model}, Latency: ${res.metadata.latencyMs}ms`);
    assert.ok(
      res.metadata.provider === "gemini" || res.metadata.provider === "nvidia",
      `Expected Gemini (or NVIDIA NIM secondary), got: ${res.metadata.provider}`
    );
    assert.notEqual(res.metadata.provider, "groq", "Groq must NOT be used for content generation");
    assert.equal(res.metadata.schemaValid, true);
    assert.ok(res.data.personalizedExplanation.length >= 20);
    assert.ok(res.data.practiceQuestion.options.length >= 4);
  });

  it("TEST 2: Force Gemini failure -> NVIDIA NIM is used rather than Groq", async () => {
    // Create an orchestrator with a broken Gemini provider to simulate Gemini failure
    const orchestrator = new AIOrchestrator();
    const brokenGemini = new GeminiProvider("INVALID_GEMINI_KEY", "gemini-flash-lite-latest");
    // Replace gemini with brokenGemini in orchestrator map
    (orchestrator as unknown as { providers: Map<string, unknown> }).providers.set("gemini", brokenGemini);

    const NimTestSchema = z.object({
      conceptTitle: z.string(),
      status: z.string(),
    });

    const prompt = `You are KEA's AI Adaptive Learning Engine.
Topic: "Organic Chemistry"
Concept: "Functional Groups"
You MUST respond strictly with a valid JSON object matching this structure:
{"conceptTitle": "Functional Groups", "status": "active"}`;

    const res = await orchestrator.generateStructured(prompt, NimTestSchema, {
      taskType: "learning",
      temperature: 0.2,
      timeoutMs: 35000,
    });

    console.log(`[TEST 2] Provider used after Gemini failure: ${res.metadata.provider}, Model: ${res.metadata.model}, Latency: ${res.metadata.latencyMs}ms`);
    assert.equal(res.metadata.provider, "nvidia", "Expected NVIDIA NIM to act as secondary provider upon Gemini failure");
    assert.notEqual(res.metadata.provider, "groq", "Groq must NOT be selected on Gemini failure");
    assert.equal(res.metadata.schemaValid, true);
    assert.ok(res.data.conceptTitle.length > 0);
  });

  it("TEST 3: Mock Interview routes strictly to Groq (and falls back to deterministic engine, NOT Gemini/NVIDIA)", async () => {
    const orchestrator = new AIOrchestrator();
    
    // Check candidate chain for taskType: "interview"
    const candidates = orchestrator.getCandidateProviders("interview");
    assert.deepEqual(candidates, ["groq", "fallback"]);
    assert.equal(candidates.includes("gemini"), false, "Gemini must NOT be in mock interview candidate chain");
    assert.equal(candidates.includes("nvidia"), false, "NVIDIA must NOT be in mock interview candidate chain");

    const OpeningSchema = z.object({
      openingQuestion: z.string(),
      targetConceptId: z.string(),
      reasoning: z.string(),
    });

    const prompt = `You are a supportive, rigorous Academic Defense Interviewer at KEA.
Topic: "Organic Chemistry" (Stage 3)
Generate an opening question for the oral defense.`;

    const res = await orchestrator.generateStructured(prompt, OpeningSchema, {
      taskType: "interview",
      temperature: 0.3,
      timeoutMs: 8000,
    });

    console.log(`[TEST 3] Interview Provider: ${res.metadata.provider}, Fallback Used: ${res.metadata.fallbackUsed}`);
    // Since Groq in .env.local has a placeholder dummy key, Groq will fail auth and fall back to deterministic interview engine
    assert.ok(
      res.metadata.provider === "groq" || res.metadata.provider === "fallback",
      `Expected Groq or fallback, got: ${res.metadata.provider}`
    );
    assert.notEqual(res.metadata.provider, "gemini", "Gemini must NOT be used for mock interview");
    assert.notEqual(res.metadata.provider, "nvidia", "NVIDIA must NOT be used for mock interview");
    assert.equal(res.metadata.schemaValid, true);
    assert.ok(res.data.openingQuestion.length > 0);
  });

  it("TEST 4: Interview follow-up/evaluation routes strictly to Groq / fallback", async () => {
    const orchestrator = new AIOrchestrator();
    const prompt = `You are a supportive, rigorous Academic Defense Interviewer at KEA.
Topic: "Organic Chemistry"
Turn Number: 2 of max 4
Current Question Asked: "Explain catalytic hydrogenation."
Current Concept Under Evaluation: "concept_organic_reactions"
Student's Natural Response: "Hydrogen gas adds across the carbon-carbon double bond over a metal catalyst surface, saturating the alkene to an alkane."

Evaluate the student's response matching this structure:
${INTERVIEW_TURN_JSON_TEMPLATE}`;

    const res = await orchestrator.generateStructured(prompt, InterviewTurnEvaluationSchema, {
      taskType: "interview",
      temperature: 0.3,
      timeoutMs: 8000,
    });

    console.log(`[TEST 4] Interview Follow-up Provider: ${res.metadata.provider}, Fallback Used: ${res.metadata.fallbackUsed}`);
    assert.ok(
      res.metadata.provider === "groq" || res.metadata.provider === "fallback",
      `Expected Groq or fallback, got: ${res.metadata.provider}`
    );
    assert.notEqual(res.metadata.provider, "gemini", "Gemini must NOT be used for mock interview evaluation");
    assert.notEqual(res.metadata.provider, "nvidia", "NVIDIA must NOT be used for mock interview evaluation");
    assert.equal(res.metadata.schemaValid, true);
    assert.ok(["strong", "partial", "weak"].includes(res.data.understanding));
  });

  it("TEST 5A: Oral comprehension probe evaluation with real Gemini API", async () => {
    const result = await evaluateOralResponse({
      studentId: "student_test_101",
      conceptId: "NODE_03",
      conceptTitle: "Comparing Like Denominators",
      transcript: "When both fractions have 8 pieces, 5 pieces is more than 3 pieces because 5 is greater than 3.",
      expectedConceptPrinciple: "When denominators are equal, fractions with greater numerators represent greater quantities.",
      theme: "space",
    });

    console.log(`[TEST 5A] Oral Probe Result: Score=${result.conceptualUnderstandingScore}, ArticulatesKeyPrinciple=${result.articulatesKeyPrinciple}, IsFallback=${result.isFallback}, Latency=${result.evaluationLatencyMs}ms`);
    assert.equal(typeof result.conceptualUnderstandingScore, "number");
    assert.ok(result.conceptualUnderstandingScore >= 0.7);
    assert.equal(result.articulatesKeyPrinciple, true);
    // Real Gemini call succeeded with updated model!
    assert.equal(result.isFallback, false, "Expected live Gemini evaluation to succeed rather than falling back to heuristic");
  });

  it("TEST 5B: Content Re-Theming executes end-to-end and preserves invariants", async () => {
    const result = await rethemeQuestion("NODE_03", "space");
    console.log(`[TEST 5B] Rethemed Context: "${result.thematicContext}", InvariantPassed=${result.invariantCheckPassed}, IsFallback=${result.isFallback}`);
    assert.equal(result.invariantCheckPassed, true);
    assert.equal(result.options.length, 4);
    assert.equal(result.correctOptionId, "opt-2");
    assert.ok(result.questionText.includes("3/8") && result.questionText.includes("5/8"));
  });
});
