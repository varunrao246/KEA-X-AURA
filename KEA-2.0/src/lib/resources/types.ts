/**
 * KEA Platform — Educational Resource & SERP Discovery Types
 * 
 * Strict contracts for SERP-discovered and curated educational resources,
 * maintaining single-query-per-topic efficiency and client multi-modal learning.
 */

export type EducationalResourceType =
  | 'video'
  | 'youtube'
  | 'article'
  | 'documentation'
  | 'tutorial'
  | 'course'
  | 'reference'
  | 'guide';

export interface EducationalResource {
  id: string;
  title: string;
  url: string;
  source: string;
  type: EducationalResourceType;
  snippet: string;
  thumbnail?: string;
  date?: string;
  relevance?: number;
}

export interface ResourcePool {
  topic: string;
  normalizedTopic: string;
  searchKey: string;
  query: string;
  searchedAt: number;
  requestCount: number;
  resources: EducationalResource[];
  isFallback?: boolean;
}

export interface DiscoverResourcesOptions {
  forceRefresh?: boolean;
  apiKey?: string;
  fetchFn?: typeof fetch;
  customQuery?: string;
}

export interface DiscoverResourcesResult {
  success: boolean;
  resourcePool: ResourcePool;
  fromCache: boolean;
  error?: string;
}

export type ExploreCategory =
  | 'research'
  | 'academic'
  | 'documentation'
  | 'video'
  | 'real_world'
  | 'further_reading';

export interface ExploreResourceItem {
  id: string;
  title: string;
  source: string;
  url: string;
  category: ExploreCategory;
  shortDescription: string;
  whyRelevant: string;
  authors?: string[];
  year?: number;
  thumbnail?: string;
  keyMomentTimestamp?: number;
  duration?: string;
}

export interface ConceptExploreResult {
  topic: string;
  conceptTitle: string;
  misconceptionTargeted?: string;
  headline: string;
  resources: ExploreResourceItem[];
  fromCache: boolean;
  searchedAt: number;
}

