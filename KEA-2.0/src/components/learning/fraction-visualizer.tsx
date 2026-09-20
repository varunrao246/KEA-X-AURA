"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface FractionVisualizerProps {
  fractionA?: { num: number; den: number; label: string };
  fractionB?: { num: number; den: number; label: string };
  interactive?: boolean;
}

export function FractionVisualizer({
  fractionA = { num: 3, den: 8, label: "3/8" },
  fractionB = { num: 5, den: 8, label: "5/8" },
}: FractionVisualizerProps) {
  return (
    <div className="p-4 rounded-xl border border-border/70 bg-card/80 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Visual Fraction Model (Manipulative View)
        </span>
        <Badge variant="outline" className="font-mono text-[10px]">
          Denominator = {fractionA.den} Equal Parts
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Fraction Bar A */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-primary">{fractionA.label} ({fractionA.num} of {fractionA.den} parts)</span>
            <span className="font-mono text-muted-foreground">{Math.round((fractionA.num / fractionA.den) * 100)}%</span>
          </div>
          <div className="w-full h-8 rounded-lg border border-border bg-muted/30 flex overflow-hidden p-0.5 gap-0.5">
            {Array.from({ length: fractionA.den }).map((_, i) => (
              <div
                key={`a-${i}`}
                className={`flex-1 h-full rounded-xs transition-all duration-300 flex items-center justify-center text-[10px] font-mono ${
                  i < fractionA.num
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/40 text-muted-foreground/40"
                }`}
              >
                1/{fractionA.den}
              </div>
            ))}
          </div>
        </div>

        {/* Fraction Bar B */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">{fractionB.label} ({fractionB.num} of {fractionB.den} parts)</span>
            <span className="font-mono text-muted-foreground">{Math.round((fractionB.num / fractionB.den) * 100)}%</span>
          </div>
          <div className="w-full h-8 rounded-lg border border-border bg-muted/30 flex overflow-hidden p-0.5 gap-0.5">
            {Array.from({ length: fractionB.den }).map((_, i) => (
              <div
                key={`b-${i}`}
                className={`flex-1 h-full rounded-xs transition-all duration-300 flex items-center justify-center text-[10px] font-mono ${
                  i < fractionB.num
                    ? "bg-emerald-500 text-white font-bold shadow-xs"
                    : "bg-muted/40 text-muted-foreground/40"
                }`}
              >
                1/{fractionB.den}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic text-center pt-1 border-t border-border/40">
        Notice: Because each block is 1/8, {fractionA.num} blocks are shorter in total length than {fractionB.num} blocks.
      </p>
    </div>
  );
}
