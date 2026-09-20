import { CurriculumGraph } from "@/components/curriculum/CurriculumGraph";
import { NextStepCard } from "@/components/curriculum/NextStepCard";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SegmentedLinks } from "@/components/ui/SegmentedLinks";
import { StatusPill, type TopicStatus } from "@/components/ui/StatusPill";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState } from "@/lib/student";

export const metadata = { title: "My Path" };
export const dynamic = "force-dynamic";

const LEGEND: TopicStatus[] = ["mastered", "learning", "attention", "locked"];

export default async function PathPage({ searchParams }: { searchParams: Promise<{ course?: string; gap?: string }> }) {
  const user = await requireUser("student");
  const { course: courseParam, gap } = await searchParams;
  const state = getStudentState(getStore(), user.id);

  const currentCourseId = state.topics.find((t) => t.id === state.currentTopicId)?.subjectId;
  const gapCourseId = gap ? state.topics.find((t) => t.id === gap)?.subjectId : undefined;
  const course =
    state.courses.find((c) => c.subjectId === (courseParam ?? gapCourseId ?? currentCourseId)) ?? state.courses[0];

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="My Path"
        title={`${state.student.firstName}'s path to ${course.courseTitle}`}
        description="Each topic builds on the one before it. Master a topic to unlock the next."
      />

      <SegmentedLinks
        className="mb-8"
        items={state.courses.map((c) => ({
          href: `/student/path?course=${c.subjectId}`,
          label: c.courseTitle,
          sublabel: `${c.name} · ${c.progress}%`,
          active: c.subjectId === course.subjectId,
        }))}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <CurriculumGraph
          key={`${course.subjectId}-${gap ?? ""}`}
          allTopics={state.topics}
          topics={course.topics}
          goalTopicId={course.goalTopicId}
          autoOpenGap={gap}
        />

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <NextStepCard course={course} allTopics={state.topics} />
          <Card>
            <div className="flex items-center gap-4">
              <ProgressRing value={course.progress} size={84} stroke={8} label={`${course.courseTitle} progress`}>
                <span className="t-num text-lg">{course.progress}%</span>
              </ProgressRing>
              <div>
                <p className="font-semibold">{course.courseTitle}</p>
                <p className="t-small">{course.masteredCount} of {course.topics.length} topics mastered</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              {LEGEND.map((s) => <StatusPill key={s} status={s} />)}
            </div>
            <p className="t-small mt-3">The mark at 60% on each bar is the unlock threshold.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
