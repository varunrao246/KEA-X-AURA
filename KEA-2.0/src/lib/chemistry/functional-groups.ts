/**
 * KEA Platform — Deterministic Functional Groups Engine (Stage 3)
 *
 * Rules:
 * 1. Heteroatom valences strictly enforced:
 *    - Oxygen (O): max valence 2, 2 lone pairs
 *    - Nitrogen (N): max valence 3, 1 lone pair
 *    - Carbon (C): max valence 4
 *    - Hydrogen (H): max valence 1
 * 2. Deterministic identification of functional groups:
 *    - Alcohol: -OH group attached to carbon
 *    - Aldehyde: C=O group with at least one H on the carbonyl carbon (terminal -CHO)
 *    - Ketone: C=O group bonded to two carbon atoms (internal -CO-)
 *    - Carboxylic Acid: -COOH group (carbonyl C=O and hydroxyl -OH on the same carbon)
 *    - Amine: -NH2 (or -NHR/-NR2) group with trivalent nitrogen
 * 3. All validation is deterministic — no LLM guessing.
 * 4. Reuses existing Atom, Bond, Molecule, and ElementSymbol from types.ts.
 */

import { ElementSymbol, Molecule } from './types';
import { calculateAtomValence, MAX_VALENCE_MAP } from './molecule-validator';

export type FunctionalGroupFamily =
  | 'alcohol'
  | 'aldehyde'
  | 'ketone'
  | 'carboxylic_acid'
  | 'amine'
  | 'alkane'
  | 'alkene'
  | 'alkyne'
  | 'unknown';

export interface FunctionalGroupProfile {
  id: string;
  name: string;
  formulaSuffix: string;
  generalFormula: string;
  heteroatom: ElementSymbol;
  keyBond: string;
  polarity: 'high' | 'medium' | 'low';
  exampleMoleculeName: string;
  exampleFormula: string;
  description: string;
  properties: string[];
}

export const FUNCTIONAL_GROUPS_CATALOG: Record<FunctionalGroupFamily, FunctionalGroupProfile | null> = {
  alcohol: {
    id: 'fg-alcohol',
    name: 'Alcohol',
    formulaSuffix: '-ol',
    generalFormula: 'R—OH',
    heteroatom: 'O',
    keyBond: 'C—O—H (single bond to oxygen)',
    polarity: 'high',
    exampleMoleculeName: 'Ethanol',
    exampleFormula: 'C2H5OH',
    description: 'Contains a polar hydroxyl group (-OH) capable of hydrogen bonding, significantly raising boiling points.',
    properties: ['Hydrogen bonding', 'Water soluble (short chain)', 'High boiling point'],
  },
  aldehyde: {
    id: 'fg-aldehyde',
    name: 'Aldehyde',
    formulaSuffix: '-al',
    generalFormula: 'R—CH=O',
    heteroatom: 'O',
    keyBond: 'C=O (terminal carbonyl with H)',
    polarity: 'high',
    exampleMoleculeName: 'Acetaldehyde (Ethanal)',
    exampleFormula: 'CH3CHO',
    description: 'Features a carbonyl double bond (C=O) at the end of the carbon chain with at least one bonded hydrogen.',
    properties: ['Electrophilic carbonyl carbon', 'Readily oxidizes to carboxylic acid', 'Fruity/pungent odor'],
  },
  ketone: {
    id: 'fg-ketone',
    name: 'Ketone',
    formulaSuffix: '-one',
    generalFormula: 'R—C(=O)—R\'',
    heteroatom: 'O',
    keyBond: 'C=O (internal carbonyl between two carbons)',
    polarity: 'high',
    exampleMoleculeName: 'Acetone (Propanone)',
    exampleFormula: 'CH3COCH3',
    description: 'Possesses an internal carbonyl (C=O) flanked by two carbon atoms; widely used as an organic solvent.',
    properties: ['Dipolar solvent', 'Resistant to mild oxidation', 'Planar trigonal carbonyl geometry'],
  },
  carboxylic_acid: {
    id: 'fg-acid',
    name: 'Carboxylic Acid',
    formulaSuffix: '-oic acid',
    generalFormula: 'R—COOH',
    heteroatom: 'O',
    keyBond: 'O=C—O—H (carbonyl + hydroxyl on same C)',
    polarity: 'high',
    exampleMoleculeName: 'Acetic Acid (Ethanoic Acid)',
    exampleFormula: 'CH3COOH',
    description: 'Combines a carbonyl (C=O) and hydroxyl (-OH) on the same carbon, creating acidic protons that dissociate in water.',
    properties: ['Acidic proton donation (pKa ~ 4.76)', 'Strong dimeric hydrogen bonds', 'Sour taste / vinegar smell'],
  },
  amine: {
    id: 'fg-amine',
    name: 'Amine',
    formulaSuffix: '-amine',
    generalFormula: 'R—NH2',
    heteroatom: 'N',
    keyBond: 'C—N—H (trivalent nitrogen with lone pair)',
    polarity: 'medium',
    exampleMoleculeName: 'Methylamine',
    exampleFormula: 'CH3NH2',
    description: 'Derived from ammonia where carbon replaces hydrogen; the nitrogen lone pair acts as an organic base (proton acceptor).',
    properties: ['Basic (lone pair accepts H+)', 'Forms hydrogen bonds', 'Fishy odor'],
  },
  alkane: null,
  alkene: null,
  alkyne: null,
  unknown: null,
};

