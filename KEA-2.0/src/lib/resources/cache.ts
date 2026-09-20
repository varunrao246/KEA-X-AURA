/**
 * KEA Platform — Server-Side In-Memory Resource Pool Cache
 * 
 * Aggressively enforces the critical requirement:
 * "ONE SERP SEARCH PER NEW TOPIC. 250 SERP searches/month."
 * 
 * Stores ResourcePool indexed by normalized topic. Subsequent requests for
 * the same topic return the cached pool with requestCount = 0.
 */

import { ResourcePool } from "./types";
import { normalizeTopic } from "./normalizer";

// Global singleton map across hot reloads in development
const globalCacheKey = Symbol.for("kea.resourcePoolCache");
type GlobalWithCache = typeof globalThis & {
  [globalCacheKey]?: Map<string, ResourcePool>;
};

const globalObj = globalThis as GlobalWithCache;
if (!globalObj[globalCacheKey]) {
  globalObj[globalCacheKey] = new Map<string, ResourcePool>();
}

const resourcePoolCache: Map<string, ResourcePool> = globalObj[globalCacheKey]!;

/**
 * Retrieves a cached resource pool by topic (automatically normalized).
 * If found, returns a shallow copy with requestCount = 0 to reflect that
 * zero SERP API requests were made for this retrieval.
 */
export function getCachedResourcePool(topic: string): ResourcePool | undefined {
  const normalized = normalizeTopic(topic);
  if (!normalized) return undefined;

  const pool = resourcePoolCache.get(normalized);
  if (!pool) return undefined;

  // Return with requestCount = 0 for cache hits
  return {
    ...pool,
    requestCount: 0,
  };
}

/**
 * Stores a resource pool in the in-memory cache under its normalized topic.
 */
export function setCachedResourcePool(topic: string, pool: ResourcePool): void {
  const normalized = normalizeTopic(topic);
  if (!normalized) return;
  resourcePoolCache.set(normalized, pool);
}

/**
 * Checks whether a topic exists in cache.
 */
export function hasCachedResourcePool(topic: string): boolean {
  const normalized = normalizeTopic(topic);
  if (!normalized) return false;
  return resourcePoolCache.has(normalized);
}

/**
 * Clears the in-memory cache. Useful for test isolation.
 */
export function clearResourcePoolCache(): void {
  resourcePoolCache.clear();
}

/**
 * Returns current number of cached topic pools.
 */
export function getResourcePoolCacheSize(): number {
  return resourcePoolCache.size;
}

/**
 * Returns reference to raw cache map (for diagnostic & inspection).
 */
export function getRawResourcePoolCache(): Map<string, ResourcePool> {
  return resourcePoolCache;
}
