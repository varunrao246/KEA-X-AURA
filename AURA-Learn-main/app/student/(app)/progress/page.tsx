import { Flame, ListChecks, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AdaptiveTimeline } from "@/components/adaptive/AdaptiveTimeline";
import { ActivityBars } from "@/components/charts/ActivityBars";
import { MasteryTrendChart } from "@/components/charts/MasteryTrendChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { StatusPill } from "@/components/ui/StatusPill";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { BAND_LABEL } from "@/lib/mastery";
import { getStudentState } from "@/lib/student";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireUser("student");
  const state = getStudentState(getStore(), user.id);
  const { overall } = state;

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader eyebrow="Progress" title="How you're growing" description="Mastery is measured from your answers, your recent practice and your lab work." />

      <div className="enter mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Overall mastery" value={`${overall.mastery}%`} icon={TrendingUp} delta={overall.weeklyDelta} deltaSuffix="% wk" />
        <StatTile label="Learning streak" value={`${overall.streak} ${overall.streak === 1 ? "day" : "days"}`} icon={Flame} />
        <StatTile label="Answered this week" value={overall.questionsThisWeek} icon={ListChecks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="enter" style={{ ["--i" as string]: 1 }}>
          <CardHeader title="Mastery over 14 days" subtitle="Average across every topic you've started" />
          <MasteryTrendChart data={overall.trend} />
        </Card>
        <Card className="enter" style={{ ["--i" as string]: 2 }}>
          <CardHeader title="Practice this week" subtitle="Questions answered each day" />
          <ActivityBars data={overall.activity} />
        </Card>
      </div>

      <Card className="enter mt-6" style={{ ["--i" as string]: 3 }}>
        <CardHeader title="Recent AURA decisions" subtitle="Level changes, struggle checks, interventions and unlocks, with the reason for each" />
        <AdaptiveTimeline events={state.events} />
      </Card>

      <h2 className="t-heading mb-4 mt-10">Mastery by topic</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        {state.courses.map((c, ci) => (
          <Card key={c.subjectId} className="enter" style={{ ["--i" as string]: ci + 3 }}>
            <CardHeader title={c.courseTitle} subtitle={c.name} action={<span className="t-num text-lg">{c.progress}%</span>} />
            <ul className="space-y-5">
              {c.topics.map((t) => (
                <li key={t.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Link href={t.locked ? `/student/path?course=${t.subjectId}&gap=${t.id}` : `/student/learn/${t.id}`} className="font-medium transition hover:text-brand">{t.name}</Link>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="relative">
                    <ProgressBar value={t.score} size="sm" tone={t.status === "mastered" ? "success" : t.status === "attention" ? "warn" : "brand"} label={`${t.name} mastery`} />
                    <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink/30" style={{ left: "60%" }} aria-hidden />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{t.started ? `${t.score}% · ${BAND_LABEL[t.band]} · ${t.attempts} answers` : t.locked ? "Locked" : "Not started"}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
