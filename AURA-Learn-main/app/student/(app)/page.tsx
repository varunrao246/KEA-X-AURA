import { ArrowRight } from "lucide-react";
import { AttentionList } from "@/components/student/AttentionList";
import { ContinueCard } from "@/components/student/ContinueCard";
import { InterestStrip } from "@/components/student/InterestStrip";
import { InterventionBanner } from "@/components/student/InterventionBanner";
import { LearningPulse } from "@/components/student/LearningPulse";
import { PathProgress } from "@/components/student/PathProgress";
import { RecommendedList } from "@/components/student/RecommendedList";
import { Greeting } from "@/components/shell/Greeting";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState, getTopicState, recommend } from "@/lib/student";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function StudentHome() {
  const user = await requireUser("student");
  const state = getStudentState(getStore(), user.id);
  const recs = recommend(state);
  const current = state.currentTopicId ? getTopicState(state, state.currentTopicId) : undefined;
  const course = current ? state.courses.find((c) => c.subjectId === current.subjectId) : undefined;
  const goalName = course ? state.topics.find((t) => t.id === course.goalTopicId)?.name : undefined;
  const topInterventions = [...state.interventions].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="Home"
        title={<Greeting name={state.student.firstName} />}
        description="Ready to continue your learning journey?"
        actions={<Button href="/student/path" variant="secondary" iconRight={<ArrowRight className="size-4" />}>My Path</Button>}
      />

      {topInterventions[0] && (
        <InterventionBanner
          intervention={topInterventions[0]}
          topicName={state.topics.find((t) => t.id === topInterventions[0].topicId)?.name ?? "this topic"}
          blocksName={state.topics.find((t) => t.id === topInterventions[0].blocksTopicId)?.name}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {current && course && <ContinueCard topic={current} course={course} goalName={goalName} />}
          <LearningPulse state={state} />
          <RecommendedList items={recs} />
        </div>
        <div className="space-y-6">
          <AttentionList topics={state.attention} />
          <PathProgress courses={state.courses} />
          <InterestStrip profile={state.profile} />
        </div>
      </div>
    </div>
  );
}
