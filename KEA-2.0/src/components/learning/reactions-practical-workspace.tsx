"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ReactionVisualizer,
} from "@/components/chemistry/reaction-visualizer";
import {
  ReactionPathway,
} from "@/components/chemistry/reaction-pathway";
import {
  ReactionBuilder,
} from "@/components/chemistry/reaction-builder";
import {
  ReactionClassifier,
} from "@/components/chemistry/reaction-classifier";
import {
  ReactionApplicationChallenge,
} from "@/components/chemistry/reaction-application-challenge";
import { MasteryEngine } from "@/lib/mastery/engine";
import { AssessmentEvidence } from "@/lib/mastery/types";
import {
  ArrowLeft,
  Zap,
  Layers,
  FlaskConical,
  CheckCircle2,
  Trophy,
  GitFork,
} from "lucide-react";

interface ReactionsPracticalWorkspaceProps {
  onBackToTopicPlan?: () => void;
  onStageCompleted?: (stageNumber: number, masteryScore: number) => void;
}

type TabType = "visualizer" | "pathway" | "builder" | "classifier" | "challenges";

export function ReactionsPracticalWorkspace({
  onBackToTopicPlan,
  onStageCompleted,
}: ReactionsPracticalWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("visualizer");
  const [masteryEngine] = React.useState<MasteryEngine>(() => new MasteryEngine());
  const [conceptScores, setConceptScores] = React.useState<Record<string, number>>({
    "c-org-15": 0,
    "c-org-16": 0,
    "c-org-17": 0,
  });
  const [evidenceLog, setEvidenceLog] = React.useState<
    Array<{
      conceptId: string;
      previousScore: number;
      newScore: number;
      status: string;
      timestamp: number;
    }>
  >([]);

  // Compute composite mastery score for Stage 5
  const scoresArray = Object.values(conceptScores);
  const compositeScore = Math.round(
    scoresArray.reduce((acc, curr) => acc + curr, 0) / (scoresArray.length || 1)
  );
  const isStage5Mastered = compositeScore >= 80;

  // Ingest empirical evidence into deterministic MasteryEngine (W-EMM)
  const handleEvidenceEmitted = React.useCallback(
    (evidence: AssessmentEvidence) => {
      const result = masteryEngine.recordEvidence(evidence);
      setConceptScores((prev) => ({
        ...prev,
        [evidence.conceptId]: result.newScore,
      }));

      // Calculate new composite score with this update
      const updatedScores = {
        ...conceptScores,
        [evidence.conceptId]: result.newScore,
      };
      const arr = Object.values(updatedScores);
      const newAvg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

      setEvidenceLog((prev) => [
        {
          conceptId: evidence.conceptId,
          previousScore: Math.round(result.previousScore),
          newScore: Math.round(result.newScore),
          status: result.status,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 6),
      ]);

      onStageCompleted?.(5, newAvg);
    },
    [masteryEngine, conceptScores, onStageCompleted]
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation & Mastery Progress Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-background/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToTopicPlan}
            className="text-xs h-8 gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Curriculum Route
          </Button>
          <div className="h-4 w-px bg-border/60 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                Stage 5 (Terminal Milestone)
              </Badge>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Reactions & Practical Application
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Bond transformations, reaction pathways, and real-world synthesis logic
            </span>
          </div>
        </div>

        {/* Live Mastery Engine Progress Indicator */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
              Stage 5 Mastery (W-EMM)
            </span>
            <span className={`text-base font-bold font-mono ${
              isStage5Mastered ? "text-emerald-500" : compositeScore > 0 ? "text-primary" : "text-muted-foreground"
            }`}>
              {compositeScore}% {isStage5Mastered ? "✓ Mastered" : "In Progress"}
            </span>
          </div>
          <div className="w-24">
            <Progress value={compositeScore} className="h-2" />
          </div>
        </div>
      </div>

      {/* FINAL ORGANIC CHEMISTRY COMPLETION STATE BANNER */}
      {isStage5Mastered && (
        <div className="p-5 rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/40 via-background to-emerald-950/30 shadow-lg shadow-emerald-500/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px] uppercase tracking-wider">
                    Capstone Achieved
                  </Badge>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Organic Chemistry Completed & Mastered!
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All 5 stages of the Organic Chemistry curriculum have been verified with $\ge 80\%$ deterministic mastery.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={onBackToTopicPlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              View Full Mastery Map
            </Button>
          </div>

          {/* 5-Stage Checklist Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/40 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-mono">Stage 1</span>
                <span className="text-xs font-bold text-foreground">Carbon Basics</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/40 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-mono">Stage 2</span>
                <span className="text-xs font-bold text-foreground">Hydrocarbons</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/40 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-mono">Stage 3</span>
                <span className="text-xs font-bold text-foreground">Functional Groups</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/40 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-mono">Stage 4</span>
                <span className="text-xs font-bold text-foreground">Isomerism</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/40 flex items-center gap-2 col-span-2 sm:col-span-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-muted-foreground block font-mono">Stage 5</span>
                <span className="text-xs font-bold text-emerald-500">Reactions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Laboratory Modules Tabs Ribbon */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/60">
        <button
          onClick={() => setActiveTab("visualizer")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "visualizer"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          1. Reaction Visualizer
        </button>

        <button
          onClick={() => setActiveTab("pathway")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pathway"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          }`}
        >
          <GitFork className="h-3.5 w-3.5" />
          2. Synthesis Pathways
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "builder"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5" />
          3. Reaction Builder Lab
        </button>

        <button
          onClick={() => setActiveTab("classifier")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "classifier"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          4. Classification Engine
        </button>

        <button
          onClick={() => setActiveTab("challenges")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "challenges"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          5. Capstone Challenges
        </button>
      </div>

      {/* Active Laboratory Module View */}
      {activeTab === "visualizer" && (
        <ReactionVisualizer
          onReactionExplored={() => {
            handleEvidenceEmitted({
              conceptId: "c-org-15",
              assessmentType: "practice",
              score: 90,
              metadata: { difficultyTier: "intermediate", isCorrect: true },
            });
          }}
        />
      )}

      {activeTab === "pathway" && (
        <ReactionPathway
          onStepSelected={() => {
            handleEvidenceEmitted({
              conceptId: "c-org-17",
              assessmentType: "practice",
              score: 95,
              metadata: { difficultyTier: "advanced", isCorrect: true },
            });
          }}
        />
      )}

      {activeTab === "builder" && (
        <ReactionBuilder
          onSuccessfulSynthesis={() => {
            handleEvidenceEmitted({
              conceptId: "c-org-15",
              assessmentType: "practice",
              score: 100,
              metadata: { difficultyTier: "intermediate", isCorrect: true },
            });
          }}
        />
      )}

      {activeTab === "classifier" && (
        <ReactionClassifier
          onClassificationCompleted={(score) => {
            handleEvidenceEmitted({
              conceptId: "c-org-16",
              assessmentType: "practice",
              score,
              metadata: { difficultyTier: "intermediate", isCorrect: score >= 80 },
            });
          }}
        />
      )}

      {activeTab === "challenges" && (
        <ReactionApplicationChallenge
          onEvidenceEmitted={handleEvidenceEmitted}
          onChallengeCompleted={(avg) => {
            handleEvidenceEmitted({
              conceptId: "c-org-17",
              assessmentType: "practice",
              score: avg,
              metadata: { difficultyTier: "advanced", isCorrect: avg >= 80 },
            });
          }}
        />
      )}

      {/* Live Deterministic W-EMM Evidence Log */}
      {evidenceLog.length > 0 && (
        <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs">
          <span className="text-[11px] font-mono uppercase font-bold text-muted-foreground block">
            Recent Deterministic W-EMM Evidence Log:
          </span>
          <div className="space-y-1">
            {evidenceLog.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded bg-background/60 border border-border/40 font-mono text-[11px]"
              >
                <span className="text-foreground">
                  Concept: <strong>{entry.conceptId}</strong> • Old: {entry.previousScore}% → New:{" "}
                  <strong className="text-emerald-500">{entry.newScore}%</strong>
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
