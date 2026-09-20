import { AlertTriangle, BookOpenCheck, CheckCircle2, Lock, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "./Badge";

import type { TopicStatus } from "@/lib/student";
export type { TopicStatus };

export const topicStatusMeta: Record<TopicStatus, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  mastered: { label: "Mastered", tone: "success", icon: CheckCircle2 },
  learning: { label: "Learning", tone: "brand", icon: BookOpenCheck },
  attention: { label: "Needs attention", tone: "warn", icon: AlertTriangle },
  locked: { label: "Locked", tone: "neutral", icon: Lock },
};

export function StatusPill({ status, className }: { status: TopicStatus; className?: string }) {
  const { label, tone, icon: Icon } = topicStatusMeta[status];
  return (
    <Badge tone={tone} className={className}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Badge>
  );
}
