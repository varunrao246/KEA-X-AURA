"use client";

import * as React from "react";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { TopicEntryHeader, DemoPersona } from "@/components/entry/topic-entry-header";
import { TopicLandingHero } from "@/components/entry/topic-landing-hero";
import { TopicAnalyzingView } from "@/components/entry/topic-analyzing-view";
import { LearningMap } from "@/components/entry/learning-map";
import { StageCardsList } from "@/components/entry/stage-cards-list";
import { TopicResourcesSection } from "@/components/resources/topic-resources-section";

import { DiagnosticCalibrationModal } from "@/components/entry/diagnostic-calibration-modal";
import { DiagnosticCalibrationResult } from "@/lib/diagnostic/types";
import { StudentLearningCanvas } from "@/components/learning/student-learning-canvas";
import { FacilitatorCockpit } from "@/components/facilitator/facilitator-cockpit";
import { OrganicChemistryMap } from "@/components/chemistry/organic-chemistry-map";
import { VisualLearningWorkspace } from "@/components/learning/visual-learning-workspace";
import { HydrocarbonWorkspace } from "@/components/learning/hydrocarbon-workspace";
import { FunctionalGroupWorkspace } from "@/components/learning/functional-group-workspace";
import { StructureIsomerismWorkspace } from "@/components/learning/structure-isomerism-workspace";
import { ReactionsPracticalWorkspace } from "@/components/learning/reactions-practical-workspace";
import { AIRuntimeStatus } from "@/components/ai/ai-runtime-status";
import { AILearningPanel } from "@/components/ai/ai-learning-panel";
import { AIMockTest } from "@/components/assessment/ai-mock-test";
import { AIMockInterview } from "@/components/interview/ai-mock-interview";
import { ExecutionMetadata, ProviderType } from "@/lib/ai/ai-provider";
import { calculateEMMUpdate } from "@/lib/mastery/engine";

// shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Map,
  Compass,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ListChecks,
  PlayCircle,
  Users,
  X,
  Atom,
  Flame,
  FlaskConical,
  Layers,
  Beaker,
} from "lucide-react";

export type TopicExperienceState =
  | "NO_TOPIC"
  | "TOPIC_SUBMITTED"
  | "ANALYZING"
  | "PLAN_READY";

