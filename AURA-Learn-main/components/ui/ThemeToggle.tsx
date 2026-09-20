"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light/dark switch. The initial theme is applied before paint by the inline script in
 * app/layout.tsx, so this component only flips the attribute and remembers the choice.
 * Icons swap via CSS, which avoids a hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("aura-theme", next);
    } catch {
      /* storage unavailable, the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-ink active:scale-95",
        className,
      )}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </button>
  );
}
