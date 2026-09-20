"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { isActive, NAV } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIMARY_COUNT = 4;

/** Bottom tab bar for phones. The first four destinations are tabs, the rest live under "More". */
export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = NAV[role];
  const primary = items.slice(0, PRIMARY_COUNT);
  const overflow = items.slice(PRIMARY_COUNT);
  const overflowActive = overflow.some((i) => isActive(pathname, i.href, role));

  useEffect(() => setMoreOpen(false), [pathname]);

  const tab = (active: boolean) =>
    cn(
      "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition active:scale-95",
      active ? "text-brand" : "text-muted",
    );

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href, role);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={tab(active)}>
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-brand" aria-hidden />}
              <Icon className="size-[22px]" aria-hidden />
              {label.length > 10 ? label.split(" ")[0] : label}
            </Link>
          );
        })}
        {overflow.length > 0 && (
          <button type="button" onClick={() => setMoreOpen(true)} className={tab(overflowActive)}>
            {overflowActive && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-brand" aria-hidden />}
            <Ellipsis className="size-[22px]" aria-hidden />
            More
          </button>
        )}
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-2 gap-2">
          {overflow.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, role);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex h-14 items-center gap-3 rounded-2xl border px-4 font-medium transition",
                  active ? "border-brand bg-brand-soft text-brand" : "border-line text-ink hover:bg-subtle",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
