"use client";

import type { LucideIcon } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Small dot to draw attention, e.g. when AURA has a suggestion. */
  alert?: boolean;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Accessible tab list with arrow-key navigation. Panels are rendered by the caller. */
export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" className={cn("scrollbar-none inline-flex max-w-full overflow-x-auto rounded-2xl border border-line bg-subtle p-1", className)}>
      {tabs.map((t, i) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-medium transition sm:gap-2 sm:px-4 sm:text-sm",
              active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {t.label}
            {t.alert && <span className="size-2 rounded-full bg-danger" aria-label="AURA has a suggestion" />}
          </button>
        );
      })}
    </div>
  );
}
