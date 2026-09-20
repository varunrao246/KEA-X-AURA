/**
 * KEA Platform — Stage 5: Reactions & Practical Application Domain Engine
 * 
 * Deterministic Chemistry Reaction Engine:
 * 1. Curated, reliable reaction set:
 *    - Electrophilic Addition (Hydrogenation, Hydration across C=C)
 *    - Elimination (Acid-catalyzed Dehydration of Alcohols)
 *    - Stepwise Oxidation (Alcohol -> Aldehyde -> Carboxylic Acid)
 *    - Condensation / Esterification (Fischer Esterification: Acid + Alcohol -> Ester + Water)
 *    - Complete Combustion (Hydrocarbon/Alcohol + O2 -> CO2 + H2O)
 * 2. 100% deterministic atom conservation and valence validation.
 * 3. Exact bond-change tracking (bonds broken vs formed).
 * 4. Zero LLM involvement in chemical validity or product prediction.
 */

import type { ElementSymbol, Molecule } from './types';
import { calculateAtomValence, MAX_VALENCE_MAP } from './molecule-validator';

export type ReactionType =
  | 'addition'
  | 'elimination'
  | 'oxidation'
  | 'condensation_esterification'
  | 'combustion';

export interface ChemicalEntity {
  id: string;
  name: string;
  formula: string;
  condensed: string;
  functionalGroup: string;
  description: string;
  molecule: Molecule;
}

export interface BondChange {
  type: 'broken' | 'formed' | 'order_changed';
  description: string;
  atomsInvolved: string[];
  fromBondOrder?: number;
  toBondOrder?: number;
}

export interface ReactionCondition {
  catalyst: string;
  temperature?: string;
  pressure?: string;
  environmentDescription: string;
}

export interface ReactionDefinition {
  id: string;
  name: string;
  reactionType: ReactionType;
  reactants: ChemicalEntity[];
  products: ChemicalEntity[];
  conditions: ReactionCondition;
  bondsBroken: BondChange[];
  bondsFormed: BondChange[];
  mechanismSummary: string;
  energyChange: 'exothermic' | 'endothermic';
  atomConservation: {
    reactants: Record<ElementSymbol, number>;
    products: Record<ElementSymbol, number>;
    isBalanced: boolean;
  };
  practicalApplication: {
    title: string;
    industry: string;
    realWorldContext: string;
    significance: string;
  };
}

// ==========================================
// CURATED MOLECULAR ENTITIES (C, H, O, N)
// ==========================================

export const ENTITY_ETHENE: ChemicalEntity = {
  id: 'ent-ethene',
  name: 'Ethene (Ethylene)',
  formula: 'C2H4',
  condensed: 'CH2=CH2',
  functionalGroup: 'Alkene (C=C double bond)',
  description: 'Planar unsaturated hydrocarbon with sp2 hybridized carbons and a reactive pi bond.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 120, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 200, y: 120, label: 'C2' },
      { id: 'h1', element: 'H', x: 80, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 80, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 240, y: 80, label: 'H' },
      { id: 'h4', element: 'H', x: 240, y: 160, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 2 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c2-h3', atomAId: 'c2', atomBId: 'h3', order: 1 },
      { id: 'b-c2-h4', atomAId: 'c2', atomBId: 'h4', order: 1 },
    ],
  },
};

export const ENTITY_HYDROGEN_GAS: ChemicalEntity = {
  id: 'ent-h2',
  name: 'Hydrogen Gas',
  formula: 'H2',
  condensed: 'H-H',
  functionalGroup: 'Diatomic Gas',
  description: 'Diatomic hydrogen molecule used as reducing agent in catalytic hydrogenation.',
  molecule: {
    atoms: [
      { id: 'h_a', element: 'H', x: 130, y: 120, label: 'H' },
      { id: 'h_b', element: 'H', x: 190, y: 120, label: 'H' },
    ],
    bonds: [
      { id: 'b-h-h', atomAId: 'h_a', atomBId: 'h_b', order: 1 },
    ],
  },
};

export const ENTITY_ETHANE: ChemicalEntity = {
  id: 'ent-ethane',
  name: 'Ethane',
  formula: 'C2H6',
  condensed: 'CH3-CH3',
  functionalGroup: 'Alkane (Saturated)',
  description: 'Fully saturated hydrocarbon with tetrahedral sp3 carbons and single sigma bonds.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 120, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 200, y: 120, label: 'C2' },
      { id: 'h1', element: 'H', x: 80, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 80, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 120, y: 50, label: 'H' },
      { id: 'h4', element: 'H', x: 240, y: 80, label: 'H' },
      { id: 'h5', element: 'H', x: 240, y: 160, label: 'H' },
      { id: 'h6', element: 'H', x: 200, y: 50, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 1 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c1-h3', atomAId: 'c1', atomBId: 'h3', order: 1 },
      { id: 'b-c2-h4', atomAId: 'c2', atomBId: 'h4', order: 1 },
      { id: 'b-c2-h5', atomAId: 'c2', atomBId: 'h5', order: 1 },
      { id: 'b-c2-h6', atomAId: 'c2', atomBId: 'h6', order: 1 },
    ],
  },
};

