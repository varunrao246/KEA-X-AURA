"use client";

import * as React from "react";
import { GeneratedLearningContent } from "@/lib/ai/schemas";
import { ExecutionMetadata } from "@/lib/ai/ai-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Compass,
  Trophy,
} from "lucide-react";

interface AILearningPanelProps {
  topic: string;
  stageNumber?: number;
  concept: { id: string; title: string; summary?: string };
  learnerMastery?: number;
  recentMistakes?: string[];
  pace?: string;
  demoMode?: boolean;
  onMetadataUpdate?: (metadata: ExecutionMetadata) => void;
  onEvidenceCaptured?: (evidence: {
    conceptId: string;
    success: boolean;
    score: number;
    understanding: "strong" | "weak";
    timestamp: number;
  }) => void;
  onNextConcept?: () => void;
  onClose?: () => void;
}

export function AILearningPanel({
  topic,
  stageNumber = 1,
  concept,
  learnerMastery = 50,
  recentMistakes = [],
  pace = "steady",
  demoMode = false,
  onMetadataUpdate,
  onEvidenceCaptured,
  onNextConcept,
  onClose,
}: AILearningPanelProps) {
  const [content, setContent] = React.useState<GeneratedLearningContent | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = React.useState<boolean>(false);
  const [showHint, setShowHint] = React.useState<boolean>(false);
  const [showStretch, setShowStretch] = React.useState<boolean>(false);

  const onMetadataUpdateRef = React.useRef(onMetadataUpdate);
  React.useEffect(() => {
    onMetadataUpdateRef.current = onMetadataUpdate;
  }, [onMetadataUpdate]);

  const conceptRef = React.useRef(concept);
  const mistakesRef = React.useRef(recentMistakes);
  React.useEffect(() => {
    conceptRef.current = concept;
    mistakesRef.current = recentMistakes;
  }, [concept, recentMistakes]);

  const fetchLearningContent = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setShowStretch(false);

    try {
      const res = await fetch("/api/learning/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          stage: stageNumber,
          concept: conceptRef.current,
          mastery: learnerMastery,
          recentMistakes: mistakesRef.current,
          pace,
          demoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate learning content.");
      }

      setContent(data.content);
      if (data.metadata && onMetadataUpdateRef.current) {
        onMetadataUpdateRef.current(data.metadata);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load AI content");
    } finally {
      setIsLoading(false);
    }
  }, [topic, stageNumber, learnerMastery, pace, demoMode]);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/learning/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        stage: stageNumber,
        concept: conceptRef.current,
        mastery: learnerMastery,
        recentMistakes: mistakesRef.current,
        pace,
        demoMode,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.content) {
          setContent(data.content);
          if (data.metadata && onMetadataUpdateRef.current) {
            onMetadataUpdateRef.current(data.metadata);
          }
        } else {
          setError(data.error || "Failed to generate learning content.");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load AI content");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topic, stageNumber, concept.id, learnerMastery, pace, demoMode]);

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitPractice = () => {
    if (selectedOption === null || !content) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === content.practiceQuestion.correctOptionIndex;
    if (onEvidenceCaptured) {
      onEvidenceCaptured({
        conceptId: content.conceptId,
        success: isCorrect,
        score: isCorrect ? 100 : 25,
        understanding: isCorrect ? "strong" : "weak",
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 gap-1 font-mono text-xs">
              <Sparkles className="h-3 w-3" />
              <span>AI Learning Synthesizer</span>
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              Stage {stageNumber}
            </Badge>
            {demoMode && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                Offline Mode
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {content?.conceptTitle || concept.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLearningContent}
            disabled={isLoading}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Generate New Variation</span>
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer text-xs">
              Done
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {demoMode
                ? "Loading verified curriculum lesson (Offline Demo Mode)..."
                : "Generating personalized lesson via Groq LPU..."}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Calibrating explanation, worked examples, and practice for {concept.title}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button size="sm" onClick={fetchLearningContent} className="cursor-pointer">
            Retry Generation
          </Button>
        </Card>
      )}

      {/* Content Rendered */}
      {content && !isLoading && (
        <div className="space-y-6">
          {/* Visible Adaptivity Proof Banners */}
          {recentMistakes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  🎯 KEA Adaptive Remediation Active
                </span>
                <p className="text-foreground/90 font-normal leading-relaxed">
                  KEA identified prior conceptual struggle: <em>{recentMistakes.join("; ")}</em>.
                  This lesson has been calibrated with supportive scaffolding, intuitive analogies,
                  and targeted practice addressing your specific misconception.
                </p>
              </div>
            </div>
          )}

          {learnerMastery >= 80 && recentMistakes.length === 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  ⚡ High Mastery Extension Active ({learnerMastery}%)
                </span>
                <p className="text-foreground/90 font-normal leading-relaxed">
                  Solid conceptual foundations demonstrated! AI has calibrated advanced mechanistic
                  depth, rigorous multi-bond reasoning, and higher-order stretch challenges.
                </p>
              </div>
            </div>
          )}

          {/* 1. Personalized Explanation */}
          <Card className="border-border/60 bg-card/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Personalized Conceptual Foundation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-sans">
                {content.personalizedExplanation}
              </p>
            </CardContent>
          </Card>

          {/* 2. Step-by-Step Worked Example */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-500" />
                <span>Concrete Worked Reasoning (Step-by-Step)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {content.workedExamples.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {step.action}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                      {step.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Misconception Warning Alert */}
          <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Critical Misconception Warning</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="font-semibold text-foreground">Common Pitfall: </span>
                <span className="text-muted-foreground">{content.misconceptionAlert.commonPitfall}</span>
              </div>
              <div className="space-y-1 pt-1 border-t border-amber-500/20">
                <span className="font-semibold text-foreground">How to Avoid: </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {content.misconceptionAlert.howToAvoid}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Interactive Practice Question */}
          <Card className="border-primary/30 shadow-md bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Real-Time Practice Challenge</span>
                </CardTitle>
                <Badge variant="outline" className="capitalize text-[11px] font-mono">
                  {content.practiceQuestion.difficulty}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground pt-2">
                {content.practiceQuestion.prompt}
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid gap-2">
                {content.practiceQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === content.practiceQuestion.correctOptionIndex;

                  let optionStyle =
                    "border-border/60 hover:bg-muted/40 hover:border-border text-foreground";
                  if (isSelected && !isAnswerSubmitted) {
                    optionStyle = "border-primary bg-primary/10 text-primary font-medium";
                  } else if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optionStyle =
                        "border-destructive bg-destructive/10 text-destructive line-through";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action buttons & Hint toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>{showHint ? "Hide Hint" : "Need a Hint?"}</span>
                </Button>

                {!isAnswerSubmitted ? (
                  <Button
                    size="sm"
                    onClick={handleSubmitPractice}
                    disabled={selectedOption === null}
                    className="gap-1.5 cursor-pointer text-xs"
                  >
                    <span>Check Answer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStretch((prev) => !prev)}
                      className="gap-1.5 text-xs cursor-pointer"
                    >
                      <Trophy className="h-3.5 w-3.5 text-primary" />
                      <span>{showStretch ? "Hide Stretch" : "Stretch Challenge"}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Hint Box */}
              {showHint && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
                  <span className="font-semibold">Hint: </span>
                  {content.hint}
                </div>
              )}

              {/* Feedback & Explanation on Submit */}
              {isAnswerSubmitted && (
                <div className="space-y-3 pt-2 border-t border-border/40 animate-in fade-in duration-200">
                  <div
                    className={`p-3 rounded-lg text-xs sm:text-sm font-medium ${
                      selectedOption === content.practiceQuestion.correctOptionIndex
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    <p className="font-bold pb-1">
                      {selectedOption === content.practiceQuestion.correctOptionIndex
                        ? "✓ Outstanding work!"
                        : "✗ Not quite. Here's why:"}
                    </p>
                    <p className="font-normal text-foreground/90">{content.practiceQuestion.explanation}</p>
                  </div>

                  {showStretch && (
                    <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-xs">
                      <p className="font-bold text-primary flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" />
                        Next-Level Stretch Challenge
                      </p>
                      <p className="text-muted-foreground">{content.stretchChallenge}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Recommended Next Step: </span>
                      {content.recommendedNextStep}
                    </p>

                    <div className="flex items-center gap-2">
                      {selectedOption !== content.practiceQuestion.correctOptionIndex && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={fetchLearningContent}
                          className="gap-1.5 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Adaptive Remediation</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => {
                          if (onNextConcept) {
                            onNextConcept();
                          } else if (onClose) {
                            onClose();
                          }
                        }}
                        className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-xs"
                      >
                        <span>Continue to Next Concept</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
