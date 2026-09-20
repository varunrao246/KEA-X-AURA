import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Positive/negative change, shown as a small trend chip. */
  delta?: number;
  deltaSuffix?: string;
  className?: string;
}

export function StatTile({ label, value, icon: Icon, delta, deltaSuffix = "%", className }: StatTileProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("surface p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="t-eyebrow">{label}</span>
        {Icon && <Icon className="size-4 text-faint" aria-hidden />}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="t-num text-4xl">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
            {Math.abs(delta)}
            {deltaSuffix}
          </span>
        )}
      </div>
    </div>
  );
}
