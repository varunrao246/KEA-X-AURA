"use client";

import { BookOpenText, Check, FlaskConical, HandHelping, LifeBuoy, Link2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { interventionStatusLabel } from "@/lib/format";
import type { InterventionSummary } from "@/lib/intervention";
import type { InterventionActionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<InterventionActionKind, typeof LifeBuoy> = { simpler: BookOpenText, prerequisite: Link2, lab: FlaskConical, facilitator: HandHelping };

interface Props {
  intervention: InterventionSummary;
  topicName: string;
  /** Name of the locked topic this is holding back. */
  blocksName?: string;
  onSimpler?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/** PRD section 13: not "your score is low", but the likely cause and a specific next step. */
export function InterventionCard({ intervention: iv, topicName, blocksName, onSimpler, onDismiss, className }: Props) {
  const toast = useToast();
  const [asked, setAsked] = useState(iv.studentRequestedHelp);
  const [busy, setBusy] = useState(false);
  const urgent = iv.severity === "immediate";

  async function askFacilitator() {
    setBusy(true);
    try {
      const res = await fetch("/api/interventions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ask-facilitator", topicId: iv.topicId }) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setAsked(true);
      toast.success("Your facilitator has been told", "It will show at the top of their list.");
    } catch {
      toast.error("Couldn't reach your facilitator", "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="AURA intervention" className={cn("enter rounded-3xl border p-5 sm:p-6", urgent ? "border-danger/40 bg-danger-soft/50" : "border-warn/40 bg-warn-soft/50", className)}>
      <div className="flex items-start gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", urgent ? "bg-danger text-brand-on" : "bg-warn text-brand-on")}>
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="t-heading">AURA Intervention</h3>
            <span className="rounded-full bg-surface/70 px-2.5 py-0.5 text-xs font-medium">{urgent ? "Needs attention now" : "Suggested"}</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">{iv.reason}</p>
          <p className="t-small mt-2">
            Main issue: <span className="font-medium text-ink">{iv.mainIssue}</span>
            {blocksName && <> · Holding back <span className="font-medium text-ink">{blocksName}</span></>}
          </p>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="Hide for now" className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface/70 hover:text-ink">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {iv.assignedAction?.href && (
          <Button href={iv.assignedAction.href} variant="primary" className="justify-start sm:col-span-2" iconLeft={<Check className="size-4" />}>
            Your facilitator assigned: {iv.assignedAction.label}
          </Button>
        )}
        {iv.actions.map((a, i) => {
          const Icon = ICON[a.kind];
          const primary = a.kind === "prerequisite" && !iv.assignedAction;
          if (a.kind === "facilitator") {
            return (
              <Button key={a.kind} variant="secondary" disabled={asked} loading={busy} className="justify-start" iconLeft={asked ? <Check className="size-4 text-success" /> : <Icon className="size-4" />} onClick={askFacilitator}>
                {asked ? "Facilitator notified" : a.label}
              </Button>
            );
          }
          if (a.kind === "simpler") {
            return <Button key={a.kind} variant="secondary" className="justify-start" iconLeft={<Icon className="size-4" />} onClick={onSimpler}>{a.label}</Button>;
          }
          return <Button key={`${a.kind}-${i}`} href={a.href} variant={primary ? "primary" : "secondary"} className="justify-start" iconLeft={<Icon className="size-4" />}>{a.label}</Button>;
        })}
      </div>

      <p className="t-small mt-4">{interventionStatusLabel(iv.status, asked, !!iv.assignedAction)}</p>
    </section>
  );
}
