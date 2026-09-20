/**
 * KEA Platform — SERP Response Parser & Resource Classifier
 * 
 * Extracts and classifies rich multi-modal educational resources from a
 * SINGLE SerpApi Google search response. Deduplicates by URL and title.
 */

import { EducationalResource, EducationalResourceType } from "./types";
import { normalizeUrl } from "./normalizer";

interface SerpApiVideoItem {
  title?: string;
  link?: string;
  snippet?: string;
  description?: string;
  thumbnail?: string;
  source?: string;
  date?: string;
  duration?: string;
}

interface SerpApiOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
  displayed_link?: string;
  source?: string;
  thumbnail?: string;
  date?: string;
  rich_snippet?: {
    top?: {
      detected_extensions?: Record<string, string | number>;
      extensions?: string[];
    };
  };
}

interface SerpApiKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  source?: {
    name?: string;
    link?: string;
  };
  website?: string;
  header_images?: Array<{ image?: string; source?: string }> | string;
}

export interface SerpApiResponse {
  organic_results?: SerpApiOrganicItem[];
  inline_videos?: SerpApiVideoItem[];
  video_results?: SerpApiVideoItem[];
  knowledge_graph?: SerpApiKnowledgeGraph;
  search_metadata?: {
    id?: string;
    status?: string;
  };
}

/**
 * Classifies an educational resource based on URL patterns, source, and content keywords.
 */
export function classifyResourceType(
  url: string,
  title: string,
  _snippet: string,
  isFromVideoSection: boolean = false
): EducationalResourceType {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // 1. YouTube
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return "youtube";
  }

  // 2. Video from other video platforms or SERP video block
  if (
    isFromVideoSection ||
    lowerUrl.includes("vimeo.com") ||
    lowerUrl.includes("/watch") ||
    lowerUrl.includes("/video") ||
    lowerTitle.includes("video tutorial")
  ) {
    return "video";
  }

  // 3. Documentation
  if (
    lowerUrl.includes("docs.") ||
    lowerUrl.includes("/docs/") ||
    lowerUrl.includes("/doc/") ||
    lowerUrl.includes("developer.mozilla.org") ||
    lowerUrl.includes("python.org") ||
    lowerUrl.includes("devdocs.io") ||
    lowerTitle.includes("documentation") ||
    lowerTitle.includes("official docs")
  ) {
    return "documentation";
  }

  // 4. Course
  if (
    lowerUrl.includes("coursera.org") ||
    lowerUrl.includes("edx.org") ||
    lowerUrl.includes("udemy.com") ||
    lowerUrl.includes("khanacademy.org") ||
    lowerUrl.includes("ocw.mit.edu") ||
    lowerTitle.includes("course") ||
    lowerTitle.includes("curriculum")
  ) {
    return "course";
  }

  // 5. Reference
  if (
    lowerUrl.includes("reference") ||
    lowerUrl.includes("/api/") ||
    lowerUrl.includes("/specs/") ||
    lowerTitle.includes("cheat sheet") ||
    lowerTitle.includes("cheatsheet") ||
    lowerTitle.includes("quick reference") ||
    lowerTitle.includes("api reference")
  ) {
    return "reference";
  }

  // 6. Guide
  if (
    lowerUrl.includes("/guide") ||
    lowerTitle.includes("guide") ||
    lowerTitle.includes("handbook") ||
    lowerTitle.includes("playbook") ||
    lowerTitle.includes("roadmap")
  ) {
    return "guide";
  }

  // 7. Tutorial
  if (
    lowerUrl.includes("tutorial") ||
    lowerUrl.includes("w3schools.com") ||
    lowerUrl.includes("geeksforgeeks.org") ||
    lowerUrl.includes("freecodecamp.org") ||
    lowerUrl.includes("tutorialspoint.com") ||
    lowerTitle.includes("tutorial") ||
    lowerTitle.includes("how to") ||
    lowerTitle.includes("getting started")
  ) {
    return "tutorial";
  }

  // 8. General educational article
  return "article";
}

/**
 * Extracts a clean domain/source label from a URL.
 */
export function extractDomainSource(url: string, fallbackSource?: string): string {
  if (fallbackSource && fallbackSource.trim().length > 0) {
    return fallbackSource.trim();
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "External Resource";
  }
}

/**
 * Parses a SerpApi Google response payload into an array of deduplicated EducationalResource items.
 */
export function parseSerpApiResponse(data: SerpApiResponse): EducationalResource[] {
  const resources: EducationalResource[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  function addResource(
    title: string | undefined,
    url: string | undefined,
    snippet: string | undefined,
    source: string | undefined,
    thumbnail?: string,
    date?: string,
    isFromVideoSection: boolean = false,
    explicitType?: EducationalResourceType
  ) {
    if (!title || !url) return;

    const trimmedTitle = title.trim();
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) return;

    const normalizedUrl = normalizeUrl(cleanUrl);
    const normalizedTitleKey = trimmedTitle.toLowerCase();

    // Deduplication check
    if (seenUrls.has(normalizedUrl) || seenTitles.has(normalizedTitleKey)) {
      return;
    }

    seenUrls.add(normalizedUrl);
    seenTitles.add(normalizedTitleKey);

    const cleanSnippet = (snippet || "").trim();
    const domainSource = extractDomainSource(cleanUrl, source);
    const type = explicitType || classifyResourceType(cleanUrl, trimmedTitle, cleanSnippet, isFromVideoSection);

    const id = `res_${type}_${seenUrls.size}_${Math.random().toString(36).substring(2, 7)}`;

    resources.push({
      id,
      title: trimmedTitle,
      url: cleanUrl,
      source: domainSource,
      type,
      snippet: cleanSnippet,
      ...(thumbnail ? { thumbnail } : {}),
      ...(date ? { date } : {}),
      relevance: 1.0,
    });
  }

  // 1. Process Knowledge Graph (often provides authoritative primary documentation/overview)
  if (data.knowledge_graph) {
    const kg = data.knowledge_graph;
    const kgUrl = kg.website || kg.source?.link;
    if (kgUrl && kg.title) {
      let kgThumb: string | undefined;
      if (typeof kg.header_images === "string") {
        kgThumb = kg.header_images;
      } else if (Array.isArray(kg.header_images) && kg.header_images[0]?.image) {
        kgThumb = kg.header_images[0].image;
      }

      addResource(
        kg.title,
        kgUrl,
        kg.description || `Authoritative overview and knowledge source for ${kg.title}.`,
        kg.source?.name || "Official / Knowledge Graph",
        kgThumb,
        undefined,
        false,
        "documentation"
      );
    }
  }

  // 2. Process Video Results (inline_videos and video_results)
  const videoList = [...(data.inline_videos || []), ...(data.video_results || [])];
  for (const v of videoList) {
    addResource(
      v.title,
      v.link,
      v.snippet || v.description,
      v.source || (v.link?.includes("youtube") ? "YouTube" : "Video"),
      v.thumbnail,
      v.date,
      true
    );
  }

  // 3. Process Organic Results
  if (Array.isArray(data.organic_results)) {
    for (const item of data.organic_results) {
      addResource(
        item.title,
        item.link,
        item.snippet,
        item.source || item.displayed_link,
        item.thumbnail,
        item.date,
        false
      );
    }
  }

  return resources;
}
