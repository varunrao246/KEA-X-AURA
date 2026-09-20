import test from "node:test";
import assert from "node:assert/strict";
import { KnowledgeGraphEngine } from "../engine";
import { CLASS_4_FRACTIONS_NODES, class4FractionsGraph } from "../seed-data";
import { ConceptNode } from "../types";

test("Knowledge Graph Engine Test Suite", async (t) => {

  await t.test("1. Valid canonical graph passes validation and initializes without error", () => {
    assert.equal(class4FractionsGraph.getNodeCount(), 7);
    const validation = KnowledgeGraphEngine.validateNodes(CLASS_4_FRACTIONS_NODES);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
    assert.equal(validation.topologicalOrder.length, 7);
  });

  await t.test("2. Topological ordering succeeds and satisfies all prerequisite dependencies", () => {
    const topo = class4FractionsGraph.getTopologicalOrder();
    assert.equal(topo.length, 7);

    // Verify root is first
    assert.equal(topo[0], "NODE_01_PARTS");

    // Helper to check index of node in topological order
    const indexOf = (id: string) => topo.indexOf(id);

    // Check all edge relationships
    assert.ok(indexOf("NODE_01_PARTS") < indexOf("NODE_02_NUM_DENOM"));
    assert.ok(indexOf("NODE_02_NUM_DENOM") < indexOf("NODE_03_COMPARE_LIKE"));
    assert.ok(indexOf("NODE_02_NUM_DENOM") < indexOf("NODE_04_EQUIVALENT"));
    assert.ok(indexOf("NODE_03_COMPARE_LIKE") < indexOf("NODE_05_COMPARE_UNLIKE"));
    assert.ok(indexOf("NODE_04_EQUIVALENT") < indexOf("NODE_05_COMPARE_UNLIKE"));
    assert.ok(indexOf("NODE_03_COMPARE_LIKE") < indexOf("NODE_06_ADD_LIKE"));
    assert.ok(indexOf("NODE_05_COMPARE_UNLIKE") < indexOf("NODE_07_WORD_PROBLEMS"));
    assert.ok(indexOf("NODE_06_ADD_LIKE") < indexOf("NODE_07_WORD_PROBLEMS"));
  });

  await t.test("3. Cyclic graph is detected and rejected", () => {
    const cyclicNodes: ConceptNode[] = [
      {
        id: "A",
        code: "A",
        title: "Node A",
        description: "",
        difficulty: "foundational",
        orderIndex: 1,
        prerequisites: ["C"], // cycle: A -> B -> C -> A
        learningObjectives: [],
        estimatedMinutes: 5,
        visualModel: "circle",
      },
      {
        id: "B",
        code: "B",
        title: "Node B",
        description: "",
        difficulty: "foundational",
        orderIndex: 2,
        prerequisites: ["A"],
        learningObjectives: [],
        estimatedMinutes: 5,
        visualModel: "circle",
      },
      {
        id: "C",
        code: "C",
        title: "Node C",
        description: "",
        difficulty: "foundational",
        orderIndex: 3,
        prerequisites: ["B"],
        learningObjectives: [],
        estimatedMinutes: 5,
        visualModel: "circle",
      },
    ];

    const result = KnowledgeGraphEngine.validateNodes(cyclicNodes);
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /Cycle detected/);

    assert.throws(() => {
      new KnowledgeGraphEngine(cyclicNodes);
    }, /Cycle detected/);
  });

  await t.test("4. Root concepts with zero prerequisites unlock initially with empty mastery set", () => {
    const emptyMastery = new Set<string>();
    const unlocked = class4FractionsGraph.getUnlockedNodes(emptyMastery);

    assert.equal(unlocked.length, 1);
    assert.equal(unlocked[0].id, "NODE_01_PARTS");

    assert.equal(class4FractionsGraph.isUnlocked("NODE_01_PARTS", emptyMastery), true);
    assert.equal(class4FractionsGraph.isUnlocked("NODE_02_NUM_DENOM", emptyMastery), false);
  });

  await t.test("5. A concept with unmet prerequisites remains locked", () => {
    const emptyMastery = new Set<string>();
    const state = class4FractionsGraph.getNodeUnlockState("NODE_02_NUM_DENOM", emptyMastery);

    assert.equal(state.isUnlocked, false);
    assert.deepEqual(state.unmetPrerequisites, ["NODE_01_PARTS"]);
    assert.deepEqual(state.metPrerequisites, []);
  });

  await t.test("6. A concept becomes unlocked when all required prerequisites are satisfied", () => {
    const masterySet = new Set<string>(["NODE_01_PARTS"]);
    assert.equal(class4FractionsGraph.isUnlocked("NODE_02_NUM_DENOM", masterySet), true);

    const unlocked = class4FractionsGraph.getUnlockedNodes(masterySet);
    const unlockedIds = unlocked.map(n => n.id);
    assert.ok(unlockedIds.includes("NODE_01_PARTS"));
    assert.ok(unlockedIds.includes("NODE_02_NUM_DENOM"));
  });

  await t.test("7. Multiple prerequisite paths (diamond dependencies) evaluate correctly", () => {
    // NODE_05_COMPARE_UNLIKE requires BOTH NODE_03_COMPARE_LIKE and NODE_04_EQUIVALENT
    const baseMastery = ["NODE_01_PARTS", "NODE_02_NUM_DENOM"];

    // Case A: Only NODE_03 mastered
    const masteryWith03 = new Set<string>([...baseMastery, "NODE_03_COMPARE_LIKE"]);
    assert.equal(class4FractionsGraph.isUnlocked("NODE_05_COMPARE_UNLIKE", masteryWith03), false);
    const stateA = class4FractionsGraph.getNodeUnlockState("NODE_05_COMPARE_UNLIKE", masteryWith03);
    assert.deepEqual(stateA.unmetPrerequisites, ["NODE_04_EQUIVALENT"]);
    assert.deepEqual(stateA.metPrerequisites, ["NODE_03_COMPARE_LIKE"]);

    // Case B: Only NODE_04 mastered
    const masteryWith04 = new Set<string>([...baseMastery, "NODE_04_EQUIVALENT"]);
    assert.equal(class4FractionsGraph.isUnlocked("NODE_05_COMPARE_UNLIKE", masteryWith04), false);
    const stateB = class4FractionsGraph.getNodeUnlockState("NODE_05_COMPARE_UNLIKE", masteryWith04);
    assert.deepEqual(stateB.unmetPrerequisites, ["NODE_03_COMPARE_LIKE"]);
    assert.deepEqual(stateB.metPrerequisites, ["NODE_04_EQUIVALENT"]);

    // Case C: Both NODE_03 and NODE_04 mastered
    const masteryBoth = new Set<string>([...baseMastery, "NODE_03_COMPARE_LIKE", "NODE_04_EQUIVALENT"]);
    assert.equal(class4FractionsGraph.isUnlocked("NODE_05_COMPARE_UNLIKE", masteryBoth), true);
    const stateC = class4FractionsGraph.getNodeUnlockState("NODE_05_COMPARE_UNLIKE", masteryBoth);
    assert.deepEqual(stateC.unmetPrerequisites, []);
    assert.equal(stateC.metPrerequisites.length, 2);
  });

  await t.test("8. Unknown prerequisite IDs are rejected during validation", () => {
    const invalidNodes: ConceptNode[] = [
      {
        id: "NODE_01",
        code: "N-1",
        title: "Node 1",
        description: "",
        difficulty: "foundational",
        orderIndex: 1,
        prerequisites: ["NON_EXISTENT_ID"],
        learningObjectives: [],
        estimatedMinutes: 10,
        visualModel: "circle",
      },
    ];

    const result = KnowledgeGraphEngine.validateNodes(invalidNodes);
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /references unknown prerequisite ID/);

    assert.throws(() => {
      new KnowledgeGraphEngine(invalidNodes);
    }, /references unknown prerequisite ID/);
  });

  await t.test("9. Duplicate concept IDs are rejected during validation", () => {
    const duplicateNodes: ConceptNode[] = [
      {
        id: "DUP_ID",
        code: "D-1",
        title: "First",
        description: "",
        difficulty: "foundational",
        orderIndex: 1,
        prerequisites: [],
        learningObjectives: [],
        estimatedMinutes: 10,
        visualModel: "circle",
      },
      {
        id: "DUP_ID",
        code: "D-2",
        title: "Second",
        description: "",
        difficulty: "foundational",
        orderIndex: 2,
        prerequisites: [],
        learningObjectives: [],
        estimatedMinutes: 10,
        visualModel: "circle",
      },
    ];

    const result = KnowledgeGraphEngine.validateNodes(duplicateNodes);
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /Duplicate concept node ID/);

    assert.throws(() => {
      new KnowledgeGraphEngine(duplicateNodes);
    }, /Duplicate concept node ID/);
  });

  await t.test("10. Graph traversal returns expected direct and transitive relationships", () => {
    // Direct prerequisites
    const directPrereqs05 = class4FractionsGraph.getDirectPrerequisites("NODE_05_COMPARE_UNLIKE");
    assert.equal(directPrereqs05.length, 2);
    const directPrereqIds = directPrereqs05.map(n => n.id);
    assert.ok(directPrereqIds.includes("NODE_03_COMPARE_LIKE"));
    assert.ok(directPrereqIds.includes("NODE_04_EQUIVALENT"));

    // Direct dependents
    const directDeps02 = class4FractionsGraph.getDirectDependents("NODE_02_NUM_DENOM");
    assert.equal(directDeps02.length, 2);
    const directDepIds = directDeps02.map(n => n.id);
    assert.ok(directDepIds.includes("NODE_03_COMPARE_LIKE"));
    assert.ok(directDepIds.includes("NODE_04_EQUIVALENT"));

    // Transitive ancestors of final node (NODE_07)
    const ancestors07 = class4FractionsGraph.getAncestorPrerequisites("NODE_07_WORD_PROBLEMS");
    assert.equal(ancestors07.length, 6); // All other 6 nodes are ancestors of NODE_07!
    const ancestorIds07 = ancestors07.map(n => n.id);
    assert.ok(ancestorIds07.includes("NODE_01_PARTS"));
    assert.ok(ancestorIds07.includes("NODE_02_NUM_DENOM"));
    assert.ok(ancestorIds07.includes("NODE_03_COMPARE_LIKE"));
    assert.ok(ancestorIds07.includes("NODE_04_EQUIVALENT"));
    assert.ok(ancestorIds07.includes("NODE_05_COMPARE_UNLIKE"));
    assert.ok(ancestorIds07.includes("NODE_06_ADD_LIKE"));

    // Transitive descendants of root node (NODE_01)
    const descendants01 = class4FractionsGraph.getDescendantDependents("NODE_01_PARTS");
    assert.equal(descendants01.length, 6); // All other 6 nodes descend from root!
  });

  await t.test("11. Available next nodes recommendations exclude already mastered or in-progress nodes", () => {
    // When student has mastered NODE_01
    const mastered = new Set<string>(["NODE_01_PARTS"]);
    const available = class4FractionsGraph.getAvailableNextNodes(mastered);
    assert.equal(available.length, 1);
    assert.equal(available[0].id, "NODE_02_NUM_DENOM");

    // When NODE_02 is already in progress, nothing new is available
    const inProgress = new Set<string>(["NODE_02_NUM_DENOM"]);
    const availableWithInProgress = class4FractionsGraph.getAvailableNextNodes(mastered, inProgress);
    assert.equal(availableWithInProgress.length, 0);

    // When NODE_02 is also mastered, both NODE_03 and NODE_04 become available
    mastered.add("NODE_02_NUM_DENOM");
    const availableBranching = class4FractionsGraph.getAvailableNextNodes(mastered);
    assert.equal(availableBranching.length, 2);
    const branchingIds = availableBranching.map(n => n.id);
    assert.ok(branchingIds.includes("NODE_03_COMPARE_LIKE"));
    assert.ok(branchingIds.includes("NODE_04_EQUIVALENT"));
  });

  await t.test("12. Remediation target locates the weakest prerequisite ancestor", () => {
    // Student struggling on NODE_05_COMPARE_UNLIKE
    // Ancestors: NODE_01, NODE_02, NODE_03, NODE_04
    const masteryScores: Record<string, number> = {
      "NODE_01_PARTS": 0.95,
      "NODE_02_NUM_DENOM": 0.88,
      "NODE_03_COMPARE_LIKE": 0.82,
      "NODE_04_EQUIVALENT": 0.42, // Weakest ancestor
      "NODE_05_COMPARE_UNLIKE": 0.35, // Current node
    };

    const target = class4FractionsGraph.getRemediationTarget("NODE_05_COMPARE_UNLIKE", masteryScores);
    assert.ok(target !== undefined);
    assert.equal(target?.id, "NODE_04_EQUIVALENT");
  });

  await t.test("13. Self-referencing prerequisite is caught and rejected", () => {
    const selfRefNode: ConceptNode[] = [
      {
        id: "SELF_REF",
        code: "S-1",
        title: "Self Referencer",
        description: "",
        difficulty: "foundational",
        orderIndex: 1,
        prerequisites: ["SELF_REF"],
        learningObjectives: [],
        estimatedMinutes: 5,
        visualModel: "circle",
      },
    ];

    const result = KnowledgeGraphEngine.validateNodes(selfRefNode);
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /cannot list itself as a prerequisite/);
  });
});
