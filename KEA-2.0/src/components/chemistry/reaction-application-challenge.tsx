"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STAGE5_CHALLENGES,
  Stage5Challenge,
} from "@/lib/chemistry/reactions";
import { AssessmentEvidence } from "@/lib/mastery/types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface ReactionApplicationChallengeProps {
  onEvidenceEmitted?: (evidence: AssessmentEvidence) => void;
  onChallengeCompleted?: (averageScore: number) => void;
}

export function ReactionApplicationChallenge({
  onEvidenceEmitted,
  onChallengeCompleted,
}: ReactionApplicationChallengeProps) {
  const [currentIdx, setCurrentIdx] = React.useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = React.useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = React.useState<boolean>(false);
  const [showHint, setShowHint] = React.useState<boolean>(false);
  const [scores, setScores] = React.useState<Record<string, number>>({});

  const challenge: Stage5Challenge = STAGE5_CHALLENGES[currentIdx];
  const selectedOption = challenge.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;

  const handleSelectOption = (id: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(id);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const score = isCorrect ? 100 : 0;
    const newScores = { ...scores, [challenge.id]: score };
    setScores(newScores);

    // Emit empirical evidence to deterministic MasteryEngine (W-EMM)
    const evidence: AssessmentEvidence = {
      conceptId: challenge.conceptId,
      assessmentType: "practice",
      score,
      metadata: {
        isCorrect,
        difficultyTier: challenge.conceptId === "c-org-17" ? "advanced" : "intermediate",
      },
    };
    onEvidenceEmitted?.(evidence);

    if (currentIdx === STAGE5_CHALLENGES.length - 1) {
      const totalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      const avg = Math.round(totalScore / STAGE5_CHALLENGES.length);
      onChallengeCompleted?.(avg);
    }
  };

  const handleNext = () => {
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    if (currentIdx < STAGE5_CHALLENGES.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(0);
      setScores({});
    }
  };

  const totalAnswered = Object.keys(scores).length;
  const totalCorrect = Object.values(scores).filter((s) => s === 100).length;

  return (
    <div className="w-full space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-5">
        {/* Header with Progress Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase font-bold text-primary border-primary/30">
                Capstone Diagnostic Assessment
              </Badge>
              <h3 className="text-base font-bold text-foreground">
                Real-World Reaction & Synthesis Scenarios
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apply deterministic reaction logic, bond transformations, and multi-step synthesis planning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              Challenge {currentIdx + 1} of {STAGE5_CHALLENGES.length}
            </span>
            <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/30">
              Mastery: {totalCorrect} / {totalAnswered || STAGE5_CHALLENGES.length} Correct
            </Badge>
          </div>
        </div>

        {/* Scenario Card */}
        <div className="p-4 rounded-xl border border-border/60 bg-background/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold text-primary tracking-wider">
              {challenge.title}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              Target Concept: {challenge.conceptId}
            </Badge>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border border-border/40 text-xs text-foreground/90 leading-relaxed">
            <strong className="text-foreground">Scenario: </strong>
            {challenge.scenario}
          </div>

          <div className="text-sm font-bold text-foreground pt-1">
            {challenge.prompt}
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-2.5">
          {challenge.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const showCorrect = isAnswerSubmitted && option.isCorrect;
            const showIncorrect = isAnswerSubmitted && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(option.id)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  showCorrect
                    ? "border-emerald-500 bg-emerald-500/15 text-foreground ring-1 ring-emerald-500/40"
                    : showIncorrect
                    ? "border-rose-500 bg-rose-500/15 text-foreground ring-1 ring-rose-500/40"
                    : isSelected
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-border/60 bg-background/60 hover:bg-background/90 text-muted-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground block">
                      {option.label}
                    </span>
                    {isAnswerSubmitted && (isSelected || option.isCorrect) && (
                      <p className={`text-[11px] leading-relaxed ${
                        option.isCorrect ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {option.explanation}
                      </p>
                    )}
                  </div>

                  {isAnswerSubmitted && (
                    <div className="shrink-0 mt-0.5">
                      {option.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isSelected ? (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint Accordion */}
        <div className="space-y-2">
          {!showHint && !isAnswerSubmitted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(true)}
              className="text-xs h-7 text-amber-500 hover:text-amber-600 gap-1.5 px-2 cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Need a chemical hint?
            </Button>
          )}

          {showHint && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 dark:text-amber-200">
              <strong className="text-amber-400">Chemical Hint: </strong>
              {challenge.hint}
            </div>
          )}
        </div>

        {/* Action Controls & Scientific Defense */}
        <div className="space-y-3 pt-1 border-t border-border/60">
          {!isAnswerSubmitted ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedOptionId}
              className="w-full bg-primary text-primary-foreground text-xs font-bold h-9 cursor-pointer shadow-xs"
            >
              Submit Answer for Deterministic Evaluation
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Scientific Defense Card */}
              <div className="p-3.5 rounded-xl border border-primary/20 bg-background/80 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Deterministic Scientific Defense
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {challenge.scientificDefense}
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono pt-1">
                  Evidence emitted to <strong>MasteryEngine (W-EMM)</strong> for concept {challenge.conceptId}.
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-primary text-primary-foreground text-xs font-bold h-9 cursor-pointer"
              >
                {currentIdx < STAGE5_CHALLENGES.length - 1 ? (
                  <>
                    Next Challenge
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </>
                ) : (
                  <>
                    Restart Assessment
                    <RotateCcw className="h-3.5 w-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
