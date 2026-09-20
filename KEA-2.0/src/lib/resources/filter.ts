/**
 * KEA Platform — Local Stage & Concept Resource Filter
 * 
 * Aggressively optimizes SERP efficiency by filtering a single topic ResourcePool
 * locally across stages and concepts using keyword matching.
 * 
 * CRITICAL INVARIANT: MAKES ZERO NETWORK REQUESTS.
 */

import { EducationalResource, ResourcePool } from "./types";

const STOP_WORDS = new Set([
  "stage",
  "concept",
  "the",
  "a",
  "an",
  "and",
  "or",
  "in",
  "to",
  "of",
  "for",
  "with",
  "on",
  "at",
  "by",
  "from",
  "part",
  "unit",
  "chapter",
  "lesson",
  "intro",
  "introduction",
  "basics",
  "advanced",
  "intermediate",
  "foundational",
  "overview",
  "guide",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
]);

/**
 * Extracts normalized search terms from a stage or concept title.
 */
function extractTerms(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

/**
 * Filters a pre-fetched ResourcePool for a specific learning stage or concept.
 * Matches keywords against titles, snippets, and URLs.
 * 
 * Never makes external API or network calls.
 */
export function filterResourcesForStageOrConcept(
  pool: ResourcePool,
  stageTitle?: string,
  conceptTitle?: string
): EducationalResource[] {
  if (!pool || !Array.isArray(pool.resources)) {
    return [];
  }

  // If neither filter is provided, return all pool resources
  if (!stageTitle?.trim() && !conceptTitle?.trim()) {
    return pool.resources;
  }

  const stageTerms = extractTerms(stageTitle);
  const conceptTerms = extractTerms(conceptTitle);
  const allTerms = Array.from(new Set([...conceptTerms, ...stageTerms]));

  if (allTerms.length === 0) {
    return pool.resources;
  }

  const cleanConcept = (conceptTitle || "").toLowerCase().trim();
  const cleanStage = (stageTitle || "").toLowerCase().trim();

  interface ScoredResource {
    resource: EducationalResource;
    score: number;
  }

  const scored: ScoredResource[] = [];

  for (const resource of pool.resources) {
    const titleLower = resource.title.toLowerCase();
    const snippetLower = resource.snippet.toLowerCase();
    const urlLower = resource.url.toLowerCase();

    let score = 0;

    // Full phrase matches (high confidence)
    if (cleanConcept && (titleLower.includes(cleanConcept) || snippetLower.includes(cleanConcept))) {
      score += 10;
    }
    if (cleanStage && (titleLower.includes(cleanStage) || snippetLower.includes(cleanStage))) {
      score += 6;
    }

    // Term-by-term matching
    for (const term of allTerms) {
      const isConceptTerm = conceptTerms.includes(term);
      const weightMultiplier = isConceptTerm ? 2 : 1;

      if (titleLower.includes(term)) {
        score += 3 * weightMultiplier;
      }
      if (urlLower.includes(term)) {
        score += 2 * weightMultiplier;
      }
      if (snippetLower.includes(term)) {
        score += 1 * weightMultiplier;
      }
    }

    if (score > 0) {
      scored.push({ resource, score });
    }
  }

  if (scored.length > 0) {
    // Sort highest score first
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.resource);
  }

  // Fallback: If no narrow keyword matches found for a specific sub-concept,
  // return the broader pool resources so the learner always has guidance
  return pool.resources;
}
