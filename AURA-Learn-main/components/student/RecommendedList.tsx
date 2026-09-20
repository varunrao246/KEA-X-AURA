import { ArrowRight, BookOpen, Compass, FlaskConical, LifeBuoy, Play, Target, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Recommendation } from "@/lib/student";
import { cn } from "@/lib/utils";

const ICONS: Record<Recommendation["kind"], { icon: LucideIcon; tone: string }> = {
  practice: { icon: Target, tone: "bg-warn-soft text-warn" },
  learn: { icon: BookOpen, tone: "bg-brand-soft text-brand" },
  lab: { icon: FlaskConical, tone: "bg-accent-soft text-accent" },
  continue: { icon: Play, tone: "bg-brand-soft text-brand" },
  explore: { icon: Compass, tone: "bg-success-soft text-success" },
  intervention: { icon: LifeBuoy, tone: "bg-danger-soft text-danger" },
};

export function RecommendedList({ items }: { items: Recommendation[] }) {
  return (
    <Card className="enter" style={{ ["--i" as string]: 3 }}>
      <CardHeader title="Recommended for you" subtitle="Picked from your mastery, pace and how you like to learn" />
      <ul className="-mx-2 divide-y divide-line">
        {items.map((r) => {
          const { icon: Icon, tone } = ICONS[r.kind];
          return (
            <li key={r.id}>
              <Link href={r.href} className="group flex items-center gap-4 rounded-2xl px-2 py-3.5 transition hover:bg-subtle">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.title}</span>
                  <span className="t-small mt-0.5 block">{r.reason}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
