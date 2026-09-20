import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { DemoLoginCard, type DemoAccount } from "@/components/auth/DemoLoginCard";
import { LearningLoopVisual } from "@/components/auth/LearningLoopVisual";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getCurrentUser } from "@/lib/auth";
import { listDemoAccounts } from "@/lib/repo";
import { homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const current = await getCurrentUser();
  if (current) redirect(homeFor(current.role));

  const accounts: DemoAccount[] = listDemoAccounts().map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    subtitle: u.role === "student" ? `Grade ${u.grade} · ${u.school}` : `Class 9A · ${u.school}`,
  }));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.08fr_0.92fr]">
      {/* Brand panel */}
      <section className="relative overflow-hidden px-6 py-8 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14">
        <div className="pointer-events-none absolute -left-40 -top-40 hidden size-[38rem] lg:block" aria-hidden>
          <div className="absolute inset-0 animate-aura-pulse rounded-full border border-brand/15" />
          <div className="absolute inset-16 animate-aura-pulse rounded-full border border-brand/20 [animation-delay:-2s]" />
          <div className="absolute inset-32 animate-aura-pulse rounded-full border border-accent/25 [animation-delay:-4s]" />
        </div>

        <div className="relative flex items-center justify-between">
          <Logo />
          <ThemeToggle className="lg:hidden" />
        </div>

        <div className="relative mt-10 max-w-xl lg:mt-0">
          <p className="t-eyebrow mb-4">Adaptive Understanding &amp; Responsive Assistance</p>
          <h1 className="t-display">
            Learn your way.
            <br />
            <span className="text-brand">Master at your pace.</span>
          </h1>
          <p className="t-body mt-5 max-w-md text-base">
            One outcome for every student, a different path to get there.
          </p>
        </div>

        <LearningLoopVisual />
      </section>

      {/* Sign-in panel */}
      <section className="relative flex items-center justify-center px-6 pb-12 pt-4 sm:px-10 lg:bg-subtle/60 lg:py-14">
        <div className="absolute right-6 top-6 hidden lg:block">
          <ThemeToggle />
        </div>
        <div className="enter w-full max-w-md">
          <AuthPanel />
          <div className="my-7 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-line" /><span className="text-xs font-medium uppercase tracking-[0.14em] text-faint">or explore</span><span className="h-px flex-1 bg-line" />
          </div>
          <details className="rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Use a ready-made demo account</summary>
            <p className="t-small mt-2">Try the complete student or facilitator flow without registering.</p>
            <div className="mt-4"><DemoLoginCard accounts={accounts} /></div>
          </details>
        </div>
      </section>
    </div>
  );
}
