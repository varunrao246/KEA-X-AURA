/**
 * KEA Diagnostic & Prerequisite Assessment Calibration Engine (P0-03B)
 * 
 * Bridges the Topic Plan's diagnostic questions with the deterministic
 * MasteryEngine (W-EMM) and KnowledgeGraphEngine (DAG traversal).
 * 
 * Flow:
 * Student diagnostic answers
 *         ↓
 * Question Evaluation (checks correctness & tested concept)
 *         ↓
 * Mastery Calibration (applies assessment evidence to MasteryEngine)
 *         ↓
 * Knowledge Graph Update (determines downstream concept unlock states)
 *         ↓
 * Calibrated Learning Stages & Recommended Starting Point
 */

import { KnowledgeGraphEngine } from "@/lib/knowledge-graph/engine";
import { ConceptNode } from "@/lib/knowledge-graph/types";
import { MasteryEngine } from "@/lib/mastery/engine";
import { NodeMasteryStatus } from "@/types";
import { LearningStage, LearningStageConcept, TopicCurriculumPlan } from "@/types/topic-path";
import { DiagnosticAnswerSubmission, DiagnosticCalibrationResult, QuestionEvaluationResult } from "./types";

/**
 * Maps a diagnostic question's conceptTested label to a specific concept ID in the plan.
 */
export function resolveTargetConceptId(
  conceptTested: string,
  allConcepts: LearningStageConcept[]
): string {
  if (allConcepts.length === 0) return "unknown";

  const lowerTested = conceptTested.toLowerCase().trim();

  // 1. Direct ID match
  const directId = allConcepts.find(c => c.id.toLowerCase() === lowerTested);
  if (directId) return directId.id;

  // 2. Direct name match
  const directName = allConcepts.find(c => c.name.toLowerCase() === lowerTested);
  if (directName) return directName.id;

  // 3. Substring match on name
  const substringName = allConcepts.find(c =>
    c.name.toLowerCase().includes(lowerTested) || lowerTested.includes(c.name.toLowerCase())
  );
  if (substringName) return substringName.id;

  // 4. Fallback to first foundational concept in stage 1
  return allConcepts[0].id;
}

/**
 * Builds canonical ConceptNode list from a TopicCurriculumPlan for KnowledgeGraphEngine.
 */
export function buildConceptNodesFromPlan(plan: TopicCurriculumPlan): ConceptNode[] {
  const nodes: ConceptNode[] = [];
  let orderIndex = 1;

  for (let sIdx = 0; sIdx < plan.stages.length; sIdx++) {
    const stage = plan.stages[sIdx];
    const prevStage = sIdx > 0 ? plan.stages[sIdx - 1] : undefined;

    for (const concept of stage.concepts) {
      let prerequisites: string[] = [];

      if (concept.prerequisiteIds && concept.prerequisiteIds.length > 0) {
        prerequisites = [...concept.prerequisiteIds];
      } else if (sIdx > 0 && prevStage && prevStage.concepts.length > 0) {
        // Link to first concept of previous stage if no explicit prerequisites
        prerequisites = [prevStage.concepts[0].id];
      }

      nodes.push({
        id: concept.id,
        code: `C-${orderIndex}`,
        title: concept.name,
        description: concept.summary,
        difficulty: concept.difficulty,
        orderIndex,
        prerequisites,
        learningObjectives: [concept.summary],
        estimatedMinutes: 15,
        visualModel: "standard",
      });

      orderIndex++;
    }
  }

  return nodes;
}

/**
 * Evaluates student diagnostic submissions and calibrates starting mastery & unlock states.
 */
