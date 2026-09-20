"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Trophy,
  CheckCircle2,
  Lock,
  GitCommit,
  GitBranch,
} from "lucide-react";

interface LearningMapProps {
  plan: TopicCurriculumPlan;
  activeStageIndex?: number;
  onSelectStage?: (stageIndex: number) => void;
}

export function LearningMap({
  plan,
  activeStageIndex = 0,
  onSelectStage,
}: LearningMapProps) {
  return (
    <div className="w-full space-y-4">
      {/* Map Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
            Learning Map
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
          {plan.stages.length} Stages • Strict Dependencies
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        Visual roadmap from foundational concepts to verified mastery.
      </div>

      {/* Visual Pipeline */}
      <div className="relative flex flex-col items-center pt-2 pb-4 space-y-0">
        {/* 1. Target Topic Goal Node */}
        <div className="w-full max-w-sm p-3 rounded-xl border border-primary/30 bg-primary/5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
            <Target className="h-3.5 w-3.5" />
            <span>Target Goal</span>
          </div>
          <p className="text-sm font-extrabold text-foreground mt-0.5">
            {plan.topic} Mastery
          </p>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center my-1 text-muted-foreground/50">
          <div className="w-0.5 h-5 bg-border" />
          <div className="w-1.5 h-1.5 rotate-45 border-b-2 border-r-2 border-border -mt-1" />
        </div>

        {/* 2. Sequential Stages with Concept Branches */}
        {plan.stages.map((stage, idx) => {
          const isCurrent = idx === activeStageIndex;
          const isUnlocked = idx === 0;
          const isLast = idx === plan.stages.length - 1;

          return (
            <div key={stage.id} className="w-full flex flex-col items-center">
              {/* Stage Node */}
              <div
                onClick={() => onSelectStage && onSelectStage(idx)}
                className={`w-full max-w-sm p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? "border-primary bg-card shadow-sm ring-2 ring-primary/20"
                    : isUnlocked
                    ? "border-border/80 bg-card hover:border-primary/50"
                    : "border-border/60 bg-muted/30 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground font-semibold"
                      }`}
                    >
                      {stage.stageNumber}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Stage {stage.stageNumber}: {stage.title}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 font-medium shrink-0">
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] text-muted-foreground px-1.5 py-0 gap-1 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Gated</span>
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1 pl-8">
                  {stage.tagline}
                </p>

                {/* Sub-Concept Branching Pills */}
                {stage.concepts.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 pl-8">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 font-mono">
                      <GitCommit className="h-3 w-3 text-primary" />
                      <span>Key Concepts:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {stage.concepts.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-muted/60 text-foreground/80 border border-border/50"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Connector between stages */}
              {!isLast ? (
                <div className="flex flex-col items-center my-1 text-muted-foreground/50">
                  <div className="w-0.5 h-5 bg-border" />
                  <div className="w-1.5 h-1.5 rotate-45 border-b-2 border-r-2 border-border -mt-1" />
                </div>
              ) : (
                <div className="flex flex-col items-center my-1 text-muted-foreground/50">
                  <div className="w-0.5 h-5 bg-border" />
                  <div className="w-1.5 h-1.5 rotate-45 border-b-2 border-r-2 border-border -mt-1" />
                </div>
              )}
            </div>
          );
        })}

        {/* 3. Final Mastery Target Node */}
        <div className="w-full max-w-sm p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <Trophy className="h-3.5 w-3.5" />
            <span>Mastery Verified</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full conceptual competence & milestone defense
          </p>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>Prerequisite gating ensures you never skip foundational principles.</span>
      </div>
    </div>
  );
}
