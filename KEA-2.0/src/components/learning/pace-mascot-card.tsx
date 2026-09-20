"use client";

import * as React from "react";
import { PaceState } from "@/lib/pace/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Heart } from "lucide-react";

interface PaceMascotCardProps {
  paceState: PaceState;
}

export function PaceMascotCard({ paceState }: PaceMascotCardProps) {
  const { mascot, mascotName, mascotIcon, tempoCategory, avgSecondsPerProblem, recentAccuracy, growthMindsetNudge } =
    paceState;

  const mascotStyles = {
    falcon: {
      border: "border-sky-500/40 bg-sky-500/5",
      badge: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
      accent: "text-sky-600 dark:text-sky-400",
    },
    cheetah: {
      border: "border-amber-500/40 bg-amber-500/5",
      badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      accent: "text-amber-600 dark:text-amber-400",
    },
    panda: {
      border: "border-emerald-500/40 bg-emerald-500/5",
      badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
  }[mascot];

  return (
    <Card className={`overflow-hidden transition-all duration-300 border shadow-sm ${mascotStyles.border}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl select-none" role="img" aria-label={mascotName}>
              {mascotIcon}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">{mascotName}</span>
                <Badge className={`text-[10px] font-mono capitalize py-0 px-1.5 ${mascotStyles.badge}`}>
                  {tempoCategory} Pace
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Pace Buddy & Momentum Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-foreground">
                {avgSecondsPerProblem}s
              </span>
              <span className="block text-[10px] text-muted-foreground">avg tempo</span>
            </div>
          </div>
        </div>

        {/* Growth Mindset Nudge */}
        <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs flex items-start gap-2">
          <Heart className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${mascotStyles.accent}`} />
          <p className="text-foreground leading-relaxed text-[11px] italic">
            &quot;{growthMindsetNudge}&quot;
          </p>
        </div>

        {/* Non-punitive guardrail footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Accuracy: <strong className="text-foreground font-mono">{recentAccuracy}%</strong>
          </span>
          <span className="text-[10px] text-muted-foreground/80">
            🌱 Non-punitive: All tempos honored
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
