import { CheckCircle2 } from "lucide-react";
import { InterventionQueueCard } from "@/components/facilitator/InterventionQueueCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { interventionQueue } from "@/lib/facilitator";

export const metadata = { title: "Intervention Queue" };
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  await requireUser("facilitator");
  const queue = interventionQueue(getStore());
  const immediate = queue.filter((i) => i.severity === "immediate").length;

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader
        eyebrow="Intervention Queue"
        title="Students AURA thinks need you"
        description={queue.length ? `${queue.length} active case${queue.length === 1 ? "" : "s"}${immediate ? `, ${immediate} needing attention now` : ""}. Most urgent first.` : "Nothing needs you right now."}
      />
      {queue.length === 0 ? (
        <Card padding="none">
          <EmptyState icon={CheckCircle2} title="No active interventions" description="AURA opens a case here automatically when a student's struggle score crosses the threshold, or when they ask for help directly." />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {queue.map((item) => <InterventionQueueCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
