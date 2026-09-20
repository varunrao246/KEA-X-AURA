"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { generateTopicCurriculum } from "@/lib/topic-curriculum/sample-topics";
import { TopicEntryHeader } from "@/components/entry/topic-entry-header";
import { TopicHero } from "@/components/entry/topic-hero";
import { TopicAnalysisTransition } from "@/components/entry/topic-analysis-transition";
import { PrerequisiteDiagnosticView } from "@/components/entry/prerequisite-diagnostic-view";
import { TopicGraphPreview } from "@/components/entry/topic-graph-preview";

// Workspace components
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { PrimaryActionCard } from "@/components/dashboard/primary-action-card";
import { LearningPathTracker } from "@/components/dashboard/learning-path-tracker";
import { FacilitatorPreviewCard } from "@/components/dashboard/facilitator-preview-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type FlowStep = "entry" | "analyzing" | "diagnostic" | "plan_preview" | "workspace";

export function TopicEntryExperience() {
  const [step, setStep] = React.useState<FlowStep>("entry");
  const [activeTopic, setActiveTopic] = React.useState<string>("");
  const [curriculumPlan, setCurriculumPlan] = React.useState<TopicCurriculumPlan | null>(null);
  const [diagnosticScore, setDiagnosticScore] = React.useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const handleStartTopic = (topic: string) => {
    setActiveTopic(topic);
    const plan = generateTopicCurriculum(topic);
    setCurriculumPlan(plan);
    setStep("analyzing");
  };

  const handleAnalysisComplete = () => {
    setStep("diagnostic");
  };

  const handleDiagnosticComplete = (userAnswers: Record<string, string>) => {
    if (!curriculumPlan) return;

    let correctCount = 0;
    const total = curriculumPlan.diagnosticQuestions.length;

    curriculumPlan.diagnosticQuestions.forEach((q) => {
      const selectedOptId = userAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedOptId && correctOpt && selectedOptId === correctOpt.id) {
        correctCount += 1;
      }
    });

    setDiagnosticScore({ correct: correctCount, total });
    setStep("plan_preview");
  };

  const handleReset = () => {
    setStep("entry");
    setActiveTopic("");
    setCurriculumPlan(null);
    setDiagnosticScore({ correct: 0, total: 0 });
  };

  // 1. Workspace View (If user clicks Enter Learning Workspace)
  if (step === "workspace" && curriculumPlan) {
    return (
      <AppShell>
        <div className="space-y-6 sm:space-y-8">
          {/* Top Banner to switch back to Topic Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-bold">
                Active Topic
              </Badge>
              <span className="text-sm font-bold text-foreground">
                {curriculumPlan.topic}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • Stage 1 Unlocked
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 cursor-pointer h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Learning Goal</span>
            </Button>
          </div>

          {/* Student Greeting & Context Banner */}
          <WelcomeBanner />

          {/* Top Metric Cards */}
          <MetricsOverview />

          {/* Primary Immediate Learning Action */}
          <PrimaryActionCard />

          {/* Complete 7-Node Prerequisite Knowledge Graph */}
          <LearningPathTracker />

          {/* Human-in-the-Loop Facilitator Preview */}
          <FacilitatorPreviewCard />
        </div>
      </AppShell>
    );
  }

  // 2. Entry & Diagnostic Flow
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <TopicEntryHeader
        activeTopic={activeTopic || null}
        onReset={handleReset}
      />

      <main className="flex-1 flex flex-col justify-center">
        {step === "entry" && (
          <TopicHero onGeneratePath={handleStartTopic} />
        )}

        {step === "analyzing" && (
          <TopicAnalysisTransition
            topic={activeTopic}
            onComplete={handleAnalysisComplete}
          />
        )}

        {step === "diagnostic" && curriculumPlan && (
          <PrerequisiteDiagnosticView
            plan={curriculumPlan}
            onComplete={handleDiagnosticComplete}
            onBack={handleReset}
          />
        )}

        {step === "plan_preview" && curriculumPlan && (
          <TopicGraphPreview
            plan={curriculumPlan}
            diagnosticScore={diagnosticScore}
            onEnterWorkspace={() => setStep("workspace")}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-4 px-6 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>KEA • Adaptive Learning & Real-Time Intervention Platform</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80">
            Topic-to-Mastery Pipeline • Prerequisite Gating
          </div>
        </div>
      </footer>
    </div>
  );
}
