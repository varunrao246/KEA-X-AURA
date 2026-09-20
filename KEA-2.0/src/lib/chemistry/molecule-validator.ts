/**
 * KEA Platform — Deterministic Chemistry Molecular Validator
 * 
 * Rules:
 * 1. Carbon cannot exceed valence 4.
 * 2. Hydrogen cannot exceed valence 1.
 * 3. Oxygen cannot exceed valence 2.
 * 4. Nitrogen cannot exceed valence 3.
 * 5. Bond order contributes directly to valence sum (single = 1, double = 2, triple = 3).
 * 6. Deterministic target matching for molecule challenges (e.g. Ethene).
 */

import {
  Atom,
  AtomValenceStatus,
  ElementSymbol,
  HybridizationState,
  Molecule,
  MoleculeTarget,
  MoleculeValidationResult,
} from './types';

export const MAX_VALENCE_MAP: Record<ElementSymbol, number> = {
  C: 4,
  H: 1,
  O: 2,
  N: 3,
};

/**
 * Calculates current valence for a specific atom in a molecule.
 */
export function calculateAtomValence(molecule: Molecule, atomId: string): number {
  let valence = 0;
  for (const bond of molecule.bonds) {
    if (bond.atomAId === atomId || bond.atomBId === atomId) {
      valence += bond.order;
    }
  }
  return valence;
}

/**
 * Generates standard Hill-system empirical/molecular formula string.
 * Example: 2 Carbons and 4 Hydrogens -> C2H4
 */
export function getMolecularFormula(atoms: Atom[]): string {
  const counts: Record<ElementSymbol, number> = { C: 0, H: 0, O: 0, N: 0 };
  for (const atom of atoms) {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
  }

  let formula = '';
  if (counts.C > 0) formula += counts.C === 1 ? 'C' : `C${counts.C}`;
  if (counts.H > 0) formula += counts.H === 1 ? 'H' : `H${counts.H}`;
  if (counts.O > 0) formula += counts.O === 1 ? 'O' : `O${counts.O}`;
  if (counts.N > 0) formula += counts.N === 1 ? 'N' : `N${counts.N}`;

  return formula || 'Empty';
}

/**
 * Validates all valence rules across every atom in the molecule.
 */