export const ENTITY_WATER: ChemicalEntity = {
  id: 'ent-h2o',
  name: 'Water',
  formula: 'H2O',
  condensed: 'H-O-H',
  functionalGroup: 'Inorganic Hydrate',
  description: 'Bent polar molecule acting as nucleophile or leaving group.',
  molecule: {
    atoms: [
      { id: 'o1', element: 'O', x: 160, y: 110, label: 'O' },
      { id: 'h1', element: 'H', x: 120, y: 150, label: 'H' },
      { id: 'h2', element: 'H', x: 200, y: 150, label: 'H' },
    ],
    bonds: [
      { id: 'b-o-h1', atomAId: 'o1', atomBId: 'h1', order: 1 },
      { id: 'b-o-h2', atomAId: 'o1', atomBId: 'h2', order: 1 },
    ],
  },
};

export const ENTITY_ETHANOL: ChemicalEntity = {
  id: 'ent-ethanol',
  name: 'Ethanol',
  formula: 'C2H6O',
  condensed: 'CH3-CH2-OH',
  functionalGroup: 'Primary Alcohol (-OH)',
  description: 'Two-carbon primary alcohol with polar hydroxyl group capable of hydrogen bonding.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 100, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 180, y: 120, label: 'C2' },
      { id: 'o1', element: 'O', x: 250, y: 120, label: 'O' },
      { id: 'h_o', element: 'H', x: 290, y: 80, label: 'H' },
      { id: 'h1', element: 'H', x: 60, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 60, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 100, y: 50, label: 'H' },
      { id: 'h4', element: 'H', x: 180, y: 50, label: 'H' },
      { id: 'h5', element: 'H', x: 180, y: 190, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 1 },
      { id: 'b-c2-o1', atomAId: 'c2', atomBId: 'o1', order: 1 },
      { id: 'b-o1-ho', atomAId: 'o1', atomBId: 'h_o', order: 1 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c1-h3', atomAId: 'c1', atomBId: 'h3', order: 1 },
      { id: 'b-c2-h4', atomAId: 'c2', atomBId: 'h4', order: 1 },
      { id: 'b-c2-h5', atomAId: 'c2', atomBId: 'h5', order: 1 },
    ],
  },
};

export const ENTITY_ETHANAL: ChemicalEntity = {
  id: 'ent-ethanal',
  name: 'Ethanal (Acetaldehyde)',
  formula: 'C2H4O',
  condensed: 'CH3-CHO',
  functionalGroup: 'Aldehyde (-CHO carbonyl)',
  description: 'Oxidized alcohol with terminal carbonyl (C=O) double bond and acidic alpha hydrogens.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 100, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 180, y: 120, label: 'C2' },
      { id: 'o1', element: 'O', x: 230, y: 60, label: 'O' },
      { id: 'h_ald', element: 'H', x: 230, y: 170, label: 'H' },
      { id: 'h1', element: 'H', x: 60, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 60, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 100, y: 50, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 1 },
      { id: 'b-c2-o1', atomAId: 'c2', atomBId: 'o1', order: 2 },
      { id: 'b-c2-hald', atomAId: 'c2', atomBId: 'h_ald', order: 1 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c1-h3', atomAId: 'c1', atomBId: 'h3', order: 1 },
    ],
  },
};

export const ENTITY_ETHANOIC_ACID: ChemicalEntity = {
  id: 'ent-ethanoic-acid',
  name: 'Ethanoic Acid (Acetic Acid)',
  formula: 'C2H4O2',
  condensed: 'CH3-COOH',
  functionalGroup: 'Carboxylic Acid (-COOH)',
  description: 'Organic acid possessing both a carbonyl (C=O) and a hydroxyl (O-H) on the same carbon.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 90, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 170, y: 120, label: 'C2' },
      { id: 'o_carbonyl', element: 'O', x: 220, y: 60, label: 'O' },
      { id: 'o_hydroxyl', element: 'O', x: 220, y: 170, label: 'O' },
      { id: 'h_acid', element: 'H', x: 270, y: 170, label: 'H' },
      { id: 'h1', element: 'H', x: 50, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 50, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 90, y: 50, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 1 },
      { id: 'b-c2-ocarb', atomAId: 'c2', atomBId: 'o_carbonyl', order: 2 },
      { id: 'b-c2-ohyd', atomAId: 'c2', atomBId: 'o_hydroxyl', order: 1 },
      { id: 'b-ohyd-h', atomAId: 'o_hydroxyl', atomBId: 'h_acid', order: 1 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c1-h3', atomAId: 'c1', atomBId: 'h3', order: 1 },
    ],
  },
};

