import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { InterventionDispatcher } from "../dispatcher";
import { KnowledgeGraphEngine } from "@/lib/knowledge-graph/engine";
import { ConceptNode } from "@/lib/knowledge-graph/types";

describe("KEA Struggle Detection & Intervention Dispatcher Test Suite (P0-06 & P0-07)", () => {
  let dispatcher: InterventionDispatcher;

  beforeEach(() => {
    dispatcher = InterventionDispatcher.getInstance();
    dispatcher.clear();
  });

  const nodes: ConceptNode[] = [
    {
      id: "NODE_01",
      code: "N1",
      title: "Equal Parts",
      description: "Root",
      difficulty: "foundational",
      orderIndex: 1,
      prerequisites: [],
      learningObjectives: ["N1"],
      estimatedMinutes: 10,
      visualModel: "circle-pie",
    },
    {
      id: "NODE_02",
      code: "N2",
      title: "Numerator & Denominator",
      description: "Prerequisite to N3",
      difficulty: "foundational",
      orderIndex: 2,
      prerequisites: ["NODE_01"],
      learningObjectives: ["N2"],
      estimatedMinutes: 15,
      visualModel: "fraction-strip",
    },
    {
      id: "NODE_03",
      code: "N3",
      title: "Comparing Like Denominators",
      description: "Target concept",
      difficulty: "intermediate",
      orderIndex: 3,
      prerequisites: ["NODE_02"],
      learningObjectives: ["N3"],
      estimatedMinutes: 20,
      visualModel: "fraction-strip",
    },
  ];

  const graph = new KnowledgeGraphEngine(nodes);

  it("1. Single failure does not trigger struggle intervention", () => {
    const result = dispatcher.evaluateStruggle({
      studentId: "s101",
      studentName: "Aarav Sharma",
      conceptId: "NODE_03",
      conceptTitle: "Comparing Like Denominators",
      consecutiveFailures: 1,
      currentMastery: 45,
      totalAttempts: 1,
      graphEngine: graph,
    });

    assert.equal(result.struggleDetected, false);
    assert.equal(dispatcher.getInterventions().length, 0);
  });

  it("2. Two consecutive failures trigger high-priority intervention with prescriptive brief", () => {
    const result = dispatcher.evaluateStruggle({
      studentId: "s101",
      studentName: "Aarav Sharma",
      conceptId: "NODE_03",
      conceptTitle: "Comparing Like Denominators",
      consecutiveFailures: 2,
      currentMastery: 38,
      totalAttempts: 2,
      graphEngine: graph,
      masteryScores: { NODE_01: 90, NODE_02: 40, NODE_03: 38 },
    });

    assert.equal(result.struggleDetected, true);
    assert.equal(result.ruleMatched, "consecutive_failures");
    assert.ok(result.intervention);
    assert.equal(result.intervention?.studentName, "Aarav Sharma");
    assert.equal(result.intervention?.severity, "high");
    assert.ok(result.intervention?.diagnosedMisconception.includes("Whole-Number Denominator Bias"));
    assert.ok(result.intervention?.prescriptiveAction.physicalTool.includes("fraction comparison strips"));

    // Reroute target must point to weakest ancestor (NODE_02)
    assert.equal(result.remediationTargetNodeId, "NODE_02");
    assert.equal(result.remediationTargetTitle, "Numerator & Denominator");

    // Must be in pending queue
    assert.equal(dispatcher.getPendingInterventions().length, 1);
  });

  it("3. Chronic low mastery (>= 4 attempts with < 55%) triggers struggle even without 2 in a row", () => {
    const result = dispatcher.evaluateStruggle({
      studentId: "s102",
      studentName: "Diya Patel",
      conceptId: "NODE_02",
      conceptTitle: "Numerator & Denominator",
      consecutiveFailures: 1,
      currentMastery: 50,
      totalAttempts: 4,
      graphEngine: graph,
    });

    assert.equal(result.struggleDetected, true);
    assert.equal(result.ruleMatched, "chronic_low_mastery");
    assert.equal(dispatcher.getInterventions().length, 1);
  });

  it("4. Facilitator workflow: acknowledge and resolve intervention", () => {
    const result = dispatcher.evaluateStruggle({
      studentId: "s101",
      studentName: "Aarav Sharma",
      conceptId: "NODE_03",
      conceptTitle: "Comparing Like Denominators",
      consecutiveFailures: 2,
      currentMastery: 35,
      totalAttempts: 2,
      graphEngine: graph,
    });

    const interventionId = result.intervention!.id;

    // 1. Acknowledge
    const acked = dispatcher.acknowledgeIntervention(interventionId);
    assert.equal(acked?.status, "acknowledged");

    // 2. Resolve
    const resolved = dispatcher.resolveIntervention({
      id: interventionId,
      facilitatorId: "Ms. Priya",
      resolutionType: "manipulatives_used",
      notes: "Worked with Aarav using wooden fraction strips 1/4 and 1/8. He grasped that 1/4 = 2/8.",
    });

    assert.equal(resolved?.status, "resolved");
    assert.equal(resolved?.resolvedBy, "Ms. Priya");
    assert.equal(resolved?.resolutionType, "manipulatives_used");
    assert.ok(resolved?.resolvedAt);

    // Pending count should now be 0
    assert.equal(dispatcher.getPendingInterventions().length, 0);
  });
});
