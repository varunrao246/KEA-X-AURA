"use client";

/**
 * KEA Platform — Stage 3: Functional Groups Visual Learning Workspace
 *
 * Orchestrates 4 interactive modules (A-D) for heteroatom & functional group learning.
 * Emits empirical evidence through the existing MasteryEngine (W-EMM).
 * Accessible after Stage 2 mastery >= 80%.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MasteryEngine } from "@/lib/mastery/engine";
import { AssessmentEvidence } from "@/lib/mastery/types";
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from "@/lib/chemistry/organic-chemistry-demo";
import { HeteroatomValenceVisualizer } from "@/components/chemistry/heteroatom-valence-visualizer";
import { FunctionalGroupExplorer } from "@/components/chemistry/functional-group-explorer";
import { AcidAmineBuilder } from "@/components/chemistry/acid-amine-builder";
import { FunctionalGroupChallenge } from "@/components/chemistry/functional-group-challenge";
import {
  ArrowLeft,
  FlaskConical,
  Trophy,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface FunctionalGroupWorkspaceProps {
  onBackToTopicPlan?: () => void;
  onStageCompleted?: (stageNumber: number, masteryScore: number) => void;
}

export function FunctionalGroupWorkspace({
  onBackToTopicPlan,
  onStageCompleted,
}: FunctionalGroupWorkspaceProps) {
  const [activeModuleId, setActiveModuleId] = React.useState<string>("mod-a");
  const [masteryEngine] = React.useState<MasteryEngine>(() => new MasteryEngine());

  const [conceptScores, setConceptScores] = React.useState<Record<string, number>>({
    "c-org-9": 0,
    "c-org-10": 0,
    "c-org-11": 0,
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

  const stage3Concepts = ORGANIC_CHEMISTRY_TOPIC_PLAN.stages[2].concepts;
  const currentTotalScore = Object.values(conceptScores).reduce((a, b) => a + b, 0);
  const averageStageMastery = Math.round(currentTotalScore / stage3Concepts.length);
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
        const nextAvg = Math.round(total / stage3Concepts.length);
        if (nextAvg >= 80) {
          onStageCompleted?.(3, nextAvg);
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
    [masteryEngine, onStageCompleted, stage3Concepts.length]
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

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] font-mono">
                Stage 3 Interactive Lab
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Heteroatoms & Chemical Signatures
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-cyan-400" />
              <span>Functional Groups</span>
            </h2>
          </div>
        </div>

        {/* Real-Time W-EMM Mastery Score Gauge */}
        <div className="flex items-center gap-4 bg-muted/40 border border-border/80 px-4 py-2.5 rounded-xl self-start sm:self-center">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="text-muted-foreground">Stage 3 Mastery (W-EMM)</span>
              <span
                className={`font-bold ${
                  isStageMastered ? "text-cyan-400" : "text-foreground"
                }`}
              >
                {averageStageMastery}% / 80%
              </span>
            </div>
            <Progress
              value={Math.min(100, averageStageMastery)}
              className="w-40 sm:w-48 h-2"
            />
          </div>

          {isStageMastered && (
            <Badge className="bg-cyan-500 text-black font-bold text-xs gap-1 animate-pulse">
              <Trophy className="h-3.5 w-3.5" />
              Mastered
            </Badge>
          )}
        </div>
      </div>

      {/* Module Selector Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant={activeModuleId === "mod-a" ? "default" : "outline"}
          onClick={() => setActiveModuleId("mod-a")}
          className={`justify-start text-xs h-auto py-2.5 px-3 cursor-pointer ${
            activeModuleId === "mod-a" ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold" : ""
          }`}
        >
          <div className="text-left space-y-0.5">
            <span className="text-[10px] opacity-75 font-mono block">Module A</span>
            <span className="font-semibold block truncate">Heteroatom Valence</span>
          </div>
        </Button>

        <Button
          variant={activeModuleId === "mod-b" ? "default" : "outline"}
          onClick={() => setActiveModuleId("mod-b")}
          className={`justify-start text-xs h-auto py-2.5 px-3 cursor-pointer ${
            activeModuleId === "mod-b" ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold" : ""
          }`}
        >
          <div className="text-left space-y-0.5">
            <span className="text-[10px] opacity-75 font-mono block">Module B</span>
            <span className="font-semibold block truncate">Alcohols & Carbonyls</span>
          </div>
        </Button>

        <Button
          variant={activeModuleId === "mod-c" ? "default" : "outline"}
          onClick={() => setActiveModuleId("mod-c")}
          className={`justify-start text-xs h-auto py-2.5 px-3 cursor-pointer ${
            activeModuleId === "mod-c" ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold" : ""
          }`}
        >
          <div className="text-left space-y-0.5">
            <span className="text-[10px] opacity-75 font-mono block">Module C</span>
            <span className="font-semibold block truncate">Acids & Amines</span>
          </div>
        </Button>

        <Button
          variant={activeModuleId === "mod-d" ? "default" : "outline"}
          onClick={() => setActiveModuleId("mod-d")}
          className={`justify-start text-xs h-auto py-2.5 px-3 cursor-pointer ${
            activeModuleId === "mod-d" ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold" : ""
          }`}
        >
          <div className="text-left space-y-0.5">
            <span className="text-[10px] opacity-75 font-mono block">Module D</span>
            <span className="font-semibold block truncate">Group Challenges</span>
          </div>
        </Button>
      </div>

      {/* Concept Competencies Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stage3Concepts.map((concept) => {
          const score = conceptScores[concept.id] || 0;
          const isMastered = score >= 80;
          return (
            <div
              key={concept.id}
              className={`p-3 rounded-xl border transition-all ${
                isMastered
                  ? "border-cyan-500/40 bg-cyan-950/20"
                  : "border-border/70 bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-foreground truncate">{concept.name}</span>
                <span className="font-mono text-cyan-400 font-bold ml-2">{score}%</span>
              </div>
              <Progress value={Math.min(100, score)} className="h-1.5" />
            </div>
          );
        })}
      </div>

      {/* Latest Evidence Audit Pill */}
      {evidenceLog.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 animate-in fade-in">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>W-EMM Evidence Recorded:</strong> {evidenceLog[0].activityTitle} — {evidenceLog[0].deltaText}
          </span>
        </div>
      )}

      {/* Active Module Container */}
      <Card className="border-border/80 bg-card/70 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {activeModuleId === "mod-a" && (
            <HeteroatomValenceVisualizer
              onEvidence={(score) =>
                handleRecordEvidence(
                  "c-org-9",
                  "Heteroatom Valence & Lone Pair Inspection",
                  score,
                  "practice"
                )
              }
            />
          )}

          {activeModuleId === "mod-b" && (
            <FunctionalGroupExplorer
              onEvidence={(score) =>
                handleRecordEvidence(
                  "c-org-10",
                  "Alcohols & Carbonyl Compounds Explorer",
                  score,
                  "practice"
                )
              }
            />
          )}

          {activeModuleId === "mod-c" && (
            <AcidAmineBuilder
              onEvidence={(score) =>
                handleRecordEvidence(
                  "c-org-11",
                  "Carboxylic Acid & Amine Protonation",
                  score,
                  "practice"
                )
              }
            />
          )}

          {activeModuleId === "mod-d" && (
            <FunctionalGroupChallenge
              onEvidence={(score) => {
                handleRecordEvidence(
                  "c-org-9",
                  "Functional Group Identification Challenge",
                  score,
                  "practice"
                );
                handleRecordEvidence(
                  "c-org-10",
                  "Carbonyl Distinction Challenge",
                  score,
                  "practice"
                );
                handleRecordEvidence(
                  "c-org-11",
                  "Heteroatom Center Identification",
                  score,
                  "practice"
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Audit & Mastery State Footer Banner */}
      {isStageMastered && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/40">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Stage 3 Mastery Attained! ({averageStageMastery}% Score)
              </h4>
              <p className="text-xs text-muted-foreground">
                The KEA Deterministic Mastery Engine has validated your empirical evidence. Stage 4 (Structure & Isomerism) is now gated as unlockable in the Knowledge Graph DAG.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onBackToTopicPlan}
            className="cursor-pointer font-bold bg-cyan-600 hover:bg-cyan-700 text-white shrink-0"
          >
            <span>Return to Learning Map</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
