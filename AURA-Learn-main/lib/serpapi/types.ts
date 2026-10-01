/**
 * AURA Learn & KEA Platform — SerpApi Core Types & Contracts
 * 
 * Strict contracts for SerpApi real-world discovery, Topic Intelligence Packs,
 * and Master Brain reasoning pipelines.
 */

export type SerpApiEngine =
  | "google"
  | "google_scholar"
  | "google_news"
  | "youtube";

export interface SerpApiUsageLog {
  timestamp: number;
  engine: SerpApiEngine;
  query: string;
  cacheHit: boolean;
  durationMs: number;
  status: "success" | "error" | "rate_limited" | "fallback";
}

export interface SerpApiStats {
  requestsToday: number;
  cacheHitsToday: number;
  cacheMissesToday: number;
  estimatedQuotaRemaining: number;
  lastUpdated: string;
}

export interface DiscoveredResearchPaper {
  id: string;
  title: string;
  authors?: string[];
  publicationYear?: number;
  source: string;
  snippet: string;
  url: string;
  whyThisMatters: string;
  relevanceScore: number;
}

export interface DiscoveredResource {
  id: string;
  title: string;
  source: string;
  snippet: string;
  url: string;
  type: "research" | "academic" | "documentation" | "video" | "real_world" | "further_reading";
  whyRelevant: string;
  thumbnail?: string;
  duration?: string;
  keyMomentTimestamp?: number;
}

export interface TopicIntelligencePack {
  topic: string;
  normalizedTopic: string;
  subtopics: string[];
  commonQuestions: string[];
  misconceptions: Array<{
    misconception: string;
    correction: string;
    underlyingFallacy: string;
  }>;
  whyQuestions: string[];
  whatIfQuestions: string[];
  realWorldConnections: Array<{
    title: string;
    domain: string;
    description: string;
    sourceUrl?: string;
  }>;
  interestingFacts: string[];
  researchResources: DiscoveredResearchPaper[];
  educationalResources: DiscoveredResource[];
  videoResources: DiscoveredResource[];
  currentExamples: Array<{
    headline: string;
    snippet: string;
    source: string;
    publishedDate?: string;
    url: string;
  }>;
  sourceMetadata: {
    engineUsed: string;
    queryUsed: string;
    totalResultsFound: number;
    generatedVia: "serpapi_live" | "supabase_cache" | "memory_cache" | "curated_fallback";
  };
  generatedAt: string;
  expiresAt: string;
}
