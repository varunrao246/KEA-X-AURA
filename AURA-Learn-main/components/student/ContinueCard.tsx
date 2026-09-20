import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { LEVEL_NAMES } from "@/lib/adaptive";
import type { CourseState, TopicState } from "@/lib/student";

export function ContinueCard({ topic, course, goalName }: { topic: TopicState; course: CourseState; goalName?: string }) {
  return (
    <section className="enter relative overflow-hidden rounded-3xl bg-brand p-6 text-brand-on shadow-lift sm:p-8" style={{ ["--i" as string]: 1 }}>
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-brand-on/15" aria-hidden />
      <div className="pointer-events-none absolute -right-6 -top-6 size-40 rounded-full border border-brand-on/15" aria-hidden />

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">Continue learning · {course.courseTitle}</p>
      <h2 className="relative mt-2 text-3xl font-semibold tracking-tight">{topic.name}</h2>
      <p className="relative mt-1.5 max-w-md text-[15px] opacity-85">{topic.description}</p>

      <div className="relative mt-6 max-w-md">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="opacity-85">{topic.started ? `Level ${topic.level} · ${LEVEL_NAMES[topic.level]}` : "Not started yet"}</span>
          <span className="t-num">{topic.score}% mastery</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-brand-on/20" role="progressbar" aria-valuenow={topic.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${topic.name} mastery`}>
          <div className="h-full rounded-full bg-brand-on transition-[width] duration-700" style={{ width: `${topic.score}%` }} />
        </div>
      </div>

      <div className="relative mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href={`/student/learn/${topic.id}`} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-brand-on px-6 font-semibold text-brand transition hover:brightness-95 active:scale-[0.98]">
          Continue learning <ArrowRight className="size-4" aria-hidden />
        </Link>
        {goalName && topic.unlocks.some((u) => u.name === goalName) && (
          <span className="inline-flex items-center gap-2 text-sm opacity-85">
            <Lock className="size-4" aria-hidden /> Reach 60% to unlock {goalName}
          </span>
        )}
      </div>
    </section>
  );
}