export function TopicExperienceShell() {
  const [state, setState] = React.useState<TopicExperienceState>("NO_TOPIC");
  const [topic, setTopic] = React.useState<string>("");
  const [plan, setPlan] = React.useState<TopicCurriculumPlan | null>(null);
  const [, setProvider] = React.useState<ProviderType>("groq");
  const [providerNotice, setProviderNotice] = React.useState<string | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = React.useState<number>(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = React.useState<boolean>(false);
  const [calibration, setCalibration] = React.useState<DiagnosticCalibrationResult | null>(null);
  const [activeCanvasConcept, setActiveCanvasConcept] = React.useState<{ id: string; title: string } | null>(null);
  const [isFacilitatorOpen, setIsFacilitatorOpen] = React.useState<boolean>(false);
  const [pendingInterventionsCount, setPendingInterventionsCount] = React.useState<number>(0);
  const [activePersona, setActivePersona] = React.useState<DemoPersona>("lin");
  const [isOfflineMode, setIsOfflineMode] = React.useState<boolean>(false);
  const [chemistryViewMode, setChemistryViewMode] = React.useState<"lab" | "map" | "stage2" | "stage3" | "stage4" | "stage5">("lab");
  const [stage1Mastery, setStage1Mastery] = React.useState<number>(0);
  const [stage2Mastery, setStage2Mastery] = React.useState<number>(0);
  const [stage3Mastery, setStage3Mastery] = React.useState<number>(0);
  const [stage4Mastery, setStage4Mastery] = React.useState<number>(0);
  const [stage5Mastery, setStage5Mastery] = React.useState<number>(0);
  const [aiViewMode, setAiViewMode] = React.useState<"none" | "practice" | "mock_test" | "interview">("none");
  const [activeAIMetadata, setActiveAIMetadata] = React.useState<ExecutionMetadata | null>(null);
  const [recentMistakes, setRecentMistakes] = React.useState<string[]>([]);
  const [selectedConcept, setSelectedConcept] = React.useState<{ id: string; title: string; summary?: string } | null>(null);

  const handleMetadataUpdate = React.useCallback((meta: ExecutionMetadata) => {
    setActiveAIMetadata(meta);
  }, []);

  const activeAIConcept = React.useMemo(() => {
    if (selectedConcept) return selectedConcept;
    const current = plan?.stages[selectedStageIndex]?.concepts[0] || plan?.stages[0]?.concepts[0];
    const safeTopicSlug = plan?.topic ? plan.topic.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "foundations";
    return current
      ? { id: current.id, title: current.name, summary: current.summary }
      : { id: `concept_${safeTopicSlug}_core`, title: `${plan?.topic || "Core"} Fundamentals` };
  }, [selectedConcept, plan, selectedStageIndex]);

  const targetConcepts = React.useMemo(() => {
    return plan?.stages.flatMap((s) => s.concepts).map((c) => ({ id: c.id, title: c.name })) || [];
  }, [plan]);

  const handleEvidenceRecorded = (
    evidenceItems: Array<{ conceptId: string; score: number }>
  ) => {
    for (const item of evidenceItems) {
      const stageIdx = selectedStageIndex;
      if (stageIdx === 0 || item.conceptId.includes("carbon") || item.conceptId.includes("foundations") || item.conceptId.includes("c1") || item.conceptId.includes("q1")) {
        setStage1Mastery((prev) => calculateEMMUpdate(prev, item.score, 0.4));
      } else if (stageIdx === 1 || item.conceptId.includes("hydrocarbon") || item.conceptId.includes("alk") || item.conceptId.includes("c2") || item.conceptId.includes("q2")) {
        setStage2Mastery((prev) => calculateEMMUpdate(prev, item.score, 0.4));
      } else if (stageIdx === 2 || item.conceptId.includes("functional") || item.conceptId.includes("alcohol") || item.conceptId.includes("c3") || item.conceptId.includes("q3")) {
        setStage3Mastery((prev) => calculateEMMUpdate(prev, item.score, 0.4));
      } else if (stageIdx === 3 || item.conceptId.includes("isomer") || item.conceptId.includes("c4") || item.conceptId.includes("q4")) {
        setStage4Mastery((prev) => calculateEMMUpdate(prev, item.score, 0.4));
      } else {
        setStage5Mastery((prev) => calculateEMMUpdate(prev, item.score, 0.4));
      }
    }
  };

  const handleAdvanceToNextConcept = React.useCallback(() => {
    if (!plan) return;
    const currentStage = plan.stages[selectedStageIndex];
    if (!currentStage) return;

    const currentConceptIndex = currentStage.concepts.findIndex(
      (c) => c.id === activeAIConcept.id || c.name === activeAIConcept.title
    );

    if (currentConceptIndex >= 0 && currentConceptIndex < currentStage.concepts.length - 1) {
      // Advance to next concept in same stage
      const nextConcept = currentStage.concepts[currentConceptIndex + 1];
      setSelectedConcept({ id: nextConcept.id, title: nextConcept.name, summary: nextConcept.summary });
    } else if (selectedStageIndex < plan.stages.length - 1) {
      // Advance to next stage
      const nextStageIndex = selectedStageIndex + 1;
      setSelectedStageIndex(nextStageIndex);
      const nextStage = plan.stages[nextStageIndex];
      if (nextStage && nextStage.concepts.length > 0) {
        const nextConcept = nextStage.concepts[0];
        setSelectedConcept({ id: nextConcept.id, title: nextConcept.name, summary: nextConcept.summary });
      }
    } else {
      // Completed all stages! Move to mock test
      setAiViewMode("mock_test");
    }
  }, [plan, selectedStageIndex, activeAIConcept]);

  const isChemistryTopic = Boolean(
    plan &&
      (plan.topic.toLowerCase().includes("organic") ||
        plan.topic.toLowerCase().includes("chemistry") ||
        plan.category.toLowerCase().includes("chemistry"))
  );

  const handleSelectPersona = (p: DemoPersona) => {
    setActivePersona(p);
    if (p === "lin") {
      setActiveCanvasConcept(null);
      if (!plan || !plan.topic.toLowerCase().includes("organic")) {
        handleSubmitTopic("Organic Chemistry");
      }
      setChemistryViewMode("lab");
    } else if (p === "priya") {
      setIsFacilitatorOpen(true);
    } else if (p === "diya") {
      if (!plan || !plan.topic.toLowerCase().includes("fraction")) {
        handleSubmitTopic("Fractions");
      }
      setActiveCanvasConcept({
        id: "NODE_05",
        title: "Adding Fractions with Like Denominators",
      });
    } else {
      if (!plan || !plan.topic.toLowerCase().includes("fraction")) {
        handleSubmitTopic("Fractions");
      }
      setActiveCanvasConcept({
        id: "NODE_03",
        title: "Comparing Like Denominators",
      });
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/facilitator/interventions")
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setPendingInterventionsCount(data.pendingCount || 0);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Pending API plan holder while analyzing animation plays
  const pendingPlanRef = React.useRef<{
    plan: TopicCurriculumPlan;
    provider: ProviderType;
    notice?: string;
    metadata?: ExecutionMetadata;
  } | null>(null);

  const isAnalysisAnimDoneRef = React.useRef<boolean>(false);

  // Submit flow: Calls Next.js Server Route POST /api/topic/plan
  const handleSubmitTopic = async (submittedTopic: string) => {
    setTopic(submittedTopic);
    setErrorMsg(null);
    pendingPlanRef.current = null;
    isAnalysisAnimDoneRef.current = false;
    setState("ANALYZING");

    try {
      const response = await fetch("/api/topic/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: submittedTopic, forceFallback: isOfflineMode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.plan) {
        throw new Error(data.error || "Failed to generate learning plan.");
      }

      pendingPlanRef.current = {
        plan: data.plan,
        provider: data.provider || "groq",
        notice: data.notice,
        metadata: data.metadata,
      };

      // If animation has already completed while fetch was in-flight, finish now
      if (isAnalysisAnimDoneRef.current) {
        setPlan(data.plan);
        setProvider(data.provider || "groq");
        setProviderNotice(data.notice || null);
        if (data.metadata) setActiveAIMetadata(data.metadata);
        setSelectedStageIndex(0);
        setState("PLAN_READY");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load learning path.";
      console.error("[TopicExperienceShell] Server route failed:", message);
      setErrorMsg("KEA couldn't build the learning path right now. Try again.");
    }
  };

  // Called when the 3-step analyzing animation signals completion
  const handleAnalysisComplete = React.useCallback(() => {
    isAnalysisAnimDoneRef.current = true;
    if (pendingPlanRef.current) {
      setPlan(pendingPlanRef.current.plan);
      setProvider(pendingPlanRef.current.provider);
      setProviderNotice(pendingPlanRef.current.notice || null);
      if (pendingPlanRef.current.metadata) setActiveAIMetadata(pendingPlanRef.current.metadata);
      setSelectedStageIndex(0);
      setState("PLAN_READY");
    }
    // If pendingPlanRef is not ready yet, it will transition once fetch resolves
  }, []);

  // Reset: return to NO_TOPIC
  const handleReset = () => {
    setState("NO_TOPIC");
    setTopic("");
    setPlan(null);
    setErrorMsg(null);
    setProviderNotice(null);
    setSelectedStageIndex(0);
    pendingPlanRef.current = null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Top Navbar */}
      <TopicEntryHeader
        activeTopic={state === "PLAN_READY" && plan ? plan.topic : null}
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode(prev => !prev)}
        onOpenFacilitator={() => setIsFacilitatorOpen(true)}
        pendingInterventionsCount={pendingInterventionsCount}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {/* State 1: NO_TOPIC */}
        {state === "NO_TOPIC" && (
          <TopicLandingHero
            onSubmitTopic={handleSubmitTopic}
            isLoading={false}
          />
        )}

        {/* State 2 & 3: ANALYZING (with error handling) */}
        {state === "ANALYZING" && (
          <div>
            {errorMsg ? (
              <div className="py-16 px-4 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300">
                <Card className="border-destructive/30 bg-destructive/5 shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground">
                        Learning Path Generation Paused
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {errorMsg}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="cursor-pointer"
                      >
                        Enter Another Topic
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitTopic(topic)}
                        className="gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Try Again</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <TopicAnalyzingView
                topic={topic}
                onComplete={handleAnalysisComplete}
              />
            )}
          </div>
        )}

        {/* State 4: PLAN_READY */}
        {state === "PLAN_READY" && plan && (
          <div className="py-8 sm:py-12 px-4 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
            {/* Header: Dynamic Topic Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    {plan.category}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 font-medium">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>~{plan.estimatedHours} Hours to Mastery</span>
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {plan.stages.length} Structured Stages
                  </Badge>

                  {/* Provider Indicator & Telemetry Drawer */}
                  <AIRuntimeStatus
                    currentMetadata={activeAIMetadata}
                    demoMode={isOfflineMode}
                    onToggleDemoMode={() => setIsOfflineMode((prev) => !prev)}
                  />
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground uppercase">
                  YOUR PATH TO MASTERING {plan.topic}
                </h1>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                  {plan.overview}
                </p>

                {providerNotice && (
                  <p className="text-[11px] text-muted-foreground/75 font-mono italic">
                    Note: {providerNotice}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {/* Mobile Sheet Drawer Trigger for Learning Map */}
                <div className="block lg:hidden">
                  <Sheet>
                    <SheetTrigger render={
                      <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                        <Map className="h-4 w-4 text-primary" />
                        <span>View Learning Map</span>
                      </Button>
                    } />
                    <SheetContent side="left" className="w-[85vw] max-w-md overflow-y-auto">
                      <SheetHeader className="text-left pb-4">
                        <SheetTitle className="flex items-center gap-2 text-base font-bold">
                          <Compass className="h-4 w-4 text-primary" />
                          <span>Learning Map: {plan.topic}</span>
                        </SheetTitle>
                      </SheetHeader>
                      {isChemistryTopic ? (
                        <OrganicChemistryMap
                          stage1MasteryScore={stage1Mastery}
                          stage2MasteryScore={stage2Mastery}
                          stage3MasteryScore={stage3Mastery}
                          stage4MasteryScore={stage4Mastery}
                          stage5MasteryScore={stage5Mastery}
                          onSelectStage={(num) => {
                            if (num === 1) setChemistryViewMode("lab");
                            else if (num === 2 && stage1Mastery >= 80) setChemistryViewMode("stage2");
                            else if (num === 3 && stage2Mastery >= 80) setChemistryViewMode("stage3");
                            else if (num === 4 && stage3Mastery >= 80) setChemistryViewMode("stage4");
                            else if (num === 5 && stage4Mastery >= 80) setChemistryViewMode("stage5");
                          }}
                        />
                      ) : (
                        <LearningMap
                          plan={plan}
                          activeStageIndex={selectedStageIndex}
                          onSelectStage={setSelectedStageIndex}
                        />
                      )}
                    </SheetContent>
                  </Sheet>
                </div>

                {plan.diagnosticQuestions && plan.diagnosticQuestions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDiagnosticOpen(true)}
                    className="gap-1.5 cursor-pointer border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>{calibration ? "Recalibrate Path" : "Calibrate Starting Point"}</span>
                  </Button>
                )}

                {/* Primary Interactive Lab / Practice Challenge Button */}
                {isChemistryTopic ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (chemistryViewMode !== "map") {
                        setChemistryViewMode("map");
                      } else {
                        if (stage4Mastery >= 80) {
                          setChemistryViewMode("stage5");
                        } else if (stage3Mastery >= 80) {
                          setChemistryViewMode("stage4");
                        } else if (stage2Mastery >= 80) {
                          setChemistryViewMode("stage3");
                        } else if (stage1Mastery >= 80) {
                          setChemistryViewMode("stage2");
                        } else {
                          setChemistryViewMode("lab");
                        }
                      }
                    }}
                    className="gap-1.5 cursor-pointer font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <Atom className="h-4 w-4" />
                    <span>
                      {chemistryViewMode !== "map"
                        ? "View Curriculum Map"
                        : stage4Mastery >= 80
                        ? "Enter Stage 5 Lab"
                        : stage3Mastery >= 80
                        ? "Enter Stage 4 Lab"
                        : stage2Mastery >= 80
                        ? "Enter Stage 3 Lab"
                        : stage1Mastery >= 80
                        ? "Enter Stage 2 Lab"
                        : "Enter Interactive Lab"}
                    </span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      const firstEligible = plan.stages[selectedStageIndex]?.concepts[0] || plan.stages[0]?.concepts[0];
                      if (firstEligible) {
                        setSelectedConcept({ id: firstEligible.id, title: firstEligible.name, summary: firstEligible.summary });
                      }
                      setAiViewMode("practice");
                    }}
                    className="gap-1.5 cursor-pointer font-bold bg-primary text-primary-foreground shadow-xs"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Practice Challenge</span>
                  </Button>
                )}

                {/* Teacher Cockpit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFacilitatorOpen(true)}
                  className="gap-1.5 cursor-pointer border-border hover:border-primary/50 relative"
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Teacher Cockpit</span>
                  {pendingInterventionsCount > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4">
                      {pendingInterventionsCount}
                    </Badge>
                  )}
                </Button>

                {/* AI Practice Button */}
                <Button
                  variant={aiViewMode === "practice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAiViewMode(aiViewMode === "practice" ? "none" : "practice")}
                  className={`gap-1.5 cursor-pointer text-xs ${
                    aiViewMode === "practice"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-primary/40 text-primary hover:bg-primary/5"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Practice</span>
                </Button>

                {/* AI Mock Test Button */}
                <Button
                  variant={aiViewMode === "mock_test" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAiViewMode(aiViewMode === "mock_test" ? "none" : "mock_test")}
                  className={`gap-1.5 cursor-pointer text-xs ${
                    aiViewMode === "mock_test"
                      ? "bg-purple-600 text-white font-bold shadow-xs"
                      : "border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/5"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>AI Mock Test</span>
                </Button>

                {/* AI Oral Defense Button */}
                <Button
                  variant={aiViewMode === "interview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAiViewMode(aiViewMode === "interview" ? "none" : "interview")}
                  className={`gap-1.5 cursor-pointer text-xs ${
                    aiViewMode === "interview"
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
                  }`}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>AI Oral Defense</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Explore Another Topic</span>
                </Button>
              </div>
            </div>

            {/* Calibration Status Banner if calibrated */}
            {calibration && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Diagnostic Calibration Active:</strong> {calibration.correctCount}/{calibration.totalQuestions} verified ({calibration.accuracyPercentage}%).
                    {calibration.masteredConceptIds.length > 0 && ` Calibrated ${calibration.masteredConceptIds.length} foundational concepts to Mastered.`}
                  </span>
                </div>
                <Badge variant="outline" className="bg-background text-primary border-primary/30 font-mono">
                  Starting at: {calibration.recommendedStartingNodeTitle}
                </Badge>
              </div>
            )}

            {/* Learner Guided Step Card — Clear Primary Action Workflow */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border-2 border-primary/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-wider">
                    {!calibration
                      ? "Step 1 of 4: Prior Knowledge Calibration"
                      : stage1Mastery < 80
                      ? `Step 2 of 4: Core Fundamentals (${plan.topic})`
                      : stage2Mastery < 80
                      ? `Step 3 of 4: Intermediate Mastery (${plan.topic})`
                      : `Step 4 of 4: Capstone Oral Defense (${plan.topic})`}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    {!calibration
                      ? "Establish Starting Baseline"
                      : stage1Mastery < 80
                      ? `Master ${plan.stages[0]?.title || plan.topic + " Foundations"}`
                      : stage2Mastery < 80
                      ? `Apply ${plan.stages[1]?.title || plan.topic + " Mechanics"}`
                      : `Defend ${plan.topic} Conceptual Models`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  {!calibration
                    ? "Complete the 5-question Diagnostic to calibrate your baseline, establish optimal pacing, and automatically unlock prerequisite stages."
                    : stage1Mastery < 80
                    ? `Study core foundational concepts in ${plan.topic} and reinforce understanding with AI-synthesized practice problems.`
                    : stage2Mastery < 80
                    ? `Stage 1 Mastered! Advance to ${plan.stages[1]?.title || "Stage 2"} or validate your cross-concept synthesis in the AI Mock Test.`
                    : `Validate your mechanistic reasoning and analytical principles before the AI Academic Defense Evaluator.`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!calibration ? (
                  <Button
                    size="sm"
                    onClick={() => setIsDiagnosticOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md cursor-pointer text-xs"
                  >
                    <ListChecks className="h-4 w-4 mr-1.5" />
                    <span>Start Diagnostic Check</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : stage1Mastery < 80 ? (
                  <div className="flex items-center gap-2">
                    {isChemistryTopic && (
                      <Button
                        size="sm"
                        onClick={() => setChemistryViewMode("lab")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer text-xs"
                      >
                        <Atom className="h-4 w-4 mr-1.5" />
                        <span>Enter Stage 1 Lab</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setAiViewMode("practice")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md cursor-pointer text-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      <span>Start AI Practice</span>
                    </Button>
                  </div>
                ) : stage2Mastery < 80 ? (
                  <div className="flex items-center gap-2">
                    {isChemistryTopic && (
                      <Button
                        size="sm"
                        onClick={() => setChemistryViewMode("stage2")}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer text-xs"
                      >
                        <Flame className="h-4 w-4 mr-1.5" />
                        <span>Enter Stage 2 Lab</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAiViewMode("mock_test")}
                      className="border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer text-xs"
                    >
                      <Layers className="h-3.5 w-3.5 mr-1" />
                      <span>Start AI Mock Test</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setAiViewMode("interview")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer text-xs"
                  >
                    <PlayCircle className="h-4 w-4 mr-1.5" />
                    <span>Start AI Oral Defense</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Organic Chemistry Mode Switcher Header Bar */}
            {isChemistryTopic && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Atom className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      Organic Chemistry Interactive Vertical Slice
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Primary Demo
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      5-Stage Knowledge Graph DAG • Interactive SVG Molecular Workspace • Deterministic W-EMM Mastery
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={chemistryViewMode === "lab" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChemistryViewMode("lab")}
                    className={
                      chemistryViewMode === "lab"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                        : "text-xs h-8"
                    }
                  >
                    <Atom className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                    Interactive Lab (Stage 1)
                  </Button>
                  {stage1Mastery >= 80 && (
                    <Button
                      variant={chemistryViewMode === "stage2" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChemistryViewMode("stage2")}
                      className={
                        chemistryViewMode === "stage2"
                          ? "bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8"
                          : "text-xs h-8 border-amber-500/40 text-amber-400"
                      }
                    >
                      <Flame className="h-3.5 w-3.5 mr-1 text-amber-300" />
                      Stage 2 Lab
                    </Button>
                  )}
                  {stage2Mastery >= 80 && (
                    <Button
                      variant={chemistryViewMode === "stage3" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChemistryViewMode("stage3")}
                      className={
                        chemistryViewMode === "stage3"
                          ? "bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs h-8"
                          : "text-xs h-8 border-cyan-500/40 text-cyan-400"
                      }
                    >
                      <FlaskConical className="h-3.5 w-3.5 mr-1 text-cyan-300" />
                      Stage 3 Lab
                    </Button>
                  )}
                  {stage3Mastery >= 80 && (
                    <Button
                      variant={chemistryViewMode === "stage4" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChemistryViewMode("stage4")}
                      className={
                        chemistryViewMode === "stage4"
                          ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8"
                          : "text-xs h-8 border-purple-500/40 text-purple-400"
                      }
                    >
                      <Layers className="h-3.5 w-3.5 mr-1 text-purple-300" />
                      Stage 4 Lab
                    </Button>
                  )}
                  {stage4Mastery >= 80 && (
                    <Button
                      variant={chemistryViewMode === "stage5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChemistryViewMode("stage5")}
                      className={
                        chemistryViewMode === "stage5"
                          ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8"
                          : "text-xs h-8 border-rose-500/40 text-rose-400"
                      }
                    >
                      <Beaker className="h-3.5 w-3.5 mr-1 text-rose-300" />
                      Stage 5 Lab
                    </Button>
                  )}
                  <Button
                    variant={chemistryViewMode === "map" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChemistryViewMode("map")}
                    className={
                      chemistryViewMode === "map"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
                        : "text-xs h-8"
                    }
                  >
                    <Map className="h-3.5 w-3.5 mr-1" />
                    Curriculum Map (5 Stages)
                  </Button>
                </div>
              </div>
            )}

            {/* Layout Switcher: AI Experience vs Interactive Lab Mode vs 2-Column Curriculum Map */}
            {aiViewMode === "practice" ? (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-sm">
                <AILearningPanel
                  topic={plan.topic}
                  stageNumber={selectedStageIndex + 1}
                  concept={activeAIConcept}
                  learnerMastery={stage1Mastery || 50}
                  recentMistakes={recentMistakes}
                  demoMode={isOfflineMode}
                  onMetadataUpdate={handleMetadataUpdate}
                  onEvidenceCaptured={(ev) => {
                    handleEvidenceRecorded([{ conceptId: ev.conceptId, score: ev.score }]);
                    if (!ev.success) {
                      setRecentMistakes((prev) => Array.from(new Set([...prev, `${ev.conceptId} practice gap`])));
                    }
                  }}
                  onNextConcept={handleAdvanceToNextConcept}
                  onClose={() => {
                    setAiViewMode("none");
                    setSelectedConcept(null);
                  }}
                />
              </div>
            ) : aiViewMode === "mock_test" ? (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-sm">
                <AIMockTest
                  topic={plan.topic}
                  stageNumber={selectedStageIndex + 1}
                  targetConcepts={targetConcepts}
                  currentMastery={stage1Mastery || 60}
                  demoMode={isOfflineMode}
                  onMetadataUpdate={handleMetadataUpdate}
                  onEvidenceRecorded={(evItems) => handleEvidenceRecorded(evItems)}
                  onStartInterview={() => setAiViewMode("interview")}
                  onClose={() => setAiViewMode("none")}
                />
              </div>
            ) : aiViewMode === "interview" ? (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-sm">
                <AIMockInterview
                  topic={plan.topic}
                  stageNumber={selectedStageIndex + 1}
                  targetConcepts={targetConcepts}
                  learnerMastery={stage1Mastery || 60}
                  demoMode={isOfflineMode}
                  onMetadataUpdate={handleMetadataUpdate}
                  onEvidenceRecorded={(ev) => handleEvidenceRecorded([{ conceptId: ev.conceptId, score: ev.score }])}
                  onClose={() => setAiViewMode("none")}
                />
              </div>
            ) : isChemistryTopic && (chemistryViewMode === "lab" || chemistryViewMode === "stage2" || chemistryViewMode === "stage3" || chemistryViewMode === "stage4" || chemistryViewMode === "stage5") ? (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-6 shadow-sm">
                {chemistryViewMode === "lab" ? (
                  <VisualLearningWorkspace
                    onBackToTopicPlan={() => setChemistryViewMode("map")}
                    onStageCompleted={(stNum, score) => {
                      setStage1Mastery(score);
                    }}
                  />
                ) : chemistryViewMode === "stage2" ? (
                  <HydrocarbonWorkspace
                    onBackToTopicPlan={() => setChemistryViewMode("map")}
                    onStageCompleted={(stNum, score) => {
                      setStage2Mastery(score);
                    }}
                  />
                ) : chemistryViewMode === "stage3" ? (
                  <FunctionalGroupWorkspace
                    onBackToTopicPlan={() => setChemistryViewMode("map")}
                    onStageCompleted={(stNum, score) => {
                      setStage3Mastery(score);
                    }}
                  />
                ) : chemistryViewMode === "stage4" ? (
                  <StructureIsomerismWorkspace
                    onBackToTopicPlan={() => setChemistryViewMode("map")}
                    onStageCompleted={(stNum, score) => {
                      setStage4Mastery(score);
                    }}
                  />
                ) : (
                  <ReactionsPracticalWorkspace
                    onBackToTopicPlan={() => setChemistryViewMode("map")}
                    onStageCompleted={(stNum, score) => {
                      setStage5Mastery(score);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Learning Map / Graph (Visible on Mobile & Sticky on Desktop) */}
                <aside className="col-span-1 lg:col-span-5 lg:sticky lg:top-24 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-sm">
                  {isChemistryTopic ? (
                    <OrganicChemistryMap
                      stage1MasteryScore={stage1Mastery}
                      stage2MasteryScore={stage2Mastery}
                      stage3MasteryScore={stage3Mastery}
                      stage4MasteryScore={stage4Mastery}
                      stage5MasteryScore={stage5Mastery}
                      onSelectStage={(stageNum) => {
                        if (stageNum === 1) {
                          setChemistryViewMode("lab");
                        } else if (stageNum === 2 && stage1Mastery >= 80) {
                          setChemistryViewMode("stage2");
                        } else if (stageNum === 3 && stage2Mastery >= 80) {
                          setChemistryViewMode("stage3");
                        } else if (stageNum === 4 && stage3Mastery >= 80) {
                          setChemistryViewMode("stage4");
                        } else if (stageNum === 5 && stage4Mastery >= 80) {
                          setChemistryViewMode("stage5");
                        }
                      }}
                    />
                  ) : (
                    <LearningMap
                      plan={plan}
                      activeStageIndex={selectedStageIndex}
                      onSelectStage={setSelectedStageIndex}
                    />
                  )}
                </aside>

                {/* RIGHT COLUMN: Stage-Wise Learning Plan */}
                <section className="col-span-1 lg:col-span-7">
                  <StageCardsList
                    plan={plan}
                    activeStageIndex={selectedStageIndex}
                    stageMasteryScores={{
                      stage1: stage1Mastery,
                      stage2: stage2Mastery,
                      stage3: stage3Mastery,
                      stage4: stage4Mastery,
                      stage5: stage5Mastery,
                    }}
                    onSelectStage={(idx) => {
                      setSelectedStageIndex(idx);
                      if (isChemistryTopic) {
                        if (idx === 0) setChemistryViewMode("lab");
                        else if (idx === 1 && stage1Mastery >= 80) setChemistryViewMode("stage2");
                        else if (idx === 2 && stage2Mastery >= 80) setChemistryViewMode("stage3");
                        else if (idx === 3 && stage3Mastery >= 80) setChemistryViewMode("stage4");
                        else if (idx === 4 && stage4Mastery >= 80) setChemistryViewMode("stage5");
                      }
                    }}
                    onStartConcept={(c) => {
                      setSelectedConcept({ id: c.id, title: c.title });
                      if (c.stageNumber) setSelectedStageIndex(c.stageNumber - 1);
                      if (isChemistryTopic) {
                        if (c.stageNumber === 2 && stage1Mastery >= 80) {
                          setChemistryViewMode("stage2");
                        } else if (c.stageNumber === 3 && stage2Mastery >= 80) {
                          setChemistryViewMode("stage3");
                        } else if (c.stageNumber === 4 && stage3Mastery >= 80) {
                          setChemistryViewMode("stage4");
                        } else if (c.stageNumber === 5 && stage4Mastery >= 80) {
                          setChemistryViewMode("stage5");
                        } else {
                          setChemistryViewMode("lab");
                        }
                      } else {
                        setAiViewMode("practice");
                      }
                    }}
                  />
                </section>
              </div>
            )}

            {/* SERP Resource Discovery Section — 1 Search per Unique Topic, Cached */}
            <div className="mt-8">
              <TopicResourcesSection
                topic={plan.topic}
                stageTitle={plan.stages[selectedStageIndex]?.title}
                conceptTitle={activeAIConcept.title}
              />
            </div>

            {/* Bottom Actions */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Ready to explore another subject?
                </h3>
                <p className="text-xs text-muted-foreground">
                  KEA dynamically structures learning paths for any topic from Computer Science to Biology.
                </p>
              </div>

              <Button
                variant="outline"
                size="default"
                onClick={handleReset}
                className="gap-2 cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Enter a New Topic</span>
              </Button>
            </div>

            {/* Diagnostic Calibration Modal */}
            <DiagnosticCalibrationModal
              plan={plan}
              isOpen={isDiagnosticOpen}
              onClose={() => setIsDiagnosticOpen(false)}
              onCalibrationComplete={(calib) => {
                setCalibration(calib);
                setPlan((prev) => (prev ? { ...prev, stages: calib.calibratedStages } : null));
                const missed = calib.questionResults ? calib.questionResults.filter((q) => !q.isCorrect) : [];
                if (missed.length > 0) {
                  setRecentMistakes(missed.map((q) => q.conceptTested || q.targetConceptId || "Prerequisite gap"));
                }
              }}
            />

            {/* Interactive Student Learning Canvas Modal (Legacy Fractions Demo Only) */}
            {activeCanvasConcept && !isChemistryTopic && plan?.topic?.toLowerCase().includes("fraction") && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="max-w-4xl w-full max-h-[94vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl p-4 sm:p-6 relative">
                  <button
                    onClick={() => setActiveCanvasConcept(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <StudentLearningCanvas
                    conceptId={activeCanvasConcept.id}
                    conceptTitle={activeCanvasConcept.title}
                    initialTheme={activePersona === "diya" ? "wildlife" : "space"}
                    studentName={activePersona === "diya" ? "Diya Patel" : "Aarav Sharma"}
                    onRemediationReroute={() => {
                      setPendingInterventionsCount(prev => prev + 1);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Facilitator Real-Time Cockpit Modal */}
            <FacilitatorCockpit
              isOpen={isFacilitatorOpen}
              onClose={() => setIsFacilitatorOpen(false)}
              onInterventionResolved={() => {
                setPendingInterventionsCount(0);
              }}
            />
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-border/40 py-4 px-6 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>KEA • AI-Powered Topic-to-Mastery Adaptive Learning Platform</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80">
            Prerequisite Gating • Stage-Wise Structuring
          </div>
        </div>
      </footer>
    </div>
  );
}
