"use client";

/**
 * KEA Platform — Multi-Modal Topic Educational Resources Section
 * 
 * Displays SERP-discovered and curated educational resources for the current topic.
 * Strictly enforces client-side and server-side SERP quota preservation:
 * - Switches tabs and filters locally with ZERO additional network requests.
 * - Displays graceful empty states when categories (such as videos) are absent.
 */

import * as React from "react";
import {
  EducationalResourceType,
  ResourcePool,
  filterResourcesForStageOrConcept,
} from "@/lib/resources";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Play,
  Sparkles,
  Video,
  Info,
} from "lucide-react";

export interface TopicResourcesSectionProps {
  topic: string;
  stageTitle?: string;
  conceptTitle?: string;
  initialPool?: ResourcePool;
  className?: string;
}

type TabCategory = "all" | "video" | "documentation" | "tutorial" | "guide" | "course" | "reference";

export function TopicResourcesSection({
  topic,
  stageTitle,
  conceptTitle,
  initialPool,
  className = "",
}: TopicResourcesSectionProps) {
  const [fetchedPool, setFetchedPool] = React.useState<ResourcePool | null>(null);
  const pool = initialPool || fetchedPool;
  const [isLoading, setIsLoading] = React.useState<boolean>(!initialPool && Boolean(topic));
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<TabCategory>("all");
  const [fromCache, setFromCache] = React.useState<boolean>(Boolean(initialPool));

  // Fetch from server API if initialPool was not provided
  React.useEffect(() => {
    if (initialPool || !topic || topic.trim().length === 0) {
      return;
    }

    let isMounted = true;

    async function loadResources() {
      try {
        const res = await fetch("/api/resources/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch resources (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setFetchedPool(data.resourcePool);
          setFromCache(Boolean(data.fromCache));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[TopicResourcesSection] Resource fetch failed:", err);
          setError(err instanceof Error ? err.message : "Unable to load resources");
          setIsLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      isMounted = false;
    };
  }, [topic, initialPool]);

  // Locally filtered resources: combines stage/concept filtering + local category tab
  // STRICT INVARIANT: ZERO EXTRA NETWORK CALLS.
  const filteredResources = React.useMemo(() => {
    if (!pool) return [];

    // 1. Stage / Concept local filtering
    const stageFiltered = filterResourcesForStageOrConcept(pool, stageTitle, conceptTitle);

    // 2. Tab category local filtering
    if (selectedCategory === "all") {
      return stageFiltered;
    }

    if (selectedCategory === "video") {
      return stageFiltered.filter(
        (r) => r.type === "video" || r.type === "youtube"
      );
    }

    return stageFiltered.filter((r) => r.type === selectedCategory);
  }, [pool, stageTitle, conceptTitle, selectedCategory]);

  // Count available by category for badges
  const categoryCounts = React.useMemo(() => {
    if (!pool) return { all: 0, video: 0, doc: 0, tut: 0, guide: 0 };
    const all = pool.resources.length;
    const video = pool.resources.filter((r) => r.type === "video" || r.type === "youtube").length;
    const doc = pool.resources.filter((r) => r.type === "documentation").length;
    const tut = pool.resources.filter((r) => r.type === "tutorial").length;
    const guide = pool.resources.filter((r) => r.type === "guide").length;
    return { all, video, doc, tut, guide };
  }, [pool]);

  // Helper for badge display and icon
  function renderTypeBadge(type: EducationalResourceType) {
    switch (type) {
      case "youtube":
        return (
          <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold gap-1">
            <span>▶</span> YouTube
          </Badge>
        );
      case "video":
        return (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold gap-1">
            <span>▶</span> Video
          </Badge>
        );
      case "documentation":
        return (
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold gap-1">
            <span>📖</span> Documentation
          </Badge>
        );
      case "tutorial":
        return (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold gap-1">
            <span>📄</span> Tutorial
          </Badge>
        );
      case "guide":
        return (
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold gap-1">
            <span>📚</span> Guide
          </Badge>
        );
      case "course":
        return (
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold gap-1">
            <span>🎓</span> Course
          </Badge>
        );
      case "reference":
        return (
          <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold gap-1">
            <span>🔍</span> Reference
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 font-semibold gap-1">
            <span>📰</span> Article
          </Badge>
        );
    }
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="topic-resources-section">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Educational Learning Resources
            </h3>
            {fromCache ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                Cached (0 queries)
              </Badge>
            ) : pool?.isFallback ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
                Curated
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                SERP Discovered
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Topic: <span className="font-medium text-foreground">{topic}</span>
            {stageTitle && (
              <> &bull; Stage: <span className="font-medium text-foreground">{stageTitle}</span></>
            )}
            {conceptTitle && (
              <> &bull; Concept: <span className="font-medium text-foreground">{conceptTitle}</span></>
            )}
          </p>
        </div>

        {/* Tab Filters (100% Client-Side Local Filtering) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All ({categoryCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("video")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === "video"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Videos ({categoryCounts.video})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("documentation")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === "documentation"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Documentation ({categoryCounts.doc})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("tutorial")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === "tutorial"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Tutorials ({categoryCounts.tut})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("guide")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === "guide"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Guides ({categoryCounts.guide})
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="resource-skeletons">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-14 w-full rounded" />
              <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          <p className="font-medium">Failed to load resources for &ldquo;{topic}&rdquo;</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      )}

      {/* Empty State: Specific video empty state handling without extra searches */}
      {!isLoading && !error && pool && filteredResources.length === 0 && (
        <div
          className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2"
          data-testid="resource-empty-state"
        >
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {selectedCategory === "video" ? <Video className="size-5" /> : <Info className="size-5" />}
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {selectedCategory === "video"
              ? "No video resources found for this topic"
              : `No ${selectedCategory} resources available`}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {selectedCategory === "video"
              ? "No video lectures were indexed in the primary search pool. Detailed documentation, tutorials, and step-by-step guides remain fully available below."
              : "Try switching to the 'All' tab to view documentation, guides, and tutorials."}
          </p>
          {selectedCategory !== "all" && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="cursor-pointer"
              >
                View All Available Resources
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Resource Cards Grid */}
      {!isLoading && !error && filteredResources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="resource-cards-grid">
          {filteredResources.map((res) => {
            const hasThumbnail = Boolean(res.thumbnail);
            const isVideo = res.type === "video" || res.type === "youtube";

            return (
              <Card
                key={res.id}
                className="flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-xs group"
              >
                <div>
                  {/* Optional Card Thumbnail */}
                  {hasThumbnail && (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted/50 border-b border-border/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={res.thumbnail}
                        alt={res.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken thumbnail gracefully
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="rounded-full bg-red-600/90 p-2 text-white shadow-md">
                            <Play className="size-4 fill-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {renderTypeBadge(res.type)}
                      <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={res.source}>
                        {res.source}
                      </span>
                    </div>

                    <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline focus-visible:outline-hidden"
                      >
                        {res.title}
                      </a>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {res.snippet}
                    </CardDescription>
                  </CardContent>
                </div>

                {/* Card Footer with External Link Action */}
                <div className="p-4 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {res.date ? res.date : res.source}
                  </span>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