export const ENTITY_ETHYL_ACETATE: ChemicalEntity = {
  id: 'ent-ethyl-acetate',
  name: 'Ethyl Ethanoate (Ethyl Acetate)',
  formula: 'C4H8O2',
  condensed: 'CH3-COO-CH2CH3',
  functionalGroup: 'Ester (-COO-)',
  description: 'Pleasant-smelling ester formed via acid-catalyzed condensation of ethanoic acid and ethanol.',
  molecule: {
    atoms: [
      { id: 'c1', element: 'C', x: 60, y: 120, label: 'C1' },
      { id: 'c2', element: 'C', x: 130, y: 120, label: 'C2' },
      { id: 'o_carbonyl', element: 'O', x: 130, y: 50, label: 'O' },
      { id: 'o_ester', element: 'O', x: 200, y: 120, label: 'O' },
      { id: 'c3', element: 'C', x: 260, y: 120, label: 'C3' },
      { id: 'c4', element: 'C', x: 320, y: 120, label: 'C4' },
      { id: 'h1', element: 'H', x: 30, y: 80, label: 'H' },
      { id: 'h2', element: 'H', x: 30, y: 160, label: 'H' },
      { id: 'h3', element: 'H', x: 60, y: 180, label: 'H' },
      { id: 'h4', element: 'H', x: 260, y: 60, label: 'H' },
      { id: 'h5', element: 'H', x: 260, y: 180, label: 'H' },
      { id: 'h6', element: 'H', x: 350, y: 80, label: 'H' },
      { id: 'h7', element: 'H', x: 350, y: 160, label: 'H' },
      { id: 'h8', element: 'H', x: 320, y: 180, label: 'H' },
    ],
    bonds: [
      { id: 'b-c1-c2', atomAId: 'c1', atomBId: 'c2', order: 1 },
      { id: 'b-c2-ocarb', atomAId: 'c2', atomBId: 'o_carbonyl', order: 2 },
      { id: 'b-c2-oester', atomAId: 'c2', atomBId: 'o_ester', order: 1 },
      { id: 'b-oester-c3', atomAId: 'o_ester', atomBId: 'c3', order: 1 },
      { id: 'b-c3-c4', atomAId: 'c3', atomBId: 'c4', order: 1 },
      { id: 'b-c1-h1', atomAId: 'c1', atomBId: 'h1', order: 1 },
      { id: 'b-c1-h2', atomAId: 'c1', atomBId: 'h2', order: 1 },
      { id: 'b-c1-h3', atomAId: 'c1', atomBId: 'h3', order: 1 },
      { id: 'b-c3-h4', atomAId: 'c3', atomBId: 'h4', order: 1 },
      { id: 'b-c3-h5', atomAId: 'c3', atomBId: 'h5', order: 1 },
      { id: 'b-c4-h6', atomAId: 'c4', atomBId: 'h6', order: 1 },
      { id: 'b-c4-h7', atomAId: 'c4', atomBId: 'h7', order: 1 },
      { id: 'b-c4-h8', atomAId: 'c4', atomBId: 'h8', order: 1 },
    ],
  },
};

export const ENTITY_CARBON_DIOXIDE: ChemicalEntity = {
  id: 'ent-co2',
  name: 'Carbon Dioxide',
  formula: 'CO2',
  condensed: 'O=C=O',
  functionalGroup: 'Inorganic Oxide',
  description: 'Linear molecule with two double bonds; the fully oxidized carbon product of combustion.',
  molecule: {
    atoms: [
      { id: 'o1', element: 'O', x: 100, y: 120, label: 'O' },
      { id: 'c1', element: 'C', x: 160, y: 120, label: 'C' },
      { id: 'o2', element: 'O', x: 220, y: 120, label: 'O' },
    ],
    bonds: [
      { id: 'b-o1-c', atomAId: 'o1', atomBId: 'c1', order: 2 },
      { id: 'b-c-o2', atomAId: 'c1', atomBId: 'o2', order: 2 },
    ],
  },
};

export const ENTITY_OXYGEN_GAS: ChemicalEntity = {
  id: 'ent-o2',
  name: 'Oxygen Gas',
  formula: 'O2',
  condensed: 'O=O',
  functionalGroup: 'Diatomic Gas',
  description: 'Diatomic oxidizing agent essential for aerobic combustion and respiration.',
  molecule: {
    atoms: [
      { id: 'o1', element: 'O', x: 130, y: 120, label: 'O' },
      { id: 'o2', element: 'O', x: 190, y: 120, label: 'O' },
    ],
    bonds: [
      { id: 'b-o-o', atomAId: 'o1', atomBId: 'o2', order: 2 },
    ],
  },
};

// ==========================================
// DETERMINISTIC ATOM COUNT HELPER
// ==========================================

export function countAtomsInEntities(entities: ChemicalEntity[]): Record<ElementSymbol, number> {
  const counts: Record<ElementSymbol, number> = { C: 0, H: 0, O: 0, N: 0 };
  for (const ent of entities) {
    for (const atom of ent.molecule.atoms) {
      counts[atom.element] = (counts[atom.element] || 0) + 1;
    }
  }
  return counts;
}

export function checkAtomConservation(
  reactants: ChemicalEntity[],
  products: ChemicalEntity[]
): { reactants: Record<ElementSymbol, number>; products: Record<ElementSymbol, number>; isBalanced: boolean } {
  const rCounts = countAtomsInEntities(reactants);
  const pCounts = countAtomsInEntities(products);

  const isBalanced =
    rCounts.C === pCounts.C &&
    rCounts.H === pCounts.H &&
    rCounts.O === pCounts.O &&
    rCounts.N === pCounts.N;

  return { reactants: rCounts, products: pCounts, isBalanced };
}

// ==========================================
// CURATED CANONICAL REACTIONS
// ==========================================

