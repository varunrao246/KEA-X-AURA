"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { DiagnosticAnswerSubmission, DiagnosticCalibrationResult } from "@/lib/diagnostic/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle, Loader2 } from "lucide-react";

interface DiagnosticCalibrationModalProps {
  plan: TopicCurriculumPlan;
  isOpen: boolean;
  onClose: () => void;
  onCalibrationComplete: (result: DiagnosticCalibrationResult) => void;
}

export function DiagnosticCalibrationModal({
  plan,
  isOpen,
  onClose,
  onCalibrationComplete,
}: DiagnosticCalibrationModalProps) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<DiagnosticCalibrationResult | null>(null);

  if (!isOpen) return null;

  const questions = plan.diagnosticQuestions || [];

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const submissions: DiagnosticAnswerSubmission[] = Object.entries(selectedAnswers).map(
        ([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })
      );

      const response = await fetch("/api/diagnostic/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicPlan: plan,
          submissions,
        }),
      });

      const data = await response.json();
      if (data.success && data.calibration) {
        setResult(data.calibration);
        onCalibrationComplete(data.calibration);
      }
    } catch (err) {
      console.error("Diagnostic submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every(q => selectedAnswers[q.id]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-primary/20">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 font-mono text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Prerequisite Calibration</span>
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {questions.length} Diagnostic Checks
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
              Skip Calibration
            </Button>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold mt-2">
            Calibrate Your Knowledge in {plan.topic}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Answer these quick prerequisite questions so KEA can calibrate your starting mastery and skip what you already know.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {result ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Calibration Result: {result.accuracyPercentage}% Accurate
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.correctCount} of {result.totalQuestions} questions answered correctly.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase block">Recommended Starting Point</span>
                  <span className="text-sm font-bold text-primary">{result.recommendedStartingNodeTitle}</span>
                </div>
              </div>

              {result.masteredConceptIds.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Concepts Mastered:</strong> {result.masteredConceptIds.length} foundational concepts were calibrated to Mastered and skipped for you!
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question Breakdown & Explanations
                </h4>
                {result.questionResults.map((q, idx) => (
                  <div
                    key={q.questionId}
                    className="p-3.5 rounded-lg border border-border/60 bg-card/60 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {idx + 1}. {q.questionText}
                      </span>
                      {q.isCorrect ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 shrink-0 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Correct</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1 shrink-0 text-[10px]">
                          <XCircle className="h-3 w-3" />
                          <span>Needs Review</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px] italic">
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={onClose} className="gap-2 cursor-pointer">
                  <span>View Updated Learning Path</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, qIdx) => (
                <div
                  key={question.id}
                  className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-primary font-bold">
                      Q{qIdx + 1} • {question.conceptTested}
                    </span>
                    {question.context && (
                      <span className="text-[10px] text-muted-foreground">
                        {question.context}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    {question.question}
                  </p>

                  <div className="space-y-2 pt-1">
                    {question.options.map(option => {
                      const isSelected = selectedAnswers[question.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectOption(question.id, option.id)}
                          className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs"
                              : "border-border/60 hover:border-primary/40 bg-card hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center justify-between border-t border-border/60">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Answer all questions for accurate starting calibration</span>
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || isSubmitting}
                  className="gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calibrating...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Calibrate Path</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
