/**
 * KEA Platform — AI Output Schemas & Type Contracts
 * 
 * Defines strict Zod schemas for all AI-generated educational artifacts:
 * 1. GeneratedLearningContent (personalized explanation, worked example, pitfall, practice, hint)
 * 2. GeneratedPracticeSet (adaptive practice questions)
 * 3. GeneratedMockTest (multi-concept milestone diagnostic exam)
 * 4. AssessmentEvaluation (semantic evaluation against rubrics)
 * 5. InterviewTurnEvaluation (adaptive multi-turn interview evaluation & next question)
 * 6. InterviewSummary (comprehensive post-interview synthesis & evidence)
 * 7. RemediationPlan (targeted scaffold for struggling students)
 */

import { z } from "zod";

// ==========================================
// 1. GENERATED LEARNING CONTENT SCHEMA
// ==========================================

export const WorkedExampleStepSchema = z.object({
  stepNumber: z.number(),
  action: z.string(),
  reasoning: z.string(),
});

export const PracticeQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(5),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string(),
  difficulty: z.enum(["foundational", "intermediate", "advanced"]).default("intermediate"),
});

export const GeneratedLearningContentSchema = z.object({
  conceptId: z.string(),
  conceptTitle: z.string(),
  personalizedExplanation: z.string().min(20),
  workedExamples: z.array(WorkedExampleStepSchema).min(1),
  misconceptionAlert: z.object({
    commonPitfall: z.string(),
    howToAvoid: z.string(),
  }),
  practiceQuestion: PracticeQuestionSchema,
  hint: z.string(),
  stretchChallenge: z.string(),
  recommendedNextStep: z.string(),
});

export type GeneratedLearningContent = z.infer<typeof GeneratedLearningContentSchema>;

// ==========================================
// 2. MOCK TEST SCHEMAS
// ==========================================

export const RubricCriterionSchema = z.object({
  criterion: z.string(),
  weight: z.number().min(0).max(1),
});

export const MockTestQuestionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["multiple_choice", "short_answer", "reasoning"]),
    conceptId: z.string().min(1),
    conceptTitle: z.string().optional(),
    difficulty: z.enum(["foundational", "intermediate", "advanced"]),
    prompt: z.string().min(5),
    options: z.array(z.string().min(1)).optional(),
    correctOptionIndex: z.number().int().optional(),
    expectedConcepts: z.array(z.string()).default([]),
    rubric: z.array(RubricCriterionSchema).default([]),
    sampleIdealAnswer: z.string().optional(),
    explanation: z.string(),
  })
  .refine(
    (q) => {
      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) return false;
        // Check for duplicate options
        const unique = new Set(q.options.map((o) => o.trim().toLowerCase()));
        if (unique.size !== q.options.length) return false;
        // Check correctOptionIndex within range
        if (
          q.correctOptionIndex === undefined ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= q.options.length
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Multiple-choice questions must have at least 2 unique options and a valid correctOptionIndex within range.",
    }
  );

export type MockTestQuestion = z.infer<typeof MockTestQuestionSchema>;

export const GeneratedMockTestSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  stageNumber: z.number().int().optional(),
  targetDifficulty: z.enum(["foundational", "intermediate", "advanced", "adaptive"]),
  questions: z.array(MockTestQuestionSchema).min(3).max(10),
});

export type GeneratedMockTest = z.infer<typeof GeneratedMockTestSchema>;

// ==========================================
// 3. ASSESSMENT EVALUATION SCHEMA
// ==========================================

export const QuestionEvaluationSchema = z.object({
  questionId: z.string(),
  conceptId: z.string(),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  understanding: z.enum(["strong", "partial", "weak"]),
  rubricHits: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  feedback: z.string(),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const AssessmentEvaluationSchema = z.object({
  testId: z.string(),
  topic: z.string(),
  totalQuestions: z.number().int(),
  overallScore: z.number().min(0).max(100),
  evaluations: z.array(QuestionEvaluationSchema),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  recommendedAction: z.enum(["advance", "review", "remediate"]),
});

export type AssessmentEvaluation = z.infer<typeof AssessmentEvaluationSchema>;

// ==========================================
// 4. INTERVIEW SCHEMAS
// ==========================================

export const InterviewTurnEvaluationSchema = z.object({
  understanding: z.enum(["strong", "partial", "weak"]),
  conceptCoverage: z.array(z.string()).default([]),
  misconceptions: z.array(z.string()).default([]),
  reasoningQuality: z.string(),
  confidence: z.number().min(0).max(1).default(0.85),
  nextAction: z.enum(["follow_up", "advance", "remediate", "finish"]),
  nextQuestion: z.string(),
  nextConceptId: z.string().optional(),
  feedbackToStudent: z.string().optional(),
});

export type InterviewTurnEvaluation = z.infer<typeof InterviewTurnEvaluationSchema>;

export const InterviewSummarySchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  overallScore: z.number().min(0).max(100),
  understandingLevel: z.enum(["expert", "proficient", "developing", "novice"]),
  conceptsDemonstrated: z.array(z.string()),
  strongConcepts: z.array(z.string()),
  weakConcepts: z.array(z.string()),
  misconceptions: z.array(z.string()),
  reasoningQualitySummary: z.string(),
  recommendedNextSteps: z.array(z.string()),
  sampleEvidenceQuote: z.string().optional(),
});

