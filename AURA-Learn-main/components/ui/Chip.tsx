"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  selected?: boolean;
  onToggle?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Large selectable pill / card. Used for onboarding interests and preferences. */
export function Chip({ selected, onToggle, icon, children, className }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!selected}
      onClick={onToggle}
      className={cn(
        "group relative flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition duration-150 active:scale-[0.98]",
        selected
          ? "border-brand bg-brand-soft text-brand shadow-sm"
          : "border-line bg-surface text-ink hover:border-brand/40 hover:bg-subtle",
        className,
      )}
    >
      {icon && <span className="grid size-8 place-items-center text-xl">{icon}</span>}
      <span className="flex-1">{children}</span>
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full transition",
          selected ? "bg-brand text-brand-on" : "border border-line",
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}
