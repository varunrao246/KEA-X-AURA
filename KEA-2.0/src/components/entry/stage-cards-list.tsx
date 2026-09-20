"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Lock,
  PlayCircle,
  GitFork,
  Target,
  Trophy,
  CheckCircle2,
} from "lucide-react";

interface StageCardsListProps {
  plan: TopicCurriculumPlan;
  activeStageIndex?: number;
  stageMasteryScores?: {
    stage1?: number;
    stage2?: number;
    stage3?: number;
    stage4?: number;
    stage5?: number;
  };
  onSelectStage?: (index: number) => void;
  onStartConcept?: (concept: { id: string; title: string; stageNumber?: number }) => void;
}

export function StageCardsList({
  plan,
  activeStageIndex = 0,
  stageMasteryScores,
  onSelectStage,
  onStartConcept,
}: StageCardsListProps) {
  const isChemistry = Boolean(
    plan.topic.toLowerCase().includes("organic") ||
    plan.topic.toLowerCase().includes("chemistry") ||
    plan.category.toLowerCase().includes("chemistry")
  );

  const s1 = stageMasteryScores?.stage1 ?? 0;
  const s2 = stageMasteryScores?.stage2 ?? 0;
  const s3 = stageMasteryScores?.stage3 ?? 0;
  const s4 = stageMasteryScores?.stage4 ?? 0;
  const s5 = stageMasteryScores?.stage5 ?? 0;

  return (
    <div className="w-full space-y-5">
      {/* List Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
            Stage-Wise Learning Path
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {plan.stages.length} Milestones
        </span>
      </div>

      {/* Stage Cards */}
      <div className="space-y-4">
        {plan.stages.map((stage, idx) => {
          const isCurrent = idx === activeStageIndex;
          const isLast = idx === plan.stages.length - 1;

          let isUnlocked = idx === 0;
          let isMastered = false;
          let masteryScore = 0;

          if (isChemistry) {
            if (idx === 0) {
              isUnlocked = true;
              isMastered = s1 >= 80;
              masteryScore = s1;
            } else if (idx === 1) {
              isUnlocked = s1 >= 80;
              isMastered = s2 >= 80;
              masteryScore = s2;
            } else if (idx === 2) {
              isUnlocked = s2 >= 80;
              isMastered = s3 >= 80;
              masteryScore = s3;
            } else if (idx === 3) {
              isUnlocked = s3 >= 80;
              isMastered = s4 >= 80;
              masteryScore = s4;
            } else if (idx === 4) {
              isUnlocked = s4 >= 80;
              isMastered = s5 >= 80;
              masteryScore = s5;
            } else {
              isUnlocked = false;
              isMastered = false;
            }
          }

          return (
            <Card
              key={stage.id}
              onClick={() => onSelectStage && onSelectStage(idx)}
              className={`transition-all cursor-pointer ${
                isCurrent
                  ? "border-primary/60 bg-card shadow-sm ring-1 ring-primary/20"
                  : isMastered
                  ? "border-emerald-500/40 bg-card hover:border-emerald-500/60"
                  : isUnlocked
                  ? "border-border/80 bg-card hover:border-primary/40"
                  : "border-border/60 bg-muted/20 opacity-85 hover:opacity-100"
              }`}
            >
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : isMastered
                          ? "bg-emerald-600 text-white font-semibold"
                          : isUnlocked
                          ? "bg-muted text-foreground font-semibold"
                          : "bg-muted text-muted-foreground font-semibold"
                      }`}
                    >
                      {stage.stageNumber}
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        Stage {stage.stageNumber} — {stage.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        {stage.tagline}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isMastered ? (
                      <Badge className="bg-emerald-600 text-white text-[11px] font-semibold gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Mastered ({masteryScore}%)</span>
                      </Badge>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectStage) onSelectStage(idx);
                          const firstEligible = stage.concepts.find((c) => c.status !== "mastered") || stage.concepts[0];
                          if (onStartConcept && firstEligible) {
                            onStartConcept({
                              id: firstEligible.id,
                              title: firstEligible.name,
                              stageNumber: stage.stageNumber,
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <PlayCircle className="h-3 w-3" />
                        <span>Ready to Begin</span>
                      </button>
                    ) : isLast ? (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold gap-1">
                        <Trophy className="h-3 w-3" />
                        <span>Mastery Capstone</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground text-[11px] gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Prerequisite Gated</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Short Objective */}
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  <strong>Objective:</strong> {stage.objective}
                </p>

                {/* Concepts Covered */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Concepts Covered:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {stage.concepts.map((c) => {
                      const isConceptMastered = c.status === "mastered";
                      const isConceptActive = c.status === "in_progress";
                      const isConceptUnlocked = c.status === "unlocked" || isUnlocked;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!isConceptUnlocked && !isConceptMastered}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onStartConcept && (isConceptUnlocked || isConceptMastered)) {
                              onStartConcept({ id: c.id, title: c.name, stageNumber: stage.stageNumber });
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isConceptMastered
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer"
                              : isConceptActive
                              ? "bg-primary/15 text-primary border-primary/40 hover:bg-primary/25 cursor-pointer shadow-xs"
                              : isConceptUnlocked
                              ? "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                              : "bg-muted/40 text-muted-foreground/60 border-border/40 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConceptMastered
                                ? "bg-emerald-500"
                                : isConceptActive
                                ? "bg-primary animate-pulse"
                                : isConceptUnlocked
                                ? "bg-primary/60"
                                : "bg-muted-foreground/40"
                            }`}
                          />
                          <span>{c.name}</span>
                          {isConceptMastered && (
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Mastered
                            </span>
                          )}
                          {isConceptActive && (
                            <span className="text-[10px] uppercase font-bold text-primary">
                              In Progress
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prerequisite & Milestone Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      <strong>Prerequisite:</strong>{" "}
                      {stage.prerequisites.length > 0
                        ? stage.prerequisites.join(", ")
                        : "None (Entry Level)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      <strong>Milestone:</strong> {stage.milestoneAssessment}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