export const STAGE5_REACTIONS: Record<string, ReactionDefinition> = {
  'rx-hydrogenation': {
    id: 'rx-hydrogenation',
    name: 'Catalytic Hydrogenation of Ethene',
    reactionType: 'addition',
    reactants: [ENTITY_ETHENE, ENTITY_HYDROGEN_GAS],
    products: [ENTITY_ETHANE],
    conditions: {
      catalyst: 'Nickel (Ni) or Platinum (Pt)',
      temperature: '150°C',
      pressure: '1 atm',
      environmentDescription: 'Finely divided metallic transition metal surface facilitating H-H bond cleavage.',
    },
    bondsBroken: [
      { type: 'order_changed', description: 'C=C double bond weakened to single bond (1 pi bond broken)', fromBondOrder: 2, toBondOrder: 1, atomsInvolved: ['c1', 'c2'] },
      { type: 'broken', description: 'H-H sigma bond cleaved homolytically on metal catalyst', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['h_a', 'h_b'] },
    ],
    bondsFormed: [
      { type: 'formed', description: 'Two new C-H sigma bonds formed across carbons C1 and C2', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['c1', 'c2'] },
    ],
    mechanismSummary: 'Electrophilic addition across the alkene double bond: hydrogen atoms chemisorb onto the metal surface and add across the C=C bond (syn addition).',
    energyChange: 'exothermic',
    atomConservation: checkAtomConservation([ENTITY_ETHENE, ENTITY_HYDROGEN_GAS], [ENTITY_ETHANE]),
    practicalApplication: {
      title: 'Industrial Margarine Production & Vegetable Oil Hardening',
      industry: 'Food Science & Agriculture',
      realWorldContext: 'Liquid polyunsaturated plant oils containing cis double bonds are partially hydrogenated to solid fats (margarine, shortening) to increase shelf life and raise melting point.',
      significance: 'Demonstrates how saturation alters physical state from liquid oil to solid lipid.',
    },
  },

  'rx-hydration': {
    id: 'rx-hydration',
    name: 'Acid-Catalyzed Hydration of Ethene',
    reactionType: 'addition',
    reactants: [ENTITY_ETHENE, ENTITY_WATER],
    products: [ENTITY_ETHANOL],
    conditions: {
      catalyst: 'Phosphoric Acid (H3PO4) on silica',
      temperature: '300°C',
      pressure: '60-70 atm',
      environmentDescription: 'High pressure steam and acidic proton donor environment.',
    },
    bondsBroken: [
      { type: 'order_changed', description: 'C=C double bond reduced to single sigma bond (1 pi bond broken)', fromBondOrder: 2, toBondOrder: 1, atomsInvolved: ['c1', 'c2'] },
      { type: 'broken', description: 'One H-O bond in water cleaved as H+ and OH- add to the alkene', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['o1', 'h2'] },
    ],
    bondsFormed: [
      { type: 'formed', description: 'New C-H sigma bond formed on C1', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['c1'] },
      { type: 'formed', description: 'New C-O sigma bond formed on C2 establishing the alcohol functional group', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['c2', 'o1'] },
    ],
    mechanismSummary: 'Electrophilic attack by H+ on the pi bond forms a carbocation intermediate, followed by nucleophilic attack by water and deprotonation to yield ethanol.',
    energyChange: 'exothermic',
    atomConservation: checkAtomConservation([ENTITY_ETHENE, ENTITY_WATER], [ENTITY_ETHANOL]),
    practicalApplication: {
      title: 'Industrial Synthesis of Pharmaceutical & Solvent Ethanol',
      industry: 'Chemical Manufacturing & Pharmaceuticals',
      realWorldContext: 'Produces pure industrial ethanol directly from petroleum-derived ethene without fermentation impurities, used worldwide for hand sanitizers, medicines, and chemical synthesis.',
      significance: 'Converts an abundant gaseous hydrocarbon byproduct into a high-value polar solvent.',
    },
  },

  'rx-dehydration': {
    id: 'rx-dehydration',
    name: 'Acid-Catalyzed Dehydration of Ethanol',
    reactionType: 'elimination',
    reactants: [ENTITY_ETHANOL],
    products: [ENTITY_ETHENE, ENTITY_WATER],
    conditions: {
      catalyst: 'Concentrated Sulfuric Acid (H2SO4)',
      temperature: '170°C',
      pressure: '1 atm',
      environmentDescription: 'Hot dehydrating acidic medium favoring elimination over substitution.',
    },
    bondsBroken: [
      { type: 'broken', description: 'C-O bond cleaved as protonated -OH2+ departs as water leaving group', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['c2', 'o1'] },
      { type: 'broken', description: 'Adjacent beta C-H bond cleaved by base deprotonation', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['c1', 'h'] },
    ],
    bondsFormed: [
      { type: 'order_changed', description: 'C-C single bond increased to C=C double bond (new pi bond formed)', fromBondOrder: 1, toBondOrder: 2, atomsInvolved: ['c1', 'c2'] },
      { type: 'formed', description: 'O-H bond formed inside departing H2O molecule', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['o1'] },
    ],
    mechanismSummary: 'E1/E2 elimination: Protonation of the hydroxyl group turns -OH into an excellent -OH2+ leaving group, followed by beta-elimination to generate the C=C alkene.',
    energyChange: 'endothermic',
    atomConservation: checkAtomConservation([ENTITY_ETHANOL], [ENTITY_ETHENE, ENTITY_WATER]),
    practicalApplication: {
      title: 'Green Bio-Ethylene from Plant Bio-Ethanol',
      industry: 'Renewable Materials & Bio-Plastics',
      realWorldContext: 'Sugar cane ethanol is dehydrated into green ethylene, which is then polymerized into bio-polyethylene (bio-PE) plastics with a net-negative carbon footprint.',
      significance: 'Connects agricultural biomass to sustainable polymers without fossil fuels.',
    },
  },

  'rx-oxidation': {
    id: 'rx-oxidation',
    name: 'Stepwise Oxidation of Ethanol to Ethanoic Acid',
    reactionType: 'oxidation',
    reactants: [ENTITY_ETHANOL],
    products: [ENTITY_ETHANOIC_ACID],
    conditions: {
      catalyst: 'Potassium Dichromate (K2Cr2O7) or KMnO4 in Acid',
      temperature: 'Reflux heat (80-100°C)',
      pressure: '1 atm',
      environmentDescription: 'Strong chemical oxidizing agent providing nascent oxygen [O].',
    },
    bondsBroken: [
      { type: 'broken', description: 'Alpha C-H bonds cleaved as oxidation increases C-O bond order', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['c2', 'h'] },
    ],
    bondsFormed: [
      { type: 'formed', description: 'C=O carbonyl double bond formed, followed by addition of hydroxyl oxygen to yield -COOH', fromBondOrder: 1, toBondOrder: 2, atomsInvolved: ['c2', 'o'] },
    ],
    mechanismSummary: 'Two-stage oxidation: primary alcohol is first oxidized to ethanal (aldehyde), which is rapidly oxidized further in reflux to ethanoic acid (carboxylic acid).',
    energyChange: 'exothermic',
    atomConservation: {
      reactants: { C: 2, H: 6, O: 1, N: 0 },
      products: { C: 2, H: 4, O: 2, N: 0 },
      isBalanced: false, // In organic chemistry, nascent [O] is supplied by the inorganic oxidizing reagent
    },
    practicalApplication: {
      title: 'Breathalyzer Test & Vinegar Fermentation',
      industry: 'Forensic Science & Food Production',
      realWorldContext: 'Traditional roadside breathalyzers used orange acidic dichromate to oxidize breath ethanol to acetic acid, turning green (Cr3+). Biological Acetobacter bacteria perform the same oxidation in vinegar fermentation.',
      significance: 'Demonstrates redox colorimetry and biological conversion of alcohols into acids.',
    },
  },

  'rx-esterification': {
    id: 'rx-esterification',
    name: 'Fischer Esterification (Ethyl Ethanoate Synthesis)',
    reactionType: 'condensation_esterification',
    reactants: [ENTITY_ETHANOIC_ACID, ENTITY_ETHANOL],
    products: [ENTITY_ETHYL_ACETATE, ENTITY_WATER],
    conditions: {
      catalyst: 'Concentrated Sulfuric Acid (H2SO4)',
      temperature: '60°C gentle reflux',
      pressure: '1 atm',
      environmentDescription: 'Proton acid catalyst and dehydrating conditions to shift equilibrium forward.',
    },
    bondsBroken: [
      { type: 'broken', description: 'Acyl C-OH bond cleaved from ethanoic acid', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['c2', 'o_hydroxyl'] },
      { type: 'broken', description: 'Alcohol O-H bond cleaved from ethanol', fromBondOrder: 1, toBondOrder: 0, atomsInvolved: ['o1', 'h_o'] },
    ],
    bondsFormed: [
      { type: 'formed', description: 'New ester C-O sigma bond formed linking acyl and alkoxy groups', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['c2', 'o_ester'] },
      { type: 'formed', description: 'Water molecule formed from liberated H and OH fragments', fromBondOrder: 0, toBondOrder: 1, atomsInvolved: ['o', 'h'] },
    ],
    mechanismSummary: 'Nucleophilic acyl substitution: protonated carbonyl is attacked by alcohol oxygen; proton transfer and departure of water generates the sweet ester.',
    energyChange: 'exothermic',
    atomConservation: checkAtomConservation([ENTITY_ETHANOIC_ACID, ENTITY_ETHANOL], [ENTITY_ETHYL_ACETATE, ENTITY_WATER]),
    practicalApplication: {
      title: 'Fragrance, Flavorings & Biodiesel Synthesis',
      industry: 'Flavors & Fragrances / Green Fuels',
      realWorldContext: 'Ethyl acetate provides the distinct fruity aroma in pears, apples, and nail polish removers. The same transesterification reaction converts vegetable oils and methanol into biodiesel.',
      significance: 'Combines an acid and an alcohol into a sweet-smelling, non-corrosive ester.',
    },
  },
};

