/**
 * KEA Platform — Deterministic Molecular Structure & Isomerism Engine (Stage 4)
 * 
 * Rules & Invariants:
 * 1. Formula equivalence: isomers MUST share identical Hill-system molecular formula.
 * 2. Constitutional Isomerism: same formula, different topological connectivity signature.
 * 3. Stereoisomerism (Geometric): same formula, same connectivity, different spatial arrangement (cis vs trans).
 * 4. Identical molecules: same formula, same connectivity, same spatial geometry.
 * 5. Deterministic valence validation: C <= 4, H <= 1, O <= 2, N <= 3.
 */

import { Molecule } from './types';
import { MAX_VALENCE_MAP, calculateAtomValence, getMolecularFormula } from './molecule-validator';

export type IsomerClassification =
  | 'identical'
  | 'constitutional_chain'
  | 'constitutional_position'
  | 'constitutional_functional'
  | 'stereoisomer_geometric'
  | 'not_isomers_different_formula'
  | 'invalid_valence';

export interface IsomerMolecule extends Molecule {
  id: string;
  name: string;
  iupacName: string;
  formula: string;
  commonName?: string;
  description: string;
  boilingPoint?: string;
  density?: string;
  geometry?: 'planar' | 'cis' | 'trans';
  functionalGroup?: string;
  structureType: 'linear' | 'branched' | 'functional_chain' | 'geometric';
}

export interface IsomerComparisonResult {
  relationship: IsomerClassification;
  relationshipLabel: string;
  isIsomer: boolean;
  isConstitutional: boolean;
  isStereoisomer: boolean;
  formulaA: string;
  formulaB: string;
  haveSameFormula: boolean;
  haveSameConnectivity: boolean;
  details: string;
  connectivityDifferences: string[];
}

/**
 * Calculates a deterministic topological connectivity signature for heavy atoms (C, O, N).
 * Two molecules with identical connectivity will produce identical sorted signatures.
 */
export function getHeavyAtomConnectivitySignature(molecule: Molecule): string {
  const heavyAtoms = molecule.atoms.filter(a => a.element !== 'H');
  
  if (heavyAtoms.length === 0) {
    // Pure hydrogen or empty
    const hCount = molecule.atoms.filter(a => a.element === 'H').length;
    return `H:${hCount}`;
  }

  const atomSignatures: string[] = [];

  for (const atom of heavyAtoms) {
    // Find all heavy neighbors and bond orders
    const neighborDescriptors: string[] = [];

    for (const bond of molecule.bonds) {
      let neighborId: string | null = null;
      if (bond.atomAId === atom.id) neighborId = bond.atomBId;
      else if (bond.atomBId === atom.id) neighborId = bond.atomAId;

      if (neighborId) {
        const neighbor = molecule.atoms.find(a => a.id === neighborId);
        if (neighbor && neighbor.element !== 'H') {
          neighborDescriptors.push(`${neighbor.element}${bond.order}`);
        }
      }
    }

    // Sort neighbor descriptors for invariance to connection order
    neighborDescriptors.sort();
    
    // Count attached hydrogens
    let hCount = 0;
    for (const bond of molecule.bonds) {
      let neighborId: string | null = null;
      if (bond.atomAId === atom.id) neighborId = bond.atomBId;
      else if (bond.atomBId === atom.id) neighborId = bond.atomAId;

      if (neighborId) {
        const neighbor = molecule.atoms.find(a => a.id === neighborId);
        if (neighbor && neighbor.element === 'H') {
          hCount += bond.order;
        }
      }
    }

    atomSignatures.push(`${atom.element}[${neighborDescriptors.join(',')}|H${hCount}]`);
  }

  // Sort across all heavy atoms to make signature invariant to atom indexing
  atomSignatures.sort();
  return atomSignatures.join(';');
}

/**
 * Validates that all atoms satisfy valences and contain no self loops.
 */
