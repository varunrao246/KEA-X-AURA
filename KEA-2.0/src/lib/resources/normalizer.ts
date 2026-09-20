/**
 * KEA Platform — Resource Normalization Utilities
 * 
 * Aggressively optimizes SERP usage by canonicalizing topic queries
 * so variants like "Python", "python", " PYTHON " hit the exact same cache key.
 */

/**
 * Normalizes a topic string: lowercase, trimmed, and whitespace collapsed.
 * Example: "  Python   Programming  " -> "python programming"
 */
export function normalizeTopic(topic: string): string {
  if (!topic || typeof topic !== "string") {
    return "";
  }
  return topic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Creates canonical search key for the resource cache.
 */
export function createSearchKey(normalizedTopic: string): string {
  return `topic:${normalizedTopic}`;
}

/**
 * Normalizes a URL for deduplication purposes.
 * Strips tracking parameters, trailing slashes, and downcases hostnames.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove UTM and common analytics params
    const searchParams = new URLSearchParams(parsed.search);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "ref",
    ];
    for (const param of trackingParams) {
      searchParams.delete(param);
    }
    parsed.search = searchParams.toString();
    // Normalize trailing slash in pathname (unless it's just '/')
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}
