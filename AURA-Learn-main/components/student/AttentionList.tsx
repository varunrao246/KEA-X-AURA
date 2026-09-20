import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { TopicState } from "@/lib/student";

export function AttentionList({ topics }: { topics: TopicState[] }) {
  return (
    <Card className="enter" style={{ ["--i" as string]: 3 }}>
      <CardHeader title="Needs attention" subtitle="Concepts worth a little extra practice" />
      {topics.length === 0 ? (
        <EmptyState icon={PartyPopper} title="Nothing needs attention" description="You're on track everywhere. Keep the streak going." className="py-8" />
      ) : (
        <ul className="space-y-4">
          {topics.map((t) => (
            <li key={t.id} className="rounded-2xl bg-subtle p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="t-small mt-0.5">
                    {t.accuracy}% accuracy
                    {t.unlocks[0] ? ` · needed for ${t.unlocks[0].name}` : ""}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </div>
              <div className="relative">
                <ProgressBar value={t.score} tone="warn" label={`${t.name} mastery`} />
                <span className="absolute -top-1 h-4 w-0.5 rounded bg-ink/40" style={{ left: "60%" }} aria-hidden title="Unlock threshold" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{t.score}% mastery</span>
                <span>Unlock at 60%</span>
              </div>
              <Button href={`/student/learn/${t.id}?tab=practice`} size="sm" variant="soft" className="mt-4" fullWidth>
                Practice {t.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
