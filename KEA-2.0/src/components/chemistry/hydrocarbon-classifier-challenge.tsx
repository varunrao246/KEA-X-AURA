"use client";

/**
 * Module E — "What Did I Build?" — Hydrocarbon Classification Challenge
 *
 * Visual classification quiz. Shows one molecule, asks alkane/alkene/alkyne.
 * All validation is deterministic — no AI.
 * Correct: visual success + evidence emitted.
 * Incorrect: highlight bond, visual hint, allow retry.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Beaker,
  ChevronRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import {
  CLASSIFICATION_CHALLENGES,
  ClassificationChallenge,
  HydrocarbonClass,
} from "@/lib/chemistry/hydrocarbon-classifier";
import { ChemistryLearningEvidence } from "@/lib/chemistry/types";
import { AssessmentEvidence } from "@/lib/mastery/types";
import { MasteryEngine } from "@/lib/mastery/engine";

interface HydrocarbonClassifierChallengeProps {
  onEvidenceProduced?: (evidence: ChemistryLearningEvidence) => void;
  onMasteryEvidence?: (e: AssessmentEvidence) => void;
}

// Molecule structural SVG for a challenge
function ChallengeMoleculeSVG({
  challenge,
  highlightBond,
}: {
  challenge: ClassificationChallenge;
  highlightBond: boolean;
}) {
  const spacing = 90;
  const n = challenge.carbonCount;
  const cy = 55;
  const r = 18;
  const cx = Array.from({ length: n }, (_, i) => 30 + r + i * spacing);
  const totalW = Math.max(200, n * spacing + 60);

  const bondColors: string[] = challenge.bondPattern.map((order, i) => {
    if (i === 0 && highlightBond && order > 1) return "#f59e0b";
    if (order === 2) return "#f59e0b";
    if (order === 3) return "#06b6d4";
    return "#10b981";
  });

  return (
    <svg
      viewBox={`0 0 ${totalW} 130`}
      className="w-full transition-all duration-300"
      role="img"
      aria-label={`Molecule challenge: ${challenge.structureDescription}`}
    >
      {/* C-C bonds */}
      {challenge.bondPattern.map((order, i) => {
        const x1 = cx[i] + r;
        const x2 = cx[i + 1] - r;
        const col = bondColors[i];
        return (
          <g key={`bond-${i}`}>
            {order === 1 && (
              <line x1={x1} y1={cy} x2={x2} y2={cy} stroke={col} strokeWidth="2.5" />
            )}
            {order === 2 && (
              <>
                <line x1={x1} y1={cy - 4.5} x2={x2} y2={cy - 4.5} stroke={col} strokeWidth="2.5" />
                <line x1={x1} y1={cy + 4.5} x2={x2} y2={cy + 4.5} stroke={col} strokeWidth="2.5" />
              </>
            )}
            {order === 3 && (
              <>
                <line x1={x1} y1={cy - 5.5} x2={x2} y2={cy - 5.5} stroke={col} strokeWidth="2.5" />
                <line x1={x1} y1={cy} x2={x2} y2={cy} stroke={col} strokeWidth="2.5" />
                <line x1={x1} y1={cy + 5.5} x2={x2} y2={cy + 5.5} stroke={col} strokeWidth="2.5" />
              </>
            )}
            {/* Bond label */}
            <text
              x={(cx[i] + cx[i + 1]) / 2}
              y={cy + r + 22}
              textAnchor="middle"
              fontSize="9"
              fill={col}
              fontWeight="bold"
            >
              {order === 1 && "C—C"}
              {order === 2 && "C=C"}
              {order === 3 && "C≡C"}
            </text>
          </g>
        );
      })}

      {/* Carbon atoms */}
      {cx.map((x, i) => {
        const adjBonds = challenge.bondPattern.filter(
          (_, bi) => bi === i || bi === i - 1
        );
        const hasHighBond = adjBonds.some((b) => b > 1);
        const col = hasHighBond
          ? challenge.bondPattern[0] === 3
            ? "#06b6d4"
            : "#f59e0b"
          : "#10b981";
        return (
          <g key={`ca-${i}`}>
            <circle
              cx={x}
              cy={cy}
              r={r}
              fill="#0f172a"
              stroke={col}
              strokeWidth="2"
            />
            <text
              x={x}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="white"
              fontWeight="bold"
            >
              C
            </text>
          </g>
        );
      })}

      {/* Structure text */}
      <text
        x={totalW / 2}
        y={cy + r + 42}
        textAnchor="middle"
        fontSize="11"
        fill="#6b7280"
      >
        {challenge.structureDescription}
      </text>
    </svg>
  );
}

const CLASS_LABELS: Record<HydrocarbonClass, { label: string; color: string; border: string }> = {
  alkane: { label: "ALKANE", color: "text-emerald-400", border: "border-emerald-500/50" },
  alkene: { label: "ALKENE", color: "text-amber-400", border: "border-amber-500/50" },
  alkyne: { label: "ALKYNE", color: "text-cyan-400", border: "border-cyan-500/50" },
  unknown: { label: "UNKNOWN", color: "text-muted-foreground", border: "border-border" },
};

