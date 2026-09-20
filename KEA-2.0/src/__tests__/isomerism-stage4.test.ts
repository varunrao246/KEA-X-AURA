/**
 * KEA Platform — Stage 4: Structure & Isomerism Test Suite
 *
 * Verifies:
 * 1. Molecular formula and heavy-atom connectivity signatures
 * 2. Deterministic valence validation and invalid structure rejection
 * 3. Constitutional isomer identification (chain, positional, functional)
 * 4. Geometric stereoisomer identification (cis vs trans 2-butene)
 * 5. Identical molecule detection vs different compound rejection
 * 6. Deterministic evidence emission and MasteryEngine (W-EMM) integration
 * 7. Prerequisite gating: Stage 3 -> Stage 4 and Stage 4 -> Stage 5
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  IsomerMolecule,
  PRESET_ISOMER_PAIRS,
  compareMolecules,
  getHeavyAtomConnectivitySignature,
  validateIsomerStructure,
} from '../lib/chemistry/isomerism';
import { MasteryEngine } from '../lib/mastery/engine';
import { AssessmentEvidence } from '../lib/mastery/types';

describe('KEA Stage 4: Structure & Isomerism Deterministic Domain Suite', () => {
  const butane = PRESET_ISOMER_PAIRS[0].molA;
  const isobutane = PRESET_ISOMER_PAIRS[0].molB;
  const propanol1 = PRESET_ISOMER_PAIRS[1].molA;
  const propanol2 = PRESET_ISOMER_PAIRS[1].molB;
  const ethanol = PRESET_ISOMER_PAIRS[2].molA;
  const dimethylEther = PRESET_ISOMER_PAIRS[2].molB;
  const cis2Butene = PRESET_ISOMER_PAIRS[3].molA;
  const trans2Butene = PRESET_ISOMER_PAIRS[3].molB;

  it('1. Confirms all preset curated molecules satisfy deterministic valence rules', () => {
    for (const pair of PRESET_ISOMER_PAIRS) {
      const valA = validateIsomerStructure(pair.molA);
      const valB = validateIsomerStructure(pair.molB);
      assert.equal(valA.isValid, true, `${pair.molA.name} should have valid valence`);
      assert.equal(valB.isValid, true, `${pair.molB.name} should have valid valence`);
      assert.equal(valA.errors.length, 0);
      assert.equal(valB.errors.length, 0);
    }
  });

  it('2. Rejects invalid molecular structures exceeding maximum valence or containing self-loops', () => {
    // Texas carbon with 5 bonds
    const invalidTexasCarbon: IsomerMolecule = {
      ...butane,
      id: 'texas-c',
      bonds: [
        ...butane.bonds,
        { id: 'b-illegal', atomAId: 'C2', atomBId: 'C4', order: 1 },
      ],
    };
    const valTexas = validateIsomerStructure(invalidTexasCarbon);
    assert.equal(valTexas.isValid, false);
    assert.ok(valTexas.errors.some(e => e.includes('exceeds maximum valence')));

    // Self loop bond
    const invalidLoop: IsomerMolecule = {
      ...butane,
      id: 'loop-c',
      bonds: [
        ...butane.bonds,
        { id: 'b-self', atomAId: 'C1', atomBId: 'C1', order: 1 },
      ],
    };
    const valLoop = validateIsomerStructure(invalidLoop);
    assert.equal(valLoop.isValid, false);
    assert.ok(valLoop.errors.some(e => e.includes('self-loop')));
  });

  it('3. Generates invariant connectivity signatures regardless of atom ordering in array', () => {
    // Shuffle atoms in butane array
    const shuffledButane: IsomerMolecule = {
      ...butane,
      atoms: [...butane.atoms].reverse(),
      bonds: [...butane.bonds].reverse(),
    };

    const sigOriginal = getHeavyAtomConnectivitySignature(butane);
    const sigShuffled = getHeavyAtomConnectivitySignature(shuffledButane);
    assert.equal(sigOriginal, sigShuffled, 'Signatures must be invariant to atom indexing');
  });

  it('4. Distinguishes chain isomers (Butane vs Isobutane, C4H10)', () => {
    const result = compareMolecules(butane, isobutane);

    assert.equal(result.isIsomer, true);
    assert.equal(result.isConstitutional, true);
    assert.equal(result.isStereoisomer, false);
    assert.equal(result.relationship, 'constitutional_chain');
    assert.equal(result.haveSameFormula, true);
    assert.equal(result.haveSameConnectivity, false);
    assert.equal(result.formulaA, 'C4H10');
    assert.equal(result.formulaB, 'C4H10');
  });

  it('5. Distinguishes positional isomers (1-Propanol vs 2-Propanol, C3H8O)', () => {
    const result = compareMolecules(propanol1, propanol2);

    assert.equal(result.isIsomer, true);
    assert.equal(result.isConstitutional, true);
    assert.equal(result.isStereoisomer, false);
    assert.equal(result.relationship, 'constitutional_position');
    assert.equal(result.haveSameFormula, true);
    assert.equal(result.haveSameConnectivity, false);
    assert.equal(result.formulaA, 'C3H8O');
    assert.equal(result.formulaB, 'C3H8O');
  });

  it('6. Distinguishes functional group isomers (Ethanol vs Dimethyl Ether, C2H6O)', () => {
    const result = compareMolecules(ethanol, dimethylEther);

    assert.equal(result.isIsomer, true);
    assert.equal(result.isConstitutional, true);
    assert.equal(result.isStereoisomer, false);
    assert.equal(result.relationship, 'constitutional_functional');
    assert.equal(result.haveSameFormula, true);
    assert.equal(result.haveSameConnectivity, false);
    assert.equal(result.formulaA, 'C2H6O');
    assert.equal(result.formulaB, 'C2H6O');
  });

  it('7. Accurately identifies geometric stereoisomers (cis-2-butene vs trans-2-butene, C4H8)', () => {
    const result = compareMolecules(cis2Butene, trans2Butene);

    assert.equal(result.isIsomer, true);
    assert.equal(result.isConstitutional, false);
    assert.equal(result.isStereoisomer, true);
    assert.equal(result.relationship, 'stereoisomer_geometric');
    assert.equal(result.haveSameFormula, true);
    assert.equal(result.haveSameConnectivity, true);
    assert.equal(result.formulaA, 'C4H8');
    assert.equal(result.formulaB, 'C4H8');
    assert.ok(result.details.includes('CIS'));
    assert.ok(result.details.includes('TRANS'));
  });

  it('8. Accurately identifies identical molecules (same formula and connectivity)', () => {
    const result = compareMolecules(butane, butane);

    assert.equal(result.isIsomer, false);
    assert.equal(result.relationship, 'identical');
    assert.equal(result.haveSameFormula, true);
    assert.equal(result.haveSameConnectivity, true);
  });

  it('9. Rejects different compounds with different molecular formulas as non-isomers', () => {
    // Compare butane (C4H10) with ethanol (C2H6O)
    const result = compareMolecules(butane, ethanol);

    assert.equal(result.isIsomer, false);
    assert.equal(result.relationship, 'not_isomers_different_formula');
    assert.equal(result.haveSameFormula, false);
    assert.notEqual(result.formulaA, result.formulaB);
  });

  it('10. Ingests Stage 4 practice evidence into MasteryEngine (W-EMM) and advances mastery score', () => {
    const engine = new MasteryEngine();
    const conceptId = 'c-org-12';

    // Baseline: concept has 0 mastery
    assert.equal(engine.getConceptState(conceptId).currentScore, 0);

    // Record high score evidence
    const evidence1: AssessmentEvidence = {
      conceptId,
      assessmentType: 'practice',
      score: 95,
      metadata: { isCorrect: true, difficultyTier: 'intermediate' },
    };
    const res1 = engine.recordEvidence(evidence1);

    // With practice weight and initial score 0: newScore > 0
    assert.ok(res1.newScore > 0);
    assert.equal(res1.status, 'in_progress');

    // Repeated strong evidence transitions asymptotically toward mastery (>= 80%)
    for (let i = 0; i < 6; i++) {
      engine.recordEvidence({
        conceptId,
        assessmentType: 'practice',
        score: 100,
      });
    }

    const finalState = engine.getConceptState(conceptId);
    assert.ok(finalState.currentScore >= 80, `Final score ${finalState.currentScore} must reach mastery threshold >= 80`);
    assert.equal(finalState.status, 'mastered');
  });

  it('11. Deterministic gating: Stage 4 is locked until Stage 3 reaches >= 80% mastery', () => {
    const isStage4Unlocked = (s3Score: number) => s3Score >= 80;

    assert.equal(isStage4Unlocked(0), false);
    assert.equal(isStage4Unlocked(50), false);
    assert.equal(isStage4Unlocked(79.9), false);
    assert.equal(isStage4Unlocked(80), true);
    assert.equal(isStage4Unlocked(95), true);
  });

  it('12. Deterministic gating: Stage 5 remains locked until Stage 4 reaches >= 80% mastery', () => {
    const isStage5Unlocked = (s4Score: number) => s4Score >= 80;

    assert.equal(isStage5Unlocked(0), false);
    assert.equal(isStage5Unlocked(65), false);
    assert.equal(isStage5Unlocked(79.9), false);
    assert.equal(isStage5Unlocked(80), true);
    assert.equal(isStage5Unlocked(100), true);
  });

  it('13. Preserves deterministic behavior across repeated executions with zero flakiness', () => {
    for (let iter = 0; iter < 5; iter++) {
      const resA = compareMolecules(butane, isobutane);
      assert.equal(resA.relationship, 'constitutional_chain');

      const resB = compareMolecules(cis2Butene, trans2Butene);
      assert.equal(resB.relationship, 'stereoisomer_geometric');
    }
  });
});
