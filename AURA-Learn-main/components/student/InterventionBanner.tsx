import { ArrowRight, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { interventionStatusLabel } from "@/lib/format";
import type { Intervention } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Dashboard alert for the most urgent open case. Reads the stored case, so it is exactly what the engine decided. */
export function InterventionBanner({ intervention: iv, topicName, blocksName }: { intervention: Intervention; topicName: string; blocksName?: string }) {
  const urgent = iv.severity === "immediate";
  const step = iv.actions.find((a) => a.kind === "prerequisite") ?? iv.actions.find((a) => a.href);
  return (
    <section aria-label="AURA intervention" className={cn("enter mb-6 rounded-3xl border p-5 sm:p-6", urgent ? "border-danger/40 bg-danger-soft/50" : "border-warn/40 bg-warn-soft/50")}>
      <div className="flex flex-wrap items-start gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-brand-on", urgent ? "bg-danger" : "bg-warn")}>
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="t-heading">AURA noticed {topicName} is tricky right now</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed">{iv.reason}</p>
          <p className="t-small mt-2">
            {blocksName && (
              <>
                Holding back <span className="font-medium text-ink">{blocksName}</span> ·{" "}
              </>
            )}
            {interventionStatusLabel(iv.status, iv.studentRequestedHelp)}
          </p>
        </div>
        {step?.href && (
          <Link href={step.href} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98]">
            {step.label} <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </section>
  );
}
