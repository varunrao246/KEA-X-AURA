/**
 * Knowledge Graph Domain Types for KEA Platform
 * Defines discrete conceptual competencies, prerequisite dependencies,
 * and graph validation results.
 */

export type NodeDifficulty = 'foundational' | 'intermediate' | 'advanced';

export interface ConceptNode {
  /** Unique stable identifier (e.g. 'NODE_01_PARTS') */
  id: string;
  /** Short curriculum code (e.g. 'FRAC-01') */
  code: string;
  /** Human-readable title */
  title: string;
  /** Pedagogical learning objective and description */
  description: string;
  /** Pedagogical difficulty tier */
  difficulty: NodeDifficulty;
  /** Relative curriculum sequence index (1-based) */
  orderIndex: number;
  /** Array of prerequisite concept node IDs that must be mastered first */
  prerequisites: string[];
  /** Discrete target learning objectives */
  learningObjectives: string[];
  /** Estimated seat/interaction time in minutes for standard pace */
  estimatedMinutes: number;
  /** Visual manipulative model used (e.g. 'circle-pie', 'fraction-strip', 'number-line') */
  visualModel: string;
}

export interface GraphValidationResult {
  /** True if the graph is structurally valid and forms a true DAG */
  valid: boolean;
  /** List of validation error messages, if any */
  errors: string[];
  /** Deterministic topological ordering of node IDs (empty if invalid or cyclic) */
  topologicalOrder: string[];
}

export interface NodeUnlockState {
  nodeId: string;
  isUnlocked: boolean;
  metPrerequisites: string[];
  unmetPrerequisites: string[];
}
