"use client";

import * as React from "react";
import { GeneratedMockTest, AssessmentEvaluation, MockTestQuestion } from "@/lib/ai/schemas";
import { ExecutionMetadata } from "@/lib/ai/ai-provider";
import { AssessmentResults } from "./assessment-results";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";

interface AIMockTestProps {
  topic: string;
  stageNumber?: number;
  targetConcepts?: Array<{ id: string; title: string }>;
  currentMastery?: number;
  demoMode?: boolean;
  onMetadataUpdate?: (metadata: ExecutionMetadata) => void;
  onEvidenceRecorded?: (evidenceItems: Array<{
    conceptId: string;
    success: boolean;
    score: number;
    understanding: "strong" | "partial" | "weak";
    confidence: number;
  }>) => void;
  onStartInterview?: () => void;
  onClose?: () => void;
}

export function AIMockTest({
  topic,
  stageNumber = 3,
  targetConcepts = [],
  currentMastery = 60,
  demoMode = false,
  onMetadataUpdate,
  onEvidenceRecorded,
  onStartInterview,
  onClose,
}: AIMockTestProps) {
  const [test, setTest] = React.useState<GeneratedMockTest | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState<number>(0);
  const [answers, setAnswers] = React.useState<Record<string, string | number>>({});
  const [evaluation, setEvaluation] = React.useState<AssessmentEvaluation | null>(null);

  const onMetadataUpdateRef = React.useRef(onMetadataUpdate);
  React.useEffect(() => {
    onMetadataUpdateRef.current = onMetadataUpdate;
  }, [onMetadataUpdate]);

  const targetConceptsRef = React.useRef(targetConcepts);
  React.useEffect(() => {
    targetConceptsRef.current = targetConcepts;
  }, [targetConcepts]);

  const fetchMockTest = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const res = await fetch("/api/assessment/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          stageNumber,
          targetConcepts: targetConceptsRef.current,
          currentMastery,
          targetDifficulty: "adaptive",
          numQuestions: 5,
          demoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate mock test.");
      }

      setTest(data.test);
      if (data.metadata && onMetadataUpdateRef.current) {
        onMetadataUpdateRef.current(data.metadata);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mock test");
    } finally {
      setIsLoading(false);
    }
  }, [topic, stageNumber, currentMastery, demoMode]);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/assessment/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        stageNumber,
        targetConcepts: targetConceptsRef.current,
        currentMastery,
        targetDifficulty: "adaptive",
        numQuestions: 5,
        demoMode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.test) {
          setTest(data.test);
          if (data.metadata && onMetadataUpdateRef.current) {
            onMetadataUpdateRef.current(data.metadata);
          }
        } else {
          setError(data.error || "Failed to generate mock test.");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load mock test");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topic, stageNumber, currentMastery, demoMode]);

  const handleSelectOption = (qId: string, optIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const handleTextAnswerChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmitTest = async () => {
    if (!test) return;
    setIsEvaluating(true);
    setError(null);

    try {
      const res = await fetch("/api/assessment/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: test.id,
          topic: test.topic,
          responses: answers,
          submissions: test.questions.map((q) => ({
            questionId: q.id,
            studentAnswer: answers[q.id] !== undefined ? answers[q.id] : "",
          })),
          demoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to evaluate assessment.");
      }

      setEvaluation(data.evaluation);

      // Pass evidence items to deterministic MasteryEngine
      if (data.masteryEvidence && onEvidenceRecorded) {
        onEvidenceRecorded(data.masteryEvidence);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  if (evaluation) {
    return (
      <AssessmentResults
        evaluation={evaluation}
        onRetake={fetchMockTest}
        onStartInterview={onStartInterview}
        onClose={onClose}
      />
    );
  }

  const currentQ: MockTestQuestion | undefined = test?.questions[currentQuestionIndex];
  const isLastQuestion = Boolean(test && currentQuestionIndex === test.questions.length - 1);
  const totalQuestions = test?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 gap-1 font-mono text-xs">
              <Sparkles className="h-3 w-3" />
              <span>AI Milestone Mock Test</span>
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              Stage {stageNumber}
            </Badge>
            {demoMode && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                Demo Mode
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {test?.title || "Milestone Diagnostic Exam"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMockTest}
            disabled={isLoading || isEvaluating}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Regenerate Test</span>
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Exit
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Generating Dynamic Mock Test...
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Calibrating 5 questions across objective, short-answer, and conceptual reasoning.
            </p>
          </div>
        </div>
      )}

      {/* Evaluating Spinner */}
      {isEvaluating && (
        <div className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Evaluating Assessment Submissions...
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Applying deterministic grading and AI semantic rubric analysis...
            </p>
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && !isLoading && !isEvaluating && (
        <Card className="border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button size="sm" onClick={fetchMockTest} className="cursor-pointer">
            Retry Generation
          </Button>
        </Card>
      )}

      {/* Test Runner */}
      {test && currentQ && !isLoading && !isEvaluating && (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>{answeredCount}/{totalQuestions} Answered</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {currentQ.conceptTitle || currentQ.conceptId}
                  </Badge>
                  <Badge variant="secondary" className="capitalize text-[11px] font-mono">
                    {currentQ.type.replace("_", " ")}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className="capitalize text-[10px] font-mono text-muted-foreground"
                >
                  {currentQ.difficulty}
                </Badge>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground pt-3 leading-snug">
                {currentQ.prompt}
              </h3>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Type 1: Multiple Choice */}
              {currentQ.type === "multiple_choice" && currentQ.options && (
                <div className="grid gap-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id] === oIdx;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQ.id, oIdx)}
                        className={`w-full p-3.5 rounded-lg border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                            : "border-border/60 hover:bg-muted/40 hover:border-border text-foreground"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Short Answer / Reasoning */}
              {(currentQ.type === "short_answer" || currentQ.type === "reasoning") && (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={(answers[currentQ.id] as string) || ""}
                    onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                    placeholder={
                      currentQ.type === "reasoning"
                        ? "Articulate your conceptual reasoning and underlying mechanism step-by-step..."
                        : "Type your concise scientific explanation here..."
                    }
                    className="w-full p-3.5 rounded-lg border border-border/80 bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans leading-relaxed"
                  />

                  {currentQ.rubric && currentQ.rubric.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                      <span className="font-semibold text-foreground">Scoring Rubric Criteria:</span>
                      <ul className="list-disc list-inside space-y-0.5 pt-1">
                        {currentQ.rubric.map((r, rIdx) => (
                          <li key={rIdx}>{r.criterion} (Weight: {r.weight * 100}%)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="gap-1.5 cursor-pointer text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            {!isLastQuestion ? (
              <Button
                size="sm"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmitTest}
                disabled={answeredCount === 0}
                className="gap-1.5 cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Assessment</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
