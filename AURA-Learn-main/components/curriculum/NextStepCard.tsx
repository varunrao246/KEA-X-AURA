import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { findBlocker } from "@/lib/blockers";
import type { CourseState, TopicState } from "@/lib/student";

/** "What should I do next?" for the selected course, in one card. */
export function NextStepCard({ course, allTopics }: { course: CourseState; allTopics: TopicState[] }) {
  const goal = course.topics.find((t) => t.id === course.goalTopicId)!;
  const blocker = goal.locked ? findBlocker(allTopics, goal.id) : null;

  let title: string;
  let body: string;
  let cta: { href: string; label: string } | null = null;

  if (blocker) {
    title = `Practice ${blocker.name}`;
    body = `Get ${blocker.name} to 60% to unlock ${goal.name}.`;
    cta = { href: `/student/learn/${blocker.id}?tab=practice`, label: `Practice ${blocker.name}` };
  } else if (goal.status === "mastered") {
    title = "Course complete";
    body = `You've mastered ${goal.name}. Try another course or revisit to keep it fresh.`;
  } else {
    title = `${goal.name} is open`;
    body = "Every prerequisite is in place. This is your goal topic.";
    cta = { href: `/student/learn/${goal.id}`, label: goal.started ? "Continue" : `Start ${goal.name}` };
  }

  return (
    <Card className="border-brand/30 bg-brand-soft/60">
      <div className="mb-3 flex items-center gap-2 text-brand">
        <Sparkles className="size-4" aria-hidden />
        <span className="t-eyebrow text-brand">AURA suggests</span>
      </div>
      <h3 className="t-heading">{title}</h3>
      <p className="t-body mt-1">{body}</p>
      {blocker && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>{blocker.name}</span>
            <span>{blocker.score}% of 60%</span>
          </div>
          <div className="relative">
            <ProgressBar value={blocker.score} tone="warn" label={`${blocker.name} mastery`} />
            <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/40" style={{ left: "60%" }} aria-hidden />
          </div>
        </div>
      )}
      {cta && (
        <Button href={cta.href} className="mt-5" fullWidth iconRight={<ArrowRight className="size-4" />}>
          {cta.label}
        </Button>
      )}
    </Card>
  );
}
