import { Flame, Gauge, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { paceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StudentState } from "@/lib/student";

export function LearningPulse({ state }: { state: StudentState }) {
  const { overall, profile, topics } = state;
  const masteredCount = topics.filter((t) => t.status === "mastered").length;
  const tone = overall.mastery >= 80 ? "success" : "brand";

  return (
    <Card padding="lg" className="enter" style={{ ["--i" as string]: 2 }}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-5">
          <ProgressRing value={overall.mastery} size={132} stroke={11} tone={tone} label="Overall mastery">
            <div className="text-center">
              <div className="t-num text-3xl leading-none">{overall.mastery}%</div>
              <div className="t-eyebrow mt-1.5">Mastery</div>
            </div>
          </ProgressRing>
          <div className="sm:hidden">
            <TrendChip delta={overall.weeklyDelta} />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="hidden sm:block">
            <TrendChip delta={overall.weeklyDelta} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Flame className={cn("size-5", overall.streak > 0 ? "text-warn" : "text-faint")} aria-hidden />
              <span className="font-semibold">
                {overall.streak > 0 ? `${overall.streak}-day streak` : "Start a streak today"}
              </span>
            </div>
            <ul className="mt-3 flex gap-1.5" aria-label="Activity over the last 7 days">
              {overall.activity.map((d) => (
                <li key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    title={`${d.label}: ${d.count} question${d.count === 1 ? "" : "s"}`}
                    className={cn(
                      "h-2.5 w-full rounded-full",
                      d.count > 0 ? "bg-warn" : d.today ? "border border-dashed border-faint" : "bg-subtle",
                    )}
                  />
                  <span className={cn("text-[11px]", d.today ? "font-semibold text-ink" : "text-faint")}>{d.label[0]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-3 divide-x divide-line border-t border-line pt-5">
        <Stat icon={Target} label="Accuracy" value={`${overall.accuracy}%`} />
        <Stat icon={Gauge} label="Pace" value={paceLabel(profile.learningPace)} />
        <Stat icon={TrendingUp} label="Mastered" value={`${masteredCount}/${topics.length}`} />
      </dl>
    </Card>
  );
}

function TrendChip({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <div>
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold", up ? "bg-success-soft text-success" : "bg-warn-soft text-warn")}>
        {up ? "+" : "−"}{Math.abs(delta)}% this week
      </span>
      <p className="t-small mt-1.5">{up ? "You're improving." : "A small dip. Practice will bring it back."}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="px-2 text-center first:pl-0 last:pr-0 sm:px-4">
      <dt className="t-eyebrow flex items-center justify-center gap-1.5">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="t-num mt-1.5 text-xl">{value}</dd>
    </div>
  );
}