export interface FunctionalGroupDetectionResult {
  detectedGroups: FunctionalGroupFamily[];
  hasAlcohol: boolean;
  hasAldehyde: boolean;
  hasKetone: boolean;
  hasCarboxylicAcid: boolean;
  hasAmine: boolean;
  oxygenValenceValid: boolean;
  nitrogenValenceValid: boolean;
  explanation: string;
}

/**
 * Deterministically analyzes molecule connectivity and identifies present functional groups.
 */
export function detectFunctionalGroups(molecule: Molecule): FunctionalGroupDetectionResult {
  const groups: Set<FunctionalGroupFamily> = new Set();
  let oxygenValid = true;
  let nitrogenValid = true;

  // Check heteroatom valences
  for (const atom of molecule.atoms) {
    const val = calculateAtomValence(molecule, atom.id);
    if (atom.element === 'O' && val > MAX_VALENCE_MAP.O) {
      oxygenValid = false;
    }
    if (atom.element === 'N' && val > MAX_VALENCE_MAP.N) {
      nitrogenValid = false;
    }
  }

  // Find all carbon atoms
  const carbons = molecule.atoms.filter((a) => a.element === 'C');

  for (const carbon of carbons) {
    // Find all bonds connected to this carbon
    const cBonds = molecule.bonds.filter(
      (b) => b.atomAId === carbon.id || b.atomBId === carbon.id
    );

    const neighbors = cBonds.map((b) => {
      const neighborId = b.atomAId === carbon.id ? b.atomBId : b.atomAId;
      const neighborAtom = molecule.atoms.find((a) => a.id === neighborId);
      return { bond: b, atom: neighborAtom };
    });

    const oxygens = neighbors.filter((n) => n.atom?.element === 'O');
    const doubleBondO = oxygens.find((n) => n.bond.order === 2);
    const singleBondO = oxygens.filter((n) => n.bond.order === 1);
    const nitrogen = neighbors.find((n) => n.atom?.element === 'N');
    const carbonNeighbors = neighbors.filter((n) => n.atom?.element === 'C');
    const hydrogenNeighbors = neighbors.filter((n) => n.atom?.element === 'H');

    // Carboxylic Acid check: Carbon has BOTH a C=O double bond AND a C-O single bond
    if (doubleBondO && singleBondO.length > 0) {
      groups.add('carboxylic_acid');
      continue;
    }

    // Carbonyl check (C=O without adjacent single-bonded oxygen)
    if (doubleBondO && singleBondO.length === 0) {
      // If carbon is bonded to at least one H -> Aldehyde
      if (hydrogenNeighbors.length >= 1) {
        groups.add('aldehyde');
      } else if (carbonNeighbors.length >= 2) {
        // Flanked by 2 carbons -> Ketone
        groups.add('ketone');
      } else {
        // Fallback default for carbonyl
        groups.add('aldehyde');
      }
    }

    // Alcohol check: Carbon has single-bonded oxygen without C=O double bond on this carbon
    if (!doubleBondO && singleBondO.length > 0) {
      groups.add('alcohol');
    }

    // Amine check: Carbon has single bond to Nitrogen
    if (nitrogen) {
      groups.add('amine');
    }
  }

  const detectedList = Array.from(groups);

  const explanations: string[] = [];
  if (detectedList.includes('carboxylic_acid')) explanations.push('Carboxylic acid (-COOH) center confirmed.');
  if (detectedList.includes('alcohol')) explanations.push('Hydroxyl (-OH) alcohol group confirmed.');
  if (detectedList.includes('aldehyde')) explanations.push('Terminal carbonyl (-CHO) aldehyde confirmed.');
  if (detectedList.includes('ketone')) explanations.push('Internal carbonyl (-CO-) ketone confirmed.');
  if (detectedList.includes('amine')) explanations.push('Amine (-NH2) nitrogen center confirmed.');

  return {
    detectedGroups: detectedList,
    hasAlcohol: detectedList.includes('alcohol'),
    hasAldehyde: detectedList.includes('aldehyde'),
    hasKetone: detectedList.includes('ketone'),
    hasCarboxylicAcid: detectedList.includes('carboxylic_acid'),
    hasAmine: detectedList.includes('amine'),
    oxygenValenceValid: oxygenValid,
    nitrogenValenceValid: nitrogenValid,
    explanation: explanations.join(' ') || 'No recognized heteroatom functional groups detected.',
  };
}

