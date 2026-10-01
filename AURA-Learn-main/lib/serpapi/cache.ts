import "server-only";
import type { TopicIntelligencePack } from "./types";
import { recordSerpApiUsage } from "./service";

/**
 * Multi-Tier Cache for Topic Intelligence Packs
 * 
 * Hierarchy:
 * 1. Fast in-memory LRU-like Map (0ms)
 * 2. Supabase `topic_intelligence_packs` table (if Supabase configured)
 * 3. File store fallback
 */

const memoryCache = new Map<string, { pack: TopicIntelligencePack; expiresAtMs: number }>();

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function normalizeTopicKey(topic: string): string {
  return topic.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function getCachedIntelligencePack(
  topic: string
): Promise<TopicIntelligencePack | null> {
  const key = normalizeTopicKey(topic);

  // 1. Check in-memory cache
  const inMemory = memoryCache.get(key);
  if (inMemory && inMemory.expiresAtMs > Date.now()) {
    recordSerpApiUsage({
      timestamp: Date.now(),
      engine: "google",
      query: topic,
      cacheHit: true,
      durationMs: 0,
      status: "success",
    });
    return {
      ...inMemory.pack,
      sourceMetadata: {
        ...inMemory.pack.sourceMetadata,
        generatedVia: "memory_cache",
      },
    };
  }

  // 2. Check Supabase if credentials are present
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/topic_intelligence_packs?topic_key=eq.${encodeURIComponent(key)}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const expiresAtMs = new Date(row.expires_at).getTime();
          if (expiresAtMs > Date.now()) {
            const pack = row.pack_data as TopicIntelligencePack;
            memoryCache.set(key, { pack, expiresAtMs });
            recordSerpApiUsage({
              timestamp: Date.now(),
              engine: "google",
              query: topic,
              cacheHit: true,
              durationMs: 0,
              status: "success",
            });
            return {
              ...pack,
              sourceMetadata: {
                ...pack.sourceMetadata,
                generatedVia: "supabase_cache",
              },
            };
          }
        }
      }
    } catch (err) {
      console.warn("[SerpApi Cache] Supabase lookup failed, falling back to memory:", err);
    }
  }

  return null;
}

export async function setCachedIntelligencePack(
  topic: string,
  pack: TopicIntelligencePack
): Promise<void> {
  const key = normalizeTopicKey(topic);
  const expiresAtMs = Date.now() + DEFAULT_TTL_MS;

  // 1. Store in memory
  memoryCache.set(key, { pack, expiresAtMs });

  // 2. Persist to Supabase if available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/topic_intelligence_packs`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          topic_key: key,
          topic_name: pack.topic,
          pack_data: pack,
          generated_at: pack.generatedAt,
          expires_at: pack.expiresAt,
        }),
      });
    } catch (err) {
      console.warn("[SerpApi Cache] Supabase write failed (non-fatal):", err);
    }
  }
}
