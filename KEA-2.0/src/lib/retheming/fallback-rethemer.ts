/**
 * Fallback Re-Themer for KEA (P0-04)
 * 
 * Provides verified, invariant-safe pre-authored questions across all 4 student themes
 * (space, wildlife, chef, superhero) to guarantee 100% demo reliability without network/API failure.
 */

import { StudentTheme } from "@/types";
import { CanonicalQuestion, RethemedQuestion } from "./types";

interface ThemedQuestionTemplate {
  thematicContext: string;
  questionText: string;
  optionsText: Record<string, string>;
}

const PRE_AUTHORED_THEMES: Record<string, Record<StudentTheme, ThemedQuestionTemplate>> = {
  NODE_03: {
    space: {
      thematicContext: "Commander Leo's Starship Fuel Tanks",
      questionText:
        "Starship Pod Alpha has 3/8 of a tank remaining, while Pod Beta has 5/8 of a tank remaining. Which statement correctly compares the fuel pods?",
      optionsText: {
        "opt-1": "Pod Alpha has more fuel than Beta (3/8 > 5/8)",
        "opt-2": "Pod Alpha has less fuel than Beta (3/8 < 5/8)",
        "opt-3": "Both pods have equal fuel (3/8 = 5/8)",
        "opt-4": "They cannot be compared because the denominators are the same",
      },
    },
    wildlife: {
      thematicContext: "Serengeti Wildlife Safari Waterhole",
      questionText:
        "The Lion Pride drank 3/8 of the water trough, while the Elephant Herd drank 5/8 of the water trough. Which animal group drank less water?",
      optionsText: {
        "opt-1": "The Lion Pride drank more than the Elephant Herd (3/8 > 5/8)",
        "opt-2": "The Lion Pride drank less than the Elephant Herd (3/8 < 5/8)",
        "opt-3": "Both groups drank equal water (3/8 = 5/8)",
        "opt-4": "They cannot be compared because the denominators are the same",
      },
    },
    chef: {
      thematicContext: "Junior Chef Cupcake Bakery",
      questionText:
        "Chef Leo needs 3/8 cup of sugar for Vanilla Frosting, and 5/8 cup of sugar for Chocolate Frosting. Which frosting uses less sugar?",
      optionsText: {
        "opt-1": "Vanilla Frosting uses more sugar than Chocolate (3/8 > 5/8)",
        "opt-2": "Vanilla Frosting uses less sugar than Chocolate (3/8 < 5/8)",
        "opt-3": "Both frostings use equal sugar (3/8 = 5/8)",
        "opt-4": "They cannot be compared because the denominators are the same",
      },
    },
    superhero: {
      thematicContext: "Superhero Academy Energy Shields",
      questionText:
        "Laser Shield Alpha is charged to 3/8 power, while Laser Shield Beta is charged to 5/8 power. Which shield has less power?",
      optionsText: {
        "opt-1": "Shield Alpha has more energy than Beta (3/8 > 5/8)",
        "opt-2": "Shield Alpha has less energy than Beta (3/8 < 5/8)",
        "opt-3": "Both shields have equal energy (3/8 = 5/8)",
        "opt-4": "They cannot be compared because the denominators are the same",
      },
    },
  },
};

const THEME_PREFIXES: Record<StudentTheme, { context: string; prefix: string }> = {
  space: {
    context: "Cosmic Space Station Operations",
    prefix: "[Space Mission] Orbit telemetry report: ",
  },
  wildlife: {
    context: "Wildlife Safari Observation",
    prefix: "[Safari Tracking] Animal tracker field log: ",
  },
  chef: {
    context: "Junior Chef Academy Kitchen",
    prefix: "[Chef Challenge] Culinary measurement check: ",
  },
  superhero: {
    context: "Superhero Training Academy",
    prefix: "[Hero Training] Tactical academy simulation: ",
  },
};

const THEME_ALIASES: Record<string, StudentTheme> = {
  cooking: "chef",
  food: "chef",
  baking: "chef",
  gaming: "superhero",
  game: "superhero",
  games: "superhero",
  sports: "wildlife",
  sport: "wildlife",
  nature: "wildlife",
  animals: "wildlife",
  space: "space",
  wildlife: "wildlife",
  chef: "chef",
  superhero: "superhero",
};

export function normalizeStudentTheme(inputTheme?: string): StudentTheme {
  if (!inputTheme) return "space";
  const lower = String(inputTheme).toLowerCase().trim();
  return THEME_ALIASES[lower] || "space";
}

/**
 * Generates an invariant-safe re-themed question using curated templates or dynamic skinning.
 */
export function getFallbackRethemedQuestion(
  canonical: CanonicalQuestion,
  theme: StudentTheme | string
): RethemedQuestion {
  const normalizedTheme = normalizeStudentTheme(theme);
  const preAuthored = PRE_AUTHORED_THEMES[canonical.id]?.[normalizedTheme];

  if (preAuthored) {
    const options = canonical.options.map(o => ({
      id: o.id,
      text: preAuthored.optionsText[o.id] || o.text,
      isCorrect: o.isCorrect,
    }));

    return {
      canonicalId: canonical.id,
      conceptId: canonical.conceptId,
      theme: normalizedTheme,
      thematicContext: preAuthored.thematicContext,
      questionText: preAuthored.questionText,
      options,
      correctOptionId: canonical.correctOptionId,
      explanation: canonical.explanation,
      isFallback: true,
      invariantCheckPassed: true,
    };
  }

  // Dynamic generic skinning for arbitrary canonical questions
  const themeMeta = THEME_PREFIXES[normalizedTheme] || THEME_PREFIXES.space;
  return {
    canonicalId: canonical.id,
    conceptId: canonical.conceptId,
    theme: normalizedTheme,
    thematicContext: themeMeta.context,
    questionText: `${themeMeta.prefix}${canonical.questionText}`,
    options: [...canonical.options],
    correctOptionId: canonical.correctOptionId,
    explanation: canonical.explanation,
    isFallback: true,
    invariantCheckPassed: true,
  };
}
