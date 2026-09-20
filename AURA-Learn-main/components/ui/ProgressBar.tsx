import { cn, clamp } from "@/lib/utils";

export type ProgressTone = "brand" | "accent" | "success" | "warn" | "danger";

const fills: Record<ProgressTone, string> = {
  brand: "bg-brand",
  accent: "bg-accent",
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
};

interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

export function ProgressBar({ value, tone = "brand", size = "md", label, className }: ProgressBarProps) {
  const pct = clamp(Math.round(value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-subtle", heights[size], className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fills[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
