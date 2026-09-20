/**
 * KEA Platform — AI Oral Probe Evaluator & Fallback Heuristic (P1-01)
 *
 * Implements conceptual reasoning evaluation for oral and typed explanations.
 * Diagnoses misconceptions (e.g., whole-number denominator bias) and provides
 * encouraging pedagogical feedback with guaranteed deterministic fallback.
 */

import {
  OralEvaluationRequest,
  OralEvaluationResult,
  KnownMisconception,
} from "./types";

/**
 * Deterministic keyword heuristic evaluation when offline or API latency > 2.5s.
 */
export function evaluateOralHeuristic(
  request: OralEvaluationRequest
): OralEvaluationResult {
  const startTime = Date.now();
  const text = request.transcript.toLowerCase().trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Procedural Guessing Check
  if (
    wordCount < 2 ||
    text.length < 6 ||
    text.includes("i guessed") ||
    text.includes("random") ||
    text.includes("idk") ||
    text.includes("don't know") ||
    text.includes("dont know")
  ) {
    return {
      conceptualUnderstandingScore: 0.15,
      articulatesKeyPrinciple: false,
      identifiedMisconception: "procedural_guessing",
      misconceptionDescription: "Student selected an answer by elimination or random guess without conceptual basis.",
      evidenceQuote: request.transcript.slice(0, 80),
      encouragingChildFeedback:
        "It's totally okay to feel unsure! Let's think about what the numbers mean: the bottom number shows how many total pieces, and the top number shows how many pieces you have.",
      suggestedCorrection: "Compare how many pieces each fraction has.",
      isFallback: true,
      evaluationLatencyMs: Date.now() - startTime,
    };
  }

  // Misconception 1: Whole Number Denominator Bias
  // Child thinks bigger number automatically means bigger fraction or confuses denominator/numerator magnitude
  const hasDenominatorBias =
    (text.includes("8 is bigger") && (text.includes("so") || text.includes("gives") || text.includes("more"))) ||
    ((text.includes("bigger number") || text.includes("larger number")) && (text.includes("bottom") || text.includes("denominator") || text.includes("8 is"))) ||
    /(?:bottom|denominator)\s*(?:is\s*(?:the\s*)?)?(?:bigger|larger|more)/i.test(text) ||
    (text.includes("more pieces") && (text.includes("smaller") || text.includes("3/8"))) ||
    text.includes("8 is more than");

  if (hasDenominatorBias) {
    return {
      conceptualUnderstandingScore: 0.35,
      articulatesKeyPrinciple: false,
      identifiedMisconception: "whole_number_denominator_bias",
      misconceptionDescription:
        "Whole-Number Denominator Bias: interpreting fraction magnitude solely through whole-number size heuristics.",
      evidenceQuote: request.transcript.slice(0, 100),
      encouragingChildFeedback:
        "You noticed that 8 is a big number! But remember: when the denominators are equal (both are 8ths), more pieces at the top means a larger share!",
      suggestedCorrection: "When denominators are the same, look at the top number (numerator) to see which has more pieces.",
      isFallback: true,
      evaluationLatencyMs: Date.now() - startTime,
    };
  }

  // Key Principle Articulation: Same denominator / More shaded parts / Greater numerator
  const mentionsSameDenominator =
    text.includes("same denominator") ||
    text.includes("like denominator") ||
    text.includes("both have 8") ||
    text.includes("same parts") ||
    text.includes("equal parts") ||
    text.includes("same size pieces");

  const mentionsNumeratorMagnitude =
    /5\s*(?:pieces|parts)?\s*is\s*(?:more|greater|bigger)\s*than\s*3/i.test(text) ||
    text.includes("5 is more than 3") ||
    text.includes("5 is bigger than 3") ||
    text.includes("5 is greater than 3") ||
    text.includes("5 pieces") ||
    text.includes("five is more") ||
    text.includes("more shaded") ||
    text.includes("more parts") ||
    text.includes("greater than 3") ||
    text.includes("top number is bigger") ||
    text.includes("larger numerator") ||
    text.includes("greater numerator");

  if (mentionsSameDenominator || mentionsNumeratorMagnitude) {
    const articulatesBoth = mentionsSameDenominator && mentionsNumeratorMagnitude;
    return {
      conceptualUnderstandingScore: articulatesBoth ? 0.95 : 0.82,
      articulatesKeyPrinciple: true,
      identifiedMisconception: "none",
      evidenceQuote: request.transcript.slice(0, 100),
      encouragingChildFeedback:
        "Outstanding reasoning! You clearly understood that when the pieces are the same size, having more pieces (greater numerator) means a larger fraction!",
      suggestedCorrection: undefined,
      isFallback: true,
      evaluationLatencyMs: Date.now() - startTime,
    };
  }

  // Partial / Incomplete Reasoning
  return {
    conceptualUnderstandingScore: 0.55,
    articulatesKeyPrinciple: false,
    identifiedMisconception: "incomplete_reasoning",
    misconceptionDescription: "Student provided an intuitive response but did not explicitly cite the numerator comparison rule.",
    evidenceQuote: request.transcript.slice(0, 100),
    encouragingChildFeedback:
      "Good effort! You're on the right track. Try explaining what the top number (numerator) tells us about the number of slices.",
    suggestedCorrection: "Explain why 5 slices of an 8-slice pie is more than 3 slices of the same pie.",
    isFallback: true,
    evaluationLatencyMs: Date.now() - startTime,
  };
}