export type InterviewSummary = z.infer<typeof InterviewSummarySchema>;

// ==========================================
// 5. REMEDIATION PLAN SCHEMA
// ==========================================

export const RemediationPlanSchema = z.object({
  conceptId: z.string(),
  conceptTitle: z.string(),
  diagnosedMisconception: z.string(),
  prescriptiveGuidance: z.string(),
  concreteAnalogy: z.string(),
  practiceChallenge: PracticeQuestionSchema,
  estimatedMinutesToRecover: z.number().default(5),
});

export type RemediationPlan = z.infer<typeof RemediationPlanSchema>;

// ==========================================
// 6. JSON SKELETON PROMPT TEMPLATES
// ==========================================

export const LEARNING_CONTENT_JSON_TEMPLATE = `{
  "conceptId": "concept_id",
  "conceptTitle": "Title of Concept",
  "personalizedExplanation": "detailed explanation of at least 20 words engaging the learner",
  "workedExamples": [
    { "stepNumber": 1, "action": "Step 1 action", "reasoning": "Step 1 reasoning" },
    { "stepNumber": 2, "action": "Step 2 action", "reasoning": "Step 2 reasoning" },
    { "stepNumber": 3, "action": "Step 3 action", "reasoning": "Step 3 reasoning" }
  ],
  "misconceptionAlert": {
    "commonPitfall": "common misconception pitfall description",
    "howToAvoid": "how to avoid and overcome this pitfall"
  },
  "practiceQuestion": {
    "id": "pq_1",
    "prompt": "practice question prompt testing understanding",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "detailed explanation of why the correct option is right",
    "difficulty": "intermediate"
  },
  "hint": "progressive guiding hint without spoiling the answer",
  "stretchChallenge": "advanced challenge question extending the concept",
  "recommendedNextStep": "recommended pedagogical next step"
}`;

export const MOCK_TEST_JSON_TEMPLATE = `{
  "id": "mock_test_generated",
  "title": "Topic Mastery Assessment",
  "topic": "Organic Chemistry",
  "stageNumber": 1,
  "targetDifficulty": "adaptive",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "conceptId": "concept_id_1",
      "conceptTitle": "Concept 1",
      "difficulty": "foundational",
      "prompt": "Multiple choice question prompt",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "expectedConcepts": ["concept_id_1"],
      "rubric": [],
      "sampleIdealAnswer": "Option A explanation",
      "explanation": "Why Option A is correct"
    },
    {
      "id": "q2",
      "type": "short_answer",
      "conceptId": "concept_id_2",
      "conceptTitle": "Concept 2",
      "difficulty": "intermediate",
      "prompt": "Short answer question prompt requiring 1-2 sentences",
      "expectedConcepts": ["concept_id_2"],
      "rubric": [
        { "criterion": "Identifies key functional group or rule", "weight": 0.5 },
        { "criterion": "Explains chemical significance", "weight": 0.5 }
      ],
      "sampleIdealAnswer": "Ideal 1-2 sentence student response",
      "explanation": "Comprehensive rubric justification"
    },
    {
      "id": "q3",
      "type": "reasoning",
      "conceptId": "concept_id_3",
      "conceptTitle": "Concept 3",
      "difficulty": "advanced",
      "prompt": "Deep reasoning question comparing mechanisms or properties",
      "expectedConcepts": ["concept_id_3"],
      "rubric": [
        { "criterion": "Contrasts structural features", "weight": 0.5 },
        { "criterion": "Connects structure to physical or chemical behavior", "weight": 0.5 }
      ],
      "sampleIdealAnswer": "Detailed reasoning answer",
      "explanation": "Explanation of structural cause and effect"
    }
  ]
}`;

export const INTERVIEW_TURN_JSON_TEMPLATE = `{
  "understanding": "strong",
  "conceptCoverage": ["concept_evaluated"],
  "misconceptions": [],
  "reasoningQuality": "Accurate conceptual justification demonstrating deep understanding",
  "confidence": 0.9,
  "nextAction": "follow_up",
  "nextQuestion": "Next probing question to deepen reasoning",
  "nextConceptId": "concept_evaluated",
  "feedbackToStudent": "Constructive encouraging feedback"
}`;

