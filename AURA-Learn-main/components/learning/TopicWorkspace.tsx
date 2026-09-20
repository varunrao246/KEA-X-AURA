"use client";

import { Activity, BookOpen, FlaskConical, Target } from "lucide-react";
import { useState } from "react";
import { EngineInsights } from "@/components/adaptive/EngineInsights";
import type { Lesson } from "@/content/lessons";
import { Tabs } from "@/components/ui/Tabs";
import type { TopicEngine } from "@/lib/engine";
import type { InterventionSummary } from "@/lib/intervention";
import type { Interest, Level } from "@/lib/types";
import { LabPanel, type LabSummary } from "./LabPanel";
import { LearnPanel, type Analogy } from "./LearnPanel";
import { PracticeSession } from "./PracticeSession";

export type WorkspaceTab = "learn" | "practice" | "lab" | "insights";

interface Props {
  topicId: string;
  topicName: string;
  score: number;
  level: Level;
  interests: Interest[];
  lesson: Lesson | undefined;
  analogies: Analogy[];
  labs: LabSummary[];
  initialTab: WorkspaceTab;
  engine: TopicEngine;
  intervention: InterventionSummary | null;
  blocksName?: string;
}

export function TopicWorkspace({ topicId, topicName, score, level, interests, lesson, analogies, labs, initialTab, engine, intervention, blocksName }: Props) {
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  // Practice keeps its state (session, hints) when you peek at the concept or the insights and come back.
  const [practiceMounted, setPracticeMounted] = useState(initialTab === "practice");

  function change(next: WorkspaceTab) {
    if (next === "practice") setPracticeMounted(true);
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <Tabs
        className="mb-6 w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none"
        value={tab}
        onChange={change}
        tabs={[
          { id: "learn", label: "Learn", icon: BookOpen },
          { id: "practice", label: "Practice", icon: Target, alert: !!intervention },
          { id: "lab", label: "Lab", icon: FlaskConical },
          { id: "insights", label: "Insights", icon: Activity },
        ]}
      />
      <div role="tabpanel" id="panel-learn" aria-labelledby="tab-learn" hidden={tab !== "learn"}>
        {tab === "learn" && <LearnPanel lesson={lesson} analogies={analogies} onStartPractice={() => change("practice")} />}
      </div>
      <div role="tabpanel" id="panel-practice" aria-labelledby="tab-practice" hidden={tab !== "practice"}>
        {practiceMounted && (
          <PracticeSession
            topicId={topicId}
            topicName={topicName}
            initialScore={score}
            initialLevel={level}
            initialStruggle={{ score: engine.struggle.score, level: engine.struggle.level }}
            initialIntervention={intervention}
            blocksName={blocksName}
            lesson={lesson}
            analogy={analogies[0]?.text}
            interests={interests}
            onReviewConcept={() => change("learn")}
            onOpenInsights={() => change("insights")}
          />
        )}
      </div>
      <div role="tabpanel" id="panel-lab" aria-labelledby="tab-lab" hidden={tab !== "lab"}>
        {tab === "lab" && <LabPanel labs={labs} topicName={topicName} />}
      </div>
      <div role="tabpanel" id="panel-insights" aria-labelledby="tab-insights" hidden={tab !== "insights"}>
        {tab === "insights" && <EngineInsights engine={engine} />}
      </div>
    </div>
  );
}