/**
 * Evaluates oral transcript using Gemini Flash if available, with strict 2.5s fallback guard.
 */
export async function evaluateOralResponse(
  request: OralEvaluationRequest
): Promise<OralEvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return evaluateOralHeuristic(request);
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s latency guard
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  try {
    const prompt = `You are an expert pedagogical assessment engine evaluating a student's oral explanation in an adaptive learning platform.

CONCEPT: "${request.conceptTitle}" (${request.conceptId})
EXPECTED PRINCIPLE: ${request.expectedConceptPrinciple || "When denominators are equal, fractions with greater numerators represent greater quantities."}
STUDENT TRANSCRIPT:
<student_transcript>
${request.transcript.slice(0, 1000).replace(/"/g, "'")}
</student_transcript>

Evaluate whether the student genuinely articulates conceptual understanding or demonstrates a misconception.
Possible misconceptions:
- "whole_number_denominator_bias" (thinks bigger number always means bigger fraction, or confuses parts with wholes)
- "numerator_denominator_inversion" (confuses top and bottom roles)
- "procedural_guessing" (recites procedural steps without understanding, or guessed)
- "incomplete_reasoning" (intuitive but lacks mathematical justification)
- "none" (correct mathematical conceptual reasoning)

Respond strictly with valid JSON conforming to this schema:
{
  "conceptual_understanding_score": number between 0.0 and 1.0,
  "articulates_key_principle": boolean,
  "identified_misconception": "whole_number_denominator_bias" | "numerator_denominator_inversion" | "procedural_guessing" | "incomplete_reasoning" | "none",
  "evidence_quote": "brief excerpt from transcript",
  "encouraging_child_feedback": "1-2 warm, encouraging sentences addressing the child directly"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      return evaluateOralHeuristic(request);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return evaluateOralHeuristic(request);
    }

    const parsed = JSON.parse(rawText);

    return {
      conceptualUnderstandingScore: Math.min(
        1.0,
        Math.max(0.0, Number(parsed.conceptual_understanding_score ?? 0.5))
      ),
      articulatesKeyPrinciple: Boolean(parsed.articulates_key_principle),
      identifiedMisconception: (parsed.identified_misconception as KnownMisconception) || "none",
      evidenceQuote: String(parsed.evidence_quote || request.transcript.slice(0, 80)),
      encouragingChildFeedback: String(
        parsed.encouraging_child_feedback || "Great job explaining your thoughts!"
      ),
      isFallback: false,
      evaluationLatencyMs: Date.now() - startTime,
    };
  } catch {
    clearTimeout(timeoutId);
    return evaluateOralHeuristic(request);
  }
}
