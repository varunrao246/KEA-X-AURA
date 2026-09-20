/**
 * KEA Platform — Chemistry Domain Model Types
 * 
 * Reusable data representations for atoms, bonds, molecules, valence rules,
 * hybridization states, and deterministic learning evidence.
 */

export type ElementSymbol = 'C' | 'H' | 'O' | 'N';

export type BondOrder = 1 | 2 | 3;

export type HybridizationState = 'sp3' | 'sp2' | 'sp';

export interface Atom {
  id: string;
  element: ElementSymbol;
  label?: string;
  x?: number;
  y?: number;
}

export interface Bond {
  id: string;
  atomAId: string;
  atomBId: string;
  order: BondOrder;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
}

export interface AtomValenceStatus {
  current: number;
  max: number;
  isExceeded: boolean;
  isSatisfied: boolean;
}

export interface MoleculeValidationResult {
  isValid: boolean;
  errors: string[];
  atomValences: Record<string, AtomValenceStatus>;
  formula: string;
}

export interface MoleculeTarget {
  name: string;
  formula: string;
  requiredAtoms: Record<ElementSymbol, number>;
  requiredBonds: {
    single: number;
    double: number;
    triple: number;
  };
  requiredCarbonBondOrder?: BondOrder;
}

export interface ChemistryLearningEvidence {
  conceptId: string;
  activityId: string;
  evidenceType: 'practice' | 'interactive' | 'written' | 'oral';
  score: number;
  attempts: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
