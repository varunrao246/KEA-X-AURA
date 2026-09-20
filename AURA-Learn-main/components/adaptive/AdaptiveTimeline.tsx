import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, FlaskConical, Link2, LockOpen, Trophy, Eye, type LucideIcon } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { AdaptiveEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<string, LucideIcon> = { level: ArrowUp, struggle: Eye, intervention: AlertTriangle, unlock: LockOpen, mastered: Trophy, lab: FlaskConical, prerequisite: Link2 };
const TONE: Record<AdaptiveEvent["tone"], string> = {
  good: "bg-success-soft text-success",
  info: "bg-brand-soft text-brand",
  warn: "bg-warn-soft text-warn",
  alert: "bg-danger-soft text-danger",
};

export function AdaptiveTimeline({ events, empty = "Nothing yet. AURA's decisions will appear here as you learn." }: { events: AdaptiveEvent[]; empty?: string }) {
  if (events.length === 0) return <p className="t-small">{empty}</p>;
  return (
    <ol className="space-y-4">
      {events.map((e) => {
        let Icon = ICON[e.type] ?? CheckCircle2;
        if (e.type === "level" && e.title.toLowerCase().startsWith("difficulty")) Icon = ArrowDown;
        return (
          <li key={e.id} className="flex gap-3">
            <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", TONE[e.tone])}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{e.title}</p>
              <p className="t-small mt-0.5">{e.detail}</p>
              <p className="mt-0.5 text-xs text-faint" suppressHydrationWarning>{timeAgo(e.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
