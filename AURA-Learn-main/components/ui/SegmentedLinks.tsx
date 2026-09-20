import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SegmentItem {
  href: string;
  label: ReactNode;
  sublabel?: string;
  active: boolean;
}

/** Pill switcher made of real links, so the selected view is in the URL and works without client state. */
export function SegmentedLinks({ items, className }: { items: SegmentItem[]; className?: string }) {
  return (
    <nav aria-label="Course" className={cn("scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          scroll={false}
          className={cn(
            "shrink-0 rounded-2xl border px-4 py-2.5 text-left transition active:scale-[0.98]",
            item.active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink",
          )}
        >
          <span className="block text-sm font-semibold leading-tight">{item.label}</span>
          {item.sublabel && <span className="mt-0.5 block text-xs opacity-80">{item.sublabel}</span>}
        </Link>
      ))}
    </nav>
  );
}
