/**
 * Strict Schema and Knowledge Graph Validation for Topic Plans
 * 
 * Verifies that AI-generated curricula are syntactically sound,
 * referentially intact, and topologically valid DAGs with zero cycles.
 */

import { TopicCurriculumPlan, LearningStage, LearningStageConcept } from "@/types/topic-path";
import { RawAITopicPlan, RawAIConcept, RawAIStage } from "@/lib/ai/types";
import { KnowledgeGraphEngine } from "@/lib/knowledge-graph/engine";
import { ConceptNode, NodeDifficulty } from "@/lib/knowledge-graph/types";

export interface InputValidationResult {
  isValid: boolean;
  sanitizedTopic: string;
  error?: string;
}

export interface PlanValidationResult {
  isValid: boolean;
  plan?: TopicCurriculumPlan;
  errors?: string[];
}

/**
 * Validates and sanitizes user input topic
 */
export function validateTopicInput(rawTopic: unknown): InputValidationResult {
  if (typeof rawTopic !== "string") {
    return { isValid: false, sanitizedTopic: "", error: "Topic must be a string." };
  }

  const trimmed = rawTopic.trim();
  if (trimmed.length === 0) {
    return { isValid: false, sanitizedTopic: "", error: "Topic cannot be empty or whitespace only." };
  }

  if (trimmed.length < 2) {
    return { isValid: false, sanitizedTopic: "", error: "Topic must be at least 2 characters." };
  }

  if (trimmed.length > 100) {
    return { isValid: false, sanitizedTopic: "", error: "Topic must be 100 characters or fewer." };
  }

  return { isValid: true, sanitizedTopic: trimmed };
}

/**
 * Validates raw JSON object from AI against structural requirements
 * and verifies that the concept dependency tree forms a valid DAG using KnowledgeGraphEngine.
 */
