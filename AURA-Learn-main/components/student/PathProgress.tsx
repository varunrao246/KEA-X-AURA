import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CourseState, TopicStatus } from "@/lib/student";
import { cn } from "@/lib/utils";

const DOT: Record<TopicStatus, string> = {
  mastered: "bg-success text-brand-on",
  learning: "bg-brand text-brand-on",
  attention: "bg-warn text-brand-on",
  locked: "border border-line bg-subtle text-faint",
};

export function PathProgress({ courses }: { courses: CourseState[] }) {
  return (
    <Card className="enter" style={{ ["--i" as string]: 4 }}>
      <CardHeader title="Learning path" subtitle="Your three courses" />
      <ul className="space-y-3">
        {courses.map((c) => (
          <li key={c.subjectId}>
            <Link href={`/student/path?course=${c.subjectId}`} className="block rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="t-eyebrow">{c.name}</p>
                  <p className="truncate font-semibold">{c.courseTitle}</p>
                </div>
                <span className="t-num text-lg">{c.progress}%</span>
              </div>
              <div className="mb-3 flex items-center" aria-label={c.topics.map((t) => `${t.name}: ${t.status}`).join(", ")}>
                {c.topics.map((t, i) => (
                  <div key={t.id} className="flex flex-1 items-center last:flex-none">
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold", DOT[t.status])} title={t.name}>
                      {t.status === "mastered" ? <Check className="size-3.5" strokeWidth={3} /> : t.status === "locked" ? <Lock className="size-3" /> : i + 1}
                    </span>
                    {i < c.topics.length - 1 && <span className={cn("h-0.5 flex-1", c.topics[i + 1].locked ? "bg-line" : "bg-brand/50")} />}
                  </div>
                ))}
              </div>
              <ProgressBar value={c.progress} size="sm" tone={c.accent === "brand" ? "brand" : c.accent === "accent" ? "accent" : "success"} label={`${c.courseTitle} progress`} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
