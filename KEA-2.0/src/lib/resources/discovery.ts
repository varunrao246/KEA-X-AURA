/**
 * KEA Platform — Server-Side Resource Discovery Engine
 * 
 * Enforces the critical architecture requirement:
 * "ONE SERP SEARCH PER NEW TOPIC. 250 SERP searches/month."
 * 
 * Flow:
 * 1. Normalize topic (lowercase, trimmed, collapsed whitespace).
 * 2. Check in-memory cache -> Return immediately if present (0 API calls).
 * 3. If genuine new topic and API key present -> Perform SINGLE SerpApi search.
 * 4. Parse Google organic, video, knowledge graph, and YouTube links.
 * 5. Deduplicate and cache.
 * 6. If no key set or fetch fails -> Return curated fallback (isFallback: true).
 */

import {
  DiscoverResourcesOptions,
  DiscoverResourcesResult,
  ResourcePool,
} from "./types";
import { normalizeTopic, createSearchKey } from "./normalizer";
import { getCachedResourcePool, setCachedResourcePool } from "./cache";
import { parseSerpApiResponse, SerpApiResponse } from "./parser";
import { getCuratedFallbackPool } from "./fallback";

export async function discoverResources(
  topic: string,
  options?: DiscoverResourcesOptions
): Promise<DiscoverResourcesResult> {
  const normalizedTopic = normalizeTopic(topic);

  if (!normalizedTopic) {
    const emptyPool: ResourcePool = {
      topic: topic || "",
      normalizedTopic: "",
      searchKey: "topic:",
      query: "",
      searchedAt: Date.now(),
      requestCount: 0,
      resources: [],
      isFallback: true,
    };
    return {
      success: false,
      resourcePool: emptyPool,
      fromCache: false,
      error: "Topic cannot be empty.",
    };
  }

  // 1. In-Memory Cache Check — CRITICAL SERP USAGE OPTIMIZATION
  if (!options?.forceRefresh) {
    const cached = getCachedResourcePool(normalizedTopic);
    if (cached) {
      return {
        success: true,
        resourcePool: cached,
        fromCache: true,
      };
    }
  }

  // 2. Determine API Key
  const apiKey =
    options?.apiKey ||
    process.env.SERPAPI_API_KEY ||
    process.env.SERP_API_KEY;

  const query =
    options?.customQuery || `${normalizedTopic} tutorial documentation guide`;

  // 3. If no API key configured, use graceful curated fallback
  if (!apiKey) {
    const fallbackPool = getCuratedFallbackPool(topic);
    setCachedResourcePool(normalizedTopic, fallbackPool);
    return {
      success: true,
      resourcePool: fallbackPool,
      fromCache: false,
    };
  }

  // 4. Perform Exactly ONE SERP API Search
  const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
    query
  )}&api_key=${apiKey}&num=15`;

  try {
    const fetcher = options?.fetchFn || fetch;
    const response = await fetcher(serpUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SERP API request failed with status: ${response.status}`);
    }

    const payload = (await response.json()) as SerpApiResponse;
    const parsedResources = parseSerpApiResponse(payload);

    if (parsedResources.length === 0) {
      // If SERP returned 0 usable items, fall back to curated
      const fallbackPool = getCuratedFallbackPool(topic);
      setCachedResourcePool(normalizedTopic, fallbackPool);
      return {
        success: true,
        resourcePool: fallbackPool,
        fromCache: false,
      };
    }

    const newPool: ResourcePool = {
      topic,
      normalizedTopic,
      searchKey: createSearchKey(normalizedTopic),
      query,
      searchedAt: Date.now(),
      requestCount: 1, // Exactly 1 request made
      resources: parsedResources,
      isFallback: false,
    };

    // Cache the newly discovered pool
    setCachedResourcePool(normalizedTopic, newPool);

    return {
      success: true,
      resourcePool: newPool,
      fromCache: false,
    };
  } catch (error) {
    console.warn(
      `[SERP Discovery] Search failed for topic "${topic}", using graceful fallback:`,
      error instanceof Error ? error.message : error
    );

    // Graceful fallback: roadmap NEVER breaks
    const fallbackPool = getCuratedFallbackPool(topic);
    setCachedResourcePool(normalizedTopic, fallbackPool);

    return {
      success: true,
      resourcePool: fallbackPool,
      fromCache: false,
    };
  }
}
