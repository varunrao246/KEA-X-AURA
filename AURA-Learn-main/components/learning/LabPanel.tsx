import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export interface LabSummary { id: string; title: string; blurb: string; minutes: number; best: number | null }

export function LabPanel({ labs, topicName }: { labs: LabSummary[]; topicName: string }) {
  if (labs.length === 0) {
    return <Card padding="none"><EmptyState icon={FlaskConical} title="No lab for this topic yet" description={`${topicName} doesn't have a virtual lab. Practice questions are the best way to build mastery here.`} /></Card>;
  }
  return (
    <div className="space-y-4">
      {labs.map((l) => (
        <Link key={l.id} href={`/student/labs/${l.id}`} className="block">
          <Card interactive className="flex items-center gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><FlaskConical className="size-7" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <h3 className="t-heading">{l.title}</h3>
              <p className="t-small mt-0.5">{l.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{l.minutes} min</Badge>
                {l.best !== null ? <Badge tone="success">Best score {l.best}%</Badge> : <Badge tone="brand">Counts towards mastery</Badge>}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
