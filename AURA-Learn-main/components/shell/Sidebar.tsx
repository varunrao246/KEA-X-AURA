"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { isActive, NAV } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href={items[0].href} aria-label="AURA Learn home">
          <Logo />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href, role);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
                active ? "bg-brand-soft text-brand" : "text-muted hover:bg-subtle hover:text-ink",
              )}
            >
              {active && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-brand" aria-hidden />}
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl bg-subtle p-4">
          <p className="text-sm font-semibold">Learn your way.</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">Master at your pace.</p>
        </div>
      </div>
    </aside>
  );
}
