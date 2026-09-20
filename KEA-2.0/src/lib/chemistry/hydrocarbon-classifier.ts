/**
 * KEA Platform — Deterministic Hydrocarbon Classification Engine (Stage 2)
 *
 * Rules:
 * 1. Alkane: only C-C single bonds → CnH(2n+2) formula
 * 2. Alkene: at least one C=C double bond (no triple) → CnH(2n) formula
 * 3. Alkyne: at least one C≡C triple bond → CnH(2n-2) formula
 * 4. All formulas and classifications are deterministic — no AI.
 * 5. Reuses existing Molecule, Bond, BondOrder from types.ts.
 */

import { Molecule, BondOrder } from './types';

export type HydrocarbonClass = 'alkane' | 'alkene' | 'alkyne' | 'unknown';

export interface HydrocarbonClassificationResult {
  hydrocarbonClass: HydrocarbonClass;
  formula: string;
  carbonCount: number;
  hydrogenCount: number;
  isSaturated: boolean;
  doubleBondCount: number;
  tripleBondCount: number;
  degreeOfUnsaturation: number;
  explanation: string;
}

export interface AlkaneFormulaResult {
  carbonCount: number;
  hydrogenCount: number;
  formula: string;
  name: string;
}

export interface AlkeneFormulaResult {
  carbonCount: number;
  hydrogenCount: number;
  formula: string;
  doubleBondPosition: number;
}

export interface AlkyneFormulaResult {
  carbonCount: number;
  hydrogenCount: number;
  formula: string;
  tripleBondPosition: number;
}

// IUPAC prefixes for carbon chain lengths 1–6
export const IUPAC_PREFIXES: Record<number, string> = {
  1: 'meth',
  2: 'eth',
  3: 'prop',
  4: 'but',
  5: 'pent',
  6: 'hex',
};

// Alkane suffix: -ane
export const ALKANE_NAMES: Record<number, string> = {
  1: 'Methane',
  2: 'Ethane',
  3: 'Propane',
  4: 'Butane',
  5: 'Pentane',
  6: 'Hexane',
};

// Alkene suffix: -ene
export const ALKENE_NAMES: Record<number, string> = {
  2: 'Ethene',
  3: 'Propene',
  4: 'Butene',
  5: 'Pentene',
  6: 'Hexene',
};

// Alkyne suffix: -yne
export const ALKYNE_NAMES: Record<number, string> = {
  2: 'Ethyne',
  3: 'Propyne',
  4: 'Butyne',
  5: 'Pentyne',
  6: 'Hexyne',
};

/**
 * Computes the alkane molecular formula for a given carbon count.
 * Formula: CnH(2n+2)
 */
export function getAlkaneFormula(n: number): AlkaneFormulaResult {
  if (n < 1 || n > 6) {
    throw new Error(`Carbon count must be between 1 and 6; received ${n}.`);
  }
  const h = 2 * n + 2;
  const formula = n === 1 ? `CH${h}` : `C${n}H${h}`;
  return {
    carbonCount: n,
    hydrogenCount: h,
    formula,
    name: ALKANE_NAMES[n],
  };
}

/**
 * Computes the alkene molecular formula for a given carbon count.
 * Formula: CnH(2n) — requires n >= 2
 */
export function getAlkeneFormula(n: number, doubleBondPosition: number = 1): AlkeneFormulaResult {
  if (n < 2 || n > 6) {
    throw new Error(`Alkene carbon count must be between 2 and 6; received ${n}.`);
  }
  if (doubleBondPosition < 1 || doubleBondPosition >= n) {
    throw new Error(
      `Double bond position ${doubleBondPosition} is invalid for C${n} chain (must be 1 to ${n - 1}).`
    );
  }
  const h = 2 * n;
  const formula = `C${n}H${h}`;
  return {
    carbonCount: n,
    hydrogenCount: h,
    formula,
    doubleBondPosition,
  };
}

/**
 * Computes the alkyne molecular formula for a given carbon count.
 * Formula: CnH(2n-2) — requires n >= 2
 */
export function getAlkyneFormula(n: number, tripleBondPosition: number = 1): AlkyneFormulaResult {
  if (n < 2 || n > 6) {
    throw new Error(`Alkyne carbon count must be between 2 and 6; received ${n}.`);
  }
  if (tripleBondPosition < 1 || tripleBondPosition >= n) {
    throw new Error(
      `Triple bond position ${tripleBondPosition} is invalid for C${n} chain (must be 1 to ${n - 1}).`
    );
  }
  const h = 2 * n - 2;
  const formula = `C${n}H${h}`;
  return {
    carbonCount: n,
    hydrogenCount: h,
    formula,
    tripleBondPosition,
  };
}

/**
 * Classifies a Molecule as alkane, alkene, or alkyne deterministically.
 * Uses existing Molecule type from types.ts. No duplicate valence system.
 */