export const INTERVIEW_SUMMARY_JSON_TEMPLATE = `{
  "sessionId": "session_id",
  "topic": "Organic Chemistry",
  "overallScore": 88,
  "understandingLevel": "proficient",
  "conceptsDemonstrated": ["Concept 1", "Concept 2"],
  "strongConcepts": ["Concept 1"],
  "weakConcepts": [],
  "misconceptions": [],
  "reasoningQualitySummary": "Clear and rigorous defense with sound principles",
  "recommendedNextSteps": ["Advance to synthesis laboratory"],
  "sampleEvidenceQuote": "Verbatim quote demonstrating learner understanding"
}`;

export const ASSESSMENT_EVALUATION_JSON_TEMPLATE = `{
  "testId": "test_id",
  "topic": "Organic Chemistry",
  "totalQuestions": 5,
  "overallScore": 85,
  "evaluations": [
    {
      "questionId": "q1",
      "conceptId": "concept_id",
      "isCorrect": true,
      "score": 100,
      "understanding": "strong",
      "rubricHits": ["Accurately identifies rule"],
      "misconceptions": [],
      "feedback": "Clear and correct answer",
      "confidence": 0.95
    }
  ],
  "strengths": ["Solid grasp of valency and bonding"],
  "areasForImprovement": [],
  "recommendedAction": "advance"
}`;

export const TOPIC_PLAN_JSON_TEMPLATE = `{
  "topic": "Topic Name",
  "category": "Domain Category",
  "estimatedHours": 12,
  "overview": "Clear 2-sentence overview of the curriculum goals.",
  "prerequisiteSummary": "Foundational prerequisites needed before starting.",
  "stages": [
    {
      "id": "stage-1",
      "stageNumber": 1,
      "title": "Stage 1 Title",
      "tagline": "Stage 1 Subtitle",
      "objective": "Stage 1 learning goal",
      "conceptIds": ["c1", "c2"],
      "prerequisites": ["None"],
      "learningActivities": ["Interactive practice", "Concept mapping"],
      "milestoneAssessment": "Stage 1 checkpoint",
      "masteryCondition": "Achieve >= 80% on Stage 1 assessment"
    },
    {
      "id": "stage-2",
      "stageNumber": 2,
      "title": "Stage 2 Title",
      "tagline": "Stage 2 Subtitle",
      "objective": "Stage 2 learning goal",
      "conceptIds": ["c3", "c4"],
      "prerequisites": ["Stage 1"],
      "learningActivities": ["Hands-on exercises", "Case study"],
      "milestoneAssessment": "Stage 2 checkpoint",
      "masteryCondition": "Achieve >= 80% on Stage 2 assessment"
    }
  ],
  "concepts": [
    {
      "id": "c1",
      "name": "Foundational Concept 1",
      "summary": "Clear summary of concept 1",
      "difficulty": "foundational",
      "prerequisiteIds": []
    },
    {
      "id": "c2",
      "name": "Foundational Concept 2",
      "summary": "Clear summary of concept 2",
      "difficulty": "foundational",
      "prerequisiteIds": ["c1"]
    },
    {
      "id": "c3",
      "name": "Intermediate Concept 1",
      "summary": "Clear summary of concept 3",
      "difficulty": "intermediate",
      "prerequisiteIds": ["c2"]
    },
    {
      "id": "c4",
      "name": "Advanced Concept 1",
      "summary": "Clear summary of concept 4",
      "difficulty": "advanced",
      "prerequisiteIds": ["c3"]
    }
  ]
}`;

// ==========================================
// 8. TOPIC CURRICULUM PLANNING SCHEMA
// ==========================================

export const RawAIConceptSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  difficulty: z.enum(["foundational", "intermediate", "advanced"]),
  prerequisiteIds: z.array(z.string()).default([]),
});

export const RawAIStageSchema = z.object({
  id: z.string(),
  stageNumber: z.number().int(),
  title: z.string(),
  tagline: z.string().optional().default("Milestone Stage"),
  objective: z.string(),
  conceptIds: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  learningActivities: z.array(z.string()).default([]),
  milestoneAssessment: z.string().optional().default("Milestone Checkpoint"),
  masteryCondition: z.string().optional().default("Demonstrate >= 80% mastery"),
});

export const RawAITopicPlanSchema = z.object({
  topic: z.string().optional().default("Curriculum Plan"),
  category: z.string().optional().default("General Academic"),
  estimatedHours: z.number().min(1).max(100).optional().default(10),
  overview: z.string().optional().default("A structured pathway to mastery through guided stages."),
  prerequisiteSummary: z.string().optional().default("Basic literacy and foundational understanding."),
  stages: z.array(RawAIStageSchema).min(2).max(6),
  concepts: z.array(RawAIConceptSchema).min(3).max(16),
});

