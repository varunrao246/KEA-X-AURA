"use client";

import { ArrowRight, GraduationCap, LockKeyhole, Mail, Presentation, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type Mode = "signin" | "register";

interface AuthEnvelope {
  ok?: boolean;
  error?: string;
  data?: { needsEmailConfirmation?: boolean; email?: string; redirectTo?: string };
}

/** API routes should return JSON, but a framework/proxy error can return an empty HTML response. */
async function readAuthResponse(response: Response): Promise<AuthEnvelope> {
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(`The authentication service returned an empty response (${response.status}). Check the app server terminal, then try again.`);
  }
  try {
    return JSON.parse(raw) as AuthEnvelope;
  } catch {
    throw new Error(response.ok
      ? "The authentication service returned an unexpected response. Please check the app server terminal."
      : `Authentication request failed (${response.status}). Please check the app server terminal.`);
  }
}

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [facilitatorCode, setFacilitatorCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setRetryAfter(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || retryAfter !== null) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(mode === "signin" ? "/api/auth/signin" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signin" ? { email, password } : { name, email, password, role, facilitatorCode }),
      });
      const json = await readAuthResponse(response);
      if (!response.ok || !json.ok) throw new Error(json.error ?? "We couldn't complete that request.");
      if (json.data?.needsEmailConfirmation) {
        setNotice(`Check ${json.data.email ?? email} to confirm your account, then sign in.`);
        setMode("signin");
        return;
      }
      if (!json.data?.redirectTo) throw new Error("Authentication succeeded but no destination was returned. Please try signing in again.");
      router.push(json.data.redirectTo);
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong. Please try again.";
      setError(message);
      if (/rate-limit|rate limit/i.test(message)) {
        setRetryAfter(60);
        window.setTimeout(() => setRetryAfter(null), 60_000);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-7 grid grid-cols-2 rounded-2xl bg-subtle p-1" role="tablist" aria-label="Authentication options">
        <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => switchMode("signin")} className={cn("h-10 rounded-xl text-sm font-semibold transition", mode === "signin" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")} className={cn("h-10 rounded-xl text-sm font-semibold transition", mode === "register" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>Create account</button>
      </div>

      <div className="mb-6">
        <p className="t-eyebrow">{mode === "signin" ? "Welcome back" : "Start your learning journey"}</p>
        <h2 className="t-title mt-1.5">{mode === "signin" ? "Sign in to AURA" : "Create your AURA account"}</h2>
        <p className="t-body mt-2">{mode === "signin" ? "Use your email and password to continue where you left off." : "Choose your space, then AURA will guide the next step."}</p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <>
            <Input label="Your name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required placeholder="e.g. Ananya Rao" />
            <fieldset>
              <legend className="mb-2 block text-sm font-medium">I’m joining as</legend>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "student", label: "Student", description: "My personalised path", icon: GraduationCap },
                  { value: "facilitator", label: "Facilitator", description: "My learner overview", icon: Presentation },
                ] as const).map(({ value, label, description, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setRole(value)} className={cn("rounded-2xl border p-3.5 text-left transition", role === value ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40")}>
                    <Icon className={cn("mb-3 size-5", role === value ? "text-brand" : "text-muted")} aria-hidden />
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" />
        <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} hint={mode === "register" ? "At least 8 characters" : undefined} placeholder="••••••••" />
        {mode === "register" && role === "facilitator" && (
          <Input label="Facilitator invite code" type="password" value={facilitatorCode} onChange={(event) => setFacilitatorCode(event.target.value)} autoComplete="off" required={false} hint="Required if your school has configured one." placeholder="Optional invite code" />
        )}

        {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">{notice}</p>}

        <Button type="submit" size="lg" fullWidth disabled={retryAfter !== null} loading={busy} iconLeft={mode === "signin" ? <LockKeyhole className="size-4" /> : <UserRound className="size-4" />} iconRight={<ArrowRight className="size-4" />}>
          {retryAfter !== null ? "Please wait before retrying" : mode === "signin" ? "Sign in securely" : `Create ${role === "student" ? "student" : "facilitator"} account`}
        </Button>
      </form>

      <p className="mt-5 flex items-center gap-2 text-xs text-faint"><Mail className="size-3.5" aria-hidden /> Your account is authenticated securely through Supabase.</p>
    </div>
  );
}
