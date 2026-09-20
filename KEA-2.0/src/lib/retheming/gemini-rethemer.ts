/**
 * Gemini AI Re-Theming Provider for KEA (P0-04)
 *
 * Primary path: Uses Google GenAI SDK (requires a valid GEMINI_API_KEY of the form AIzaSy...).
 * Fallback path: If Gemini key is missing or invalid, routes through the AIOrchestrator
 *   (NVIDIA NIM → Groq → deterministic fallback) so re-theming always works.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { StudentTheme } from "@/types";
import { CanonicalQuestion, RethemedQuestion } from "./types";
import { validateInvariants } from "./invariant-checker";
import { getFallbackRethemedQuestion } from "./fallback-rethemer";
import { AIOrchestrator } from "@/lib/ai/ai-orchestrator";

const RethemedSchema = z.object({
  thematicContext: z.string(),
  questionText: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })
  ),
});

function isValidGeminiKey(key: string): boolean {
  // Google AI Studio issues keys in two formats:
  //   Legacy format: "AIzaSy..." (39 chars)
  //   New format:    "AQ...." (OAuth-style, issued since 2025)
  // Both are valid API keys for the Gemini REST API.
  return (
    (key.startsWith("AIzaSy") && key.length > 30) ||
    (key.startsWith("AQ.") && key.length > 20)
  );
}

function buildRethemePrompt(canonical: CanonicalQuestion, theme: StudentTheme): string {
  return `You are an educational problem adapter for elementary/middle school students.
Task: Re-theme the following question into the student's chosen passion theme: "${theme}".

CRITICAL INVARIANT RULES:
1. You MUST preserve all exact numbers, fractions, formulas, and percentages: ${JSON.stringify(
    canonical.canonicalNumbers
  )}. Do NOT change any numbers or math operators!
2. You MUST preserve the exact same number of options (${canonical.options.length}).
3. Option ${canonical.correctOptionId} MUST remain the correct answer!
4. The narrative should be engaging, age-appropriate, and fit the "${theme}" theme.

Canonical Problem:
Question: ${canonical.questionText}
Options: ${JSON.stringify(canonical.options)}
Correct Option ID: ${canonical.correctOptionId}
Explanation: ${canonical.explanation}

Output strictly matching the required JSON schema with thematicContext, questionText, and options (id, text, isCorrect).`;
}

async function rethemeViaOrchestrator(
  canonical: CanonicalQuestion,
  theme: StudentTheme
): Promise<RethemedQuestion> {
  const orchestrator = AIOrchestrator.getInstance();
  const prompt = buildRethemePrompt(canonical, theme);

  try {
    const res = await orchestrator.generateStructured(prompt, RethemedSchema, {
      taskType: "learning",
      temperature: 0.2,
      timeoutMs: 15000,
    });

    const candidate = res.data;
    const validation = validateInvariants(canonical, {
      questionText: candidate.questionText,
      options: candidate.options,
      correctOptionId: canonical.correctOptionId,
    });

    if (!validation.passed) {
      console.warn(
        `[AIOrchestrator retheme] Invariant check failed (provider: ${res.metadata.provider}), using fallback:`,
        validation.errors
      );
      return getFallbackRethemedQuestion(canonical, theme);
    }

    return {
      canonicalId: canonical.id,
      conceptId: canonical.conceptId,
      theme,
      thematicContext: candidate.thematicContext,
      questionText: candidate.questionText,
      options: candidate.options,
      correctOptionId: canonical.correctOptionId,
      explanation: canonical.explanation,
      isFallback: false,
      invariantCheckPassed: true,
    };
  } catch (err) {
    console.warn("[AIOrchestrator retheme] Orchestrator failed, using deterministic fallback:", err);
    return getFallbackRethemedQuestion(canonical, theme);
  }
}

export async function rethemeWithGemini(
  canonical: CanonicalQuestion,
  theme: StudentTheme
): Promise<RethemedQuestion> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no key or key is clearly not a valid Gemini API key (e.g. OAuth token),
  // skip directly to the AIOrchestrator cascade (NVIDIA → Groq → fallback).
  if (!apiKey || !isValidGeminiKey(apiKey)) {
    console.info(
      "[rethemeWithGemini] Valid Gemini API key not found — routing through AIOrchestrator."
    );
    return rethemeViaOrchestrator(canonical, theme);
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = buildRethemePrompt(canonical, theme);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thematicContext: {
              type: Type.STRING,
              description:
                "A short 3-6 word themed scenario title (e.g. Commander Leo's Rocket Fuel Tanks)",
            },
            questionText: {
              type: Type.STRING,
              description:
                "The re-themed question narrative preserving all exact numbers and fractions",
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                },
                required: ["id", "text", "isCorrect"],
              },
            },
          },
          required: ["thematicContext", "questionText", "options"],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return rethemeViaOrchestrator(canonical, theme);
    }

    const candidate = JSON.parse(responseText);

    const validation = validateInvariants(canonical, {
      questionText: candidate.questionText,
      options: candidate.options,
      correctOptionId: canonical.correctOptionId,
    });

    if (!validation.passed) {
      console.warn("Gemini re-theming failed invariant check, routing to orchestrator:", validation.errors);
      return rethemeViaOrchestrator(canonical, theme);
    }

    return {
      canonicalId: canonical.id,
      conceptId: canonical.conceptId,
      theme,
      thematicContext: candidate.thematicContext,
      questionText: candidate.questionText,
      options: candidate.options,
      correctOptionId: canonical.correctOptionId,
      explanation: canonical.explanation,
      isFallback: false,
      invariantCheckPassed: true,
    };
  } catch (error) {
    console.warn(
      "[rethemeWithGemini] Gemini API error — routing through AIOrchestrator:",
      error instanceof Error ? error.message.slice(0, 100) : String(error)
    );
    return rethemeViaOrchestrator(canonical, theme);
  }
}
