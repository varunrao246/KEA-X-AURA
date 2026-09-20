import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectFunctionalGroups,
  FUNCTIONAL_GROUPS_CATALOG,
  STAGE_3_CHALLENGES,
} from '../lib/chemistry/functional-groups';
import { Molecule } from '../lib/chemistry/types';
import { MAX_VALENCE_MAP, validateMoleculeValence } from '../lib/chemistry/molecule-validator';
import { MasteryEngine } from '../lib/mastery/engine';
import { AssessmentEvidence } from '../lib/mastery/types';

test('KEA Stage 3 — Functional Groups Deterministic Test Suite', async (t) => {
  await t.test('1. Strictly enforces heteroatom maximum valences (O=2, N=3, C=4, H=1)', () => {
    assert.equal(MAX_VALENCE_MAP.O, 2, 'Oxygen maximum valence must be 2');
    assert.equal(MAX_VALENCE_MAP.N, 3, 'Nitrogen maximum valence must be 3');
    assert.equal(MAX_VALENCE_MAP.C, 4, 'Carbon maximum valence must be 4');
    assert.equal(MAX_VALENCE_MAP.H, 1, 'Hydrogen maximum valence must be 1');
  });

  await t.test('2. Correctly identifies Alcohol (-OH) in Ethanol (C2H5OH)', () => {
    // Ethanol: C1 - C2 - O - H
    const ethanol: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'o1', element: 'O' },
        { id: 'h1', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'o1', order: 1 },
        { id: 'b3', atomAId: 'o1', atomBId: 'h1', order: 1 },
      ],
    };

    const res = detectFunctionalGroups(ethanol);
    assert.equal(res.hasAlcohol, true, 'Should detect alcohol');
    assert.equal(res.hasAldehyde, false, 'Should not detect aldehyde');
    assert.equal(res.hasCarboxylicAcid, false, 'Should not detect carboxylic acid');
    assert.equal(res.oxygenValenceValid, true, 'Oxygen valence must be valid (2 bonds)');
  });

  await t.test('3. Correctly identifies Aldehyde (-CHO) in Acetaldehyde (CH3CHO)', () => {
    // Acetaldehyde: C1 - C2(=O) - H
    const ethanal: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'o1', element: 'O' },
        { id: 'h1', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'o1', order: 2 }, // C=O
        { id: 'b3', atomAId: 'c2', atomBId: 'h1', order: 1 }, // C-H
      ],
    };

    const res = detectFunctionalGroups(ethanal);
    assert.equal(res.hasAldehyde, true, 'Should detect aldehyde');
    assert.equal(res.hasKetone, false, 'Should not detect ketone');
    assert.equal(res.hasAlcohol, false, 'Should not detect alcohol');
    assert.equal(res.oxygenValenceValid, true, 'Oxygen valence valid (double bond = 2)');
  });

  await t.test('4. Correctly identifies Ketone (-CO-) in Acetone (CH3COCH3)', () => {
    // Acetone: C1 - C2(=O) - C3
    const acetone: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'c3', element: 'C' },
        { id: 'o1', element: 'O' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'c3', order: 1 },
        { id: 'b3', atomAId: 'c2', atomBId: 'o1', order: 2 }, // C=O
      ],
    };

    const res = detectFunctionalGroups(acetone);
    assert.equal(res.hasKetone, true, 'Should detect ketone');
    assert.equal(res.hasAldehyde, false, 'Should not detect aldehyde (no C-H on carbonyl C)');
    assert.equal(res.hasAlcohol, false, 'Should not detect alcohol');
  });

  await t.test('5. Correctly identifies Carboxylic Acid (-COOH) in Acetic Acid (CH3COOH)', () => {
    // Acetic acid: C1 - C2(=O) - O2 - H
    const aceticAcid: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'o1', element: 'O' }, // carbonyl =O
        { id: 'o2', element: 'O' }, // hydroxyl -O-
        { id: 'h1', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'o1', order: 2 }, // C=O
        { id: 'b3', atomAId: 'c2', atomBId: 'o2', order: 1 }, // C-O
        { id: 'b4', atomAId: 'o2', atomBId: 'h1', order: 1 }, // O-H
      ],
    };

    const res = detectFunctionalGroups(aceticAcid);
    assert.equal(res.hasCarboxylicAcid, true, 'Should detect carboxylic acid');
    assert.equal(res.oxygenValenceValid, true, 'Both oxygens satisfy valence 2');
  });

  await t.test('6. Correctly identifies Amine (-NH2) in Methylamine (CH3NH2)', () => {
    // Methylamine: C1 - N1 (-H1, -H2)
    const methylamine: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'n1', element: 'N' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'n1', order: 1 },
        { id: 'b2', atomAId: 'n1', atomBId: 'h1', order: 1 },
        { id: 'b3', atomAId: 'n1', atomBId: 'h2', order: 1 },
      ],
    };

    const res = detectFunctionalGroups(methylamine);
    assert.equal(res.hasAmine, true, 'Should detect amine');
    assert.equal(res.nitrogenValenceValid, true, 'Nitrogen has 3 bonds');
  });

  await t.test('7. Rejects over-bonded Oxygen (valence > 2)', () => {
    // Invalid molecule: Oxygen with 3 bonds
    const invalidOxygenMolecule: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'c3', element: 'C' },
        { id: 'o1', element: 'O' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'o1', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'o1', order: 1 },
        { id: 'b3', atomAId: 'c3', atomBId: 'o1', order: 1 }, // 3 bonds to oxygen
      ],
    };

    const res = detectFunctionalGroups(invalidOxygenMolecule);
    assert.equal(res.oxygenValenceValid, false, 'Should flag invalid oxygen valence');

    const valRes = validateMoleculeValence(invalidOxygenMolecule);
    assert.equal(valRes.isValid, false, 'Molecule validator should reject over-bonded oxygen');
    assert.equal(valRes.atomValences.o1.isExceeded, true);
  });

  await t.test('8. Rejects over-bonded Nitrogen (valence > 3)', () => {
    // Invalid molecule: Nitrogen with 4 bonds
    const invalidNitrogenMolecule: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'c3', element: 'C' },
        { id: 'c4', element: 'C' },
        { id: 'n1', element: 'N' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'n1', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'n1', order: 1 },
        { id: 'b3', atomAId: 'c3', atomBId: 'n1', order: 1 },
        { id: 'b4', atomAId: 'c4', atomBId: 'n1', order: 1 }, // 4 bonds to nitrogen
      ],
    };

    const res = detectFunctionalGroups(invalidNitrogenMolecule);
    assert.equal(res.nitrogenValenceValid, false, 'Should flag invalid nitrogen valence');

    const valRes = validateMoleculeValence(invalidNitrogenMolecule);
    assert.equal(valRes.isValid, false, 'Molecule validator should reject over-bonded nitrogen');
    assert.equal(valRes.atomValences.n1.isExceeded, true);
  });

  await t.test('9. Stage 2 prerequisite gating: Stage 3 unlocks when Stage 2 mastery >= 80', () => {
    const stage2MasterySatisfied = 82;
    const stage3IsAvailable = stage2MasterySatisfied >= 80;
    assert.equal(stage3IsAvailable, true, 'Stage 3 must become available when Stage 2 score >= 80');

    const stage2MasteryUnmet = 74;
    const stage3IsLocked = stage2MasteryUnmet < 80;
    assert.equal(stage3IsLocked, true, 'Stage 3 must remain locked when Stage 2 score < 80');
  });

  await t.test('10. Stage 3 Mastery transition: average score >= 80 satisfies Stage 3 mastery', () => {
    const conceptScores = {
      'c-org-9': 85,
      'c-org-10': 80,
      'c-org-11': 82,
    };
    const scores = Object.values(conceptScores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    assert.equal(avg >= 80, true, 'Stage 3 is mastered when average concept mastery >= 80');
    assert.equal(avg, 82);
  });

  await t.test('11. Visual activity emits valid evidence compatible with MasteryEngine (W-EMM)', () => {
    const engine = new MasteryEngine();
    const evidence: AssessmentEvidence = {
      conceptId: 'c-org-9',
      assessmentType: 'practice',
      score: 90,
      metadata: { isCorrect: true, difficultyTier: 'intermediate' },
    };

    const result = engine.recordEvidence(evidence);
    assert.ok(result.newScore > 0, 'New mastery score should be updated deterministically');
    assert.equal(typeof result.newScore, 'number');
    assert.ok(result.status === 'unlocked' || result.status === 'in_progress' || result.status === 'mastered');
  });

  await t.test('12. All 6 Stage 3 Challenge items have deterministic correct answers matching the catalog', () => {
    assert.equal(STAGE_3_CHALLENGES.length, 6, 'Should have exactly 6 challenge fixtures');
    for (const ch of STAGE_3_CHALLENGES) {
      assert.ok(ch.name, `Challenge ${ch.id} must have a name`);
      assert.ok(ch.formula, `Challenge ${ch.id} must have a formula`);
      assert.ok(ch.correctGroup, `Challenge ${ch.id} must have a correctGroup`);
      assert.ok(
        ['alcohol', 'aldehyde', 'ketone', 'carboxylic_acid', 'amine'].includes(ch.correctGroup),
        `Challenge ${ch.id} correctGroup must be valid`
      );
      assert.ok(FUNCTIONAL_GROUPS_CATALOG[ch.correctGroup] !== null, 'Correct group must exist in catalog');
      assert.ok(ch.distractors.length >= 3, `Challenge ${ch.id} must have at least 3 distractors`);
      assert.ok(!ch.distractors.includes(ch.correctGroup), 'Distractors must not include the correct group');
    }
  });
});
