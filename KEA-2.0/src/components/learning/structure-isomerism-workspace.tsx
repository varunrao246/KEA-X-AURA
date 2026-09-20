"use client";

/**
 * KEA Platform — Stage 4: Structure & Isomerism Visual Learning Workspace
 *
 * Orchestrates 5 interactive molecular modules (A-E) for structural and stereochemical learning.
 * Emits empirical evidence through the deterministic MasteryEngine (W-EMM).
 * Accessible after Stage 3 mastery >= 80%.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MasteryEngine } from "@/lib/mastery/engine";
import { AssessmentEvidence } from "@/lib/mastery/types";
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from "@/lib/chemistry/organic-chemistry-demo";
import { MoleculeStructureEditor } from "@/components/chemistry/molecule-structure-editor";
import { IsomerComparison } from "@/components/chemistry/isomer-comparison";
import { IsomerBuilder } from "@/components/chemistry/isomer-builder";
import { StereochemistryVisualizer } from "@/components/chemistry/stereochemistry-visualizer";
import { IsomerChallenge } from "@/components/chemistry/isomer-challenge";
import {
  ArrowLeft,
  Layers,
  Trophy,
  Sparkles,
  GitBranch,
  Compass,
  FileCode2,
  Wrench,
  CheckCircle2,
} from "lucide-react";

interface StructureIsomerismWorkspaceProps {
  onBackToTopicPlan?: () => void;
  onStageCompleted?: (stageNumber: number, masteryScore: number) => void;
}

export function StructureIsomerismWorkspace({
  onBackToTopicPlan,
  onStageCompleted,
}: StructureIsomerismWorkspaceProps) {
  const [activeModuleId, setActiveModuleId] = React.useState<string>("mod-a");
  const [masteryEngine] = React.useState<MasteryEngine>(() => new MasteryEngine());

  const [conceptScores, setConceptScores] = React.useState<Record<string, number>>({
    "c-org-12": 0,
    "c-org-13": 0,
    "c-org-14": 0,
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

  const stage4Concepts = ORGANIC_CHEMISTRY_TOPIC_PLAN.stages[3].concepts;
  const currentTotalScore = Object.values(conceptScores).reduce((a, b) => a + b, 0);
  const averageStageMastery = Math.round(currentTotalScore / stage4Concepts.length);
  const isStageMastered = averageStageMastery >= 80;

  const handleRecordEvidence = React.useCallback(
    (
      conceptId: string,
      activityTitle: string,
      score: number,
      metadata?: Record<string, unknown>
    ) => {
      const evidence: AssessmentEvidence = {
        conceptId,
        assessmentType: "practice",
        score,
        metadata,
      };

      const result = masteryEngine.recordEvidence(evidence);
      const roundedScore = Math.round(result.newScore);

      setConceptScores((prev) => {
        const next = { ...prev, [conceptId]: roundedScore };
        const total = Object.values(next).reduce((a, b) => a + b, 0);
        const nextAvg = Math.round(total / stage4Concepts.length);
        if (nextAvg >= 80) {
          onStageCompleted?.(4, nextAvg);
        }
        return next;
      });

      setEvidenceLog((prev) => [
        {
          conceptId,
          activityTitle,
          score,
          timestamp: Date.now(),
          deltaText: `${Math.round(result.previousScore)}% → ${roundedScore}% (${result.status})`,
        },
        ...prev.slice(0, 4),
      ]);
    },
    [masteryEngine, onStageCompleted, stage4Concepts.length]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToTopicPlan}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Learning Map</span>
          </Button>

          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white font-mono text-[11px] gap-1">
              <Layers className="h-3 w-3" />
              <span>Stage 4 of 5</span>
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-foreground">
              Structure & Isomerism
            </span>
          </div>
        </div>

        {/* Live Mastery Meter */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Stage 4 Mastery
            </span>
            <span className="text-sm font-mono font-bold text-purple-400">
              {averageStageMastery}%
            </span>
          </div>
          <div className="w-24 sm:w-32">
            <Progress
              value={averageStageMastery}
              className="h-2 bg-muted/60"
            />
          </div>
          {isStageMastered && (
            <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
              <Trophy className="h-3 w-3" />
              <span>Mastered!</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Stage Goal Header */}
      <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Stage 4 — Structure & Isomerism: Connectivity & Spatial Architecture
              </h2>
              <p className="text-xs text-muted-foreground">
                Differentiate empirical formulas from covalent connectivity; discover chain, positional, and geometric cis/trans isomerism.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-xs self-start sm:self-center shrink-0">
            Prerequisite: Stage 3 (Functional Groups) Mastered
          </Badge>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: "mod-a", label: "A. Formulas vs Structure", icon: FileCode2, conceptId: "c-org-12" },
          { id: "mod-b", label: "B. Isomer Comparator", icon: GitBranch, conceptId: "c-org-12" },
          { id: "mod-c", label: "C. Isomer Builder", icon: Wrench, conceptId: "c-org-13" },
          { id: "mod-d", label: "D. Cis-Trans Stereochemistry", icon: Compass, conceptId: "c-org-14" },
          { id: "mod-e", label: "E. Diagnostic Challenge", icon: Trophy, conceptId: "c-org-13" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModuleId === tab.id;
          const score = conceptScores[tab.conceptId] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveModuleId(tab.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                  : "bg-card/70 hover:bg-muted/40 border-border/80 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-purple-400"}`} />
                <span className={`text-[10px] font-mono font-bold ${isActive ? "text-white/90" : "text-muted-foreground"}`}>
                  {score}%
                </span>
              </div>
              <span className="text-xs font-bold leading-tight line-clamp-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Module Canvas Area */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-sm">
        {activeModuleId === "mod-a" && (
          <MoleculeStructureEditor onRecordEvidence={handleRecordEvidence} />
        )}

        {activeModuleId === "mod-b" && (
          <IsomerComparison onRecordEvidence={handleRecordEvidence} />
        )}

        {activeModuleId === "mod-c" && (
          <IsomerBuilder onRecordEvidence={handleRecordEvidence} />
        )}

        {activeModuleId === "mod-d" && (
          <StereochemistryVisualizer onRecordEvidence={handleRecordEvidence} />
        )}

        {activeModuleId === "mod-e" && (
          <IsomerChallenge
            onRecordEvidence={handleRecordEvidence}
            onAllCompleted={(avgScore) => {
              handleRecordEvidence("c-org-13", "Stage 4 Synthesis Challenge Defense", avgScore);
            }}
          />
        )}
      </div>

      {/* Live Empirical Evidence Audit Log */}
      {evidenceLog.length > 0 && (
        <Card className="border border-border/60 bg-muted/20">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live W-EMM Empirical Evidence Stream
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Auditable Deterministic State
              </span>
            </div>

            <div className="space-y-1.5">
              {evidenceLog.map((log, idx) => (
                <div
                  key={`${log.timestamp}-${idx}`}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/60 border border-border/40"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-foreground truncate">
                      {log.activityTitle}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono py-0 h-4">
                      {log.conceptId}
                    </Badge>
                  </div>
                  <span className="font-mono text-purple-300 font-bold shrink-0 ml-2">
                    {log.deltaText}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
