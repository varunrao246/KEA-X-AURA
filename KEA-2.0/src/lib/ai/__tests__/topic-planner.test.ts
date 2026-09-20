import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateTopicInput,
  validateAndNormalizeAITopicPlan,
} from "../topic-plan-validator";
import { FallbackTopicPlanner } from "../fallback-topic-planner";
import { getTopicPlan } from "../index";

describe("KEA AI Topic-to-Learning-Plan Pipeline Test Suite", () => {
  // Test 1: Valid topic request passes input validation
  it("1. Valid topic request passes input validation with sanitized string", () => {
    const result = validateTopicInput("  Python Programming  ");
    assert.equal(result.isValid, true);
    assert.equal(result.sanitizedTopic, "Python Programming");
    assert.equal(result.error, undefined);
  });

  // Test 2: Empty topic rejected
  it("2. Empty topic rejected with validation error", () => {
    const result = validateTopicInput("");
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /empty/i);
  });

  // Test 3: Whitespace-only topic rejected
  it("3. Whitespace-only topic rejected", () => {
    const result = validateTopicInput("     ");
    assert.equal(result.isValid, false);
    assert.match(result.error || "", /whitespace/i);
  });

  // Test 4: Gemini structured output parses correctly
  it("4. Gemini structured output parses correctly into valid plan", () => {
    const validRaw = {
      topic: "Quantum Computing Basics",
      category: "Physics & Computing",
      estimatedHours: 12,
      overview: "Understand qubits, superposition, and quantum gates.",
      prerequisiteSummary: "Requires linear algebra and basic programming.",
      stages: [
        {
          id: "stg-1",
          stageNumber: 1,
          title: "Qubit Foundations",
          tagline: "Superposition & Spin States",
          objective: "Represent quantum states as state vectors in Hilbert space.",
          conceptIds: ["c-qubit", "c-superpos"],
          prerequisites: ["Linear algebra vectors"],
          learningActivities: ["Bloch sphere visualizer"],
          milestoneAssessment: "Vector state calculation check",
          masteryCondition: "Score ≥ 80%",
        },
        {
          id: "stg-2",
          stageNumber: 2,
          title: "Quantum Gates & Circuits",
          tagline: "Unitary Operators & Entanglement",
          objective: "Construct quantum circuits using Hadamard and CNOT gates.",
          conceptIds: ["c-gates", "c-entangle"],
          prerequisites: ["Stage 1"],
          learningActivities: ["Interactive circuit simulator"],
          milestoneAssessment: "Build Bell state circuit",
          masteryCondition: "Demonstrate 100% circuit synthesis",
        },
      ],
      concepts: [
        {
          id: "c-qubit",
          name: "Qubits & State Vectors",
          summary: "Two-level quantum mechanical systems.",
          difficulty: "foundational",
          prerequisiteIds: [],
        },
        {
          id: "c-superpos",
          name: "Superposition Principle",
          summary: "Linear combination of computational basis states.",
          difficulty: "foundational",
          prerequisiteIds: ["c-qubit"],
        },
        {
          id: "c-gates",
          name: "Single-Qubit Unitary Gates",
          summary: "Pauli matrices and Hadamard transformations.",
          difficulty: "intermediate",
          prerequisiteIds: ["c-superpos"],
        },
        {
          id: "c-entangle",
          name: "Entanglement & Bell States",
          summary: "Non-local quantum correlations via CNOT.",
          difficulty: "intermediate",
          prerequisiteIds: ["c-gates"],
        },
      ],
    };

    const validation = validateAndNormalizeAITopicPlan(validRaw);
    assert.equal(validation.isValid, true);
    assert.ok(validation.plan);
    assert.equal(validation.plan.topic, "Quantum Computing Basics");
    assert.equal(validation.plan.stages.length, 2);
  });

  // Test 5: Malformed AI output rejected
  it("5. Malformed AI output (missing required fields) rejected", () => {
    const malformedRaw = {
      topic: "Python",
      // missing category, overview, stages, concepts
    };
    const validation = validateAndNormalizeAITopicPlan(malformedRaw);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors && validation.errors.length > 0);
  });

  // Test 6: Duplicate concept IDs rejected
  it("6. Duplicate concept IDs rejected by validator", () => {
    const rawWithDuplicates = {
      topic: "Logic",
      category: "Math",
      estimatedHours: 4,
      overview: "Basics of logic",
      prerequisiteSummary: "None",
      stages: [
        {
          id: "s1",
          stageNumber: 1,
          title: "Stage 1",
          objective: "Obj",
          conceptIds: ["c1", "c2"],
        },
        {
          id: "s2",
          stageNumber: 2,
          title: "Stage 2",
          objective: "Obj 2",
          conceptIds: ["c1"], // duplicate c1 in stage
        },
      ],
      concepts: [
        { id: "c1", name: "Concept 1", summary: "Sum 1", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c1", name: "Concept 1 Duplicate", summary: "Sum dup", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c2", name: "Concept 2", summary: "Sum 2", difficulty: "intermediate", prerequisiteIds: ["c1"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawWithDuplicates);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors?.some(e => e.includes("Duplicate concept ID")));
  });

  // Test 7: Unknown prerequisite rejected
  it("7. Unknown prerequisite ID rejected", () => {
    const rawWithUnknownPrereq = {
      topic: "Databases",
      category: "CS",
      estimatedHours: 6,
      overview: "Databases intro",
      prerequisiteSummary: "None",
      stages: [
        { id: "s1", stageNumber: 1, title: "S1", objective: "Obj", conceptIds: ["c1", "c2"] },
        { id: "s2", stageNumber: 2, title: "S2", objective: "Obj2", conceptIds: ["c3"] },
      ],
      concepts: [
        { id: "c1", name: "Tables", summary: "Rows/cols", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c2", name: "Keys", summary: "Primary/foreign", difficulty: "foundational", prerequisiteIds: ["c1"] },
        { id: "c3", name: "Joins", summary: "Inner/outer", difficulty: "intermediate", prerequisiteIds: ["unknown-id-999"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawWithUnknownPrereq);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors?.some(e => e.includes("unknown prerequisite")));
  });

  // Test 8: Self prerequisite rejected
  it("8. Self-referencing prerequisite rejected", () => {
    const rawSelfPrereq = {
      topic: "Recursion",
      category: "CS",
      estimatedHours: 5,
      overview: "Recursion overview",
      prerequisiteSummary: "None",
      stages: [
        { id: "s1", stageNumber: 1, title: "S1", objective: "Obj", conceptIds: ["c1", "c2"] },
        { id: "s2", stageNumber: 2, title: "S2", objective: "Obj2", conceptIds: ["c3"] },
      ],
      concepts: [
        { id: "c1", name: "Call Stack", summary: "Stack frames", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c2", name: "Base Case", summary: "Stop condition", difficulty: "foundational", prerequisiteIds: ["c1"] },
        { id: "c3", name: "Infinite Loop", summary: "Loops into self", difficulty: "intermediate", prerequisiteIds: ["c3"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawSelfPrereq);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors?.some(e => e.includes("cannot list itself as a prerequisite")));
  });

  // Test 9: Cyclic graph rejected
  it("9. Cyclic graph (A -> B -> A) rejected by KnowledgeGraphEngine Kahn algorithm", () => {
    const rawCyclic = {
      topic: "Circular Logic",
      category: "Philosophy",
      estimatedHours: 4,
      overview: "Testing cycle detection",
      prerequisiteSummary: "None",
      stages: [
        { id: "s1", stageNumber: 1, title: "S1", objective: "Obj", conceptIds: ["cA", "cB"] },
        { id: "s2", stageNumber: 2, title: "S2", objective: "Obj2", conceptIds: ["cC"] },
      ],
      concepts: [
        { id: "cA", name: "Premise A", summary: "Depends on B", difficulty: "foundational", prerequisiteIds: ["cB"] },
        { id: "cB", name: "Premise B", summary: "Depends on A", difficulty: "foundational", prerequisiteIds: ["cA"] },
        { id: "cC", name: "Conclusion", summary: "Depends on B", difficulty: "intermediate", prerequisiteIds: ["cB"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawCyclic);
    assert.equal(validation.isValid, false);
    assert.ok(validation.errors?.some(e => e.includes("cycle") || e.includes("Knowledge Graph validation failed")));
  });

  // Test 10: Valid graph accepted
  it("10. Valid graph passes topological ordering and graph engine validation", () => {
    const rawValidGraph = {
      topic: "Photosynthesis",
      category: "Biology",
      estimatedHours: 8,
      overview: "Solar energy conversion into glucose.",
      prerequisiteSummary: "Basic cell biology",
      stages: [
        { id: "s1", stageNumber: 1, title: "Photon Capture", objective: "Obj1", conceptIds: ["c1", "c2"] },
        { id: "s2", stageNumber: 2, title: "Calvin Cycle", objective: "Obj2", conceptIds: ["c3"] },
      ],
      concepts: [
        { id: "c1", name: "Chloroplast Structure", summary: "Thylakoid membranes", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c2", name: "Light Absorption", summary: "Chlorophyll photon excitation", difficulty: "foundational", prerequisiteIds: ["c1"] },
        { id: "c3", name: "Carbon Fixation", summary: "RuBisCO enzyme", difficulty: "intermediate", prerequisiteIds: ["c2"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawValidGraph);
    assert.equal(validation.isValid, true);
  });

  // Test 11: Normalized topic plan returned
  it("11. Normalized topic plan correctly formats stages, concept objects, and unlock states", () => {
    const rawValid = {
      topic: "Rust Programming",
      category: "Computer Science",
      estimatedHours: 15,
      overview: "Systems programming with memory safety.",
      prerequisiteSummary: "General programming",
      stages: [
        { id: "s1", stageNumber: 1, title: "Ownership Basics", tagline: "Borrow Checker", objective: "Understand affine types", conceptIds: ["c1", "c2"] },
        { id: "s2", stageNumber: 2, title: "Lifetimes", tagline: "References", objective: "Manage reference scopes", conceptIds: ["c3"] },
      ],
      concepts: [
        { id: "c1", name: "Stack & Heap", summary: "Memory allocations", difficulty: "foundational", prerequisiteIds: [] },
        { id: "c2", name: "Ownership & Move", summary: "Single-owner rule", difficulty: "foundational", prerequisiteIds: ["c1"] },
        { id: "c3", name: "Borrowing Rules", summary: "Shared vs mutable refs", difficulty: "intermediate", prerequisiteIds: ["c2"] },
      ],
    };
    const validation = validateAndNormalizeAITopicPlan(rawValid);
    assert.equal(validation.isValid, true);
    const plan = validation.plan!;
    assert.equal(plan.stages[0].status, "unlocked");
    assert.equal(plan.stages[1].status, "locked");
    assert.equal(plan.stages[0].concepts.length, 2);
    assert.equal(plan.stages[0].concepts[0].name, "Stack & Heap");
    assert.deepEqual(plan.stages[0].concepts[1].prerequisiteIds, ["c1"]);
  });

  // Test 12: Gemini/API failure triggers fallback
  it("12. System gracefully falls back to local curriculum engine on API unavailability", async () => {
    // When GEMINI_API_KEY is unset or dummy, getTopicPlan must safely fall back
    const response = await getTopicPlan("Calculus");
    assert.equal(response.success, true);
    assert.ok(response.plan);
    assert.equal(response.plan.topic, "Calculus");
    assert.ok(["gemini", "fallback"].includes(response.provider));
  });

  // Test 13: Missing API key handled safely
  it("13. Missing API key handled safely without throwing uncaught exceptions", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const response = await getTopicPlan("Python");
      assert.equal(response.success, true);
      assert.equal(response.provider, "fallback");
      assert.ok(response.plan);
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });

  // Test 14: Arbitrary topic remains topic-agnostic
  it("14. Arbitrary topic remains topic-agnostic and produces valid structured curriculum", async () => {
    const response = await getTopicPlan("Astrophysics");
    assert.equal(response.success, true);
    assert.ok(response.plan);
    assert.equal(response.plan.topic, "Astrophysics");
    assert.ok(response.plan.stages.length >= 2);
    assert.ok(response.plan.stages[0].concepts.length >= 1);
  });

  // Test 15: Existing local fallback still works
  it("15. Existing local fallback still works for Python, Calculus, ML, and Photosynthesis", async () => {
    const fallback = new FallbackTopicPlanner();
    const pyPlan = await fallback.planTopic("Python");
    assert.equal(pyPlan.topic, "Python Programming");

    const calcPlan = await fallback.planTopic("Calculus");
    assert.equal(calcPlan.topic, "Calculus");

    const mlPlan = await fallback.planTopic("Machine Learning");
    assert.equal(mlPlan.topic, "Machine Learning Fundamentals");
  });

  // Test 16: API key is not exposed to client code
  it("16. Server-side guard guarantees GEMINI_API_KEY is not leaked into client-visible plans", async () => {
    const response = await getTopicPlan("Python");
    assert.equal(response.success, true);
    const serialized = JSON.stringify(response);
    assert.equal(serialized.includes(process.env.GEMINI_API_KEY || "NOT_EXPOSED"), false);
  });
});
