import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "brand" | "accent" | "success" | "warn" | "danger";

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: "bg-subtle text-muted", dot: "bg-faint" },
  brand: { box: "bg-brand-soft text-brand", dot: "bg-brand" },
  accent: { box: "bg-accent-soft text-accent", dot: "bg-accent" },
  success: { box: "bg-success-soft text-success", dot: "bg-success" },
  warn: { box: "bg-warn-soft text-warn", dot: "bg-warn" },
  danger: { box: "bg-danger-soft text-danger", dot: "bg-danger" },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        tones[tone].box,
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("size-1.5 rounded-full", tones[tone].dot)} aria-hidden />}
      {children}
    </span>
  );
}
