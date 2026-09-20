"use client";

import * as React from "react";
import { AssessmentEvaluation } from "@/lib/ai/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  Mic,
} from "lucide-react";

interface AssessmentResultsProps {
  evaluation: AssessmentEvaluation;
  onRetake: () => void;
  onStartInterview?: () => void;
  onClose?: () => void;
}

export function AssessmentResults({
  evaluation,
  onRetake,
  onStartInterview,
  onClose,
}: AssessmentResultsProps) {
  const isPassing = evaluation.overallScore >= 75;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Score Header Card */}
      <Card
        className={`border-2 shadow-lg ${
          isPassing
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
                  className={
                    isPassing
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                      : "text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
                  }
                >
                  {isPassing ? "Mastery Demonstrated" : "Needs Reinforcement"}
                </Badge>
                <Badge variant="secondary" className="capitalize font-mono text-xs">
                  Recommendation: {evaluation.recommendedAction}
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Mock Test Assessment Complete
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Synthesized across {evaluation.totalQuestions} questions including objective
                checking and AI semantic rubric evaluations.
              </p>
            </div>

            {/* Score Ring / Metric */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-inner w-32 h-32 shrink-0">
              <span className="text-4xl font-black text-foreground">
                {evaluation.overallScore}%
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                Score
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Areas for Improvement */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Strengths */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Demonstrated Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {evaluation.strengths.length > 0 ? (
              evaluation.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span className="text-foreground/90">{str}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">General foundational grasp demonstrated.</p>
            )}
          </CardContent>
        </Card>

        {/* Growth Areas */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Areas for Reinforcement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {evaluation.areasForImprovement.length > 0 ? (
              evaluation.areasForImprovement.map((area, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span className="text-foreground/90">{area}</span>
                </div>
              ))
            ) : (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                No major misconceptions detected! Ready for oral defense.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Question Breakdown List */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Question-by-Question Evaluation Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {evaluation.evaluations.map((qEval, idx) => (
            <div
              key={qEval.questionId}
              className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground font-mono">Q{idx + 1}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {qEval.conceptId}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`capitalize text-[10px] ${
                      qEval.understanding === "strong"
                        ? "text-emerald-500 border-emerald-500/30"
                        : qEval.understanding === "partial"
                        ? "text-amber-500 border-amber-500/30"
                        : "text-destructive border-destructive/30"
                    }`}
                  >
                    {qEval.understanding} Understanding
                  </Badge>
                </div>
                <span className="font-mono font-bold text-foreground">{qEval.score}/100</span>
              </div>

              <p className="text-muted-foreground">{qEval.feedback}</p>

              {qEval.rubricHits.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {qEval.rubricHits.map((hit, hIdx) => (
                    <span
                      key={hIdx}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium"
                    >
                      ✓ {hit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
        <Button variant="outline" size="sm" onClick={onRetake} className="gap-1.5 cursor-pointer text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retake Mock Test</span>
        </Button>

        <div className="flex items-center gap-2">
          {onStartInterview && (
            <Button
              size="sm"
              onClick={onStartInterview}
              className="gap-1.5 cursor-pointer text-xs bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Proceed to AI Oral Defense</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Return to Topic
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
