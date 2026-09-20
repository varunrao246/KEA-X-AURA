"use client";

import { CircleUserRound, ChevronDown, LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  name: string;
  subtitle: string;
}

export function UserMenu({ name, subtitle }: UserMenuProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"logout" | "reset" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setBusy("logout");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  async function resetDemo() {
    setBusy("reset");
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Demo reset", "Everything is back to the starting story.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reset the demo", "Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-subtle"
      >
        <span className="grid size-8 place-items-center rounded-full bg-subtle text-muted" aria-hidden>
          <CircleUserRound className="size-5" />
        </span>
        <ChevronDown className={cn("size-4 text-faint transition", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 animate-pop rounded-2xl border border-line bg-surface p-2 shadow-pop"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-muted" aria-hidden>
              <CircleUserRound className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted">{subtitle}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            onClick={resetDemo}
            disabled={busy !== null}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-subtle hover:text-ink disabled:opacity-50"
          >
            <RotateCcw className={cn("size-4", busy === "reset" && "animate-spin")} aria-hidden />
            Reset demo data
          </button>
          <button
            role="menuitem"
            onClick={logout}
            disabled={busy !== null}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-subtle hover:text-ink disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
