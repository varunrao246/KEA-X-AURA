import type { ReactNode } from "react";
import { cn, clamp } from "@/lib/utils";
import type { ProgressTone } from "./ProgressBar";

const strokes: Record<ProgressTone, string> = {
  brand: "stroke-brand",
  accent: "stroke-accent",
  success: "stroke-success",
  warn: "stroke-warn",
  danger: "stroke-danger",
};

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: ProgressTone;
  label?: string;
  children?: ReactNode;
  className?: string;
}

/** Circular progress. Children render centred (e.g. the percentage). */
export function ProgressRing({ value, size = 120, stroke = 10, tone = "brand", label, children, className }: ProgressRingProps) {
  const pct = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-subtle" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", strokes[tone])}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
