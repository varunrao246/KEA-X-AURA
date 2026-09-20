"use client";

import { ArrowRight, GraduationCap, Presentation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface DemoAccount {
  id: string;
  name: string;
  role: "student" | "facilitator";
  subtitle: string;
}

export function DemoLoginCard({ accounts }: { accounts: DemoAccount[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(id: string) {
    setPending(id);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Sign in failed");
      router.push(json.data.redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPending(null);
    }
  }

  if (accounts.length === 0) {
    return <p className="t-body">No demo accounts found. Reset the demo data and reload this page.</p>;
  }

  return (
    <div className="space-y-3">
      {accounts.map((a) => {
        const Icon = a.role === "student" ? GraduationCap : Presentation;
        const loading = pending === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => signIn(a.id)}
            disabled={pending !== null}
            aria-busy={loading}
            className={cn(
              "group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition duration-200",
              "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift active:scale-[0.99] disabled:pointer-events-none",
              pending !== null && !loading && "opacity-50",
            )}
          >
            <Avatar name={a.name} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold">{a.name}</span>
                <Badge tone={a.role === "student" ? "brand" : "accent"}>
                  <Icon className="size-3" aria-hidden />
                  {a.role === "student" ? "Student" : "Facilitator"}
                </Badge>
              </span>
              <span className="t-small mt-0.5 block truncate">{a.subtitle}</span>
            </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-muted transition group-hover:bg-brand group-hover:text-brand-on">
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Signing in" />
              ) : (
                <ArrowRight className="size-4" aria-hidden />
              )}
            </span>
          </button>
        );
      })}
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
