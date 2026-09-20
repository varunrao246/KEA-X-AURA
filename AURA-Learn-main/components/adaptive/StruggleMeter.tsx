import { AlertTriangle, CheckCircle2, Eye, Siren, type LucideIcon } from "lucide-react";
import { STRUGGLE_LEVEL_LABEL, STRUGGLE_THRESHOLDS, type StruggleLevel } from "@/lib/struggle";
import { cn } from "@/lib/utils";

const META: Record<StruggleLevel, { icon: LucideIcon; text: string; chip: string }> = {
  normal: { icon: CheckCircle2, text: "text-success", chip: "bg-success-soft text-success" },
  watch: { icon: Eye, text: "text-warn", chip: "bg-warn-soft text-warn" },
  intervention: { icon: AlertTriangle, text: "text-danger", chip: "bg-danger-soft text-danger" },
  immediate: { icon: Siren, text: "text-danger", chip: "bg-danger text-brand-on" },
};

export function StruggleChip({ level, score, className }: { level: StruggleLevel; score?: number; className?: string }) {
  const { icon: Icon, chip } = META[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", chip, className)}>
      <Icon className="size-3.5" aria-hidden />
      {STRUGGLE_LEVEL_LABEL[level]}
      {score !== undefined && <span className="tabular-nums opacity-80">· {score}</span>}
    </span>
  );
}

/** Four labelled zones (Normal / Watch / Intervention / Immediate) with a marker at the current score. */
export function StruggleMeter({ score, level, label = "Struggle score", showScale = true }: { score: number; level: StruggleLevel; label?: string; showScale?: boolean }) {
  const { text } = META[level];
  const { watch, intervention, immediate } = STRUGGLE_THRESHOLDS;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="whitespace-nowrap text-sm font-medium">{label}</span>
        <StruggleChip level={level} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("t-num text-3xl", text)}>{score}</span>
        <span className="text-sm text-muted">/ 100</span>
      </div>
      <div className="relative mt-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`${label}: ${score} of 100, ${STRUGGLE_LEVEL_LABEL[level]}`}>
        <div className="flex h-3 overflow-hidden rounded-full">
          <span className="bg-success/30" style={{ width: `${watch}%` }} />
          <span className="bg-warn/35" style={{ width: `${intervention - watch}%` }} />
          <span className="bg-danger/30" style={{ width: `${immediate - intervention}%` }} />
          <span className="bg-danger/60" style={{ width: `${100 - immediate}%` }} />
        </div>
        <span className="absolute -top-1 h-5 w-1.5 -translate-x-1/2 rounded-full bg-ink ring-2 ring-surface transition-[left] duration-700 ease-out" style={{ left: `${Math.min(99, Math.max(1, score))}%` }} aria-hidden />
      </div>
      {showScale && (
        <div className="relative mt-1.5 h-4 text-[11px] text-faint" aria-hidden>
          {[watch, intervention, immediate].map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${t}%` }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