export function classifyHydrocarbon(molecule: Molecule): HydrocarbonClassificationResult {
  const carbonAtoms = molecule.atoms.filter(a => a.element === 'C');
  const n = carbonAtoms.length;

  if (n === 0) {
    return {
      hydrocarbonClass: 'unknown',
      formula: '',
      carbonCount: 0,
      hydrogenCount: 0,
      isSaturated: false,
      doubleBondCount: 0,
      tripleBondCount: 0,
      degreeOfUnsaturation: 0,
      explanation: 'No carbon atoms found. Not a hydrocarbon.',
    };
  }

  let doubleBondCount = 0;
  let tripleBondCount = 0;

  for (const bond of molecule.bonds) {
    const atomA = molecule.atoms.find(a => a.id === bond.atomAId);
    const atomB = molecule.atoms.find(a => a.id === bond.atomBId);
    // Only count bonds between carbon atoms
    if (atomA?.element === 'C' && atomB?.element === 'C') {
      if (bond.order === 2) doubleBondCount++;
      if (bond.order === 3) tripleBondCount++;
    }
  }

  const hydrogenCount = molecule.atoms.filter(a => a.element === 'H').length;
  const degreeOfUnsaturation = doubleBondCount + 2 * tripleBondCount;

  let hydrocarbonClass: HydrocarbonClass;
  let formula: string;
  let isSaturated: boolean;
  let explanation: string;

  if (tripleBondCount > 0) {
    hydrocarbonClass = 'alkyne';
    isSaturated = false;
    formula = n === 1 ? `CH${hydrogenCount}` : `C${n}H${hydrogenCount}`;
    explanation = `Contains ${tripleBondCount} carbon-carbon triple bond(s) (C≡C). ` +
      `This is an alkyne — an unsaturated hydrocarbon. ` +
      `General formula: CₙH₂ₙ₋₂ for straight-chain alkynes.`;
  } else if (doubleBondCount > 0) {
    hydrocarbonClass = 'alkene';
    isSaturated = false;
    formula = n === 1 ? `CH${hydrogenCount}` : `C${n}H${hydrogenCount}`;
    explanation = `Contains ${doubleBondCount} carbon-carbon double bond(s) (C=C). ` +
      `This is an alkene — an unsaturated hydrocarbon. ` +
      `General formula: CₙH₂ₙ for straight-chain alkenes.`;
  } else {
    hydrocarbonClass = 'alkane';
    isSaturated = true;
    formula = n === 1 ? `CH${hydrogenCount}` : `C${n}H${hydrogenCount}`;
    explanation = `Contains only carbon-carbon single bonds (C-C). ` +
      `This is an alkane — a saturated hydrocarbon with maximum hydrogen content. ` +
      `General formula: CₙH₂ₙ₊₂ for straight-chain alkanes.`;
  }

  return {
    hydrocarbonClass,
    formula,
    carbonCount: n,
    hydrogenCount,
    isSaturated,
    doubleBondCount,
    tripleBondCount,
    degreeOfUnsaturation,
    explanation,
  };
}

/**
 * Validates that a carbon chain construction is within allowed bounds.
 * Guards carbon count (1–6) and rejects duplicate carbon additions.
 */
export function validateChainConstruction(
  currentCarbonCount: number,
  requestedAddition: number = 1
): { valid: boolean; reason?: string; newCount: number } {
  const newCount = currentCarbonCount + requestedAddition;
  if (currentCarbonCount < 0) {
    return { valid: false, reason: 'Carbon count cannot be negative.', newCount: currentCarbonCount };
  }
  if (newCount > 6) {
    return {
      valid: false,
      reason: `Maximum chain length is C6. Current: C${currentCarbonCount}. Cannot add ${requestedAddition} more carbon(s).`,
      newCount: currentCarbonCount,
    };
  }
  if (newCount < 1) {
    return { valid: false, reason: 'Chain must have at least 1 carbon atom.', newCount: currentCarbonCount };
  }
  return { valid: true, newCount };
}

/**
 * Challenge molecules for Module E classification quiz.
 * All answers are deterministic.
 */
export interface ClassificationChallenge {
  id: string;
  label: string;
  structureDescription: string; // e.g. "C — C — C"
  bondPattern: BondOrder[];     // bonds between carbons in chain order
  carbonCount: number;
  correctClass: HydrocarbonClass;
  formula: string;
  explanation: string;
}

export const CLASSIFICATION_CHALLENGES: ClassificationChallenge[] = [
  {
    id: 'ch-1',
    label: 'Propane',
    structureDescription: 'C — C — C',
    bondPattern: [1, 1],
    carbonCount: 3,
    correctClass: 'alkane',
    formula: 'C₃H₈',
    explanation: 'All single C-C bonds and maximum hydrogen → saturated alkane.',
  },
  {
    id: 'ch-2',
    label: 'Propene',
    structureDescription: 'C = C — C',
    bondPattern: [2, 1],
    carbonCount: 3,
    correctClass: 'alkene',
    formula: 'C₃H₆',
    explanation: 'Contains one C=C double bond → unsaturated alkene.',
  },
  {
    id: 'ch-3',
    label: 'Propyne',
    structureDescription: 'C ≡ C — C',
    bondPattern: [3, 1],
    carbonCount: 3,
    correctClass: 'alkyne',
    formula: 'C₃H₄',
    explanation: 'Contains one C≡C triple bond → unsaturated alkyne.',
  },
  {
    id: 'ch-4',
    label: 'Butane',
    structureDescription: 'C — C — C — C',
    bondPattern: [1, 1, 1],
    carbonCount: 4,
    correctClass: 'alkane',
    formula: 'C₄H₁₀',
    explanation: 'Four carbons with only single bonds → saturated alkane.',
  },
  {
    id: 'ch-5',
    label: 'But-1-ene',
    structureDescription: 'C = C — C — C',
    bondPattern: [2, 1, 1],
    carbonCount: 4,
    correctClass: 'alkene',
    formula: 'C₄H₈',
    explanation: 'Double bond at position 1 → unsaturated alkene.',
  },
  {
    id: 'ch-6',
    label: 'Ethyne',
    structureDescription: 'C ≡ C',
    bondPattern: [3],
    carbonCount: 2,
    correctClass: 'alkyne',
    formula: 'C₂H₂',
    explanation: 'Two carbons connected by a triple bond → alkyne.',
  },
];
