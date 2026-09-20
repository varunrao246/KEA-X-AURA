"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitFork,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  PlayCircle,
  Trophy,
  Sparkles,
  BookOpen,
  Target,
  Clock,
  Layers,
} from "lucide-react";

interface TopicGraphPreviewProps {
  plan: TopicCurriculumPlan;
  diagnosticScore: { correct: number; total: number };
  onEnterWorkspace: () => void;
  onReset: () => void;
}

export function TopicGraphPreview({
  plan,
  diagnosticScore,
  onEnterWorkspace,
  onReset,
}: TopicGraphPreviewProps) {
  return (
    <div className="py-8 sm:py-12 px-4 max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>New Topic</span>
        </Button>

        <Badge variant="outline" className="text-xs font-semibold gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Step 3 of 3 • Knowledge Graph Generated</span>
        </Badge>
      </div>

      {/* 2. Topic Overview Hero */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
          <Badge className="bg-primary text-primary-foreground font-bold">
            {plan.category}
          </Badge>
          <Badge variant="secondary" className="gap-1 font-medium">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>~{plan.estimatedHours} Hours to Mastery</span>
          </Badge>
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>
              Diagnostic: {diagnosticScore.correct}/{diagnosticScore.total} Validated
            </span>
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans">
          {plan.topic}
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          {plan.overview}
        </p>

        <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70 text-xs text-foreground/80 flex items-start gap-2.5">
          <GitFork className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Prerequisite Requirement: </span>
            <span>{plan.prerequisiteSummary}</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Topic Graph Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Generated Stage-Wise Learning Path
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {plan.stages.length} Stages • Strict Prerequisite Gating
          </span>
        </div>

        {/* Visual Graph Nodes */}
        <div className="relative pt-4 pb-2 space-y-0">
          {/* Target Root Node */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-center shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                Target Objective
              </span>
              <p className="text-base font-extrabold text-foreground">{plan.topic} Mastery</p>
            </div>

            {/* Connecting Arrow */}
            <div className="flex flex-col items-center my-1.5 text-muted-foreground/60">
              <div className="w-0.5 h-6 bg-border" />
              <div className="w-2 h-2 rotate-45 border-b-2 border-r-2 border-border -mt-1" />
            </div>
          </div>

          {/* Sequential Stage Cards */}
          {plan.stages.map((stage, sIdx) => {
            const isUnlocked = sIdx === 0;
            const isLast = sIdx === plan.stages.length - 1;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <Card
                  className={`w-full max-w-2xl transition-all shadow-sm ${
                    isUnlocked
                      ? "border-primary/40 bg-card shadow-md ring-1 ring-primary/20"
                      : "border-border/60 bg-muted/20 opacity-85"
                  }`}
                >
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isUnlocked
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {stage.stageNumber}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                            {stage.title}
                          </h3>
                          <p className="text-xs font-medium text-muted-foreground">
                            {stage.tagline}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isUnlocked ? (
                          <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white font-semibold gap-1 text-[11px]">
                            <PlayCircle className="h-3 w-3" />
                            <span>Unlocked & Active</span>
                          </Badge>
                        ) : isLast ? (
                          <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30">
                            <Trophy className="h-3 w-3" />
                            <span>Mastery Capstone</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-[11px] text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Gated by Stage {stage.stageNumber - 1}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Objective */}
                    <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      <strong>Objective:</strong> {stage.objective}
                    </div>

                    {/* Concept Pills */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Concepts in this stage:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.concepts.map((c) => (
                          <span
                            key={c.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                              isUnlocked
                                ? "bg-primary/5 text-foreground border-primary/20"
                                : "bg-muted/40 text-muted-foreground border-border/50"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Learning Activities & Milestone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-border/40">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" />
                          <span>Learning Modalities:</span>
                        </span>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                          {stage.learningActivities.slice(0, 2).map((act, i) => (
                            <li key={i} className="truncate">{act}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3 text-primary" />
                          <span>Milestone Assessment:</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {stage.milestoneAssessment}
                        </p>
                      </div>
                    </div>

                    {/* Mastery Condition */}
                    <div className="p-2.5 rounded-md bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>Mastery Gate: </strong>{stage.masteryCondition}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Connecting Arrow between stages */}
                {!isLast && (
                  <div className="flex flex-col items-center my-1.5 text-muted-foreground/60">
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-2 h-2 rotate-45 border-b-2 border-r-2 border-border -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Action CTA */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-foreground">Ready to start Stage 1?</h3>
          <p className="text-xs text-muted-foreground">
            Stage 1 ({plan.stages[0].title}) is unlocked and ready for your first learning session.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="default"
            onClick={onReset}
            className="flex-1 sm:flex-initial cursor-pointer"
          >
            Explore Another Topic
          </Button>

          <Button
            size="default"
            onClick={onEnterWorkspace}
            className="flex-1 sm:flex-initial font-bold gap-2 cursor-pointer shadow-sm"
          >
            <span>Enter Learning Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
