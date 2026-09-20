"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  IsomerChallengeItem,
  STAGE4_CHALLENGES,
} from "@/lib/chemistry/isomerism";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

interface IsomerChallengeProps {
  onRecordEvidence?: (
    conceptId: string,
    activityTitle: string,
    score: number,
    metadata?: Record<string, unknown>
  ) => void;
  onAllCompleted?: (finalScore: number) => void;
}

export function IsomerChallenge({
  onRecordEvidence,
  onAllCompleted,
}: IsomerChallengeProps) {
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = React.useState<string | null>(null);
  const [isAnswered, setIsAnswered] = React.useState<boolean>(false);
  const [showHint, setShowHint] = React.useState<boolean>(false);
  const [scoreList, setScoreList] = React.useState<number[]>([]);

  const currentItem: IsomerChallengeItem = STAGE4_CHALLENGES[currentIndex];
  const isLastQuestion = currentIndex === STAGE4_CHALLENGES.length - 1;

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOptionId || isAnswered) return;

    const chosenOption = currentItem.options.find((o) => o.id === selectedOptionId);
    const isCorrect = Boolean(chosenOption?.isCorrect);
    const scoreVal = isCorrect ? 100 : 40;

    setIsAnswered(true);
    setScoreList((prev) => [...prev, scoreVal]);

    onRecordEvidence?.(
      currentItem.conceptId,
      `Challenge ${currentIndex + 1}: ${currentItem.title}`,
      scoreVal,
      {
        questionId: currentItem.id,
        isCorrect,
        selectedOptionId,
      }
    );
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      const total = scoreList.reduce((a, b) => a + b, 0);
      const avg = Math.round(total / STAGE4_CHALLENGES.length);
      onAllCompleted?.(avg);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setShowHint(false);
    setScoreList([]);
  };

  const completedQuestionsCount = scoreList.length;
  const currentAverage =
    completedQuestionsCount > 0
      ? Math.round(scoreList.reduce((a, b) => a + b, 0) / completedQuestionsCount)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-foreground">
              Stage 4 Diagnostic Assessment: Isomer Detective
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test constitutional connectivity, functional group divergence, and stereochemical rigidity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Accuracy
            </span>
            <span className="text-sm font-mono font-bold text-purple-300">
              {currentAverage}%
            </span>
          </div>
          <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-xs">
            Question {currentIndex + 1} of {STAGE4_CHALLENGES.length}
          </Badge>
          {completedQuestionsCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRestart}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <Progress
        value={((currentIndex + (isAnswered ? 1 : 0)) / STAGE4_CHALLENGES.length) * 100}
        className="h-1.5 bg-muted"
      />

      {/* Main Challenge Card */}
      <Card className="border border-border/80 bg-card/70 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Question Title & Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-foreground">
                {currentItem.title}
              </h4>
            </div>
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium pl-8">
              {currentItem.question}
            </p>
          </div>

          {/* Molecule Preview Pill if applicable */}
          <div className="flex flex-wrap items-center gap-2 pl-8">
            <span className="text-xs text-muted-foreground font-semibold">Comparing:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {currentItem.molA.name} ({currentItem.molA.formula})
            </Badge>
            <span className="text-xs text-muted-foreground">vs</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {currentItem.molB.name} ({currentItem.molB.formula})
            </Badge>
          </div>

          {/* Options List */}
          <div className="space-y-2.5 pt-2">
            {currentItem.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              let optionStyle =
                "border-border/80 bg-background/80 hover:border-purple-500/50 hover:bg-muted/30";

              if (isAnswered) {
                if (option.isCorrect) {
                  optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-200 font-semibold";
                } else if (isSelected && !option.isCorrect) {
                  optionStyle = "border-rose-500 bg-rose-500/10 text-rose-200";
                } else {
                  optionStyle = "border-border/40 opacity-50";
                }
              } else if (isSelected) {
                optionStyle = "border-purple-500 bg-purple-500/15 shadow-xs font-semibold";
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                >
                  <span
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isSelected
                        ? "border-purple-500 bg-purple-500 text-white"
                        : "border-muted-foreground/40 text-muted-foreground"
                    }`}
                  >
                    {option.id.replace("opt-", "").toUpperCase()}
                  </span>
                  <span className="flex-1 leading-relaxed">{option.text}</span>
                  {isAnswered && option.isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !option.isCorrect && (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint Dropdown Toggle */}
          {!isAnswered && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHint((prev) => !prev)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span>{showHint ? "Hide Pedagogical Hint" : "Need a Hint?"}</span>
              </Button>
              {showHint && (
                <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 animate-in fade-in duration-150">
                  {currentItem.hint}
                </div>
              )}
            </div>
          )}

          {/* Explanation Banner on answered */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chemical Defense & Scientific Principle</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {currentItem.explanation}
              </p>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Evidence emitted to <strong>MasteryEngine (W-EMM)</strong>
            </span>

            {!isAnswered ? (
              <Button
                size="sm"
                disabled={!selectedOptionId}
                onClick={handleConfirmAnswer}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-5 cursor-pointer shadow-xs"
              >
                <span>Submit Answer</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 cursor-pointer shadow-xs"
              >
                <span>{isLastQuestion ? "Complete Challenge" : "Next Question"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