export function validateIsomerStructure(molecule: Molecule): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const atom of molecule.atoms) {
    const valence = calculateAtomValence(molecule, atom.id);
    const max = MAX_VALENCE_MAP[atom.element];
    if (valence > max) {
      errors.push(`Atom ${atom.element} (${atom.id}) exceeds maximum valence: ${valence}/${max}`);
    }
  }

  for (const bond of molecule.bonds) {
    if (bond.atomAId === bond.atomBId) {
      errors.push(`Invalid self-loop bond detected on atom ${bond.atomAId}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Compares two molecules deterministically and determines their structural relationship.
 */
export function compareMolecules(
  molA: IsomerMolecule,
  molB: IsomerMolecule
): IsomerComparisonResult {
  const valA = validateIsomerStructure(molA);
  const valB = validateIsomerStructure(molB);

  if (!valA.isValid || !valB.isValid) {
    return {
      relationship: 'invalid_valence',
      relationshipLabel: 'Invalid Molecular Structure',
      isIsomer: false,
      isConstitutional: false,
      isStereoisomer: false,
      formulaA: getMolecularFormula(molA.atoms),
      formulaB: getMolecularFormula(molB.atoms),
      haveSameFormula: false,
      haveSameConnectivity: false,
      details: 'One or both molecules contain invalid valence states or disconnected bonds.',
      connectivityDifferences: [...valA.errors, ...valB.errors],
    };
  }

  const formulaA = getMolecularFormula(molA.atoms);
  const formulaB = getMolecularFormula(molB.atoms);
  const haveSameFormula = formulaA === formulaB;

  if (!haveSameFormula) {
    return {
      relationship: 'not_isomers_different_formula',
      relationshipLabel: 'Different Compounds (Not Isomers)',
      isIsomer: false,
      isConstitutional: false,
      isStereoisomer: false,
      formulaA,
      formulaB,
      haveSameFormula: false,
      haveSameConnectivity: false,
      details: `Different molecular formulas (${formulaA} vs ${formulaB}). Isomers must share the exact same formula.`,
      connectivityDifferences: [`Formula mismatch: ${formulaA} ≠ ${formulaB}`],
    };
  }

  const sigA = getHeavyAtomConnectivitySignature(molA);
  const sigB = getHeavyAtomConnectivitySignature(molB);
  const haveSameConnectivity = sigA === sigB;

  // Same Formula + Same Connectivity
  if (haveSameConnectivity) {
    // Check if geometric stereoisomers (e.g. cis vs trans)
    if (
      molA.geometry &&
      molB.geometry &&
      molA.geometry !== molB.geometry &&
      (molA.geometry === 'cis' || molA.geometry === 'trans') &&
      (molB.geometry === 'cis' || molB.geometry === 'trans')
    ) {
      return {
        relationship: 'stereoisomer_geometric',
        relationshipLabel: 'Geometric Stereoisomers (Cis / Trans)',
        isIsomer: true,
        isConstitutional: false,
        isStereoisomer: true,
        formulaA,
        formulaB,
        haveSameFormula: true,
        haveSameConnectivity: true,
        details: `Identical formula (${formulaA}) and identical atomic connectivity, but distinct spatial arrangement around the rigid double bond (${molA.geometry.toUpperCase()} vs ${molB.geometry.toUpperCase()}).`,
        connectivityDifferences: [
          `Identical connectivity: ${sigA}`,
          `Spatial geometry: ${molA.name} is ${molA.geometry.toUpperCase()}, while ${molB.name} is ${molB.geometry.toUpperCase()}`,
        ],
      };
    }

    return {
      relationship: 'identical',
      relationshipLabel: 'Identical Molecule (Same Compound)',
      isIsomer: false,
      isConstitutional: false,
      isStereoisomer: false,
      formulaA,
      formulaB,
      haveSameFormula: true,
      haveSameConnectivity: true,
      details: `Identical molecular formula (${formulaA}) and identical atomic connectivity. These are the same chemical structure.`,
      connectivityDifferences: ['No connectivity differences — structures are superimposable.'],
    };
  }

  // Same Formula + Different Connectivity = Constitutional Isomer
  // Classify subtype:
  const isChain =
    (molA.structureType === 'branched' && molB.structureType === 'linear') ||
    (molA.structureType === 'linear' && molB.structureType === 'branched') ||
    (molA.formula.startsWith('C4H10') || molA.formula.startsWith('C5H12'));

  const isBothAlcohols =
    (Boolean(molA.functionalGroup?.toLowerCase().includes('alcohol')) &&
      Boolean(molB.functionalGroup?.toLowerCase().includes('alcohol'))) ||
    (molA.id.includes('propanol') && molB.id.includes('propanol')) ||
    (molA.id.includes('butanol') && molB.id.includes('butanol'));

  const isFunctional =
    !isBothAlcohols &&
    ((Boolean(molA.functionalGroup && molB.functionalGroup) &&
      molA.functionalGroup !== molB.functionalGroup) ||
      molA.id === 'ethanol' ||
      molB.id === 'dimethyl-ether' ||
      molA.formula === 'C2H6O');

  let rel: IsomerClassification = 'constitutional_position';
  let relLabel = 'Positional Constitutional Isomer';
  let desc = `Same molecular formula (${formulaA}) but substituents or double bonds are located at different positions on the carbon skeleton.`;

  if (isFunctional) {
    rel = 'constitutional_functional';
    relLabel = 'Functional Group Isomer';
    desc = `Same molecular formula (${formulaA}) but atoms are bonded into completely different functional group classes (${molA.functionalGroup || 'Group A'} vs ${molB.functionalGroup || 'Group B'}).`;
  } else if (isChain) {
    rel = 'constitutional_chain';
    relLabel = 'Chain (Skeletal) Isomer';
    desc = `Same molecular formula (${formulaA}) but the carbon backbone differs in branching (${molA.structureType} vs ${molB.structureType}).`;
  }

  return {
    relationship: rel,
    relationshipLabel: relLabel,
    isIsomer: true,
    isConstitutional: true,
    isStereoisomer: false,
    formulaA,
    formulaB,
    haveSameFormula: true,
    haveSameConnectivity: false,
    details: desc,
    connectivityDifferences: [
      `Structure A connectivity: ${sigA}`,
      `Structure B connectivity: ${sigB}`,
    ],
  };
}

// ==========================================
// PRESET CURATED ISOMER PAIRS FOR DEMO
// ==========================================

export interface IsomerPair {
  id: string;
  title: string;
  category: 'chain' | 'positional' | 'functional' | 'stereoisomer';
  formula: string;
  molA: IsomerMolecule;
  molB: IsomerMolecule;
  learningPrompt: string;
}

export const PRESET_ISOMER_PAIRS: IsomerPair[] = [
  {
    id: 'pair-butane',
    title: 'Chain Isomerism: Butane vs Isobutane',
    category: 'chain',
    formula: 'C4H10',
    learningPrompt: 'Compare linear butane with branched 2-methylpropane (isobutane). Notice how branching changes the boiling point from -0.5°C to -11.7°C.',
    molA: {
      id: 'butane',
      name: 'Butane (n-Butane)',
      iupacName: 'Butane',
      formula: 'C4H10',
      description: 'Straight 4-carbon alkane chain with maximum surface contact area.',
      boilingPoint: '-0.5°C',
      density: '0.579 g/cm³',
      structureType: 'linear',
      atoms: [
        { id: 'C1', element: 'C', x: 80, y: 150 },
        { id: 'C2', element: 'C', x: 160, y: 120 },
        { id: 'C3', element: 'C', x: 240, y: 150 },
        { id: 'C4', element: 'C', x: 320, y: 120 },
        // Hydrogens
        { id: 'H1', element: 'H', x: 80, y: 90 },
        { id: 'H2', element: 'H', x: 40, y: 150 },
        { id: 'H3', element: 'H', x: 80, y: 210 },
        { id: 'H4', element: 'H', x: 160, y: 60 },
        { id: 'H5', element: 'H', x: 160, y: 180 },
        { id: 'H6', element: 'H', x: 240, y: 90 },
        { id: 'H7', element: 'H', x: 240, y: 210 },
        { id: 'H8', element: 'H', x: 320, y: 60 },
        { id: 'H9', element: 'H', x: 360, y: 120 },
        { id: 'H10', element: 'H', x: 320, y: 180 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 1 },
        { id: 'b-c3c4', atomAId: 'C3', atomBId: 'C4', order: 1 },
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c2h5', atomAId: 'C2', atomBId: 'H5', order: 1 },
        { id: 'b-c3h6', atomAId: 'C3', atomBId: 'H6', order: 1 },
        { id: 'b-c3h7', atomAId: 'C3', atomBId: 'H7', order: 1 },
        { id: 'b-c4h8', atomAId: 'C4', atomBId: 'H8', order: 1 },
        { id: 'b-c4h9', atomAId: 'C4', atomBId: 'H9', order: 1 },
        { id: 'b-c4h10', atomAId: 'C4', atomBId: 'H10', order: 1 },
      ],
    },
    molB: {
      id: 'isobutane',
      name: 'Isobutane (2-Methylpropane)',
      iupacName: '2-Methylpropane',
      formula: 'C4H10',
      description: 'Branched alkane with 3 methyl groups bonded to a central CH carbon.',
      boilingPoint: '-11.7°C',
      density: '0.551 g/cm³',
      structureType: 'branched',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 160 },
        { id: 'C2', element: 'C', x: 200, y: 160 },
        { id: 'C3', element: 'C', x: 300, y: 160 },
        { id: 'C4', element: 'C', x: 200, y: 70 }, // branch
        // Hydrogens
        { id: 'H1', element: 'H', x: 60, y: 160 },
        { id: 'H2', element: 'H', x: 100, y: 110 },
        { id: 'H3', element: 'H', x: 100, y: 210 },
        { id: 'H4', element: 'H', x: 200, y: 220 }, // single H on central C2
        { id: 'H5', element: 'H', x: 340, y: 160 },
        { id: 'H6', element: 'H', x: 300, y: 110 },
        { id: 'H7', element: 'H', x: 300, y: 210 },
        { id: 'H8', element: 'H', x: 150, y: 40 },
        { id: 'H9', element: 'H', x: 200, y: 20 },
        { id: 'H10', element: 'H', x: 250, y: 40 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 1 },
        { id: 'b-c2c4', atomAId: 'C2', atomBId: 'C4', order: 1 }, // branch bond
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c3h5', atomAId: 'C3', atomBId: 'H5', order: 1 },
        { id: 'b-c3h6', atomAId: 'C3', atomBId: 'H6', order: 1 },
        { id: 'b-c3h7', atomAId: 'C3', atomBId: 'H7', order: 1 },
        { id: 'b-c4h8', atomAId: 'C4', atomBId: 'H8', order: 1 },
        { id: 'b-c4h9', atomAId: 'C4', atomBId: 'H9', order: 1 },
        { id: 'b-c4h10', atomAId: 'C4', atomBId: 'H10', order: 1 },
      ],
    },
  },
  {
    id: 'pair-propanol',
    title: 'Positional Isomerism: 1-Propanol vs 2-Propanol',
    category: 'positional',
    formula: 'C3H8O',
    learningPrompt: 'Observe the hydroxyl (-OH) group: attached to terminal C1 in 1-propanol versus central C2 in 2-propanol (rubbing alcohol).',
    molA: {
      id: '1-propanol',
      name: '1-Propanol (Propan-1-ol)',
      iupacName: 'Propan-1-ol',
      formula: 'C3H8O',
      description: 'Primary alcohol with the -OH functional group located at the terminus (C1).',
      boilingPoint: '97.2°C',
      density: '0.803 g/cm³',
      functionalGroup: 'Primary Alcohol (-OH on C1)',
      structureType: 'functional_chain',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 150 },
        { id: 'C2', element: 'C', x: 180, y: 120 },
        { id: 'C3', element: 'C', x: 260, y: 150 },
        { id: 'O1', element: 'O', x: 340, y: 120 },
        { id: 'H_O', element: 'H', x: 400, y: 140 },
        // Hydrogens
        { id: 'H1', element: 'H', x: 60, y: 150 },
        { id: 'H2', element: 'H', x: 100, y: 90 },
        { id: 'H3', element: 'H', x: 100, y: 210 },
        { id: 'H4', element: 'H', x: 180, y: 60 },
        { id: 'H5', element: 'H', x: 180, y: 180 },
        { id: 'H6', element: 'H', x: 260, y: 90 },
        { id: 'H7', element: 'H', x: 260, y: 210 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 1 },
        { id: 'b-c3o1', atomAId: 'C3', atomBId: 'O1', order: 1 },
        { id: 'b-o1ho', atomAId: 'O1', atomBId: 'H_O', order: 1 },
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c2h5', atomAId: 'C2', atomBId: 'H5', order: 1 },
        { id: 'b-c3h6', atomAId: 'C3', atomBId: 'H6', order: 1 },
        { id: 'b-c3h7', atomAId: 'C3', atomBId: 'H7', order: 1 },
      ],
    },
    molB: {
      id: '2-propanol',
      name: '2-Propanol (Isopropanol)',
      iupacName: 'Propan-2-ol',
      formula: 'C3H8O',
      description: 'Secondary alcohol with the -OH group attached to the central C2 carbon.',
      boilingPoint: '82.6°C',
      density: '0.786 g/cm³',
      functionalGroup: 'Secondary Alcohol (-OH on C2)',
      structureType: 'functional_chain',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 150 },
        { id: 'C2', element: 'C', x: 200, y: 150 },
        { id: 'C3', element: 'C', x: 300, y: 150 },
        { id: 'O1', element: 'O', x: 200, y: 70 }, // -OH on central C2
        { id: 'H_O', element: 'H', x: 260, y: 50 },
        // Hydrogens
        { id: 'H1', element: 'H', x: 60, y: 150 },
        { id: 'H2', element: 'H', x: 100, y: 90 },
        { id: 'H3', element: 'H', x: 100, y: 210 },
        { id: 'H4', element: 'H', x: 200, y: 210 }, // single H on central C2
        { id: 'H5', element: 'H', x: 340, y: 150 },
        { id: 'H6', element: 'H', x: 300, y: 90 },
        { id: 'H7', element: 'H', x: 300, y: 210 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 1 },
        { id: 'b-c2o1', atomAId: 'C2', atomBId: 'O1', order: 1 }, // attached to C2
        { id: 'b-o1ho', atomAId: 'O1', atomBId: 'H_O', order: 1 },
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c3h5', atomAId: 'C3', atomBId: 'H5', order: 1 },
        { id: 'b-c3h6', atomAId: 'C3', atomBId: 'H6', order: 1 },
        { id: 'b-c3h7', atomAId: 'C3', atomBId: 'H7', order: 1 },
      ],
    },
  },
  {
    id: 'pair-ethanol-ether',
    title: 'Functional Group Isomerism: Ethanol vs Dimethyl Ether',
    category: 'functional',
    formula: 'C2H6O',
    learningPrompt: 'Both molecules have exactly C2H6O, but ethanol is a liquid alcohol (bp 78°C) while dimethyl ether is a flammable gas (bp -24°C)!',
    molA: {
      id: 'ethanol',
      name: 'Ethanol',
      iupacName: 'Ethanol',
      formula: 'C2H6O',
      description: 'Liquid alcohol capable of intermolecular hydrogen bonding via its -OH group.',
      boilingPoint: '78.4°C',
      density: '0.789 g/cm³',
      functionalGroup: 'Alcohol (-OH)',
      structureType: 'functional_chain',
      atoms: [
        { id: 'C1', element: 'C', x: 120, y: 150 },
        { id: 'C2', element: 'C', x: 220, y: 150 },
        { id: 'O1', element: 'O', x: 300, y: 110 },
        { id: 'H_O', element: 'H', x: 360, y: 130 },
        // Hydrogens
        { id: 'H1', element: 'H', x: 70, y: 150 },
        { id: 'H2', element: 'H', x: 120, y: 90 },
        { id: 'H3', element: 'H', x: 120, y: 210 },
        { id: 'H4', element: 'H', x: 220, y: 90 },
        { id: 'H5', element: 'H', x: 220, y: 210 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2o1', atomAId: 'C2', atomBId: 'O1', order: 1 },
        { id: 'b-o1ho', atomAId: 'O1', atomBId: 'H_O', order: 1 },
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c2h5', atomAId: 'C2', atomBId: 'H5', order: 1 },
      ],
    },
    molB: {
      id: 'dimethyl-ether',
      name: 'Dimethyl Ether',
      iupacName: 'Methoxymethane',
      formula: 'C2H6O',
      description: 'Symmetric ether with oxygen bridging two methyl groups (C-O-C). Cannot H-bond with itself.',
      boilingPoint: '-24.0°C',
      density: '0.668 g/cm³',
      functionalGroup: 'Ether (C-O-C)',
      structureType: 'functional_chain',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 150 },
        { id: 'O1', element: 'O', x: 200, y: 120 }, // Central bridging oxygen
        { id: 'C2', element: 'C', x: 300, y: 150 },
        // Hydrogens on C1
        { id: 'H1', element: 'H', x: 60, y: 150 },
        { id: 'H2', element: 'H', x: 100, y: 90 },
        { id: 'H3', element: 'H', x: 100, y: 210 },
        // Hydrogens on C2
        { id: 'H4', element: 'H', x: 340, y: 150 },
        { id: 'H5', element: 'H', x: 300, y: 90 },
        { id: 'H6', element: 'H', x: 300, y: 210 },
      ],
      bonds: [
        { id: 'b-c1o1', atomAId: 'C1', atomBId: 'O1', order: 1 },
        { id: 'b-o1c2', atomAId: 'O1', atomBId: 'C2', order: 1 },
        { id: 'b-c1h1', atomAId: 'C1', atomBId: 'H1', order: 1 },
        { id: 'b-c1h2', atomAId: 'C1', atomBId: 'H2', order: 1 },
        { id: 'b-c1h3', atomAId: 'C1', atomBId: 'H3', order: 1 },
        { id: 'b-c2h4', atomAId: 'C2', atomBId: 'H4', order: 1 },
        { id: 'b-c2h5', atomAId: 'C2', atomBId: 'H5', order: 1 },
        { id: 'b-c2h6', atomAId: 'C2', atomBId: 'H6', order: 1 },
      ],
    },
  },
  {
    id: 'pair-butene-geom',
    title: 'Geometric Stereoisomerism: Cis-2-Butene vs Trans-2-Butene',
    category: 'stereoisomer',
    formula: 'C4H8',
    learningPrompt: 'The C=C double bond cannot rotate. Notice how the two methyl (-CH3) groups are locked on the same side (cis) vs opposite sides (trans).',
    molA: {
      id: 'cis-2-butene',
      name: 'cis-2-Butene',
      iupacName: '(2Z)-But-2-ene',
      formula: 'C4H8',
      description: 'Both methyl groups positioned on the SAME side of the rigid double bond plane (Z isomer). Polar.',
      boilingPoint: '3.7°C',
      density: '0.621 g/cm³',
      geometry: 'cis',
      structureType: 'geometric',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 90 }, // Top left CH3
        { id: 'C2', element: 'C', x: 160, y: 150 }, // C=C left
        { id: 'C3', element: 'C', x: 260, y: 150 }, // C=C right
        { id: 'C4', element: 'C', x: 320, y: 90 }, // Top right CH3 (same side!)
        { id: 'H2', element: 'H', x: 130, y: 210 }, // Bottom H
        { id: 'H3', element: 'H', x: 290, y: 210 }, // Bottom H
        // CH3 hydrogens
        { id: 'H1a', element: 'H', x: 60, y: 90 },
        { id: 'H1b', element: 'H', x: 100, y: 40 },
        { id: 'H1c', element: 'H', x: 130, y: 60 },
        { id: 'H4a', element: 'H', x: 360, y: 90 },
        { id: 'H4b', element: 'H', x: 320, y: 40 },
        { id: 'H4c', element: 'H', x: 290, y: 60 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 2 }, // C=C Double bond!
        { id: 'b-c3c4', atomAId: 'C3', atomBId: 'C4', order: 1 },
        { id: 'b-c2h2', atomAId: 'C2', atomBId: 'H2', order: 1 },
        { id: 'b-c3h3', atomAId: 'C3', atomBId: 'H3', order: 1 },
        { id: 'b-c1h1a', atomAId: 'C1', atomBId: 'H1a', order: 1 },
        { id: 'b-c1h1b', atomAId: 'C1', atomBId: 'H1b', order: 1 },
        { id: 'b-c1h1c', atomAId: 'C1', atomBId: 'H1c', order: 1 },
        { id: 'b-c4h4a', atomAId: 'C4', atomBId: 'H4a', order: 1 },
        { id: 'b-c4h4b', atomAId: 'C4', atomBId: 'H4b', order: 1 },
        { id: 'b-c4h4c', atomAId: 'C4', atomBId: 'H4c', order: 1 },
      ],
    },
    molB: {
      id: 'trans-2-butene',
      name: 'trans-2-Butene',
      iupacName: '(2E)-But-2-ene',
      formula: 'C4H8',
      description: 'Methyl groups locked on OPPOSITE sides across the double bond (E isomer). Nonpolar and more stable.',
      boilingPoint: '0.9°C',
      density: '0.604 g/cm³',
      geometry: 'trans',
      structureType: 'geometric',
      atoms: [
        { id: 'C1', element: 'C', x: 100, y: 90 }, // Top left CH3
        { id: 'C2', element: 'C', x: 160, y: 150 }, // C=C left
        { id: 'C3', element: 'C', x: 260, y: 150 }, // C=C right
        { id: 'C4', element: 'C', x: 320, y: 210 }, // Bottom right CH3 (opposite side!)
        { id: 'H2', element: 'H', x: 130, y: 210 }, // Bottom H
        { id: 'H3', element: 'H', x: 290, y: 90 }, // Top H
        // CH3 hydrogens
        { id: 'H1a', element: 'H', x: 60, y: 90 },
        { id: 'H1b', element: 'H', x: 100, y: 40 },
        { id: 'H1c', element: 'H', x: 130, y: 60 },
        { id: 'H4a', element: 'H', x: 360, y: 210 },
        { id: 'H4b', element: 'H', x: 320, y: 260 },
        { id: 'H4c', element: 'H', x: 290, y: 240 },
      ],
      bonds: [
        { id: 'b-c1c2', atomAId: 'C1', atomBId: 'C2', order: 1 },
        { id: 'b-c2c3', atomAId: 'C2', atomBId: 'C3', order: 2 }, // C=C Double bond!
        { id: 'b-c3c4', atomAId: 'C3', atomBId: 'C4', order: 1 },
        { id: 'b-c2h2', atomAId: 'C2', atomBId: 'H2', order: 1 },
        { id: 'b-c3h3', atomAId: 'C3', atomBId: 'H3', order: 1 },
        { id: 'b-c1h1a', atomAId: 'C1', atomBId: 'H1a', order: 1 },
        { id: 'b-c1h1b', atomAId: 'C1', atomBId: 'H1b', order: 1 },
        { id: 'b-c1h1c', atomAId: 'C1', atomBId: 'H1c', order: 1 },
        { id: 'b-c4h4a', atomAId: 'C4', atomBId: 'H4a', order: 1 },
        { id: 'b-c4h4b', atomAId: 'C4', atomBId: 'H4b', order: 1 },
        { id: 'b-c4h4c', atomAId: 'C4', atomBId: 'H4c', order: 1 },
      ],
    },
  },
];

// ==========================================
// CHALLENGE ITEMS FOR STAGE 4
// ==========================================

export interface IsomerChallengeItem {
  id: string;
  conceptId: string; // 'c-org-12' | 'c-org-13' | 'c-org-14'
  title: string;
  question: string;
  molA: IsomerMolecule;
  molB: IsomerMolecule;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  hint: string;
}

export const STAGE4_CHALLENGES: IsomerChallengeItem[] = [
  {
    id: 'ch-iso-1',
    conceptId: 'c-org-12',
    title: 'Challenge 1: Molecular Formula vs Connectivity',
    question: 'Both butane and 2-methylpropane have the molecular formula C4H10. What is their structural relationship?',
    molA: PRESET_ISOMER_PAIRS[0].molA,
    molB: PRESET_ISOMER_PAIRS[0].molB,
    options: [
      { id: 'opt-a', text: 'They are identical compounds drawn at different angles.', isCorrect: false },
      { id: 'opt-b', text: 'Constitutional (Chain) Isomers: same formula, different carbon connectivity.', isCorrect: true },
      { id: 'opt-c', text: 'Geometric Stereoisomers differing only by double bond rotation.', isCorrect: false },
      { id: 'opt-d', text: 'Different molecular formulas that cannot be compared.', isCorrect: false },
    ],
    explanation: 'Butane is a linear unbranched 4-carbon chain, whereas 2-methylpropane has a branched carbon backbone with 3 carbons in the main chain. They have the same formula (C4H10) but different connectivity: constitutional chain isomers!',
    hint: 'Look at the central carbon in structure B: how many other carbon atoms are bonded directly to it?',
  },
  {
    id: 'ch-iso-2',
    conceptId: 'c-org-13',
    title: 'Challenge 2: Positional Isomerism in Alcohols',
    question: 'How do 1-propanol and 2-propanol differ structurally?',
    molA: PRESET_ISOMER_PAIRS[1].molA,
    molB: PRESET_ISOMER_PAIRS[1].molB,
    options: [
      { id: 'opt-a', text: 'The -OH group is on carbon-1 in 1-propanol, and moved to carbon-2 in 2-propanol.', isCorrect: true },
      { id: 'opt-b', text: '1-propanol has an ether linkage while 2-propanol has an alcohol.', isCorrect: false },
      { id: 'opt-c', text: 'They have different numbers of carbon atoms.', isCorrect: false },
      { id: 'opt-d', text: 'They are stereoisomers that rotate polarized light differently.', isCorrect: false },
    ],
    explanation: 'Both molecules have the identical 3-carbon chain (propane), but the hydroxyl (-OH) functional group is located at position 1 (primary alcohol) vs position 2 (secondary alcohol). This is classic positional isomerism!',
    hint: 'Count the carbons along the chain from left to right to see which carbon atom holds the oxygen.',
  },
  {
    id: 'ch-iso-3',
    conceptId: 'c-org-12',
    title: 'Challenge 3: Functional Group Isomerism',
    question: 'Ethanol (CH3CH2OH) and Dimethyl Ether (CH3OCH3) both have formula C2H6O. Why does ethanol boil at 78°C while dimethyl ether boils at -24°C?',
    molA: PRESET_ISOMER_PAIRS[2].molA,
    molB: PRESET_ISOMER_PAIRS[2].molB,
    options: [
      { id: 'opt-a', text: 'Dimethyl ether has more atoms than ethanol.', isCorrect: false },
      { id: 'opt-b', text: 'Functional group isomerism: ethanol has a polar -OH group that forms hydrogen bonds; ether lacks O-H bonds.', isCorrect: true },
      { id: 'opt-c', text: 'Ethanol has a double bond which increases rigidity.', isCorrect: false },
      { id: 'opt-d', text: 'The boiling point difference is a measurement error; isomers always share boiling points.', isCorrect: false },
    ],
    explanation: 'Even though both possess formula C2H6O, ethanol is an alcohol with an active -OH group capable of strong intermolecular hydrogen bonds, raising its boiling point to 78°C. Dimethyl ether is an ether (C-O-C) with no O-H bonds, so it remains a gas at room temperature!',
    hint: 'Check if there is a hydrogen atom bonded directly to oxygen in structure B.',
  },
  {
    id: 'ch-iso-4',
    conceptId: 'c-org-14',
    title: 'Challenge 4: Rigid Rotation & Geometric Stereoisomerism',
    question: 'Why can cis-2-butene and trans-2-butene NOT interconvert at room temperature simply by rotating?',
    molA: PRESET_ISOMER_PAIRS[3].molA,
    molB: PRESET_ISOMER_PAIRS[3].molB,
    options: [
      { id: 'opt-a', text: 'The C=C double bond contains a pi (π) bond formed by sideways p-orbital overlap that restricts free rotation.', isCorrect: true },
      { id: 'opt-b', text: 'Hydrogen atoms are too massive to swing past each other.', isCorrect: false },
      { id: 'opt-c', text: 'Single sigma bonds lock molecules into permanent angles.', isCorrect: false },
      { id: 'opt-d', text: 'They do freely rotate; cis and trans are identical conformers.', isCorrect: false },
    ],
    explanation: 'The pi (π) orbital overlap in the carbon-carbon double bond requires ~260 kJ/mol of energy to break, preventing free rotation at room temperature. This locks the substituents in fixed spatial orientations: cis (same side) vs trans (opposite side)!',
    hint: 'Think about orbital hybridization: what kind of bond is formed by sideways overlap of unhybridized 2p orbitals?',
  },
  {
    id: 'ch-iso-5',
    conceptId: 'c-org-13',
    title: 'Challenge 5: Constitutional vs Conformation Invariance',
    question: 'If you rotate a single C-C bond in n-butane so the chain forms a U-shape instead of a zig-zag, is the result an isomer?',
    molA: PRESET_ISOMER_PAIRS[0].molA,
    molB: PRESET_ISOMER_PAIRS[0].molA, // Same molecule!
    options: [
      { id: 'opt-a', text: 'Yes, it becomes isobutane because the shape changed.', isCorrect: false },
      { id: 'opt-b', text: 'No, it is the same molecule in a different conformation; single bonds rotate freely without altering connectivity.', isCorrect: true },
      { id: 'opt-c', text: 'Yes, it is a stereoisomer because its dihedral angle changed.', isCorrect: false },
      { id: 'opt-d', text: 'No, rotating single bonds breaks covalent bonds.', isCorrect: false },
    ],
    explanation: 'Constitutional isomers REQUIRE breaking and reforming covalent bonds to alter atomic connectivity. Merely rotating around flexible single C-C sigma bonds creates conformers of the SAME chemical molecule!',
    hint: 'Did any covalent bonds break when the single bond rotated?',
  },
  {
    id: 'ch-iso-6',
    conceptId: 'c-org-12',
    title: 'Challenge 6: Pentane Isomer Count (C5H12)',
    question: 'For the alkane formula C5H12, how many constitutional isomers exist in nature?',
    molA: PRESET_ISOMER_PAIRS[0].molA,
    molB: PRESET_ISOMER_PAIRS[0].molB,
    options: [
      { id: 'opt-a', text: 'Only 1 (alkanes cannot have isomers).', isCorrect: false },
      { id: 'opt-b', text: 'Exactly 2 (pentane and isopentane).', isCorrect: false },
      { id: 'opt-c', text: 'Exactly 3 (n-pentane, 2-methylbutane/isopentane, and 2,2-dimethylpropane/neopentane).', isCorrect: true },
      { id: 'opt-d', text: 'Infinite isomers due to continuous chain bending.', isCorrect: false },
    ],
    explanation: 'C5H12 yields exactly 3 constitutional isomers: 1) n-pentane (linear 5C), 2) isopentane (4C chain with 1 methyl branch at C2), and 3) neopentane (3C chain with 2 methyl branches at C2). All three have formula C5H12 but distinct topological connectivity!',
    hint: 'Consider how many methyl branches can be placed on a 3-carbon or 4-carbon chain while obeying carbon valence 4.',
  },
];
