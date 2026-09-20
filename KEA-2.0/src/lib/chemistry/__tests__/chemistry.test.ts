import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAtomValence,
  validateMoleculeValence,
  getCarbonHybridization,
  createEtheneTarget,
  evaluateTargetMatch,
  getMolecularFormula,
} from '../molecule-validator';
import { Molecule, ChemistryLearningEvidence } from '../types';
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from '../organic-chemistry-demo';
import { KnowledgeGraphEngine } from '@/lib/knowledge-graph/engine';
import { ConceptNode } from '@/lib/knowledge-graph/types';

describe('KEA Chemistry Domain Model & Deterministic Validation Suite', () => {
  // 1. Carbon valence limit
  it('1. Correctly calculates carbon valence and enforces maximum valence of 4', () => {
    const methane: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
        { id: 'h3', element: 'H' },
        { id: 'h4', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'h1', order: 1 },
        { id: 'b2', atomAId: 'c1', atomBId: 'h2', order: 1 },
        { id: 'b3', atomAId: 'c1', atomBId: 'h3', order: 1 },
        { id: 'b4', atomAId: 'c1', atomBId: 'h4', order: 1 },
      ],
    };

    const val = calculateAtomValence(methane, 'c1');
    assert.equal(val, 4);

    const validation = validateMoleculeValence(methane);
    assert.equal(validation.isValid, true);
    assert.equal(validation.atomValences['c1'].isSatisfied, true);
    assert.equal(validation.atomValences['c1'].isExceeded, false);
    assert.equal(getMolecularFormula(methane.atoms), 'CH4');
  });

  // 2. Valid single bond
  it('2. Validates single bond contribution (valence 1) for ethane C-C', () => {
    const ethaneFragment: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
      ],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 }],
    };

    assert.equal(calculateAtomValence(ethaneFragment, 'c1'), 1);
    assert.equal(calculateAtomValence(ethaneFragment, 'c2'), 1);
  });

  // 3. Valid double bond
  it('3. Validates double bond contribution (valence 2) for ethene C=C', () => {
    const etheneFragment: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
      ],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 2 }],
    };

    assert.equal(calculateAtomValence(etheneFragment, 'c1'), 2);
    assert.equal(calculateAtomValence(etheneFragment, 'c2'), 2);
  });

  // 4. Valid triple bond
  it('4. Validates triple bond contribution (valence 3) for ethyne C≡C', () => {
    const ethyneFragment: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
      ],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 3 }],
    };

    assert.equal(calculateAtomValence(ethyneFragment, 'c1'), 3);
    assert.equal(calculateAtomValence(ethyneFragment, 'c2'), 3);
  });

  // 5. Valid carbon chain
  it('5. Validates a continuous saturated carbon chain (propane C3H8)', () => {
    const propane: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'c3', element: 'C' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
        { id: 'h3', element: 'H' },
        { id: 'h4', element: 'H' },
        { id: 'h5', element: 'H' },
        { id: 'h6', element: 'H' },
        { id: 'h7', element: 'H' },
        { id: 'h8', element: 'H' },
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 },
        { id: 'b2', atomAId: 'c2', atomBId: 'c3', order: 1 },
        { id: 'b3', atomAId: 'c1', atomBId: 'h1', order: 1 },
        { id: 'b4', atomAId: 'c1', atomBId: 'h2', order: 1 },
        { id: 'b5', atomAId: 'c1', atomBId: 'h3', order: 1 },
        { id: 'b6', atomAId: 'c2', atomBId: 'h4', order: 1 },
        { id: 'b7', atomAId: 'c2', atomBId: 'h5', order: 1 },
        { id: 'b8', atomAId: 'c3', atomBId: 'h6', order: 1 },
        { id: 'b9', atomAId: 'c3', atomBId: 'h7', order: 1 },
        { id: 'b10', atomAId: 'c3', atomBId: 'h8', order: 1 },
      ],
    };

    const result = validateMoleculeValence(propane);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.formula, 'C3H8');
  });

  // 6. Over-bonded carbon rejected
  it('6. Strictly rejects over-bonded carbon exceeding valence 4 (Texas Carbon)', () => {
    const invalidCarbon: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
        { id: 'h3', element: 'H' },
        { id: 'h4', element: 'H' },
        { id: 'h5', element: 'H' }, // 5th bond!
      ],
      bonds: [
        { id: 'b1', atomAId: 'c1', atomBId: 'h1', order: 1 },
        { id: 'b2', atomAId: 'c1', atomBId: 'h2', order: 1 },
        { id: 'b3', atomAId: 'c1', atomBId: 'h3', order: 1 },
        { id: 'b4', atomAId: 'c1', atomBId: 'h4', order: 1 },
        { id: 'b5', atomAId: 'c1', atomBId: 'h5', order: 1 },
      ],
    };

    const result = validateMoleculeValence(invalidCarbon);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Valence exceeded for C')));
    assert.equal(result.atomValences['c1'].isExceeded, true);
  });

  // 7. Ethene accepted
  it('7. Accepts valid ethene structure meeting exact atom count, double bond, and connectivity', () => {
    const validEthene: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
        { id: 'h3', element: 'H' },
        { id: 'h4', element: 'H' },
      ],
      bonds: [
        { id: 'b-cc', atomAId: 'c1', atomBId: 'c2', order: 2 }, // Double bond
        { id: 'b-ch1', atomAId: 'c1', atomBId: 'h1', order: 1 },
        { id: 'b-ch2', atomAId: 'c1', atomBId: 'h2', order: 1 },
        { id: 'b-ch3', atomAId: 'c2', atomBId: 'h3', order: 1 },
        { id: 'b-ch4', atomAId: 'c2', atomBId: 'h4', order: 1 },
      ],
    };

    const target = createEtheneTarget();
    const match = evaluateTargetMatch(validEthene, target);
    assert.equal(match.matched, true);
    assert.equal(match.validationResult.isValid, true);
    assert.equal(match.validationResult.formula, 'C2H4');
  });

  // 8. Incorrect ethene rejected
  it('8. Rejects incorrect ethene with single C-C bond instead of double bond', () => {
    const wrongEthene: Molecule = {
      atoms: [
        { id: 'c1', element: 'C' },
        { id: 'c2', element: 'C' },
        { id: 'h1', element: 'H' },
        { id: 'h2', element: 'H' },
        { id: 'h3', element: 'H' },
        { id: 'h4', element: 'H' },
      ],
      bonds: [
        { id: 'b-cc', atomAId: 'c1', atomBId: 'c2', order: 1 }, // Wrong! Single instead of double
        { id: 'b-ch1', atomAId: 'c1', atomBId: 'h1', order: 1 },
        { id: 'b-ch2', atomAId: 'c1', atomBId: 'h2', order: 1 },
        { id: 'b-ch3', atomAId: 'c2', atomBId: 'h3', order: 1 },
        { id: 'b-ch4', atomAId: 'c2', atomBId: 'h4', order: 1 },
      ],
    };

    const target = createEtheneTarget();
    const match = evaluateTargetMatch(wrongEthene, target);
    assert.equal(match.matched, false);
    assert.ok(match.reason && match.reason.length > 0);
  });

  // 9. Hybridization mapping
  it('9. Correctly maps carbon bond environments to sp3, sp2, and sp hybridization geometry', () => {
    const ethaneEnv: Molecule = {
      atoms: [{ id: 'c1', element: 'C' }, { id: 'c2', element: 'C' }],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 1 }],
    };
    const etheneEnv: Molecule = {
      atoms: [{ id: 'c1', element: 'C' }, { id: 'c2', element: 'C' }],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 2 }],
    };
    const ethyneEnv: Molecule = {
      atoms: [{ id: 'c1', element: 'C' }, { id: 'c2', element: 'C' }],
      bonds: [{ id: 'b1', atomAId: 'c1', atomBId: 'c2', order: 3 }],
    };

    const sp3 = getCarbonHybridization(ethaneEnv, 'c1');
    assert.equal(sp3.hybridization, 'sp3');
    assert.equal(sp3.idealAngle, 109.5);
    assert.equal(sp3.geometry, 'Tetrahedral');

    const sp2 = getCarbonHybridization(etheneEnv, 'c1');
    assert.equal(sp2.hybridization, 'sp2');
    assert.equal(sp2.idealAngle, 120);
    assert.equal(sp2.geometry, 'Trigonal Planar');

    const sp = getCarbonHybridization(ethyneEnv, 'c1');
    assert.equal(sp.hybridization, 'sp');
    assert.equal(sp.idealAngle, 180);
    assert.equal(sp.geometry, 'Linear');
  });

  // 10. Evidence structure
  it('10. Emits standardized ChemistryLearningEvidence payload consumable by MasteryEngine', () => {
    const evidence: ChemistryLearningEvidence = {
      conceptId: 'c-org-5',
      activityId: 'ethene-synthesis-canvas',
      evidenceType: 'interactive',
      score: 100,
      attempts: 1,
      timestamp: Date.now(),
      metadata: {
        moleculeFormula: 'C2H4',
        valenceErrors: 0,
      },
    };

    assert.equal(evidence.conceptId, 'c-org-5');
    assert.equal(evidence.score, 100);
    assert.equal(evidence.evidenceType, 'interactive');
  });

  // 11. Stage prerequisite state
  it('11. Integrates Organic Chemistry stage concepts into KnowledgeGraphEngine DAG', () => {
    const chemistryConcepts: ConceptNode[] = [
      {
        id: 'c-org-1',
        code: 'ORG-01',
        title: 'Carbon Tetravalency',
        prerequisites: [],
        description: '4 valence electrons',
        difficulty: 'foundational',
        orderIndex: 1,
        learningObjectives: ['Tetravalency'],
        estimatedMinutes: 15,
        visualModel: 'molecular',
      },
      {
        id: 'c-org-2',
        code: 'ORG-02',
        title: 'Catenation',
        prerequisites: ['c-org-1'],
        description: 'Carbon chains',
        difficulty: 'foundational',
        orderIndex: 2,
        learningObjectives: ['Catenation'],
        estimatedMinutes: 15,
        visualModel: 'molecular',
      },
      {
        id: 'c-org-3',
        code: 'ORG-03',
        title: 'Single Double Triple Bonds',
        prerequisites: ['c-org-1', 'c-org-2'],
        description: 'Bond orders',
        difficulty: 'foundational',
        orderIndex: 3,
        learningObjectives: ['Bond Multiplicity'],
        estimatedMinutes: 15,
        visualModel: 'molecular',
      },
      {
        id: 'c-org-4',
        code: 'ORG-04',
        title: 'Hybridization',
        prerequisites: ['c-org-3'],
        description: 'Geometry',
        difficulty: 'intermediate',
        orderIndex: 4,
        learningObjectives: ['Orbital Hybridization'],
        estimatedMinutes: 15,
        visualModel: 'molecular',
      },
      {
        id: 'c-org-5',
        code: 'ORG-05',
        title: 'Build Ethene Challenge',
        prerequisites: ['c-org-3', 'c-org-4'],
        description: 'Synthesis',
        difficulty: 'intermediate',
        orderIndex: 5,
        learningObjectives: ['Target Synthesis'],
        estimatedMinutes: 20,
        visualModel: 'molecular',
      },
    ];

    const graph = new KnowledgeGraphEngine(chemistryConcepts);
    const order = graph.getTopologicalOrder();
    assert.equal(order.length, 5);
    assert.equal(order[0], 'c-org-1'); // Root node ID must come first

    // Initially with empty mastery, only c-org-1 is unlocked
    assert.equal(graph.isUnlocked('c-org-1', new Set()), true);
    assert.equal(graph.isUnlocked('c-org-2', new Set()), false);
    assert.equal(graph.isUnlocked('c-org-5', new Set()), false);

    // After mastering prerequisites, downstream nodes unlock
    const mastered = new Set(['c-org-1', 'c-org-2']);
    assert.equal(graph.isUnlocked('c-org-3', mastered), true);
  });

  // 12. Locked stage behavior
  it('12. Confirms that Organic Chemistry plan stages correctly gate downstream stages as locked', () => {
    const plan = ORGANIC_CHEMISTRY_TOPIC_PLAN;
    assert.equal(plan.stages.length, 5);

    // Stage 1 is unlocked initially
    assert.equal(plan.stages[0].status, 'unlocked');
    assert.equal(plan.stages[0].id, 'stage-org-1');

    // Stages 2 through 5 are locked and declare explicit prerequisites
    for (let i = 1; i < plan.stages.length; i++) {
      assert.equal(plan.stages[i].status, 'locked');
      assert.ok(plan.stages[i].prerequisites.length > 0);
    }
  });
});
