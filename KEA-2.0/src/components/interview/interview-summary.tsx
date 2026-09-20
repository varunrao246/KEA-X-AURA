"use client";

import * as React from "react";
import { InterviewSummary } from "@/lib/ai/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Quote,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface InterviewSummaryViewProps {
  summary: InterviewSummary;
  onRestart: () => void;
  onClose?: () => void;
}

export function InterviewSummaryView({
  summary,
  onRestart,
  onClose,
}: InterviewSummaryViewProps) {
  const scorePercent = summary.overallScore;
  const isHighMastery = scorePercent >= 75;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Banner */}
      <Card
        className={`border-2 shadow-lg ${
          isHighMastery
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-amber-500/40 bg-amber-500/5"
        }`}
      >
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge
                  variant="outline"
                  className="font-bold text-xs uppercase tracking-wider text-primary border-primary/30 bg-primary/10"
                >
                  AI Oral Defense — Milestone Defense
                </Badge>
                <Badge variant="secondary" className="capitalize font-mono text-xs">
                  Defense Level: {summary.understandingLevel}
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Oral Defense Summary & Synthesis
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Multi-turn adaptive verbal probing evaluated across concepts, scientific rigor,
                and self-correction capabilities.
              </p>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-inner w-32 h-32 shrink-0">
              <span className="text-4xl font-black text-foreground">{scorePercent}%</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                Reasoning
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasoning Fluency Summary */}
      <Card className="border-border/60 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Verbal Reasoning Synthesis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-foreground font-sans">
            {summary.reasoningQualitySummary}
          </p>

          {summary.sampleEvidenceQuote && (
            <div className="p-3.5 rounded-lg bg-muted/40 border-l-4 border-primary text-xs italic text-muted-foreground flex items-start gap-2.5">
              <Quote className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>&ldquo;{summary.sampleEvidenceQuote}&rdquo;</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Demonstrated Strengths */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verbal Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {summary.strongConcepts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span className="text-foreground/90">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Areas for Reinforcement */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Needs Reinforcement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {summary.weakConcepts.length > 0 ? (
              summary.weakConcepts.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span className="text-foreground/90">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                No major concept weaknesses identified in this defense!
              </p>
            )}

            {summary.misconceptions.length > 0 && (
              <div className="pt-2 border-t border-amber-500/20 space-y-1">
                <span className="font-semibold text-foreground">Identified Misconceptions:</span>
                {summary.misconceptions.map((misc, mIdx) => (
                  <p key={mIdx} className="text-amber-700 dark:text-amber-300">
                    • {misc}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next Actions */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>Recommended Next Learning Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {summary.recommendedNextSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-primary font-bold">→</span>
              <span className="text-foreground">{step}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Deterministic Integration Note */}
      <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>
            Verbal reasoning evidence has been securely committed to the deterministic MasteryEngine.
          </span>
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onRestart} className="gap-1.5 cursor-pointer text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retake Oral Defense</span>
        </Button>

        {onClose && (
          <Button size="sm" onClick={onClose} className="cursor-pointer text-xs">
            <span>Continue Stage Progression</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
