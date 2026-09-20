/**
 * Core Domain Type Contracts for KEA
 * Adaptive Learning & Real-Time Intervention Platform
 */

export type StudentTheme = 'space' | 'wildlife' | 'chef' | 'superhero';

export type PaceLabel = 'sloth' | 'cheetah' | 'falcon';

export type NodeMasteryStatus =
  | 'locked'
  | 'unlocked'
  | 'in_progress'
  | 'mastered'
  | 'remediation';

export type AssessmentItemType = 'practice' | 'written' | 'oral';

export type InterventionStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export interface StudentProfileSummary {
  id: string;
  name: string;
  grade: number;
  theme: StudentTheme;
  pace: {
    label: PaceLabel;
    title: string;
    mascotEmoji: string;
  };
}

export interface KnowledgeNodeSummary {
  id: string;
  code: string;
  title: string;
  orderIndex: number;
  prerequisites: string[];
}

export interface SystemMilestoneState {
  currentMilestone: string;
  currentTask: string;
  status: 'planning' | 'in_progress' | 'ready_for_review' | 'completed';
}
