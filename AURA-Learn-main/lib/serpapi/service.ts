import "server-only";
import type { SerpApiEngine, SerpApiUsageLog, SerpApiStats } from "./types";

/**
 * Server-Side SerpApi Client & Rate Limiter
 * 
 * Enforces strict security invariants:
 * - API Key NEVER exposed to browser or client code.
 * - Sliding window rate limiter to protect monthly quota (250 limit).
 * - Detailed usage telemetry for developers.
 * - Deterministic, graceful fallback when offline or key is missing.
 */

const globalForSerp = globalThis as unknown as {
  serpUsageLogs?: SerpApiUsageLog[];
  serpCacheHits?: number;
  serpCacheMisses?: number;
  serpRequestTimestamps?: number[];
};

const usageLogs: SerpApiUsageLog[] = globalForSerp.serpUsageLogs || (globalForSerp.serpUsageLogs = []);
let cacheHitsCount = globalForSerp.serpCacheHits || 0;
let cacheMissesCount = globalForSerp.serpCacheMisses || 0;

// Rate limiting state
const MAX_REQUESTS_PER_MINUTE = 15;
const requestTimestamps: number[] = globalForSerp.serpRequestTimestamps || (globalForSerp.serpRequestTimestamps = []);

export function getSerpApiKey(): string | undefined {
  return (
    process.env.SERPAPI_API_KEY ||
    process.env.SERP_API_KEY ||
    process.env.NEXT_PUBLIC_SERPAPI_API_KEY // checked only as fallback if user set it in env
  );
}

export function isSerpApiConfigured(): boolean {
  return Boolean(getSerpApiKey());
}

/**
 * Validates and sanitizes queries to prevent arbitrary search proxy abuse.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/[^\w\s\-.,?':"()]/gi, "")
    .slice(0, 150);
}

/**
 * Logs a SerpApi call for usage analytics.
 */
export function recordSerpApiUsage(log: SerpApiUsageLog) {
  usageLogs.unshift(log);
  if (usageLogs.length > 500) {
    usageLogs.pop();
  }
  if (log.cacheHit) {
    cacheHitsCount++;
    globalForSerp.serpCacheHits = cacheHitsCount;
  } else {
    cacheMissesCount++;
    globalForSerp.serpCacheMisses = cacheMissesCount;
  }
}

/**
 * Returns developer usage statistics.
 */
export function getSerpApiUsageStats(): SerpApiStats {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const requestsToday = usageLogs.filter(
    (l) => l.timestamp >= oneDayAgo && !l.cacheHit
  ).length;

  return {
    requestsToday,
    cacheHitsToday: cacheHitsCount,
    cacheMissesToday: cacheMissesCount,
    estimatedQuotaRemaining: Math.max(0, 250 - requestsToday),
    lastUpdated: new Date().toISOString(),
  };
}

export function getRecentUsageLogs(limit = 20): SerpApiUsageLog[] {
  return usageLogs.slice(0, limit);
}

interface RawSerpApiResponse {
  organic_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    source?: string;
    publication_info?: { summary?: string; authors?: Array<{ name: string }> };
    inline_links?: { cited_by?: { total?: number } };
  }>;
  related_questions?: Array<{
    question?: string;
    snippet?: string;
    title?: string;
    link?: string;
  }>;
  related_searches?: Array<{ query?: string }>;
  knowledge_graph?: {
    title?: string;
    type?: string;
    description?: string;
    source?: { name?: string; link?: string };
  };
  news_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    source?: { name?: string } | string;
    date?: string;
  }>;
  video_results?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    duration?: string;
    thumbnail?: string;
  }>;
}

/**
 * Low-level server-side fetch with rate limiting and logging.
 */
export async function executeSerpApiSearch(
  engine: SerpApiEngine,
  params: Record<string, string | number>
): Promise<{ data: RawSerpApiResponse | null; error?: string; fromCache: boolean }> {
  const apiKey = getSerpApiKey();
  const startTime = Date.now();
  const queryString = String(params.q || "");
  const sanitizedQ = sanitizeSearchQuery(queryString);

  if (!sanitizedQ) {
    return { data: null, error: "Empty query", fromCache: false };
  }

  // Rate Limiting Check
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    recordSerpApiUsage({
      timestamp: now,
      engine,
      query: sanitizedQ,
      cacheHit: false,
      durationMs: 0,
      status: "rate_limited",
    });
    return { data: null, error: "Rate limit exceeded. Please wait.", fromCache: false };
  }

  if (!apiKey) {
    recordSerpApiUsage({
      timestamp: now,
      engine,
      query: sanitizedQ,
      cacheHit: false,
      durationMs: 0,
      status: "fallback",
    });
    return { data: null, error: "SerpApi key not configured", fromCache: false };
  }

  requestTimestamps.push(now);

  const searchParams = new URLSearchParams();
  searchParams.set("engine", engine);
  searchParams.set("api_key", apiKey);
  for (const [key, value] of Object.entries(params)) {
    if (key !== "engine" && key !== "api_key") {
      searchParams.set(key, String(value));
    }
  }

  const url = `https://serpapi.com/search.json?${searchParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const duration = Date.now() - startTime;

    if (!res.ok) {
      recordSerpApiUsage({
        timestamp: now,
        engine,
        query: sanitizedQ,
        cacheHit: false,
        durationMs: duration,
        status: "error",
      });
      return { data: null, error: `SerpApi responded with HTTP ${res.status}`, fromCache: false };
    }

    const json = (await res.json()) as RawSerpApiResponse;
    recordSerpApiUsage({
      timestamp: now,
      engine,
      query: sanitizedQ,
      cacheHit: false,
      durationMs: duration,
      status: "success",
    });

    return { data: json, fromCache: false };
  } catch (err) {
    const duration = Date.now() - startTime;
    recordSerpApiUsage({
      timestamp: now,
      engine,
      query: sanitizedQ,
      cacheHit: false,
      durationMs: duration,
      status: "error",
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : "Search network failure",
      fromCache: false,
    };
  }
}