export function validateAndNormalizeAITopicPlan(raw: unknown): PlanValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { isValid: false, errors: ["AI output is not a valid JSON object."] };
  }

  const data = raw as Partial<RawAITopicPlan>;

  // 1. Basic String Fields
  if (!data.topic || typeof data.topic !== "string" || data.topic.trim().length === 0) {
    errors.push("Missing or invalid 'topic' field.");
  }
  if (!data.category || typeof data.category !== "string" || data.category.trim().length === 0) {
    errors.push("Missing or invalid 'category' field.");
  }
  if (!data.overview || typeof data.overview !== "string" || data.overview.trim().length === 0) {
    errors.push("Missing or invalid 'overview' field.");
  }
  if (!data.prerequisiteSummary || typeof data.prerequisiteSummary !== "string") {
    errors.push("Missing or invalid 'prerequisiteSummary' field.");
  }

  const estimatedHours = Number(data.estimatedHours);
  if (isNaN(estimatedHours) || estimatedHours <= 0 || estimatedHours > 100) {
    errors.push("'estimatedHours' must be a positive number between 1 and 100.");
  }

  // 2. Validate Stages Array Bounds
  if (!Array.isArray(data.stages) || data.stages.length < 2 || data.stages.length > 6) {
    errors.push("Stages must be an array with 2 to 6 stages.");
  }

  // 3. Validate Concepts Array Bounds
  if (!Array.isArray(data.concepts) || data.concepts.length < 3 || data.concepts.length > 16) {
    errors.push("Concepts must be an array with 3 to 16 concepts.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const rawStages = data.stages as RawAIStage[];
  const rawConcepts = data.concepts as RawAIConcept[];

  // 4. Validate Concept Definitions & Uniqueness
  const conceptMap = new Map<string, RawAIConcept>();
  for (let i = 0; i < rawConcepts.length; i++) {
    const c = rawConcepts[i];
    if (!c.id || typeof c.id !== "string" || c.id.trim().length === 0) {
      errors.push(`Concept at index ${i} has invalid or missing 'id'.`);
      continue;
    }
    const cleanId = c.id.trim();
    if (conceptMap.has(cleanId)) {
      errors.push(`Duplicate concept ID detected: "${cleanId}".`);
    }
    if (!c.name || typeof c.name !== "string" || c.name.trim().length === 0) {
      errors.push(`Concept "${cleanId}" has missing or empty 'name'.`);
    }
    if (!c.summary || typeof c.summary !== "string" || c.summary.trim().length === 0) {
      errors.push(`Concept "${cleanId}" has missing or empty 'summary'.`);
    }
    if (!["foundational", "intermediate", "advanced"].includes(c.difficulty)) {
      errors.push(`Concept "${cleanId}" has invalid difficulty: "${c.difficulty}".`);
    }
    if (!Array.isArray(c.prerequisiteIds)) {
      errors.push(`Concept "${cleanId}" must have prerequisiteIds array.`);
    }

    conceptMap.set(cleanId, {
      ...c,
      id: cleanId,
      prerequisiteIds: Array.isArray(c.prerequisiteIds) ? c.prerequisiteIds.map(p => String(p).trim()) : [],
    });
  }

  // 5. Validate Stage Definitions & Uniqueness
  const stageIds = new Set<string>();
  const assignedConceptIds = new Set<string>();

  for (let i = 0; i < rawStages.length; i++) {
    const s = rawStages[i];
    if (!s.id || typeof s.id !== "string" || s.id.trim().length === 0) {
      errors.push(`Stage at index ${i} has invalid or missing 'id'.`);
      continue;
    }
    const cleanStageId = s.id.trim();
    if (stageIds.has(cleanStageId)) {
      errors.push(`Duplicate stage ID detected: "${cleanStageId}".`);
    }
    stageIds.add(cleanStageId);

    if (!s.title || typeof s.title !== "string" || s.title.trim().length === 0) {
      errors.push(`Stage "${cleanStageId}" has missing or empty 'title'.`);
    }
    if (!s.objective || typeof s.objective !== "string" || s.objective.trim().length === 0) {
      errors.push(`Stage "${cleanStageId}" has missing or empty 'objective'.`);
    }
    if (!Array.isArray(s.conceptIds) || s.conceptIds.length === 0) {
      errors.push(`Stage "${cleanStageId}" must have at least one concept in conceptIds.`);
    } else {
      for (const cid of s.conceptIds) {
        const cleanCid = String(cid).trim();
        if (!conceptMap.has(cleanCid)) {
          errors.push(`Stage "${cleanStageId}" references unknown conceptId: "${cleanCid}".`);
        } else {
          assignedConceptIds.add(cleanCid);
        }
      }
    }
  }

  // Check for orphan concepts not in any stage
  for (const cid of conceptMap.keys()) {
    if (!assignedConceptIds.has(cid)) {
      errors.push(`Concept "${cid}" is not assigned to any stage.`);
    }
  }

  // 6. Validate Concept Prerequisites Referential Integrity
  for (const c of conceptMap.values()) {
    for (const prereqId of c.prerequisiteIds) {
      if (prereqId === c.id) {
        errors.push(`Concept "${c.id}" cannot list itself as a prerequisite.`);
      }
      if (!conceptMap.has(prereqId)) {
        errors.push(`Concept "${c.id}" references unknown prerequisite "${prereqId}".`);
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // 7. Validate Graph with Kahn's Algorithm via KnowledgeGraphEngine
  const graphNodes: ConceptNode[] = Array.from(conceptMap.values()).map((c, idx) => ({
    id: c.id,
    code: `NODE_${c.id}`,
    title: c.name,
    description: c.summary,
    difficulty: c.difficulty as NodeDifficulty,
    orderIndex: idx + 1,
    prerequisites: c.prerequisiteIds,
    learningObjectives: [c.summary],
    estimatedMinutes: 20,
    visualModel: "interactive_sandbox",
  }));

  const graphValidation = KnowledgeGraphEngine.validateNodes(graphNodes);
  if (!graphValidation.valid) {
    return {
      isValid: false,
      errors: [`Knowledge Graph validation failed: ${graphValidation.errors.join("; ")}`],
    };
  }

  // 8. Normalization into TopicCurriculumPlan
  const normalizedStages: LearningStage[] = rawStages.map((s, index) => {
    const stageConcepts: LearningStageConcept[] = (s.conceptIds || [])
      .map(cid => conceptMap.get(String(cid).trim()))
      .filter((c): c is RawAIConcept => Boolean(c))
      .map(c => ({
        id: c.id,
        name: c.name,
        summary: c.summary,
        difficulty: c.difficulty,
        status: index === 0 ? "unlocked" : "locked",
        prerequisiteIds: c.prerequisiteIds,
      }));

    return {
      id: s.id.trim(),
      stageNumber: index + 1,
      title: s.title.trim(),
      tagline: s.tagline?.trim() || `Core Milestone ${index + 1}`,
      objective: s.objective.trim(),
      concepts: stageConcepts,
      prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : index === 0 ? [] : [`Stage ${index}`],
      learningActivities: Array.isArray(s.learningActivities) && s.learningActivities.length > 0
        ? s.learningActivities
        : ["Interactive conceptual sandbox", "Guided practice with instant feedback"],
      milestoneAssessment: s.milestoneAssessment?.trim() || `Stage ${index + 1} Synthesis Checkpoint`,
      masteryCondition: s.masteryCondition?.trim() || "Demonstrate ≥ 80% conceptual mastery",
      status: index === 0 ? "unlocked" : "locked",
    };
  });

  const normalizedPlan: TopicCurriculumPlan = {
    topic: data.topic!.trim(),
    category: data.category!.trim(),
    estimatedHours: estimatedHours,
    overview: data.overview!.trim(),
    prerequisiteSummary: data.prerequisiteSummary!.trim(),
    diagnosticQuestions: [], // Kept empty in accordance with non-goal rules
    stages: normalizedStages,
  };

  return { isValid: true, plan: normalizedPlan };
}
