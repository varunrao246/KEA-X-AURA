import { numberTokens, quantityTokens } from "./guardrails";
import type { ChatMessage } from "./llm";
import { INTEREST_NAMES } from "./interests";
import type { Candidate, ModelEcho, ThemeSource } from "./types";
import type { Interest } from "../types";

/**
 * Builds the model prompt from the STRUCTURED question (PRD section 14) and parses the reply.
 * The model gets what must not change spelled out, and is only allowed to return new narrative text.
 */

const SYSTEM = `You rewrite school science questions so the story matches a student's interest.

You may change ONLY the narrative: the setting, characters, objects, vocabulary and tone.
You must NOT change anything academic. Keep every number exactly as written, with the same units. Keep every variable value. Keep the same quantity being asked for. Keep chemical formulae exactly (HCl, NaOH, H2SO4, pH). Keep the same difficulty and the same concept.
Never state, hint at or calculate the answer. Do not add new numbers, new quantities or extra steps. Do not use number words such as "twice", "double" or "half" unless the original does.
Write one or two short sentences for a school student. Plain text only: no markdown, no lists, no emoji, no links. Keep it age-appropriate.

Reply with a single JSON object and nothing else:
{"stem": "<the rewritten question text>", "echo": {"numbers": [<the numeric variable values>], "unit": "<answer unit>", "difficulty": <level>, "learningObjective": "<unchanged>", "answerUnchanged": true}}`;

export function mustPreserve(src: ThemeSource) {
  return {
    numbers: numberTokens(src.stem).map((n) => (n.startsWith("^") ? `10${n}` : n)),
    quantitiesWithUnits: quantityTokens(src.stem),
    askedFor: src.unit ? `a value in ${src.unit}` : "the same thing the original asks for",
  };
}

export function buildMessages(src: ThemeSource, interest: Interest): ChatMessage[] {
  const payload = {
    topic: src.topic,
    question: src.stem,
    ...(src.type === "mcq" ? { note: "This is a multiple-choice question. Do not include or change the options, and do not mention the correct option." } : {}),
    correctAnswer: src.type === "numeric" ? `${src.answer}${src.unit ? " " + src.unit : ""}` : src.answer,
    difficulty: src.difficulty,
    learningObjective: src.learningObjective,
    variables: src.variables ?? null,
    formula: src.formula ?? null,
    studentInterest: INTEREST_NAMES[interest],
    mustPreserve: mustPreserve(src),
  };
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Rewrite this question for a student who loves ${INTEREST_NAMES[interest]}.\n\n${JSON.stringify(payload, null, 2)}` },
  ];
}

/** Accepts plain JSON or JSON wrapped in a code fence. Returns null if it cannot be understood. */
export function parseCandidate(text: string): Candidate | null {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const obj = JSON.parse(t.slice(start, end + 1)) as { stem?: unknown; options?: unknown; echo?: unknown };
    if (typeof obj.stem !== "string") return null;
    const options = Array.isArray(obj.options) && obj.options.every((o) => typeof o === "string") ? (obj.options as string[]) : undefined;
    const echo = obj.echo && typeof obj.echo === "object" ? (obj.echo as ModelEcho) : undefined;
    return { stem: obj.stem, options, echo };
  } catch {
    return null;
  }
}
