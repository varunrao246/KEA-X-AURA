"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from "@/lib/chemistry/organic-chemistry-demo";
import {
  Lock,
  CheckCircle2,
  ChevronRight,
  Atom,
  Flame,
  Layers,
  FlaskConical,
  Beaker,
  ShieldAlert,
  Unlock,
  Star,
  Trophy,
} from "lucide-react";

interface OrganicChemistryMapProps {
  currentStageNumber?: number;
  stage1MasteryScore?: number;
  stage2MasteryScore?: number;
  stage3MasteryScore?: number;
  stage4MasteryScore?: number;
  stage5MasteryScore?: number;
  onSelectStage?: (stageNumber: number) => void;
}

type StageStatus = "mastered" | "current" | "available" | "locked";

export function OrganicChemistryMap({
  currentStageNumber = 1,
  stage1MasteryScore = 0,
  stage2MasteryScore = 0,
  stage3MasteryScore = 0,
  stage4MasteryScore = 0,
  stage5MasteryScore = 0,
  onSelectStage,
}: OrganicChemistryMapProps) {
  const [stage2JustUnlocked, setStage2JustUnlocked] = React.useState(false);
  const [stage3JustUnlocked, setStage3JustUnlocked] = React.useState(false);
  const [stage4JustUnlocked, setStage4JustUnlocked] = React.useState(false);
  const [stage5JustUnlocked, setStage5JustUnlocked] = React.useState(false);
  const [selectedLockedStage, setSelectedLockedStage] = React.useState<number | null>(null);
  const prevIsStage2UnlockedRef = React.useRef(false);
  const prevIsStage3UnlockedRef = React.useRef(false);
  const prevIsStage4UnlockedRef = React.useRef(false);
  const prevIsStage5UnlockedRef = React.useRef(false);

  const isStage2Unlocked = stage1MasteryScore >= 80;
  const isStage1Mastered = stage1MasteryScore >= 80;
  const isStage2Mastered = stage2MasteryScore >= 80;
  const isStage3Unlocked = stage2MasteryScore >= 80;
  const isStage3Mastered = stage3MasteryScore >= 80;
  const isStage4Unlocked = stage3MasteryScore >= 80;
  const isStage4Mastered = stage4MasteryScore >= 80;
  const isStage5Unlocked = stage4MasteryScore >= 80;
  const isStage5Mastered = stage5MasteryScore >= 80;

  // Detect unlock transitions for subtle animations
  React.useEffect(() => {
    const wasStage2Unlocked = prevIsStage2UnlockedRef.current;
    prevIsStage2UnlockedRef.current = isStage2Unlocked;
    if (isStage2Unlocked && !wasStage2Unlocked) {
      setStage2JustUnlocked(true);
      const t = setTimeout(() => setStage2JustUnlocked(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isStage2Unlocked]);

  React.useEffect(() => {
    const wasStage3Unlocked = prevIsStage3UnlockedRef.current;
    prevIsStage3UnlockedRef.current = isStage3Unlocked;
    if (isStage3Unlocked && !wasStage3Unlocked) {
      setStage3JustUnlocked(true);
      const t = setTimeout(() => setStage3JustUnlocked(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isStage3Unlocked]);

  React.useEffect(() => {
    const wasStage4Unlocked = prevIsStage4UnlockedRef.current;
    prevIsStage4UnlockedRef.current = isStage4Unlocked;
    if (isStage4Unlocked && !wasStage4Unlocked) {
      setStage4JustUnlocked(true);
      const t = setTimeout(() => setStage4JustUnlocked(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isStage4Unlocked]);

  React.useEffect(() => {
    const wasStage5Unlocked = prevIsStage5UnlockedRef.current;
    prevIsStage5UnlockedRef.current = isStage5Unlocked;
    if (isStage5Unlocked && !wasStage5Unlocked) {
      setStage5JustUnlocked(true);
      const t = setTimeout(() => setStage5JustUnlocked(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isStage5Unlocked]);

  const getStageStatus = (stageNum: number): StageStatus => {
    if (stageNum === 1) {
      return isStage1Mastered ? "mastered" : currentStageNumber === 1 ? "current" : "available";
    }
    if (stageNum === 2) {
      if (!isStage2Unlocked) return "locked";
      if (isStage2Mastered) return "mastered";
      return currentStageNumber === 2 ? "current" : "available";
    }
    if (stageNum === 3) {
      if (!isStage3Unlocked) return "locked";
      if (isStage3Mastered) return "mastered";
      return currentStageNumber === 3 ? "current" : "available";
    }
    if (stageNum === 4) {
      if (!isStage4Unlocked) return "locked";
      if (isStage4Mastered) return "mastered";
      return currentStageNumber === 4 ? "current" : "available";
    }
    if (stageNum === 5) {
      if (!isStage5Unlocked) return "locked";
      if (isStage5Mastered) return "mastered";
      return currentStageNumber === 5 ? "current" : "available";
    }
    return "locked";
  };

  const getStageIcon = (stageNum: number, status: StageStatus) => {
    if (status === "mastered") return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    if (status === "locked") return <Lock className="h-4 w-4 text-muted-foreground" />;
    if (status === "available" && stageNum === 2)
      return <Unlock className="h-4 w-4 text-amber-400" />;
    if (status === "available" && stageNum === 3)
      return <Unlock className="h-4 w-4 text-cyan-400" />;
    if (status === "available" && stageNum === 4)
      return <Unlock className="h-4 w-4 text-purple-400" />;
    if (status === "available" && stageNum === 5)
      return <Unlock className="h-4 w-4 text-rose-400" />;

    switch (stageNum) {
      case 1:
        return <Atom className="h-5 w-5 text-emerald-400" />;
      case 2:
        return <Flame className="h-5 w-5 text-amber-400" />;
      case 3:
        return <FlaskConical className="h-5 w-5 text-cyan-400" />;
      case 4:
        return <Layers className="h-5 w-5 text-purple-400" />;
      case 5:
        return <Beaker className="h-5 w-5 text-rose-400" />;
      default:
        return <Atom className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (stageNum: number, status: StageStatus) => {
    if (status === "mastered")
      return (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] gap-1">
          <Star className="h-2.5 w-2.5" />
          Mastered
        </Badge>
      );
    if (status === "current")
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] uppercase font-bold">
          Current
        </Badge>
      );
    if (status === "available")
      return (
        <Badge
          className={`text-[10px] uppercase font-bold ${
            stageNum === 5
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
              : stageNum === 4
              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
              : stageNum === 3
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
              : stageNum === 2 && stage2JustUnlocked
              ? "bg-amber-500/30 text-amber-300 border-amber-400/60 animate-pulse"
              : "bg-amber-500/20 text-amber-400 border-amber-500/40"
          }`}
        >
          <Unlock className="h-2.5 w-2.5 mr-1" />
          Available
        </Badge>
      );
    return (
      <Badge variant="secondary" className="text-[10px] text-muted-foreground gap-1">
        <Lock className="h-3 w-3" />
        Locked
      </Badge>
    );
  };

  const getStageMasteryBar = (stageNum: number, status: StageStatus) => {
    if (stageNum === 1 && (status === "current" || status === "mastered")) {
      return (
        <div className="mt-1.5 w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Stage 1 Mastery</span>
            <span className="text-emerald-400 font-bold">{Math.round(stage1MasteryScore)}%</span>
          </div>
          <Progress value={Math.min(100, stage1MasteryScore)} className="h-1.5" />
        </div>
      );
    }
    if (stageNum === 2 && (status === "current" || status === "available" || status === "mastered")) {
      return (
        <div className="mt-1.5 w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Stage 2 Mastery</span>
            <span className="text-amber-400 font-bold">{Math.round(stage2MasteryScore)}%</span>
          </div>
          <Progress value={Math.min(100, stage2MasteryScore)} className="h-1.5" />
        </div>
      );
    }
    if (stageNum === 3 && (status === "current" || status === "available" || status === "mastered")) {
      return (
        <div className="mt-1.5 w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Stage 3 Mastery</span>
            <span className="text-cyan-400 font-bold">{Math.round(stage3MasteryScore)}%</span>
          </div>
          <Progress value={Math.min(100, stage3MasteryScore)} className="h-1.5" />
        </div>
      );
    }
    if (stageNum === 4 && (status === "current" || status === "available" || status === "mastered")) {
      return (
        <div className="mt-1.5 w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Stage 4 Mastery</span>
            <span className="text-purple-400 font-bold">{Math.round(stage4MasteryScore)}%</span>
          </div>
          <Progress value={Math.min(100, stage4MasteryScore)} className="h-1.5" />
        </div>
      );
    }
    if (stageNum === 5 && (status === "current" || status === "available" || status === "mastered")) {
      return (
        <div className="mt-1.5 w-full space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Stage 5 Mastery</span>
            <span className="text-rose-400 font-bold">{Math.round(stage5MasteryScore)}%</span>
          </div>
          <Progress value={Math.min(100, stage5MasteryScore)} className="h-1.5" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Route Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[11px]">
              Canonical Learning Route
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Knowledge Graph DAG • 5 Sequential Stages
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-1">
            Organic Chemistry — From Carbon to Organic Molecules
          </h3>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">Stage 1:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                stage1MasteryScore >= 80
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-muted text-foreground"
              }`}
            >
              {Math.round(stage1MasteryScore)}% / 80%
            </span>
          </div>
          {isStage2Unlocked && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Stage 2:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  stage2MasteryScore >= 80
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-muted text-foreground"
                }`}
              >
                {Math.round(stage2MasteryScore)}% / 80%
              </span>
            </div>
          )}
          {isStage3Unlocked && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Stage 3:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  stage3MasteryScore >= 80
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-muted text-foreground"
                }`}
              >
                {Math.round(stage3MasteryScore)}% / 80%
              </span>
            </div>
          )}
          {isStage4Unlocked && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Stage 4:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  stage4MasteryScore >= 80
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                    : "bg-muted text-foreground"
                }`}
              >
                {Math.round(stage4MasteryScore)}% / 80%
              </span>
            </div>
          )}
          {isStage5Unlocked && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Stage 5:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  stage5MasteryScore >= 80
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-muted text-foreground"
                }`}
              >
                {Math.round(stage5MasteryScore)}% / 80%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FINAL ORGANIC CHEMISTRY COMPLETION SUMMARY BANNER */}
      {isStage5Mastered && (
        <div className="p-4 rounded-xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/30 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-emerald-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Organic Chemistry COMPLETED / MASTERED
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  All 5 stages verified with ≥ 80% deterministic mastery.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
              100% COMPLETE
            </Badge>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono font-bold">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Stage 1 ✓</span>
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Stage 2 ✓</span>
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Stage 3 ✓</span>
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Stage 4 ✓</span>
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Stage 5 ✓</span>
          </div>
        </div>
      )}

      {/* Unlock notification */}
      {stage2JustUnlocked && (
        <div className="p-3 rounded-xl border border-amber-500/50 bg-amber-950/25 text-xs text-amber-300 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Unlock className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-semibold">Stage 2 — Hydrocarbon Foundations is now available! Stage 1 mastery requirement satisfied.</span>
        </div>
      )}

      {stage3JustUnlocked && (
        <div className="p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/25 text-xs text-cyan-300 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Unlock className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">Stage 3 — Functional Groups is now available! Stage 2 mastery requirement satisfied.</span>
        </div>
      )}

      {stage4JustUnlocked && (
        <div className="p-3 rounded-xl border border-purple-500/50 bg-purple-950/25 text-xs text-purple-300 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Unlock className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="font-semibold">Stage 4 — Structure & Isomerism is now available! Stage 3 mastery requirement satisfied.</span>
        </div>
      )}

      {stage5JustUnlocked && (
        <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-950/25 text-xs text-rose-300 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Unlock className="h-4 w-4 text-rose-400 shrink-0" />
          <span className="font-semibold">Stage 5 — Reactions & Practical Application is now available! Stage 4 mastery requirement satisfied.</span>
        </div>
      )}

      {/* 5-Stage Stepper Track */}
      <div className="space-y-2">
        {ORGANIC_CHEMISTRY_TOPIC_PLAN.stages.map((stage) => {
          const status = getStageStatus(stage.stageNumber);
          const isSelectedLocked = selectedLockedStage === stage.stageNumber;

          return (
            <div
              key={stage.id}
              className={`rounded-xl border transition-all ${
                status === "current"
                  ? "border-emerald-500/60 bg-emerald-950/15 shadow-sm ring-1 ring-emerald-500/30"
                  : status === "mastered"
                  ? "border-emerald-500/40 bg-card/90"
                  : status === "available"
                  ? stage.stageNumber === 4
                    ? "border-purple-500/50 bg-purple-950/10"
                    : stage.stageNumber === 3
                    ? "border-cyan-500/50 bg-cyan-950/10"
                    : `border-amber-500/50 bg-amber-950/10 ${
                        stage.stageNumber === 2 && stage2JustUnlocked
                          ? "ring-1 ring-amber-500/40 shadow-sm"
                          : ""
                      }`
                  : "border-border/60 bg-card/40 opacity-70 hover:opacity-90"
              }`}
            >
              <div
                className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
                onClick={() => {
                  if (status === "locked") {
                    setSelectedLockedStage(isSelectedLocked ? null : stage.stageNumber);
                  } else {
                    onSelectStage?.(stage.stageNumber);
                  }
                }}
              >
                {/* Stage Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      status === "current"
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : status === "mastered"
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : status === "available"
                        ? stage.stageNumber === 4
                          ? "bg-purple-500/20 border-purple-500/40"
                          : stage.stageNumber === 3
                          ? "bg-cyan-500/20 border-cyan-500/40"
                          : "bg-amber-500/20 border-amber-500/40"
                        : "bg-muted/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    {getStageIcon(stage.stageNumber, status)}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Stage {stage.stageNumber}
                      </span>
                      {getStatusBadge(stage.stageNumber, status)}
                    </div>

                    <h4 className="text-sm font-bold text-foreground">
                      {stage.title}
                      <span className="hidden md:inline text-xs font-normal text-muted-foreground ml-1.5">
                        — {stage.tagline}
                      </span>
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xl">
                      {stage.objective}
                    </p>

                    {/* Mastery progress bar */}
                    {getStageMasteryBar(stage.stageNumber, status)}
                  </div>
                </div>

                {/* Right action */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono text-muted-foreground block">
                      {stage.concepts.length} Concepts
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {status === "locked" ? "Prereq. Protected" : "Interactive Modules"}
                    </span>
                  </div>

                  {(status === "current" || status === "mastered") && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStage?.(stage.stageNumber);
                      }}
                      className={`text-white font-semibold text-xs h-8 gap-1.5 ${
                        status === "mastered"
                          ? "bg-emerald-600/70 hover:bg-emerald-700 border border-emerald-500/40"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {status === "mastered" ? "Review" : "Enter Workspace"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {status === "available" && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStage?.(stage.stageNumber);
                      }}
                      className={`text-white font-semibold text-xs h-8 gap-1.5 ${
                        stage.stageNumber === 5
                          ? "bg-rose-600 hover:bg-rose-700"
                          : stage.stageNumber === 4
                          ? "bg-purple-600 hover:bg-purple-700"
                          : stage.stageNumber === 3
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      Start Stage {stage.stageNumber}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {status === "locked" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-muted-foreground gap-1"
                    >
                      Prerequisites
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expandable Lock / Prerequisite Explanation */}
              {status === "locked" && isSelectedLocked && (
                <div className="p-3.5 m-3 mt-0 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <ShieldAlert className="h-4 w-4" />
                    Prerequisite Dependency Requirement
                  </div>
                  <p className="text-foreground/90 font-medium">
                    This stage is deterministically locked by the Knowledge Graph DAG engine.
                  </p>
                  <div className="p-2 rounded bg-background/60 border border-border/50 text-muted-foreground">
                    <strong className="text-foreground">Required to Unlock: </strong>
                    {stage.prerequisites.join(" • ")}
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    AI planners cannot bypass or hallucinate stage access. The KEA Mastery Engine (W-EMM) requires verified
                    empirical evidence from the preceding stage before unlocking downstream concepts.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
