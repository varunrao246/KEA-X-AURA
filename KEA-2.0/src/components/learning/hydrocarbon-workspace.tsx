"use client";

/**
 * KEA Platform — Stage 2: Hydrocarbon Foundations Visual Learning Workspace
 *
 * Orchestrates 5 interactive modules (A-E) for hydrocarbon learning.
 * Emits evidence through existing MasteryEngine (W-EMM).
 * Stage 2 is only accessible after Stage 1 mastery >= 80%.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MasteryEngine } from "@/lib/mastery/engine";
import { AssessmentEvidence } from "@/lib/mastery/types";
import { ChemistryLearningEvidence } from "@/lib/chemistry/types";
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from "@/lib/chemistry/organic-chemistry-demo";
import { SaturationVisualizer } from "@/components/chemistry/saturation-visualizer";
import { AlkaneBuilder } from "@/components/chemistry/alkane-builder";
import { UnsaturationBuilder } from "@/components/chemistry/unsaturation-builder";
import { HydrocarbonClassifierChallenge } from "@/components/chemistry/hydrocarbon-classifier-challenge";
import {
  ArrowLeft,
  Flame,
  Zap,
  Link2,
  FlaskConical,
  Beaker,
  Trophy,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
} from "lucide-react";

interface HydrocarbonWorkspaceProps {
  onBackToTopicPlan?: () => void;
  onStageCompleted?: (stageNumber: number, masteryScore: number) => void;
}



export function HydrocarbonWorkspace({
  onBackToTopicPlan,
  onStageCompleted,
}: HydrocarbonWorkspaceProps) {
  const [activeModuleId, setActiveModuleId] = React.useState<string>("mod-a");

  const [masteryEngine] = React.useState<MasteryEngine>(() => new MasteryEngine());

  const [conceptScores, setConceptScores] = React.useState<Record<string, number>>({
    "c-org-6": 0,
    "c-org-7": 0,
    "c-org-8": 0,
  });

  const [evidenceLog, setEvidenceLog] = React.useState<
    Array<{
      conceptId: string;
      activityTitle: string;
      score: number;
      timestamp: number;
      deltaText: string;
    }>
  >([]);

  const stage2Concepts = ORGANIC_CHEMISTRY_TOPIC_PLAN.stages[1].concepts;
  const currentTotalScore = Object.values(conceptScores).reduce((a, b) => a + b, 0);
  const averageStageMastery = Math.round(currentTotalScore / stage2Concepts.length);
  const isStageMastered = averageStageMastery >= 80;

  const handleRecordEvidence = React.useCallback(
    (
      conceptId: string,
      activityTitle: string,
      score: number,
      assessmentType: "practice" | "written" | "oral" = "practice",
      metadata?: Record<string, unknown>
    ) => {
      const evidence: AssessmentEvidence = {
        conceptId,
        assessmentType,
        score,
        metadata,
      };

      const result = masteryEngine.recordEvidence(evidence);
      const roundedScore = Math.round(result.newScore);

      setConceptScores((prev) => {
        const next = { ...prev, [conceptId]: roundedScore };
        const total = Object.values(next).reduce((a, b) => a + b, 0);
        const nextAvg = Math.round(total / stage2Concepts.length);
        if (nextAvg >= 80) {
          onStageCompleted?.(2, nextAvg);
        }
        return next;
      });

      setEvidenceLog((prev) => [
        {
          conceptId,
          activityTitle,
          score,
          timestamp: Date.now(),
          deltaText: `Score updated to ${roundedScore}% (${result.status}) via W-EMM`,
        },
        ...prev.slice(0, 4),
      ]);
    },
    [masteryEngine, onStageCompleted, stage2Concepts.length]
  );

  // Bridge from ChemistryLearningEvidence to handleRecordEvidence
  const handleChemEvidence = React.useCallback(
    (evidence: ChemistryLearningEvidence, activityTitle: string) => {
      handleRecordEvidence(
        evidence.conceptId,
        activityTitle,
        evidence.score,
        "practice",
        evidence.metadata
      );
    },
    [handleRecordEvidence]
  );

  const modules = [
    {
      id: "mod-a",
      label: "Sat. vs Unsat.",
      icon: <Zap className="h-4 w-4" />,
      conceptId: "c-org-6",
    },
    {
      id: "mod-b",
      label: "Alkane Builder",
      icon: <Link2 className="h-4 w-4" />,
      conceptId: "c-org-6",
    },
    {
      id: "mod-c",
      label: "Alkene Builder",
      icon: <FlaskConical className="h-4 w-4" />,
      conceptId: "c-org-7",
    },
    {
      id: "mod-d",
      label: "Alkyne Builder",
      icon: <FlaskConical className="h-4 w-4" />,
      conceptId: "c-org-7",
    },
    {
      id: "mod-e",
      label: "Classify It!",
      icon: <Beaker className="h-4 w-4" />,
      conceptId: "c-org-8",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTopicPlan}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Topic Overview
            </Button>
            <span className="text-muted-foreground/60 text-xs">•</span>
            <Badge variant="outline" className="font-mono text-[11px] border-amber-500/40 text-amber-400">
              Stage 2 of 5
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              Unlocked
            </Badge>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-400" />
            Stage 2: Hydrocarbon Foundations
          </h2>
          <p className="text-xs text-muted-foreground">
            See how carbon chains become different kinds of hydrocarbons — alkanes, alkenes, and alkynes.
          </p>
        </div>

        {/* Stage Mastery Metric */}
        <div className="w-full sm:w-auto p-3.5 rounded-xl border border-border/80 bg-card/70 flex flex-col items-start sm:items-end gap-1.5 min-w-[220px]">
          <div className="w-full flex items-center justify-between gap-4 text-xs font-mono">
            <span className="text-muted-foreground">Stage 2 Mastery (W-EMM)</span>
            <span
              className={`font-bold text-sm ${
                isStageMastered ? "text-amber-400" : "text-foreground"
              }`}
            >
              {averageStageMastery}% / 80%
            </span>
          </div>

          <div className="w-full">
            <Progress value={averageStageMastery} className="h-2" />
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Deterministic Threshold</span>
            <span>{isStageMastered ? "Stage 3 Gate Satisfied" : "Unlocks Stage 3"}</span>
          </div>
        </div>
      </div>

      {/* Stage Mastery Unlocked Banner */}
      {isStageMastered && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-amber-400">
                Stage 2 Prerequisite Satisfied ({averageStageMastery}% Mastery)!
              </h4>
              <p className="text-xs text-foreground/90">
                The KEA Deterministic Mastery Engine has validated your empirical evidence. Stage 3 (Functional Groups) is now gated as unlockable in the Knowledge Graph DAG.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onBackToTopicPlan}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8 gap-1.5 shrink-0"
          >
            View Route
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Concept score cards */}
      <div className="grid grid-cols-3 gap-2">
        {stage2Concepts.map((concept) => {
          const score = conceptScores[concept.id] || 0;
          const isMastered = score >= 80;
          return (
            <div
              key={concept.id}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isMastered
                  ? "border-amber-500/50 bg-amber-950/15"
                  : score > 0
                  ? "border-border bg-card"
                  : "border-border/50 bg-card/40"
              }`}
            >
              <div className={`text-xs font-mono font-bold mb-0.5 ${isMastered ? "text-amber-400" : "text-foreground"}`}>
                {score}%
              </div>
              <div className="text-[10px] text-muted-foreground line-clamp-2">
                {concept.name.split("&")[0].split(":")[0].trim()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {modules.map((mod) => {
          const isSelected = activeModuleId === mod.id;
          const score = conceptScores[mod.conceptId] || 0;

          return (
            <button
              key={mod.id}
              onClick={() => setActiveModuleId(mod.id)}
              aria-pressed={isSelected}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-amber-500/70 bg-amber-950/20 shadow-sm ring-1 ring-amber-500/40"
                  : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
              }`}
            >
              <div className="w-full flex items-center justify-between mb-1.5">
                <span
                  className={`p-1.5 rounded-md ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {mod.icon}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    score >= 80
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : score > 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/40 text-muted-foreground/60"
                  }`}
                >
                  {score > 0 ? `${score}%` : "--"}
                </span>
              </div>
              <span className="text-xs font-semibold text-foreground line-clamp-1">
                {mod.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="space-y-4">
        {activeModuleId === "mod-a" && (
          <SaturationVisualizer
            onEvidenceProduced={(ev) =>
              handleChemEvidence(ev, "Saturated vs Unsaturated Explorer")
            }
          />
        )}

        {activeModuleId === "mod-b" && (
          <AlkaneBuilder
            onEvidenceProduced={(ev) =>
              handleChemEvidence(ev, "Alkane Chain Builder")
            }
          />
        )}

        {activeModuleId === "mod-c" && (
          <UnsaturationBuilder
            mode="alkene"
            onEvidenceProduced={(ev) =>
              handleChemEvidence(ev, "Alkene Builder (C=C)")
            }
          />
        )}

        {activeModuleId === "mod-d" && (
          <UnsaturationBuilder
            mode="alkyne"
            onEvidenceProduced={(ev) =>
              handleChemEvidence(ev, "Alkyne Builder (C≡C)")
            }
          />
        )}

        {activeModuleId === "mod-e" && (
          <HydrocarbonClassifierChallenge
            onEvidenceProduced={(ev) =>
              handleChemEvidence(ev, "Hydrocarbon Classification Challenge")
            }
            onMasteryEvidence={(e) =>
              handleRecordEvidence(e.conceptId, "Classification", e.score, e.assessmentType as "practice" | "written" | "oral")
            }
          />
        )}
      </div>

      {/* Learning objectives reference */}
      <Card className="border-border/60 bg-muted/10">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            Stage 2 — Key Concepts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stage2Concepts.map((concept) => (
              <div key={concept.id} className="space-y-1">
                <div className="text-xs font-semibold text-foreground">{concept.name}</div>
                <div className="text-[11px] text-muted-foreground">{concept.summary}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Evidence Audit Trail */}
      <Card className="border-border/60 bg-muted/15">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <BrainCircuit className="h-3.5 w-3.5 text-primary" />
              Live Evidence Dispatch & W-EMM Audit Trail
            </CardTitle>
            <span className="text-[11px] font-mono text-muted-foreground">
              Deterministic Math • Zero LLM Score Hallucination
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2">
          {evidenceLog.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2 text-center">
              Interact with the hydrocarbon modules above to produce verified learning evidence.
            </div>
          ) : (
            <div className="space-y-1.5">
              {evidenceLog.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-background/60 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-foreground">{log.activityTitle}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {log.conceptId}
                    </Badge>
                  </div>
                  <span className="font-mono text-amber-400 text-[11px]">{log.deltaText}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
