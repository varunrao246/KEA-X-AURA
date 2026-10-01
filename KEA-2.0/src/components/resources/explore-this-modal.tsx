"use client";

import React, { useState } from "react";
import {
  Search,
  BookOpen,
  GraduationCap,
  FileText,
  Video,
  Globe,
  Lightbulb,
  ExternalLink,
  Sparkles,
  X,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ConceptExploreResult, ExploreCategory, ExploreResourceItem } from "@/lib/resources/types";

interface ExploreThisModalProps {
  topic: string;
  conceptTitle: string;
  misconception?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  buttonSize?: "sm" | "default" | "lg";
  className?: string;
}

export function ExploreThisModal({
  topic,
  conceptTitle,
  misconception,
  buttonVariant = "outline",
  buttonSize = "sm",
  className = "",
}: ExploreThisModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConceptExploreResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  async function handleOpen() {
    setIsOpen(true);
    if (!data) {
      setLoading(true);
      try {
        const res = await fetch("/api/resources/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            conceptTitle,
            misconception,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.warn("[ExploreThisModal] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
  }

  const categoryIcons: Record<ExploreCategory, React.ReactNode> = {
    research: <FileText className="h-3.5 w-3.5 text-purple-500" />,
    academic: <GraduationCap className="h-3.5 w-3.5 text-blue-500" />,
    documentation: <BookOpen className="h-3.5 w-3.5 text-emerald-500" />,
    video: <Video className="h-3.5 w-3.5 text-rose-500" />,
    real_world: <Globe className="h-3.5 w-3.5 text-amber-500" />,
    further_reading: <Lightbulb className="h-3.5 w-3.5 text-cyan-500" />,
  };

  const categoryLabels: Record<ExploreCategory, string> = {
    research: "📄 Research Papers",
    academic: "🎓 University / Academic",
    documentation: "📚 Documentation",
    video: "🎥 Videos",
    real_world: "🌎 Real-World Applications",
    further_reading: "💡 Further Reading",
  };

  const filtered = (data?.resources || []).filter((r) =>
    activeCategory === "all" ? true : r.category === activeCategory
  );

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpen}
        className={`gap-1.5 cursor-pointer font-medium ${className}`}
      >
        <Search className="h-3.5 w-3.5 text-primary" />
        Explore This
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-muted/30 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5">
                    🔎 Deep Discovery
                  </Badge>
                  {misconception && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                      Targeted Misconception
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {data?.headline || `Exploring: ${conceptTitle}`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated academic papers, video moments, and real-world industrial applications.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 rounded-full shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-2 border-b border-border/60 bg-card flex flex-wrap gap-1.5 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All Resources ({data?.resources.length || 0})
              </button>
              {(["research", "academic", "documentation", "video", "real_world"] as ExploreCategory[]).map((cat) => {
                const count = (data?.resources || []).filter((r) => r.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 cursor-pointer ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {categoryLabels[cat]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-medium">Discovering verified research & video resources...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No resources found in this category.
                </div>
              ) : (
                filtered.map((item) => (
                  <Card key={item.id} className="border border-border/70 hover:border-primary/40 transition shadow-xs">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {categoryIcons[item.category]}
                          {item.source}
                        </span>
                        {item.year && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {item.year}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">
                        {item.title}
                      </h4>

                      {item.authors && item.authors.length > 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          Authors: {item.authors.join(", ")}
                        </p>
                      )}

                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {item.shortDescription}
                      </p>

                      {/* Why this matters callout */}
                      {item.whyRelevant && (
                        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary font-medium leading-relaxed">
                          💡 <span className="font-bold">Why it matters: </span>
                          {item.whyRelevant}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        {item.keyMomentTimestamp ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-semibold">
                            <Play className="h-3 w-3 fill-rose-500" />
                            Timestamp: {Math.floor(item.keyMomentTimestamp / 60)}:
                            {(item.keyMomentTimestamp % 60).toString().padStart(2, "0")}
                          </span>
                        ) : <span />}

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          View Resource <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Powered by SerpApi Educational Intelligence
              </span>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
