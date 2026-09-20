/**
 * Types for KEA Topic-to-Mastery Learning Flow
 * 
 * Supports open-ended topic entry, prerequisite diagnostic checks,
 * dynamic stage-wise curriculum generation, and topic knowledge graphs.
 */

export interface DiagnosticOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  context?: string;
  conceptTested: string;
  options: DiagnosticOption[];
  explanation: string;
}

export interface LearningStageConcept {
  id: string;
  name: string;
  summary: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  status: 'locked' | 'unlocked' | 'in_progress' | 'mastered';
  prerequisiteIds?: string[];
}


export interface LearningStage {
  id: string;
  stageNumber: number;
  title: string;
  tagline: string;
  objective: string;
  concepts: LearningStageConcept[];
  prerequisites: string[];
  learningActivities: string[];
  milestoneAssessment: string;
  masteryCondition: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'mastered';
}

export interface TopicCurriculumPlan {
  topic: string;
  category: string;
  estimatedHours: number;
  overview: string;
  prerequisiteSummary: string;
  diagnosticQuestions: DiagnosticQuestion[];
  stages: LearningStage[];
}
