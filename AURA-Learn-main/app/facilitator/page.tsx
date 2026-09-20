import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { InterventionQueueCard } from "@/components/facilitator/InterventionQueueCard";
import { Greeting } from "@/components/shell/Greeting";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { facilitatorOverview, interventionQueue } from "@/lib/facilitator";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function FacilitatorHome() {
  const user = await requireUser("facilitator");
  const surname = user.name.split(" ").at(-1) ?? user.name;
  const store = getStore();
  const overview = facilitatorOverview(store);
  const queue = interventionQueue(store).slice(0, 3);

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="Class 9A"
        title={<Greeting name={`Ms. ${surname}`} />}
        description="Here's how your class is doing today."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatTile label="Students needing attention" value={overview.studentsNeedingAttention} icon={AlertTriangle} />
        <StatTile label="Active interventions" value={overview.activeInterventions} icon={ShieldAlert} />
        <StatTile label="Resolved in the last 24h" value={overview.recentlyResolved} icon={CheckCircle2} />
      </div>

      {overview.topicInsight && (
        <Card className="enter mb-8 flex items-center gap-3 border-brand/30 bg-brand-soft/40">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-on"><Users className="size-4" aria-hidden /></span>
          <p className="text-[15px]">{overview.topicInsight}</p>
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="t-heading">Active interventions</h2>
        {queue.length > 0 && (
          <Link href="/facilitator/queue" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View all {overview.activeInterventions} <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {queue.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={CheckCircle2} title="No active interventions" description="Nobody in your class currently needs a nudge. AURA will surface a case here the moment a student starts to struggle." />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {queue.map((item) => <InterventionQueueCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