export function calibrateDiagnostic(
  plan: TopicCurriculumPlan,
  submissions: DiagnosticAnswerSubmission[]
): DiagnosticCalibrationResult {
  const allConcepts: LearningStageConcept[] = [];
  for (const stage of plan.stages) {
    allConcepts.push(...stage.concepts);
  }

  // Build Knowledge Graph
  const conceptNodes = buildConceptNodesFromPlan(plan);
  const graphEngine = new KnowledgeGraphEngine(conceptNodes);
  const masteryEngine = new MasteryEngine();

  // Evaluate each question
  const submissionMap = new Map(submissions.map(s => [s.questionId, s.selectedOptionId]));

  const questionResults: QuestionEvaluationResult[] = [];
  let correctCount = 0;

  for (const question of plan.diagnosticQuestions) {
    const selectedOptionId = submissionMap.get(question.id) ?? "";
    const correctOption = question.options.find(o => o.isCorrect);
    const correctOptionId = correctOption?.id ?? "";
    const isCorrect = selectedOptionId === correctOptionId;

    if (isCorrect) {
      correctCount++;
    }

    const targetConceptId = resolveTargetConceptId(question.conceptTested, allConcepts);

    questionResults.push({
      questionId: question.id,
      questionText: question.question,
      conceptTested: question.conceptTested,
      targetConceptId,
      selectedOptionId,
      isCorrect,
      correctOptionId,
      explanation: question.explanation,
    });

    // Ingest evidence into MasteryEngine
    if (selectedOptionId) {
      if (isCorrect) {
        // Master the concept through verified diagnostic demonstration (score = 100 on written check)
        for (let i = 0; i < 4; i++) {
          masteryEngine.recordEvidence({
            conceptId: targetConceptId,
            assessmentType: "written",
            score: 100,
          });
        }
      } else {
        // Record formative attempt (score = 40)
        masteryEngine.recordEvidence({
          conceptId: targetConceptId,
          assessmentType: "practice",
          score: 40,
        });
      }
    }
  }

  const totalQuestions = plan.diagnosticQuestions.length;
  const accuracyPercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Retrieve calibrated state from MasteryEngine and KnowledgeGraphEngine
  const masteredConceptIdsSet = masteryEngine.getMasteredConceptIds();
  const masteredConceptIds = Array.from(masteredConceptIdsSet);
  const masteryScores = masteryEngine.getMasteryScores();

  const conceptStatuses: Record<string, NodeMasteryStatus> = {};
  const unlockedConceptIds: string[] = [];

  for (const node of conceptNodes) {
    const isMastered = masteredConceptIdsSet.has(node.id);
    const isUnlocked = graphEngine.isUnlocked(node.id, masteredConceptIdsSet);

    if (isMastered) {
      conceptStatuses[node.id] = "mastered";
      unlockedConceptIds.push(node.id);
    } else if (isUnlocked) {
      const state = masteryEngine.getConceptState(node.id);
      conceptStatuses[node.id] = state.attemptCount > 0 ? "in_progress" : "unlocked";
      unlockedConceptIds.push(node.id);
    } else {
      conceptStatuses[node.id] = "locked";
    }
  }

  // Determine recommended starting node:
  // First unlocked, unmastered node in topological order
  const topoOrder = graphEngine.getTopologicalOrder();
  let recommendedStartingNodeId = topoOrder[0] ?? allConcepts[0]?.id ?? "";
  let recommendedStartingNodeTitle = "";

  for (const nodeId of topoOrder) {
    if (!masteredConceptIdsSet.has(nodeId) && graphEngine.isUnlocked(nodeId, masteredConceptIdsSet)) {
      recommendedStartingNodeId = nodeId;
      break;
    }
  }

  const startingConcept = allConcepts.find(c => c.id === recommendedStartingNodeId);
  recommendedStartingNodeTitle = startingConcept ? startingConcept.name : "First Available Concept";

  // Calibrate stage objects with updated statuses
  const calibratedStages: LearningStage[] = plan.stages.map(stage => {
    const updatedConcepts: LearningStageConcept[] = stage.concepts.map(concept => ({
      ...concept,
      status: (conceptStatuses[concept.id] as "locked" | "unlocked" | "in_progress" | "mastered") ?? "unlocked",
    }));

    const allConceptsMastered = updatedConcepts.every(c => c.status === "mastered");
    const anyConceptActive = updatedConcepts.some(c => c.status === "in_progress" || c.status === "unlocked");

    let stageStatus: "locked" | "unlocked" | "in_progress" | "mastered" = "locked";
    if (allConceptsMastered) {
      stageStatus = "mastered";
    } else if (anyConceptActive) {
      stageStatus = updatedConcepts.some(c => c.status === "in_progress") ? "in_progress" : "unlocked";
    }

    return {
      ...stage,
      concepts: updatedConcepts,
      status: stageStatus,
    };
  });

  return {
    topic: plan.topic,
    totalQuestions,
    correctCount,
    accuracyPercentage,
    questionResults,
    masteredConceptIds,
    unlockedConceptIds,
    conceptMasteryScores: masteryScores,
    conceptStatuses,
    recommendedStartingNodeId,
    recommendedStartingNodeTitle,
    calibratedStages,
  };
}
