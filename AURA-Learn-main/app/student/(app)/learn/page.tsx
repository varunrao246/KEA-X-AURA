import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { getStudentState } from "@/lib/student";
import { cn } from "@/lib/utils";

export const metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await requireUser("student");
  const state = getStudentState(getStore(), user.id);

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader eyebrow="Learn" title="Pick a topic" description="Open topics are ready for you. Locked ones unlock as you master what they build on." />
      <div className="grid gap-6 lg:grid-cols-3">
        {state.courses.map((c, ci) => (
          <Card key={c.subjectId} className="enter" style={{ ["--i" as string]: ci }}>
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <p className="t-eyebrow">{c.name}</p>
                <h2 className="t-heading">{c.courseTitle}</h2>
              </div>
              <span className="t-num text-lg">{c.progress}%</span>
            </div>
            <ul className="-mx-2 divide-y divide-line">
              {c.topics.map((t) => (
                <li key={t.id}>
                  <Link
                    href={t.locked ? `/student/path?course=${t.subjectId}&gap=${t.id}` : `/student/learn/${t.id}`}
                    className={cn("group block rounded-2xl px-2 py-3 transition hover:bg-subtle", t.locked && "opacity-70")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        {t.locked && <Lock className="size-4 text-faint" aria-hidden />}
                        {t.name}
                      </span>
                      <StatusPill status={t.status} />
                    </div>
                    {!t.locked && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <ProgressBar value={t.score} size="sm" tone={t.status === "mastered" ? "success" : t.status === "attention" ? "warn" : "brand"} label={`${t.name} mastery`} />
                        <span className="t-num w-10 text-right text-sm text-muted">{t.score}%</span>
                        <ArrowRight className="size-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
