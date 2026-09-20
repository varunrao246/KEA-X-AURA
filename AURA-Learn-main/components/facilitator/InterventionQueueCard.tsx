"use client";

import { Eye, PlayCircle, ShieldAlert, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { facilitatorStatusLabel, timeAgo } from "@/lib/format";
import type { FacilitatorAction } from "@/lib/intervention";
import type { QueueItem } from "@/lib/facilitator";
import { cn } from "@/lib/utils";

/**
 * One active case in the facilitator queue. WHO / WHY / WHAT NEXT, plus the facilitator's own
 * actions — all through the SAME intervention state machine the student side uses.
 */
export function InterventionQueueCard({ item }: { item: QueueItem }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<FacilitatorAction | null>(null);
  const urgent = item.severity === "immediate";

  async function act(action: FacilitatorAction) {
    if (busy) return; // one action in flight at a time — prevents a second click firing a concurrent transition
    setBusy(action);
    try {
      const res = await fetch(`/api/interventions/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(action === "resolve" ? "Case resolved" : action === "assign" ? "Refresher assigned" : action === "start" ? "Marked as helping" : "Marked as reviewed", `${item.studentName} will see this next time they open AURA.`);
      router.refresh();
    } catch (e) {
      toast.error("Couldn't update this case", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className={cn("enter space-y-4", urgent ? "border-danger/40 bg-danger-soft/40" : "border-warn/40 bg-warn-soft/40")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={item.studentName} />
          <div>
            <p className="font-semibold">{item.studentName}</p>
            <p className="t-small">{item.topicName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.studentRequestedHelp && <Badge tone="brand" dot>Asked for help</Badge>}
          <Badge tone={urgent ? "danger" : "warn"}>{urgent ? "Needs attention now" : "Suggested"}</Badge>
        </div>
      </div>

      <div>
        <p className="text-[15px] leading-relaxed">{item.reason}</p>
        <p className="t-small mt-2">
          Main issue: <span className="font-medium text-ink">{item.mainIssue}</span>
          <span className="mx-1.5">·</span>
          Struggle score <span className="t-num font-medium text-ink">{item.riskScore}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-surface/70 p-3.5">
        <p className="t-small font-semibold text-ink">Recommended: {item.recommendedAction}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
        <Button href={`/facilitator/students/${item.studentId}`} variant="secondary" size="sm" iconLeft={<User className="size-4" />}>View student</Button>
        <span className="flex-1" />
        {(item.status === "recommended" || item.status === "detected") && (
          <Button variant="ghost" size="sm" disabled={!!busy} loading={busy === "review"} onClick={() => act("review")} iconLeft={<Eye className="size-4" />}>Mark reviewed</Button>
        )}
        {item.status === "viewed" && (
          <Button variant="soft" size="sm" disabled={!!busy} loading={busy === "assign"} onClick={() => act("assign")} iconLeft={<PlayCircle className="size-4" />}>Assign refresher</Button>
        )}
        <Button variant="primary" size="sm" disabled={!!busy} loading={busy === "resolve"} onClick={() => act("resolve")} iconLeft={<ShieldAlert className="size-4" />}>Mark resolved</Button>
      </div>

      <p className="t-small flex items-center gap-1.5">
        {facilitatorStatusLabel(item.status, item.studentRequestedHelp)}
        <span className="text-faint">· updated {timeAgo(item.updatedAt)}</span>
      </p>
    </Card>
  );
}