/**
 * Stage 3 Interactive Challenge Item Definition
 */
export interface FunctionalGroupChallengeItem {
  id: string;
  name: string;
  formula: string;
  commonName: string;
  correctGroup: FunctionalGroupFamily;
  distractors: FunctionalGroupFamily[];
  highlightCenterText: string;
  hint: string;
  explanation: string;
  svgMoleculeType: 'ethanol' | 'acetone' | 'acetic_acid' | 'methylamine' | 'acetaldehyde' | 'isopropanol';
}

export const STAGE_3_CHALLENGES: FunctionalGroupChallengeItem[] = [
  {
    id: 'ch-fg-1',
    name: 'Ethanol',
    commonName: 'Grain Alcohol',
    formula: 'CH3—CH2—OH',
    correctGroup: 'alcohol',
    distractors: ['aldehyde', 'ketone', 'carboxylic_acid'],
    highlightCenterText: '-OH group on terminal sp3 carbon',
    hint: 'Look at the oxygen: it has a single bond to carbon and a single bond to hydrogen (O-H).',
    explanation: 'The presence of the single-bonded hydroxyl (-OH) group defines this molecule as an alcohol.',
    svgMoleculeType: 'ethanol',
  },
  {
    id: 'ch-fg-2',
    name: 'Acetone',
    commonName: 'Propan-2-one (Nail Polish Remover)',
    formula: 'CH3—C(=O)—CH3',
    correctGroup: 'ketone',
    distractors: ['aldehyde', 'alcohol', 'amine'],
    highlightCenterText: 'C=O carbonyl double bond flanked by two -CH3 groups',
    hint: 'The carbonyl (C=O) is located inside the carbon chain, bonded to two other carbons, not on a terminal carbon.',
    explanation: 'A carbonyl double bond (C=O) between two carbon atoms is the signature of a ketone.',
    svgMoleculeType: 'acetone',
  },
  {
    id: 'ch-fg-3',
    name: 'Acetic Acid',
    commonName: 'Ethanoic Acid (Vinegar)',
    formula: 'CH3—C(=O)OH',
    correctGroup: 'carboxylic_acid',
    distractors: ['alcohol', 'ketone', 'aldehyde'],
    highlightCenterText: '-COOH (both C=O and -OH on the same carbon atom)',
    hint: 'Notice that the SAME carbon has both a double-bonded oxygen (=O) and a single-bonded hydroxyl (-OH).',
    explanation: 'When both a carbonyl and a hydroxyl group are attached to the same carbon atom, it is a carboxylic acid (-COOH).',
    svgMoleculeType: 'acetic_acid',
  },
  {
    id: 'ch-fg-4',
    name: 'Methylamine',
    commonName: 'Aminomethane',
    formula: 'CH3—NH2',
    correctGroup: 'amine',
    distractors: ['alcohol', 'carboxylic_acid', 'aldehyde'],
    highlightCenterText: '-NH2 amino group bonded to carbon',
    hint: 'Identify the heteroatom: it is a Nitrogen atom (N) with two hydrogens, acting as an organic base.',
    explanation: 'Nitrogen bonded to an alkyl group creates an amine (-NH2), capable of accepting a proton using its lone pair.',
    svgMoleculeType: 'methylamine',
  },
  {
    id: 'ch-fg-5',
    name: 'Acetaldehyde',
    commonName: 'Ethanal',
    formula: 'CH3—CH=O',
    correctGroup: 'aldehyde',
    distractors: ['ketone', 'alcohol', 'carboxylic_acid'],
    highlightCenterText: 'Terminal -CH=O carbonyl with a bonded hydrogen',
    hint: 'The C=O carbonyl is at the end of the chain, directly attached to a hydrogen atom (H-C=O).',
    explanation: 'A carbonyl group at the terminal position bonded to at least one hydrogen is an aldehyde (-CHO).',
    svgMoleculeType: 'acetaldehyde',
  },
  {
    id: 'ch-fg-6',
    name: 'Isopropanol',
    commonName: 'Rubbing Alcohol (Propan-2-ol)',
    formula: 'CH3—CH(OH)—CH3',
    correctGroup: 'alcohol',
    distractors: ['ketone', 'aldehyde', 'amine'],
    highlightCenterText: '-OH group attached to the central secondary carbon',
    hint: 'Even though the -OH is on the middle carbon, notice the oxygen only has single bonds (C-O-H). No C=O is present.',
    explanation: 'A single-bonded -OH group attached to an sp3 hybridized carbon classifies the molecule as a secondary alcohol.',
    svgMoleculeType: 'isopropanol',
  },
];