export function validateMoleculeValence(molecule: Molecule): MoleculeValidationResult {
  const errors: string[] = [];
  const atomValences: Record<string, AtomValenceStatus> = {};

  for (const atom of molecule.atoms) {
    const currentValence = calculateAtomValence(molecule, atom.id);
    const maxValence = MAX_VALENCE_MAP[atom.element];
    const isExceeded = currentValence > maxValence;
    const isSatisfied = currentValence === maxValence;

    atomValences[atom.id] = {
      current: currentValence,
      max: maxValence,
      isExceeded,
      isSatisfied,
    };

    if (isExceeded) {
      errors.push(
        `Valence exceeded for ${atom.element} (${atom.id}): has ${currentValence} bonds, maximum allowed is ${maxValence}.`
      );
    }
  }

  // Check for duplicate or self-referencing bonds
  for (const bond of molecule.bonds) {
    if (bond.atomAId === bond.atomBId) {
      errors.push(`Invalid self-bonding loop detected on atom ${bond.atomAId}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    atomValences,
    formula: getMolecularFormula(molecule.atoms),
  };
}

/**
 * Maps carbon bond order environment to orbital hybridization state and geometry.
 */
export function getCarbonHybridization(
  molecule: Molecule,
  carbonAtomId: string
): {
  hybridization: HybridizationState;
  geometry: string;
  idealAngle: number;
} {
  let hasTriple = false;
  let hasDouble = false;

  for (const bond of molecule.bonds) {
    if (bond.atomAId === carbonAtomId || bond.atomBId === carbonAtomId) {
      if (bond.order === 3) hasTriple = true;
      if (bond.order === 2) hasDouble = true;
    }
  }

  if (hasTriple) {
    return { hybridization: 'sp', geometry: 'Linear', idealAngle: 180 };
  }
  if (hasDouble) {
    return { hybridization: 'sp2', geometry: 'Trigonal Planar', idealAngle: 120 };
  }
  return { hybridization: 'sp3', geometry: 'Tetrahedral', idealAngle: 109.5 };
}

/**
 * Standard Canonical Target for Ethene (C2H4)
 */
export function createEtheneTarget(): MoleculeTarget {
  return {
    name: 'Ethene',
    formula: 'C2H4',
    requiredAtoms: {
      C: 2,
      H: 4,
      O: 0,
      N: 0,
    },
    requiredBonds: {
      single: 4, // 4 C-H bonds
      double: 1, // 1 C=C bond
      triple: 0,
    },
    requiredCarbonBondOrder: 2,
  };
}

/**
 * Evaluates whether a student-constructed molecule strictly satisfies the target specification.
 */
export function evaluateTargetMatch(
  molecule: Molecule,
  target: MoleculeTarget
): {
  matched: boolean;
  reason?: string;
  validationResult: MoleculeValidationResult;
} {
  const validation = validateMoleculeValence(molecule);

  // 1. Must be valence-valid
  if (!validation.isValid) {
    return {
      matched: false,
      reason: `Valence error: ${validation.errors[0]}`,
      validationResult: validation,
    };
  }

  // 2. Atom counts must match target
  const counts: Record<ElementSymbol, number> = { C: 0, H: 0, O: 0, N: 0 };
  for (const atom of molecule.atoms) {
    counts[atom.element] = (counts[atom.element] || 0) + 1;
  }

  for (const [el, req] of Object.entries(target.requiredAtoms) as [ElementSymbol, number][]) {
    if ((counts[el] || 0) !== req) {
      return {
        matched: false,
        reason: `Incorrect count of ${el} atoms: expected ${req}, but workspace contains ${counts[el] || 0}.`,
        validationResult: validation,
      };
    }
  }

  // 3. Bond counts must match target
  let singleCount = 0;
  let doubleCount = 0;
  let tripleCount = 0;

  for (const bond of molecule.bonds) {
    if (bond.order === 1) singleCount++;
    if (bond.order === 2) doubleCount++;
    if (bond.order === 3) tripleCount++;
  }

  if (singleCount !== target.requiredBonds.single) {
    return {
      matched: false,
      reason: `Single bond mismatch: expected ${target.requiredBonds.single} single bonds, found ${singleCount}.`,
      validationResult: validation,
    };
  }

  if (doubleCount !== target.requiredBonds.double) {
    return {
      matched: false,
      reason: `Double bond mismatch: expected ${target.requiredBonds.double} double bond(s), found ${doubleCount}.`,
      validationResult: validation,
    };
  }

  if (tripleCount !== target.requiredBonds.triple) {
    return {
      matched: false,
      reason: `Triple bond mismatch: expected ${target.requiredBonds.triple} triple bond(s), found ${tripleCount}.`,
      validationResult: validation,
    };
  }

  // 4. Verify Carbon-Carbon connectivity if specified
  if (target.requiredCarbonBondOrder) {
    const carbonAtoms = molecule.atoms.filter(a => a.element === 'C');
    if (carbonAtoms.length >= 2) {
      const ccBond = molecule.bonds.find(
        b =>
          (b.atomAId === carbonAtoms[0].id && b.atomBId === carbonAtoms[1].id) ||
          (b.atomAId === carbonAtoms[1].id && b.atomBId === carbonAtoms[0].id)
      );

      if (!ccBond || ccBond.order !== target.requiredCarbonBondOrder) {
        return {
          matched: false,
          reason: `Carbon-carbon bond order must be ${target.requiredCarbonBondOrder} (${
            target.requiredCarbonBondOrder === 2 ? 'double' : 'single'
          } bond).`,
          validationResult: validation,
        };
      }
    }
  }

  // 5. Ensure all atoms are fully valence-satisfied for closed molecules
  for (const atom of molecule.atoms) {
    const status = validation.atomValences[atom.id];
    if (!status.isSatisfied) {
      return {
        matched: false,
        reason: `Atom ${atom.element} (${atom.id}) has unfulfilled valence: ${status.current}/${status.max} bonds. Every atom must complete its octet/duet.`,
        validationResult: validation,
      };
    }
  }

  return {
    matched: true,
    validationResult: validation,
  };
}
