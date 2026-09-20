"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Check, ArrowRight, SkipForward, ArrowLeft } from "lucide-react";

interface PrerequisiteDiagnosticViewProps {
  plan: TopicCurriculumPlan;
  onComplete: (userAnswers: Record<string, string>) => void;
  onBack: () => void;
}

export function PrerequisiteDiagnosticView({
  plan,
  onComplete,
  onBack,
}: PrerequisiteDiagnosticViewProps) {
  // Map of questionId -> selectedOptionId
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, string>>({});

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSkip = () => {
    // Treat as beginner, empty answers
    onComplete({});
  };

  const handleSubmit = () => {
    onComplete(selectedAnswers);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = plan.diagnosticQuestions.length;
  const isAllAnswered = answeredCount === totalCount;

  return (
    <div className="py-8 sm:py-12 px-4 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Change Topic</span>
        </Button>

        <Badge variant="outline" className="text-xs font-medium">
          Step 2 of 3 • Diagnostic Calibration
        </Badge>
      </div>

      {/* 2. Main Title Banner */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Calibrating: {plan.topic}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Before we build your path...
        </h2>

        <p className="text-lg sm:text-xl font-semibold text-foreground/90">
          Let&apos;s check what you already know.
        </p>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          KEA evaluates <strong>Required Knowledge</strong> vs. <strong>Current Knowledge</strong>.
          Answering these quick diagnostic questions ensures we skip what you&apos;ve already mastered
          and target the exact foundational prerequisites you need.
        </p>
      </div>

      {/* 3. Diagnostic Question Cards */}
      <div className="space-y-6">
        {plan.diagnosticQuestions.map((q, qIndex) => {
          const selectedOptionId = selectedAnswers[q.id];
          return (
            <Card key={q.id} className="shadow-sm border-border/80 bg-card overflow-hidden">
              <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border/40">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    Question {qIndex + 1} of {totalCount}
                  </Badge>
                  {q.context && (
                    <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                      {q.context}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {q.question}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  Concept: {q.conceptTested}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-2.5">
                {q.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt.id)}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground shadow-xs font-semibold"
                          : "border-border/70 hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer order-2 sm:order-1"
        >
          <SkipForward className="h-3.5 w-3.5" />
          <span>I&apos;m a complete beginner (Start at Stage 1)</span>
        </Button>

        <Button
          size="default"
          onClick={handleSubmit}
          className="w-full sm:w-auto font-semibold gap-2 cursor-pointer shadow-sm order-1 sm:order-2"
        >
          <span>
            {isAllAnswered
              ? "Verify Knowledge & Build Path"
              : `Submit Diagnostic (${answeredCount}/${totalCount})`}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center text-[11px] text-muted-foreground font-mono">
        Transparent Local Diagnostic Calibration • Zero Hallucination Gating
      </div>
    </div>
  );
}