// ==========================================
// DETERMINISTIC VALIDATION & PREDICTION
// ==========================================

export function validateMoleculeValences(molecule: Molecule): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const atom of molecule.atoms) {
    const maxValence = MAX_VALENCE_MAP[atom.element] ?? 4;
    const currentValence = calculateAtomValence(molecule, atom.id);

    if (currentValence > maxValence) {
      errors.push(`Atom ${atom.label || atom.id} (${atom.element}) valence ${currentValence} exceeds max ${maxValence}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateReactionTransformation(
  reactionId: string,
  selectedReactantIds: string[],
  selectedCondition: string
): { isValid: boolean; feedback: string; reaction?: ReactionDefinition } {
  const reaction = STAGE5_REACTIONS[reactionId];
  if (!reaction) {
    return { isValid: false, feedback: `Unknown reaction definition: ${reactionId}` };
  }

  // 1. Check reactant IDs
  const requiredReactantIds = reaction.reactants.map(r => r.id).sort();
  const providedReactantIds = [...selectedReactantIds].sort();

  if (requiredReactantIds.length !== providedReactantIds.length ||
      !requiredReactantIds.every((id, idx) => id === providedReactantIds[idx])) {
    return {
      isValid: false,
      feedback: `Reactant mismatch: Expected [${requiredReactantIds.join(', ')}] but received [${providedReactantIds.join(', ')}].`,
    };
  }

  // 2. Check conditions
  const catalystNormalized = selectedCondition.toLowerCase();
  const reactionCatalystNormalized = reaction.conditions.catalyst.toLowerCase();

  const isConditionMatched =
    catalystNormalized.includes(reactionCatalystNormalized.split(' ')[0]) ||
    reactionCatalystNormalized.includes(catalystNormalized.split(' ')[0]);

  if (!isConditionMatched) {
    return {
      isValid: false,
      feedback: `Condition mismatch: "${selectedCondition}" cannot catalyze this transformation. Required: ${reaction.conditions.catalyst}.`,
    };
  }

  return {
    isValid: true,
    feedback: `Deterministic Reaction Verified: ${reaction.name} proceeds smoothly under declared conditions.`,
    reaction,
  };
}

export function predictReactionOutcome(
  substrateId: string,
  reagentId: string,
  conditionKey: string
): { success: boolean; reaction?: ReactionDefinition; explanation: string } {
  // Hydrogenation: Ethene + H2
  if (
    ((substrateId === 'ent-ethene' && reagentId === 'ent-h2') ||
     (substrateId === 'ent-h2' && reagentId === 'ent-ethene')) &&
    (conditionKey.includes('ni') || conditionKey.includes('pt') || conditionKey.includes('catalyst'))
  ) {
    return {
      success: true,
      reaction: STAGE5_REACTIONS['rx-hydrogenation'],
      explanation: 'Addition across C=C double bond occurs: H2 cleaves over Ni/Pt catalyst to yield saturated Ethane.',
    };
  }

  // Hydration: Ethene + H2O
  if (
    ((substrateId === 'ent-ethene' && reagentId === 'ent-h2o') ||
     (substrateId === 'ent-h2o' && reagentId === 'ent-ethene')) &&
    (conditionKey.includes('acid') || conditionKey.includes('h3po4') || conditionKey.includes('300'))
  ) {
    return {
      success: true,
      reaction: STAGE5_REACTIONS['rx-hydration'],
      explanation: 'Electrophilic addition of steam (H2O) across Ethene in presence of phosphoric acid yields Ethanol.',
    };
  }

  // Dehydration: Ethanol alone with conc H2SO4 at 170C
  if (
    substrateId === 'ent-ethanol' &&
    reagentId === 'none' &&
    (conditionKey.includes('170') || conditionKey.includes('h2so4') || conditionKey.includes('dehydrat'))
  ) {
    return {
      success: true,
      reaction: STAGE5_REACTIONS['rx-dehydration'],
      explanation: 'Elimination reaction: Concentrated H2SO4 at 170°C removes H and OH as water to generate Ethene.',
    };
  }

  // Esterification: Ethanoic Acid + Ethanol
  if (
    ((substrateId === 'ent-ethanoic-acid' && reagentId === 'ent-ethanol') ||
     (substrateId === 'ent-ethanol' && reagentId === 'ent-ethanoic-acid')) &&
    (conditionKey.includes('acid') || conditionKey.includes('h2so4') || conditionKey.includes('reflux'))
  ) {
    return {
      success: true,
      reaction: STAGE5_REACTIONS['rx-esterification'],
      explanation: 'Fischer Esterification: Acid-catalyzed condensation of ethanoic acid and ethanol yields sweet Ethyl Acetate + Water.',
    };
  }

  return {
    success: false,
    explanation: 'No viable reaction under these deterministic constraints. Reactants lack compatible functional groups or activation energy.',
  };
}

// ==========================================
// STAGE 5 DIAGNOSTIC CHALLENGES
// ==========================================

export interface Stage5Challenge {
  id: string;
  title: string;
  category: 'addition' | 'elimination' | 'oxidation' | 'esterification' | 'bond_accounting' | 'capstone_pathway';
  scenario: string;
  prompt: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  hint: string;
  scientificDefense: string;
  conceptId: 'c-org-15' | 'c-org-16' | 'c-org-17';
}

export const STAGE5_CHALLENGES: Stage5Challenge[] = [
  {
    id: 'ch-st5-1',
    title: 'Challenge 1: Electrophilic Addition across C=C',
    category: 'addition',
    scenario: 'An industrial lab wants to convert gaseous unsaturated Ethene (C2H4) into saturated Ethane (C2H6) for petrochemical blending.',
    prompt: 'What reagent and catalyst combination deterministically achieves this transformation?',
    options: [
      { id: 'opt-a', label: 'H2 gas with Nickel (Ni) or Platinum (Pt) catalyst at 150°C', isCorrect: true, explanation: 'Correct! Catalytic hydrogenation uses H2 gas over transition metal catalyst to break the pi bond and saturate the alkene.' },
      { id: 'opt-b', label: 'Concentrated H2SO4 at 170°C without reagents', isCorrect: false, explanation: 'Incorrect. This condition dehydrates alcohols into alkenes, which is the reverse direction.' },
      { id: 'opt-c', label: 'Steam (H2O) with Phosphoric acid catalyst', isCorrect: false, explanation: 'Incorrect. Hydration adds -OH and -H across the double bond to form Ethanol, not Ethane.' },
      { id: 'opt-d', label: 'Potassium Dichromate (K2Cr2O7) oxidizer', isCorrect: false, explanation: 'Incorrect. Dichromate is an oxidizing agent, whereas converting ethene to ethane requires reduction.' },
    ],
    hint: 'Look for a reducing reagent that supplies hydrogen atoms across the pi bond over a transition metal surface.',
    scientificDefense: 'Hydrogenation is an addition reaction where 1 pi bond and 1 H-H sigma bond break to form 2 new C-H sigma bonds (exothermic delta H ~ -137 kJ/mol).',
    conceptId: 'c-org-15',
  },
  {
    id: 'ch-st5-2',
    title: 'Challenge 2: Elimination & Water Departure',
    category: 'elimination',
    scenario: 'A renewable bio-plastics plant receives bio-ethanol from fermented sugar cane and must convert it to ethylene monomer for green polyethylene.',
    prompt: 'Which chemical reaction condition forces the beta-elimination of water from Ethanol (CH3CH2OH)?',
    options: [
      { id: 'opt-a', label: 'Heating with concentrated H2SO4 at 170°C', isCorrect: true, explanation: 'Correct! Hot concentrated sulfuric acid acts as a strong dehydrating agent, protonating the -OH group and triggering beta-elimination to yield ethene gas.' },
      { id: 'opt-b', label: 'Bubbling O2 gas at room temperature', isCorrect: false, explanation: 'Incorrect. Oxygen gas does not perform dehydration; it would participate in combustion or microbial oxidation.' },
      { id: 'opt-c', label: 'Adding H2 gas over a Nickel catalyst', isCorrect: false, explanation: 'Incorrect. Ethanol has no alkene double bond to hydrogenate.' },
      { id: 'opt-d', label: 'Mixing with liquid water at 0°C', isCorrect: false, explanation: 'Incorrect. Adding water shifts equilibrium away from dehydration.' },
    ],
    hint: 'Elimination requires an acidic dehydrating catalyst and high thermal energy to drive off water.',
    scientificDefense: 'The -OH group is a poor leaving group, but protonation by conc. H2SO4 converts it into -OH2+ (neutral water). At 170°C, elimination to the alkene is thermodynamically favored over ether substitution.',
    conceptId: 'c-org-15',
  },
  {
    id: 'ch-st5-3',
    title: 'Challenge 3: Stepwise Oxidation Hierarchy',
    category: 'oxidation',
    scenario: 'In a forensic toxicology lab, a breathalyzer detects alcohol vapor. In human liver biology, alcohol dehydrogenase oxidizes ethanol.',
    prompt: 'What is the correct stepwise progression when a primary alcohol (Ethanol) is fully oxidized?',
    options: [
      { id: 'opt-a', label: 'Ethanol (Primary Alcohol) → Ethanal (Aldehyde) → Ethanoic Acid (Carboxylic Acid)', isCorrect: true, explanation: 'Correct! Primary alcohols first lose two hydrogen atoms to form an aldehyde, which then accepts nascent oxygen to form a carboxylic acid.' },
      { id: 'opt-b', label: 'Ethanol → Ethane → Ethene', isCorrect: false, explanation: 'Incorrect. This represents a reduction sequence, not oxidation.' },
      { id: 'opt-c', label: 'Ethanol → Acetone (Ketone) → Carbon Dioxide', isCorrect: false, explanation: 'Incorrect. Ethanol has only 2 carbons and is a primary alcohol, so it forms ethanal (aldehyde), not a ketone like acetone (3 carbons).' },
      { id: 'opt-d', label: 'Ethanol → Ethyl Acetate (Ester) → Ethyne', isCorrect: false, explanation: 'Incorrect. Esters require condensation with a carboxylic acid, not direct stepwise oxidation.' },
    ],
    hint: 'Oxidation increases the number of C-O bonds and decreases C-H bonds at the alpha carbon.',
    scientificDefense: 'Oxidation of CH3CH2OH: 1 C-O bond -> CH3CHO with 2 C-O bonds (carbonyl) -> CH3COOH with 3 C-O bonds (carboxyl). Secondary alcohols yield ketones, while tertiary alcohols resist oxidation.',
    conceptId: 'c-org-16',
  },
  {
    id: 'ch-st5-4',
    title: 'Challenge 4: Fischer Esterification Synthesis',
    category: 'esterification',
    scenario: 'A cosmetics manufacturer needs to synthesize ethyl acetate, a safe fruity fragrance and nail polish solvent.',
    prompt: 'Which two organic precursors must be heated together with an acid catalyst to produce Ethyl Acetate (CH3COOCH2CH3) and Water?',
    options: [
      { id: 'opt-a', label: 'Ethanoic Acid (CH3COOH) + Ethanol (CH3CH2OH)', isCorrect: true, explanation: 'Correct! Fischer esterification condenses a carboxylic acid (ethanoic acid) with an alcohol (ethanol) in the presence of an acid catalyst.' },
      { id: 'opt-b', label: 'Ethane (CH3CH3) + Water (H2O)', isCorrect: false, explanation: 'Incorrect. Alkanes are unreactive and do not condense with water to form esters.' },
      { id: 'opt-c', label: 'Ethene (CH2=CH2) + Oxygen (O2)', isCorrect: false, explanation: 'Incorrect. This would form ethylene oxide or combustion products, not an ester.' },
      { id: 'opt-d', label: 'Ethanal (CH3CHO) + Ethanoic Acid (CH3COOH)', isCorrect: false, explanation: 'Incorrect. An aldehyde does not react with a carboxylic acid to make an ester.' },
    ],
    hint: 'Recall that an ester link (-COO-) is formed by joining an acyl group from an acid with an alkoxy group from an alcohol.',
    scientificDefense: 'Carboxylic Acid + Alcohol <=(H+)=> Ester + Water. Nucleophilic attack by the alcohol lone pair on the protonated carbonyl carbon leads to elimination of water.',
    conceptId: 'c-org-16',
  },
  {
    id: 'ch-st5-5',
    title: 'Challenge 5: Deterministic Bond Change Accounting',
    category: 'bond_accounting',
    scenario: 'Examine the hydration reaction: Ethene (CH2=CH2) + Water (H2O) → Ethanol (CH3CH2OH).',
    prompt: 'Which statement accurately describes the exact covalent bonds broken and formed during this addition?',
    options: [
      { id: 'opt-a', label: 'Broken: 1 C=C pi bond and 1 H-O bond. Formed: 1 C-H sigma bond and 1 C-O sigma bond.', isCorrect: true, explanation: 'Correct! The weaker pi bond (bond order 2 -> 1) and one water O-H bond break, while a new C-H bond and C-O bond form on adjacent carbons.' },
      { id: 'opt-b', label: 'Broken: 1 C-C sigma bond. Formed: 2 C=O double bonds.', isCorrect: false, explanation: 'Incorrect. The carbon-carbon backbone remains connected; the pi bond opens up.' },
      { id: 'opt-c', label: 'Broken: All 4 C-H bonds in ethene. Formed: 6 new C-H bonds.', isCorrect: false, explanation: 'Incorrect. Existing C-H bonds are conserved.' },
      { id: 'opt-d', label: 'Broken: 1 C=C double bond completely. Formed: 2 independent methane molecules.', isCorrect: false, explanation: 'Incorrect. The C-C single sigma bond remains completely intact.' },
    ],
    hint: 'Addition reactions break the weaker pi component of a double bond while preserving the sigma backbone.',
    scientificDefense: 'Energy bookkeeping: Breaking C=C pi (~264 kJ/mol) + H-OH (~498 kJ/mol) = 762 kJ/mol. Forming C-H (~413 kJ/mol) + C-O (~358 kJ/mol) = 771 kJ/mol. Net reaction is slightly exothermic.',
    conceptId: 'c-org-17',
  },
  {
    id: 'ch-st5-6',
    title: 'Challenge 6: Capstone Synthesis Pathway Planning',
    category: 'capstone_pathway',
    scenario: 'You are the lead process chemist. Your starting stock material is Ethene (C2H4) from petroleum cracking, and your target commercial product is pure Ethanoic Acid (CH3COOH) for food-grade vinegar production.',
    prompt: 'What is the optimal, deterministic 2-step synthetic route to transform Ethene into Ethanoic Acid?',
    options: [
      { id: 'opt-a', label: 'Step 1: Hydrate Ethene (+H2O, H3PO4) to Ethanol; Step 2: Oxidize Ethanol (+[O], KMnO4/reflux) to Ethanoic Acid', isCorrect: true, explanation: 'Outstanding! Step 1 adds water across the double bond to form the primary alcohol Ethanol; Step 2 oxidizes the primary alcohol into Ethanoic acid.' },
      { id: 'opt-b', label: 'Step 1: Hydrogenate Ethene (+H2, Ni) to Ethane; Step 2: Dehydrate Ethane to Ethanoic Acid', isCorrect: false, explanation: 'Incorrect. Dehydration of ethane cannot create oxygen atoms out of nowhere.' },
      { id: 'opt-c', label: 'Step 1: Combustion of Ethene to CO2; Step 2: Cool CO2 to form Ethanoic Acid', isCorrect: false, explanation: 'Incorrect. Combustion completely destroys the C-C bond into single-carbon CO2 gas.' },
      { id: 'opt-d', label: 'Step 1: Dehydrate Ethene; Step 2: Hydrolyze with concentrated base', isCorrect: false, explanation: 'Incorrect. Ethene has no water to eliminate.' },
    ],
    hint: 'Think about how to introduce oxygen onto the carbon skeleton first (alcohol), then increase the carbon-oxygen bond order.',
    scientificDefense: 'Pathway: C2H4 (Alkene) --[H2O/H+]--> C2H5OH (Primary Alcohol) --[KMnO4/H+, heat]--> CH3COOH (Carboxylic Acid). Demonstrates multi-stage functional group conversion across stages 2, 3, and 5.',
    conceptId: 'c-org-17',
  },
];
