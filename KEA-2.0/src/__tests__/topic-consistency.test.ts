/**
 * KEA Platform — Topic Consistency & Anti-Contamination Test Suite
 * 
 * Verifies that when a learner enters Python Programming, Calculus,
 * Photosynthesis, or Organic Chemistry, all downstream pedagogical artifacts:
 * - Roadmap / Topic Plan
 * - Fallback / Offline Learning Content
 * - Mock Test Generation
 * - Assessment Evaluation
 * - Interview Opening & Follow-up Turns
 * - Oral Defense Summary
 * 
 * remain 100% strictly topic-consistent and NEVER leak into unrelated domains
 * (e.g. Python must never mention carbon, alkenes, valence electrons, or fractions).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FallbackProvider, detectTopicFromPrompt } from "../lib/ai/fallback-provider";

describe("KEA Topic Consistency & Anti-Contamination Suite", () => {
  const provider = new FallbackProvider();

  const CHEMISTRY_CONTAMINATION_TERMS = [
    "carbon",
    "valence",
    "tetrahedral",
    "alkene",
    "alkane",
    "butane",
    "ethene",
    "catalytic hydrogenation",
    "isomer",
    "covalent architecture",
    "sp3",
  ];

  const ORGANIC_CHEMISTRY_CONTAMINATION_TERMS = [
    "tetrahedral",
    "alkene",
    "alkane",
    "butane",
    "ethene",
    "catalytic hydrogenation",
    "isomer",
    "covalent architecture",
    "sp3",
  ];

  const FRACTIONS_CONTAMINATION_TERMS = [
    "comparing like denominators",
    "lion pride drank",
    "water trough",
    "junior chef cupcake",
    "starship fuel tanks",
    "3/8",
    "5/8",
  ];

  it("1. detectTopicFromPrompt correctly classifies subjects", () => {
    const py = detectTopicFromPrompt('Topic: "Python Programming"\nStage: 1');
    assert.equal(py.kind, "python");
    assert.equal(py.displayName, "Python Programming");

    const calc = detectTopicFromPrompt('Topic: "Calculus"\nStage: 2');
    assert.equal(calc.kind, "calculus");
    assert.equal(calc.displayName, "Calculus");

    const photo = detectTopicFromPrompt('Topic: "Photosynthesis"\nStage: 1');
    assert.equal(photo.kind, "photosynthesis");
    assert.equal(photo.displayName, "Photosynthesis");

    const chem = detectTopicFromPrompt('Topic: "Organic Chemistry"\nStage: 1');
    assert.equal(chem.kind, "chemistry");
    assert.equal(chem.displayName, "Organic Chemistry");

    const gen = detectTopicFromPrompt('Topic: "Microeconomics"\nStage: 1');
    assert.equal(gen.kind, "general");
    assert.equal(gen.displayName, "Microeconomics");
  });

  it("2. Python Learning Content contains Python concepts and ZERO chemistry or fraction contamination", () => {
    const prompt = 'Topic: "Python Programming"\nStage: 1\nTarget Concept Title: "Variables & Memory"\nTarget Concept ID: "concept_py_memory"';
    const content = provider.generateFallbackLearningContent(prompt);

    assert.ok(content.conceptTitle.toLowerCase().includes("memory") || content.conceptTitle.toLowerCase().includes("variable") || content.conceptTitle.toLowerCase().includes("mutability"));
    assert.ok(content.personalizedExplanation.toLowerCase().includes("python"));
    assert.ok(content.practiceQuestion.prompt.toLowerCase().includes("python") || content.practiceQuestion.prompt.toLowerCase().includes("list"));

    const fullJson = JSON.stringify(content).toLowerCase();

    // Verify zero chemistry contamination
    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Python learning content must NOT contain chemistry term: "${term}"`
      );
    }

    // Verify zero fractions contamination
    for (const term of FRACTIONS_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Python learning content must NOT contain fraction demo term: "${term}"`
      );
    }
  });

  it("3. Calculus Learning Content contains limits/derivatives and ZERO chemistry contamination", () => {
    const prompt = 'Topic: "Calculus"\nStage: 1\nTarget Concept Title: "Limits & Continuity"\nTarget Concept ID: "concept_calc_limits"';
    const content = provider.generateFallbackLearningContent(prompt);

    assert.ok(content.conceptTitle.toLowerCase().includes("limit") || content.conceptTitle.toLowerCase().includes("derivative") || content.conceptTitle.toLowerCase().includes("rate"));
    assert.ok(content.personalizedExplanation.toLowerCase().includes("calculus") || content.personalizedExplanation.toLowerCase().includes("limit"));

    const fullJson = JSON.stringify(content).toLowerCase();

    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Calculus learning content must NOT contain chemistry term: "${term}"`
      );
    }
  });

  it("4. Photosynthesis Learning Content contains chlorophyll/light and ZERO organic chemistry contamination", () => {
    const prompt = 'Topic: "Photosynthesis"\nStage: 1\nTarget Concept Title: "Light-Dependent Reactions"\nTarget Concept ID: "concept_photo_light"';
    const content = provider.generateFallbackLearningContent(prompt);

    assert.ok(content.conceptTitle.toLowerCase().includes("photo") || content.conceptTitle.toLowerCase().includes("light") || content.conceptTitle.toLowerCase().includes("chloroplast"));
    assert.ok(content.personalizedExplanation.toLowerCase().includes("chloroplast") || content.personalizedExplanation.toLowerCase().includes("light") || content.personalizedExplanation.toLowerCase().includes("atp"));

    const fullJson = JSON.stringify(content).toLowerCase();

    // Photosynthesis legitimately uses "carbon" (carbon fixation, CO₂, Calvin cycle).
    // We check for ORGANIC chemistry terms (alkenes, sp3, etc.) that would indicate
    // contamination with the separate Organic Chemistry topic.
    for (const term of ORGANIC_CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Photosynthesis learning content must NOT contain organic chemistry term: "${term}"`
      );
    }
  });

  it("5. Python Mock Test generates Python questions with ZERO chemistry contamination", () => {
    const prompt = 'Topic: "Python Programming"\nStage: 2\nTarget Concepts: Functions, Lists, Tuples';
    const mockTest = provider.generateFallbackMockTest(prompt);

    assert.equal(mockTest.topic, "Python Programming");
    assert.ok(mockTest.questions.length >= 3);
    assert.ok(mockTest.questions[0].prompt.toLowerCase().includes("python") || mockTest.questions[0].conceptTitle?.toLowerCase().includes("type") || mockTest.questions[0].conceptTitle?.toLowerCase().includes("immutable"));

    const fullJson = JSON.stringify(mockTest).toLowerCase();

    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Python mock test must NOT contain chemistry term: "${term}"`
      );
    }
  });

  it("6. Python Interview Opening Question asks about Python variables and mutability, NOT carbon", () => {
    const prompt = 'Topic: "Python Programming" (Stage 1)\nCore Concepts: Variables & Object References';
    const opening = provider.generateFallbackOpeningQuestion(prompt) as {
      openingQuestion: string;
      targetConceptId: string;
      reasoning: string;
    };

    assert.ok(opening.openingQuestion.toLowerCase().includes("python"));
    assert.ok(opening.openingQuestion.toLowerCase().includes("mutable") || opening.openingQuestion.toLowerCase().includes("variable"));

    const fullJson = JSON.stringify(opening).toLowerCase();

    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Python interview opening must NOT contain chemistry term: "${term}"`
      );
    }
  });

  it("7. Python Interview Multi-Turn follow-up probes Python concepts without chemistry drift", () => {
    const prompt = 'Topic: "Python Programming"\nStudent response: In Python variables are references to objects in heap memory. Tuples are immutable and lists are mutable.';
    const turn = provider.generateFallbackInterviewTurn(prompt);

    assert.ok(turn.understanding === "strong" || turn.understanding === "partial");
    assert.ok(turn.nextQuestion.toLowerCase().includes("python") || turn.nextQuestion.toLowerCase().includes("reference") || turn.nextQuestion.toLowerCase().includes("garbage collector"));

    const fullJson = JSON.stringify(turn).toLowerCase();

    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Python interview turn must NOT contain chemistry term: "${term}"`
      );
    }
  });

  it("8. Dynamic Curriculum Plan for arbitrary generic topic creates consistent roadmap", () => {
    const prompt = 'Topic: "Quantum Mechanics"\nStage: 1';
    const plan = provider.generateFallbackTopicPlan(prompt) as {
      topic: string;
      stages: Array<{ title: string; objective: string }>;
    };

    assert.equal(plan.topic, "Quantum Mechanics");
    assert.ok(plan.stages.length >= 2);
    assert.ok(plan.stages[0].objective.includes("Quantum Mechanics"));

    const fullJson = JSON.stringify(plan).toLowerCase();
    for (const term of CHEMISTRY_CONTAMINATION_TERMS) {
      assert.equal(
        fullJson.includes(term.toLowerCase()),
        false,
        `Generic topic plan must NOT contain chemistry term: "${term}"`
      );
    }
  });
});
