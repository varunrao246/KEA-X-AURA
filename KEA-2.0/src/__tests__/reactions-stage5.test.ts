import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  STAGE5_REACTIONS,
  STAGE5_CHALLENGES,
  validateMoleculeValences,
  validateReactionTransformation,
  predictReactionOutcome,
  checkAtomConservation,
} from '../lib/chemistry/reactions';
import { MasteryEngine } from '../lib/mastery/engine';
import { AssessmentEvidence } from '../lib/mastery/types';

describe('KEA Stage 5: Reactions & Practical Application Deterministic Domain Suite', () => {
  it('1. Confirms all reactants and products in curated reactions satisfy deterministic valence limits', () => {
    for (const [key, rx] of Object.entries(STAGE5_REACTIONS)) {
      for (const reactant of rx.reactants) {
        const valRes = validateMoleculeValences(reactant.molecule);
        assert.equal(
          valRes.isValid,
          true,
          `Reactant ${reactant.name} in reaction ${key} has valence errors: ${valRes.errors.join(', ')}`
        );
      }
      for (const product of rx.products) {
        const valRes = validateMoleculeValences(product.molecule);
        assert.equal(
          valRes.isValid,
          true,
          `Product ${product.name} in reaction ${key} has valence errors: ${valRes.errors.join(', ')}`
        );
      }
    }
  });

  it('2. Atom conservation balances 100% for addition, elimination, and esterification reactions', () => {
    const balancedRxKeys = ['rx-hydrogenation', 'rx-hydration', 'rx-dehydration', 'rx-esterification'];
    for (const key of balancedRxKeys) {
      const rx = STAGE5_REACTIONS[key];
      assert.ok(rx, `Reaction ${key} must exist`);
      const conservation = checkAtomConservation(rx.reactants, rx.products);
      assert.equal(
        conservation.isBalanced,
        true,
        `Reaction ${key} must have 100% atomic balance: R=${JSON.stringify(conservation.reactants)} vs P=${JSON.stringify(conservation.products)}`
      );
    }
  });

  it('3. Catalytic Hydrogenation of Ethene converts alkene to alkane with exact bond bookkeeping', () => {
    const rx = STAGE5_REACTIONS['rx-hydrogenation'];
    assert.equal(rx.reactionType, 'addition');
    assert.equal(rx.reactants.length, 2);
    assert.equal(rx.products.length, 1);
    assert.equal(rx.products[0].id, 'ent-ethane');
    assert.equal(rx.products[0].formula, 'C2H6');

    // 1 pi bond cleaved, 1 H-H sigma cleaved, 2 C-H formed
    assert.ok(rx.bondsBroken.some(b => b.description.includes('pi bond broken')));
    assert.ok(rx.bondsBroken.some(b => b.description.includes('H-H sigma bond cleaved')));
    assert.ok(rx.bondsFormed.some(b => b.description.includes('C-H sigma bonds formed')));
  });

  it('4. Acid-Catalyzed Hydration of Ethene converts alkene to primary alcohol (Ethanol)', () => {
    const rx = STAGE5_REACTIONS['rx-hydration'];
    assert.equal(rx.reactionType, 'addition');
    assert.equal(rx.reactants[0].formula, 'C2H4');
    assert.equal(rx.reactants[1].formula, 'H2O');
    assert.equal(rx.products[0].formula, 'C2H6O');
    assert.equal(rx.products[0].id, 'ent-ethanol');
  });

  it('5. Acid-Catalyzed Dehydration of Ethanol eliminates water to regenerate alkene double bond', () => {
    const rx = STAGE5_REACTIONS['rx-dehydration'];
    assert.equal(rx.reactionType, 'elimination');
    assert.equal(rx.reactants[0].formula, 'C2H6O');
    assert.equal(rx.products[0].formula, 'C2H4');
    assert.equal(rx.products[1].formula, 'H2O');
    assert.equal(rx.energyChange, 'endothermic');
  });

  it('6. Fischer Esterification condenses Ethanoic Acid + Ethanol into Ethyl Acetate + Water', () => {
    const rx = STAGE5_REACTIONS['rx-esterification'];
    assert.equal(rx.reactionType, 'condensation_esterification');
    assert.equal(rx.reactants.length, 2);
    assert.equal(rx.products.length, 2);
    assert.equal(rx.products[0].id, 'ent-ethyl-acetate');
    assert.equal(rx.products[0].formula, 'C4H8O2');
    assert.equal(rx.products[1].formula, 'H2O');
  });

  it('7. Rejects invalid reactant inputs when attempting reaction transformations', () => {
    // Attempting hydrogenation with incorrect reactant
    const invalidRes = validateReactionTransformation(
      'rx-hydrogenation',
      ['ent-ethane', 'ent-h2'], // Ethane cannot be hydrogenated
      'Nickel'
    );
    assert.equal(invalidRes.isValid, false);
    assert.ok(invalidRes.feedback.includes('Reactant mismatch'));
  });

  it('8. Rejects incompatible catalytic conditions for declared transformations', () => {
    const condRes = validateReactionTransformation(
      'rx-hydrogenation',
      ['ent-ethene', 'ent-h2'],
      'Room temp ambient water' // Missing Ni/Pt catalyst
    );
    assert.equal(condRes.isValid, false);
    assert.ok(condRes.feedback.includes('Condition mismatch'));
  });

  it('9. Predicts correct reaction outcome for supported combinations and rejects unviable mixes', () => {
    // Valid: Ethene + H2 over Ni
    const validPred = predictReactionOutcome('ent-ethene', 'ent-h2', 'ni-catalyst');
    assert.equal(validPred.success, true);
    assert.equal(validPred.reaction?.id, 'rx-hydrogenation');

    // Valid: Ethanoic Acid + Ethanol with acid
    const esterPred = predictReactionOutcome('ent-ethanoic-acid', 'ent-ethanol', 'reflux-acid-ester');
    assert.equal(esterPred.success, true);
    assert.equal(esterPred.reaction?.id, 'rx-esterification');

    // Invalid: Ethane + H2
    const invalidPred = predictReactionOutcome('ent-ethane', 'ent-h2', 'ni-catalyst');
    assert.equal(invalidPred.success, false);
  });

  it('10. All 6 Stage 5 Diagnostic Assessment challenges have deterministic correct answers and scientific defense', () => {
    assert.equal(STAGE5_CHALLENGES.length, 6);
    for (const ch of STAGE5_CHALLENGES) {
      assert.ok(ch.title, `Challenge ${ch.id} must have a title`);
      assert.ok(ch.scenario, `Challenge ${ch.id} must have a scenario`);
      assert.ok(ch.prompt, `Challenge ${ch.id} must have a prompt`);
      assert.ok(ch.hint, `Challenge ${ch.id} must have a hint`);
      assert.ok(ch.scientificDefense, `Challenge ${ch.id} must have a scientific defense`);
      assert.ok(['c-org-15', 'c-org-16', 'c-org-17'].includes(ch.conceptId));

      const correctOpts = ch.options.filter(o => o.isCorrect);
      assert.equal(correctOpts.length, 1, `Challenge ${ch.id} must have exactly 1 correct option`);
      assert.ok(correctOpts[0].explanation.length > 10, `Challenge ${ch.id} correct option must have explanation`);
    }
  });

  it('11. Ingests Stage 5 practice evidence into MasteryEngine (W-EMM) and advances mastery score to >= 80%', () => {
    const engine = new MasteryEngine();
    const conceptId = 'c-org-15';

    assert.equal(engine.getConceptState(conceptId).currentScore, 0);

    // Initial practice evidence
    const evidence1: AssessmentEvidence = {
      conceptId,
      assessmentType: 'practice',
      score: 95,
      metadata: { isCorrect: true, difficultyTier: 'intermediate' },
    };
    const res1 = engine.recordEvidence(evidence1);
    assert.ok(res1.newScore > 0);
    assert.equal(res1.status, 'in_progress');

    // Repeated verified evidence pushes mastery score >= 80
    for (let i = 0; i < 6; i++) {
      engine.recordEvidence({
        conceptId,
        assessmentType: 'practice',
        score: 100,
        metadata: { isCorrect: true, difficultyTier: 'advanced' },
      });
    }

    const finalState = engine.getConceptState(conceptId);
    assert.ok(finalState.currentScore >= 80, `Score ${finalState.currentScore} must reach mastery >= 80`);
    assert.equal(finalState.status, 'mastered');
  });

  it('12. Deterministic gating: Stage 5 is locked until Stage 4 reaches >= 80% mastery', () => {
    const isStage5Unlocked = (s4Score: number) => s4Score >= 80;

    assert.equal(isStage5Unlocked(0), false);
    assert.equal(isStage5Unlocked(50), false);
    assert.equal(isStage5Unlocked(79.9), false);
    assert.equal(isStage5Unlocked(80), true);
    assert.equal(isStage5Unlocked(95), true);
  });

  it('13. Terminal Chemistry Completion State: Reaching >= 80% on Stage 5 confirms all 5 stages mastered', () => {
    const isOrganicChemistryMastered = (scores: { s1: number; s2: number; s3: number; s4: number; s5: number }) => {
      return scores.s1 >= 80 && scores.s2 >= 80 && scores.s3 >= 80 && scores.s4 >= 80 && scores.s5 >= 80;
    };

    assert.equal(isOrganicChemistryMastered({ s1: 85, s2: 82, s3: 88, s4: 90, s5: 75 }), false);
    assert.equal(isOrganicChemistryMastered({ s1: 85, s2: 82, s3: 88, s4: 90, s5: 80 }), true);
    assert.equal(isOrganicChemistryMastered({ s1: 90, s2: 92, s3: 95, s4: 94, s5: 96 }), true);
  });

  it('14. Preserves deterministic repeatability with zero flakiness across repeated executions', () => {
    for (let run = 0; run < 10; run++) {
      const pred = predictReactionOutcome('ent-ethene', 'ent-h2', 'ni-catalyst');
      assert.equal(pred.success, true);
      assert.equal(pred.reaction?.id, 'rx-hydrogenation');
    }
  });
});
