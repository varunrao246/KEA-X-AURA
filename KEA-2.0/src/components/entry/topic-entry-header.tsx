"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Compass, Sparkles } from "lucide-react";

export type DemoPersona = "aarav" | "diya" | "priya" | "lin";

interface TopicEntryHeaderProps {
  onReset?: () => void;
  activeTopic?: string | null;
  activePersona?: DemoPersona;
  onSelectPersona?: (persona: DemoPersona) => void;
  isOfflineMode?: boolean;
  onToggleOfflineMode?: () => void;
  onOpenFacilitator?: () => void;
  pendingInterventionsCount?: number;
}

export function TopicEntryHeader({
  onReset,
  activeTopic,
}: TopicEntryHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-2">
        {/* Brand identity — Visually Dominant KEA */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black shadow-sm">
            <Compass className="h-6 w-6 transition-transform group-hover:rotate-12 duration-200" />
          </div>
          <span className="font-black text-2xl sm:text-3xl tracking-tight text-foreground font-sans">
            KEA
          </span>
        </button>

        {/* Right side: Topic badge (if in plan) + Dark/light theme toggle */}
        <div className="flex items-center gap-3">
          {activeTopic && (
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs border-primary/30 bg-primary/5">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span>Target: <strong className="font-semibold text-foreground">{activeTopic}</strong></span>
            </Badge>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
