/**
 * Canonical Problem Bank for KEA Platform
 * Contains mathematically verified baseline problems with explicit invariant numbers.
 */

import { CanonicalQuestion } from "./types";

export const CANONICAL_QUESTIONS: Record<string, CanonicalQuestion> = {
  // Golden Demo Node 03: Comparing Like Denominators
  "NODE_03": {
    id: "NODE_03",
    conceptId: "NODE_03",
    title: "Comparing Like Denominators",
    questionText: "Compare the fractions 3/8 and 5/8. Which statement is correct?",
    options: [
      { id: "opt-1", text: "3/8 is greater than 5/8 (3/8 > 5/8)", isCorrect: false },
      { id: "opt-2", text: "3/8 is less than 5/8 (3/8 < 5/8)", isCorrect: true },
      { id: "opt-3", text: "3/8 is equal to 5/8 (3/8 = 5/8)", isCorrect: false },
      { id: "opt-4", text: "They cannot be compared because the denominators are the same", isCorrect: false },
    ],
    correctOptionId: "opt-2",
    canonicalNumbers: ["3/8", "5/8"],
    explanation: "When denominators are identical (8 equal parts), the fraction with the smaller numerator represents fewer parts. 3 parts is less than 5 parts, so 3/8 < 5/8.",
    visualModel: "fraction-strip",
  },

  // Node 01: Fractional Parts & Wholes
  "NODE_01": {
    id: "NODE_01",
    conceptId: "NODE_01",
    title: "Equal Parts of a Whole",
    questionText: "A whole unit is divided into 4 equal parts. If 1 part is shaded, what fraction is shaded?",
    options: [
      { id: "opt-1", text: "1/4 of the whole", isCorrect: true },
      { id: "opt-2", text: "4/1 of the whole", isCorrect: false },
      { id: "opt-3", text: "1/3 of the whole", isCorrect: false },
      { id: "opt-4", text: "3/4 of the whole", isCorrect: false },
    ],
    correctOptionId: "opt-1",
    canonicalNumbers: ["4", "1", "1/4"],
    explanation: "The denominator 4 shows total equal parts; the numerator 1 shows parts considered: 1/4.",
    visualModel: "circle-pie",
  },

  // Node 02: Numerator and Denominator Roles
  "NODE_02": {
    id: "NODE_02",
    conceptId: "NODE_02",
    title: "Numerator and Denominator",
    questionText: "In the fraction 2/5, what does the number 5 represent?",
    options: [
      { id: "opt-1", text: "The total number of equal parts that make up 1 whole", isCorrect: true },
      { id: "opt-2", text: "The number of selected parts", isCorrect: false },
      { id: "opt-3", text: "The total number of wholes", isCorrect: false },
      { id: "opt-4", text: "The result of multiplying 2 by 5", isCorrect: false },
    ],
    correctOptionId: "opt-1",
    canonicalNumbers: ["2/5", "5", "1"],
    explanation: "The denominator (bottom number) represents the total equal divisions in 1 whole.",
    visualModel: "fraction-strip",
  },

  // Generic Programming Node (e.g. Python variables)
  "c1": {
    id: "c1",
    conceptId: "c1",
    title: "Variable Assignment & Values",
    questionText: "If x = 5 and y = 10, what is the value of x + y?",
    options: [
      { id: "opt-1", text: "15", isCorrect: true },
      { id: "opt-2", text: "50", isCorrect: false },
      { id: "opt-3", text: "510", isCorrect: false },
      { id: "opt-4", text: "5", isCorrect: false },
    ],
    correctOptionId: "opt-1",
    canonicalNumbers: ["5", "10", "15"],
    explanation: "Variable x stores 5 and y stores 10. Evaluating 5 + 10 gives 15.",
    visualModel: "standard",
  },

  // Problem Node *8877777474742: Reaction Stoichiometry & Efficiency
  "*8877777474742": {
    id: "*8877777474742",
    conceptId: "concept_8877777474742",
    title: "Content Creation Stoichiometry *8877777474742",
    questionText: "In chemical computation *8877777474742, a synthesis yields 88 grams of reactant A and 77 grams of product B. What is the net mass conversion ratio?",
    options: [
      { id: "opt-1", text: "77/88 (approx 87.5% conversion efficiency)", isCorrect: true },
      { id: "opt-2", text: "88/77 (approx 114.2% yield exceeding mass conservation)", isCorrect: false },
      { id: "opt-3", text: "11 grams deficit due to thermal dissipation", isCorrect: false },
      { id: "opt-4", text: "Cannot be determined without catalyst weight", isCorrect: false },
    ],
    correctOptionId: "opt-1",
    canonicalNumbers: ["88", "77", "77/88"],
    explanation: "Reaction efficiency is calculated by dividing actual product yield (77 g) by reactant mass (88 g), giving 77/88 = 87.5%.",
    visualModel: "standard",
  },

  "8877777474742": {
    id: "8877777474742",
    conceptId: "concept_8877777474742",
    title: "Content Creation Stoichiometry *8877777474742",
    questionText: "In chemical computation *8877777474742, a synthesis yields 88 grams of reactant A and 77 grams of product B. What is the net mass conversion ratio?",
    options: [
      { id: "opt-1", text: "77/88 (approx 87.5% conversion efficiency)", isCorrect: true },
      { id: "opt-2", text: "88/77 (approx 114.2% yield exceeding mass conservation)", isCorrect: false },
      { id: "opt-3", text: "11 grams deficit due to thermal dissipation", isCorrect: false },
      { id: "opt-4", text: "Cannot be determined without catalyst weight", isCorrect: false },
    ],
    correctOptionId: "opt-1",
    canonicalNumbers: ["88", "77", "77/88"],
    explanation: "Reaction efficiency is calculated by dividing actual product yield (77 g) by reactant mass (88 g), giving 77/88 = 87.5%.",
    visualModel: "standard",
  },
};

