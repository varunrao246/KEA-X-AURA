import { cn } from "@/lib/utils";

/** The aura mark: a solid core with two open orbits. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn("size-8", className)}>
      <circle cx="16" cy="16" r="5" className="fill-brand" />
      <path d="M16 6.5a9.5 9.5 0 1 1-9.5 9.5" className="stroke-brand" strokeWidth="2.2" strokeLinecap="round" opacity=".75" />
      <path d="M16 1.75a14.25 14.25 0 1 1-14.25 14.25" className="stroke-accent" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="text-[19px] font-semibold tracking-tight">
          AURA<span className="ml-1 font-normal text-muted">Learn</span>
        </span>
      )}
    </span>
  );
}
