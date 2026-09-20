import { ConceptNode } from "./types";
import { KnowledgeGraphEngine } from "./engine";

/**
 * Class 4 Mathematics — Understanding Fractions
 * Canonical 7-Node Prerequisite Knowledge Graph Seed Data
 */
export const CLASS_4_FRACTIONS_NODES: ConceptNode[] = [
  {
    id: "NODE_01_PARTS",
    code: "FRAC-01",
    title: "Equal Parts & Unit Fractions",
    description:
      "Understanding parts of a whole and unit fractions (1/2, 1/3, 1/4) through equal sharing and partitioning.",
    difficulty: "foundational",
    orderIndex: 1,
    prerequisites: [],
    learningObjectives: [
      "Distinguish equal partitions from unequal partitions",
      "Identify unit fractions: 1/2, 1/3, and 1/4",
      "Model fair-share scenarios using physical and visual wholes",
    ],
    estimatedMinutes: 10,
    visualModel: "circle-pie",
  },
  {
    id: "NODE_02_NUM_DENOM",
    code: "FRAC-02",
    title: "Numerator & Denominator Roles",
    description:
      "Understanding fractional notation p/q: the denominator q defines total equal parts, while the numerator p represents selected parts.",
    difficulty: "foundational",
    orderIndex: 2,
    prerequisites: ["NODE_01_PARTS"],
    learningObjectives: [
      "Define numerator as the count of selected parts",
      "Define denominator as the total count of equal parts in the whole",
      "Write accurate fraction symbols representing shaded region models",
    ],
    estimatedMinutes: 12,
    visualModel: "fraction-strip",
  },
  {
    id: "NODE_03_COMPARE_LIKE",
    code: "FRAC-03",
    title: "Comparing Fractions with Like Denominators",
    description:
      "Comparing fractions that share the same denominator by evaluating numerator magnitudes (e.g. 2/5 vs 4/5).",
    difficulty: "intermediate",
    orderIndex: 3,
    prerequisites: ["NODE_02_NUM_DENOM"],
    learningObjectives: [
      "Compare fractions sharing equal denominators using >, <, and =",
      "Order like-denominator fractions along a calibrated number line",
      "Articulate why equal unit sizes allow direct numerator comparison",
    ],
    estimatedMinutes: 15,
    visualModel: "number-line",
  },
  {
    id: "NODE_04_EQUIVALENT",
    code: "FRAC-04",
    title: "Visual Equivalent Fractions",
    description:
      "Discovering that different numeric fraction expressions can describe identical physical quantities (e.g. 1/2 = 2/4 = 4/8).",
    difficulty: "intermediate",
    orderIndex: 4,
    prerequisites: ["NODE_02_NUM_DENOM"],
    learningObjectives: [
      "Identify equivalent area partitions across aligned fraction strips",
      "Recognize that multiplying/dividing both parts by the same factor yields equivalence",
      "Find simple equivalent forms for 1/2, 1/3, and 1/4",
    ],
    estimatedMinutes: 15,
    visualModel: "fraction-strip",
  },
  {
    id: "NODE_05_COMPARE_UNLIKE",
    code: "FRAC-05",
    title: "Comparing Fractions with Unlike Denominators",
    description:
      "Comparing fractions with different denominators (e.g. 1/2 vs 3/8) using benchmark fractions and visual equivalence.",
    difficulty: "advanced",
    orderIndex: 5,
    prerequisites: ["NODE_03_COMPARE_LIKE", "NODE_04_EQUIVALENT"],
    learningObjectives: [
      "Compare unit fractions with unlike denominators (e.g. 1/4 vs 1/8)",
      "Overcome whole-number denominator bias (recognize 1/8 < 1/4)",
      "Use equivalent fraction benchmarks (such as 1/2) to compare unlike fractions",
    ],
    estimatedMinutes: 20,
    visualModel: "fraction-strip",
  },
  {
    id: "NODE_06_ADD_LIKE",
    code: "FRAC-06",
    title: "Adding Fractions with Like Denominators",
    description:
      "Adding fractions with identical denominators (e.g. 1/6 + 3/6 = 4/6) by combining numerator quantities.",
    difficulty: "intermediate",
    orderIndex: 6,
    prerequisites: ["NODE_03_COMPARE_LIKE"],
    learningObjectives: [
      "Add like-fraction numerators while preserving the denominator",
      "Illustrate fraction addition using contiguous bar strips",
      "Solve single-step addition contextual problems",
    ],
    estimatedMinutes: 15,
    visualModel: "number-line",
  },
  {
    id: "NODE_07_WORD_PROBLEMS",
    code: "FRAC-07",
    title: "Real-World Multi-Step Fraction Problems",
    description:
      "Synthesizing comparison and addition concepts to solve multi-step contextual word challenges.",
    difficulty: "advanced",
    orderIndex: 7,
    prerequisites: ["NODE_05_COMPARE_UNLIKE", "NODE_06_ADD_LIKE"],
    learningObjectives: [
      "Extract fraction operations from narrative contextual scenarios",
      "Apply both comparison and addition in a unified problem context",
      "Formulate self-contained reasoning explaining multi-step fraction solutions",
    ],
    estimatedMinutes: 20,
    visualModel: "real-world-context",
  },
];

/**
 * Pre-instantiated, validated Class 4 Fractions Knowledge Graph Engine
 */
export const class4FractionsGraph = new KnowledgeGraphEngine(CLASS_4_FRACTIONS_NODES);
