import { ArrowRight, ChevronRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterventionQueueCard } from "@/components/facilitator/InterventionQueueCard";
import { AdaptiveTimeline } from "@/components/adaptive/AdaptiveTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusPill } from "@/components/ui/StatusPill";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { interventionQueue, studentDetail } from "@/lib/facilitator";
import { bandLabel } from "@/lib/band";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const user = getStore().users.find((u) => u.id === studentId);
  return { title: user?.name ?? "Student" };
}

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  await requireUser("facilitator");
  const { studentId } = await params;
  const store = getStore();
  const user = store.users.find((u) => u.id === studentId && u.role === "student");
  if (!user) notFound();

  const { state, insights, recommended } = studentDetail(store, studentId);
  const activeCases = interventionQueue(store).filter((i) => i.studentId === studentId);
  const blocked = state.topics.filter((t) => t.locked);

  return (
    <div className="page py-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="enter mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/facilitator/students" className="transition hover:text-ink">Students</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-ink">{user.name}</span>
      </nav>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={user.name} size="lg" /> {user.name}
          </span>
        }
        description={`Grade ${user.grade ?? "–"} · ${user.school ?? "Greenfield Public School"}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* 3. Active interventions */}
          <section>
            <h2 className="t-heading mb-4">Active interventions</h2>
            {activeCases.length === 0 ? (
              <Card padding="none"><EmptyState icon={Sparkles} title="No active case" description={`${user.name.split(" ")[0]} isn't currently flagged for anything — AURA opens a case automatically if that changes.`} /></Card>
            ) : (
              <div className="space-y-5">{activeCases.map((item) => <InterventionQueueCard key={item.id} item={item} />)}</div>
            )}
          </section>

          {/* 1. Learning progress */}
          <section>
            <h2 className="t-heading mb-4">Learning progress</h2>
            <div className="grid gap-4">
              {state.courses.map((c) => (
                <Card key={c.subjectId}>
                  <CardHeader title={c.courseTitle} subtitle={`${c.name} · ${c.masteredCount}/${c.topics.length} mastered`} action={<span className="t-num text-xl">{c.progress}%</span>} />
                  <div className="space-y-3">
                    {c.topics.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <div className="mt-1.5"><ProgressBar value={t.score} size="sm" tone={t.score >= 80 ? "success" : t.score >= 60 ? "brand" : "warn"} /></div>
                        </div>
                        <StatusPill status={t.status} />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 4. Recent learning activity */}
          <section>
            <h2 className="t-heading mb-4">Recent learning activity</h2>
            <Card>
              {state.events.length === 0 ? (
                <p className="t-small">No activity yet.</p>
              ) : (
                <AdaptiveTimeline events={state.events} />
              )}
            </Card>
          </section>
        </div>

        <aside className="space-y-6">
          {/* Overview ring */}
          <Card className="flex flex-col items-center text-center">
            <ProgressRing value={state.overall.mastery} tone={state.overall.mastery >= 60 ? "brand" : "warn"} size={112}>
              <span className="t-num text-2xl">{state.overall.mastery}%</span>
            </ProgressRing>
            <p className="t-small mt-3">Overall mastery · {bandLabel(state.overall.mastery)}</p>
            <div className="mt-4 grid w-full grid-cols-2 gap-3 border-t border-line pt-4 text-left">
              <div><p className="t-eyebrow">Accuracy</p><p className="t-num text-lg">{state.overall.accuracy}%</p></div>
              <div><p className="t-eyebrow">Streak</p><p className="t-num text-lg">{state.overall.streak}d</p></div>
            </div>
          </Card>

          {/* 2. Current blockers */}
          <Card>
            <CardHeader title="Current blockers" />
            {blocked.length === 0 ? (
              <p className="t-small">Nothing is locked — every topic they've reached is open.</p>
            ) : (
              <ul className="space-y-2.5">
                {blocked.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 text-sm">
                    <Lock className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                    <span>
                      <span className="font-medium">{t.name}</span> needs{" "}
                      {t.missing.map((m, i) => (
                        <span key={m.id}>{i > 0 && ", "}<span className="font-medium">{m.name}</span> ({m.score}%)</span>
                      ))}
                      {" "}at 60%+.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 5. Recommended next action */}
          <Card>
            <CardHeader title="Recommended next" />
            <ul className="space-y-3">
              {recommended.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="flex items-start justify-between gap-2 rounded-xl border border-line px-3.5 py-3 text-sm transition hover:border-brand/40">
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="mt-0.5 block text-muted">{r.reason}</span>
                    </span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {(insights.strengths.length > 0 || insights.attention.length > 0) && (
            <Card>
              <CardHeader title="Learning profile" />
              {insights.strengths.length > 0 && (
                <div className="mb-4">
                  <p className="t-eyebrow mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-2">{insights.strengths.map((s) => <Badge key={s.title} tone="success">{s.title}</Badge>)}</div>
                </div>
              )}
              {insights.attention.length > 0 && (
                <div>
                  <p className="t-eyebrow mb-2">Worth reinforcing</p>
                  <div className="flex flex-wrap gap-2">{insights.attention.map((s) => <Badge key={s.title} tone="warn">{s.title}</Badge>)}</div>
                </div>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
