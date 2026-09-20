"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  STAGE_3_CHALLENGES,
  FunctionalGroupChallengeItem,
  FunctionalGroupFamily,
  FUNCTIONAL_GROUPS_CATALOG,
} from "@/lib/chemistry/functional-groups";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, HelpCircle } from "lucide-react";

interface Props {
  onEvidence?: (score: number, activityId: string) => void;
}

export function FunctionalGroupChallenge({ onEvidence }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<FunctionalGroupFamily | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [scoreCount, setScoreCount] = React.useState(0);
  const [completedAll, setCompletedAll] = React.useState(false);

  const currentChallenge: FunctionalGroupChallengeItem = STAGE_3_CHALLENGES[currentIndex];

  // Options to present
  const options: FunctionalGroupFamily[] = React.useMemo(() => {
    const list = [currentChallenge.correctGroup, ...currentChallenge.distractors];
    // deterministic sort for stability
    return Array.from(new Set(list)).sort();
  }, [currentChallenge]);

  const handleSelectOption = (group: FunctionalGroupFamily) => {
    if (hasSubmitted && isCorrect) return;
    setSelectedAnswer(group);
  };

  const handleVerify = () => {
    if (!selectedAnswer) return;
    const correct = selectedAnswer === currentChallenge.correctGroup;
    setIsCorrect(correct);
    setHasSubmitted(true);

    if (correct) {
      const nextScore = scoreCount + 1;
      setScoreCount(nextScore);
      const computedScore = Math.round((nextScore / STAGE_3_CHALLENGES.length) * 100);
      onEvidence?.(computedScore, currentChallenge.id);
    } else {
      setShowHint(true);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < STAGE_3_CHALLENGES.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      setCompletedAll(true);
      onEvidence?.(100, "all-challenges-mastered");
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    setScoreCount(0);
    setCompletedAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30">
              Module D: Diagnostic Challenge
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Challenge {currentIndex + 1} of {STAGE_3_CHALLENGES.length}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-1">
            Identify the Heteroatom Functional Group
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono">
            <span className="text-muted-foreground">Solved: </span>
            <span className="font-bold text-emerald-400">{scoreCount}</span> / {STAGE_3_CHALLENGES.length}
          </div>
          <Progress
            value={Math.round((scoreCount / STAGE_3_CHALLENGES.length) * 100)}
            className="w-24 h-2"
          />
        </div>
      </div>

      {completedAll ? (
        /* Completion Victory Card */
        <Card className="border-emerald-500/40 bg-emerald-950/20 text-center py-8 px-4">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black text-foreground">
              Functional Group Mastery Verified!
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You correctly classified all functional centers (Alcohols, Aldehydes, Ketones, Carboxylic Acids, and Amines) with 100% precision.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 cursor-pointer border-emerald-500/40 text-emerald-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Challenges</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Active Challenge */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Molecule Card */}
          <div className="md:col-span-6 p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                Target: {currentChallenge.commonName}
              </span>
              <Badge variant="outline" className="font-mono text-[11px] border-primary/30 text-primary">
                Formula: {currentChallenge.formula}
              </Badge>
            </div>

            <div className="py-8 text-center space-y-2">
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                {currentChallenge.name}
              </h2>
              <div className="p-3 bg-muted/30 rounded-xl border border-border/60 inline-block font-mono text-lg text-primary font-bold">
                {currentChallenge.formula}
              </div>
            </div>

            {/* Hint Box */}
            {showHint && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2 animate-in fade-in">
                <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Hint:</strong> {currentChallenge.hint}
                </span>
              </div>
            )}
          </div>

          {/* Options & Action Column */}
          <div className="md:col-span-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              What type of functional group is present?
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {options.map((opt) => {
                const catalog = FUNCTIONAL_GROUPS_CATALOG[opt];
                const isSelected = selectedAnswer === opt;
                const isCorrectOption = opt === currentChallenge.correctGroup;

                let buttonClass = "border-border/80 hover:border-primary/50 text-foreground";
                if (hasSubmitted) {
                  if (isCorrectOption) {
                    buttonClass = "border-emerald-500/60 bg-emerald-950/30 text-emerald-300";
                  } else if (isSelected && !isCorrect) {
                    buttonClass = "border-destructive/60 bg-destructive/10 text-destructive";
                  }
                } else if (isSelected) {
                  buttonClass = "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/40";
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${buttonClass}`}
                  >
                    <div>
                      <span className="font-bold text-sm block">
                        {catalog?.name || opt.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Signature: {catalog?.generalFormula}
                      </span>
                    </div>

                    {hasSubmitted && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    )}
                    {hasSubmitted && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Verification Result Feedback */}
            {hasSubmitted && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  isCorrect
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-destructive/10 border border-destructive/30 text-destructive"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Correct Classification!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Incorrect Classification</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {currentChallenge.explanation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {!hasSubmitted ? (
                <Button
                  onClick={handleVerify}
                  disabled={!selectedAnswer}
                  className="w-full cursor-pointer bg-primary font-bold text-primary-foreground"
                >
                  Verify Classification
                </Button>
              ) : isCorrect ? (
                <Button
                  onClick={handleNext}
                  className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                >
                  <span>Next Challenge</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasSubmitted(false);
                    setSelectedAnswer(null);
                  }}
                  className="w-full cursor-pointer gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
