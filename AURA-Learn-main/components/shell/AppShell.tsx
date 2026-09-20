"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { NAV } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

interface AppShellProps {
  role: Role;
  user: { name: string; subtitle: string };
  children: ReactNode;
}

/**
 * Responsive frame shared by both roles: fixed sidebar on desktop, bottom tab bar on phones,
 * a slim top bar everywhere. Feature screens only render their own content inside <main>.
 */
export function AppShell({ role, user, children }: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-dvh">
        <Sidebar role={role} />

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6 lg:px-8">
            <Link href={NAV[role][0].href} className="lg:hidden" aria-label="AURA Learn home">
              <Logo />
            </Link>
            <div className="hidden lg:block">
              <Badge tone={role === "student" ? "brand" : "accent"} dot>
                {role === "student" ? "Student space" : "Facilitator space"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu name={user.name} subtitle={user.subtitle} />
            </div>
          </header>

          <main id="main" className="pb-28 lg:pb-12">
            {children}
          </main>
        </div>

        <MobileNav role={role} />
      </div>
    </ToastProvider>
  );
}