export function HydrocarbonClassifierChallenge({
  onEvidenceProduced,
  onMasteryEvidence,
}: HydrocarbonClassifierChallengeProps) {
  const challenges = React.useMemo(
    () => CLASSIFICATION_CHALLENGES.slice(0, 5), // 5 rounds
    []
  );

  const [masteryEngine] = React.useState(() => new MasteryEngine());
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<HydrocarbonClass | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [totalAttempts, setTotalAttempts] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const challenge = challenges[currentIdx];
  const isCorrect = selectedAnswer === challenge.correctClass;

  const handleSubmit = () => {
    if (!selectedAnswer || isSubmitted) return;
    setIsSubmitted(true);
    setTotalAttempts((p) => p + 1);

    const score = isCorrect ? 100 : 0;
    if (isCorrect) setCorrectCount((p) => p + 1);

    // Emit mastery evidence via existing MasteryEngine
    const evidence: AssessmentEvidence = {
      conceptId: "c-org-8",
      assessmentType: "practice",
      score,
    };
    masteryEngine.recordEvidence(evidence);
    onMasteryEvidence?.(evidence);
  };

  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= challenges.length) {
      // Emit final chemistry evidence
      const finalScore = Math.round((correctCount / challenges.length) * 100);
      onEvidenceProduced?.({
        conceptId: "c-org-8",
        activityId: "hydrocarbon-classifier-challenge",
        evidenceType: "practice",
        score: finalScore,
        attempts: totalAttempts + 1,
        timestamp: Date.now(),
        metadata: { correct: correctCount, total: challenges.length },
      });
      setIsCompleted(true);
    } else {
      setCurrentIdx(nextIdx);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setCorrectCount(0);
    setTotalAttempts(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const pct = Math.round((correctCount / challenges.length) * 100);
    return (
      <Card className="border-emerald-500/30 bg-emerald-950/10">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Challenge Complete!
          </h3>
          <div className="text-3xl font-bold font-mono text-emerald-400">{pct}%</div>
          <p className="text-sm text-muted-foreground">
            {correctCount}/{challenges.length} correct classifications
          </p>
          <p className="text-xs text-muted-foreground">
            Evidence recorded with the W-EMM mastery engine for concept c-org-8.
          </p>
          <Button
            size="sm"
            onClick={handleReset}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-950/10">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Beaker className="h-4 w-4 text-amber-400" />
            Module E — What Did I Build?
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              {currentIdx + 1}/{challenges.length}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400">
              {correctCount} correct
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Look at the molecular structure and classify the hydrocarbon type.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Molecule display */}
        <div className="p-4 rounded-xl border border-border/60 bg-card/60 overflow-x-auto">
          <ChallengeMoleculeSVG
            challenge={challenge}
            highlightBond={isSubmitted && !isCorrect}
          />
        </div>

        {/* Question */}
        <div className="text-sm font-semibold text-foreground text-center">
          What type of hydrocarbon is this?
        </div>

        {/* Answer choices */}
        <div className="grid grid-cols-3 gap-2">
          {(["alkane", "alkene", "alkyne"] as HydrocarbonClass[]).map((cls) => {
            const meta = CLASS_LABELS[cls];
            const isSelected = selectedAnswer === cls;
            const isThisCorrect = cls === challenge.correctClass;
            let borderCls = "border-border/60 text-muted-foreground hover:border-border";
            if (isSubmitted) {
              if (isThisCorrect)
                borderCls = "border-emerald-500/60 bg-emerald-950/20 text-emerald-400";
              else if (isSelected && !isThisCorrect)
                borderCls = "border-destructive/60 bg-destructive/10 text-destructive";
            } else if (isSelected) {
              borderCls = `${meta.border} ${meta.color} bg-card shadow-sm`;
            }
            return (
              <button
                key={cls}
                onClick={() => !isSubmitted && setSelectedAnswer(cls)}
                disabled={isSubmitted}
                aria-pressed={isSelected}
                className={`p-3 rounded-xl border text-center transition-all text-xs font-bold uppercase tracking-wide ${borderCls}`}
              >
                {meta.label}
                {isSubmitted && isThisCorrect && (
                  <CheckCircle2 className="h-3.5 w-3.5 inline-block ml-1" />
                )}
                {isSubmitted && isSelected && !isThisCorrect && (
                  <XCircle className="h-3.5 w-3.5 inline-block ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isSubmitted && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${
              isCorrect
                ? "border-emerald-500/40 bg-emerald-950/20"
                : "border-amber-500/40 bg-amber-950/20"
            }`}
          >
            <div
              className={`flex items-center gap-2 font-semibold ${
                isCorrect ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {isCorrect
                ? `Correct! This is ${challenge.label}.`
                : `Not quite. This is ${challenge.label} (${challenge.correctClass.toUpperCase()}).`}
            </div>
            <p className="text-foreground/80">{challenge.explanation}</p>
            <p className="text-muted-foreground font-mono">{challenge.formula}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="h-8 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {currentIdx + 1 < challenges.length ? "Next Molecule" : "See Results"}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
