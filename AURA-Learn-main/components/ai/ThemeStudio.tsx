"use client";

import { ChevronDown, Eye, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { INTEREST_OPTIONS } from "@/components/student/interests";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { INTEREST_IDS } from "@/lib/ai/interests";
import type { AiMode, RethemeResult } from "@/lib/ai/types";
import type { Interest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GuardrailList } from "./GuardrailList";
import { QuantityText } from "./QuantityText";
import { requestRetheme } from "./rethemeClient";
import { SourceBadge } from "./SourceBadge";

export interface StudioSample { id: string; stem: string; topic: string; level: number; objective: string; unit?: string }
export interface StudioStatus { configured: boolean; label: string; model: string | null; mode: string }

type Card_ = { phase: "loading" } | { phase: "ready"; result: RethemeResult } | { phase: "error"; message: string };

const DEFAULT_SET: Interest[] = ["space", "gaming", "sports"];

export function ThemeStudio({ samples, defaultId, status, allowReveal }: { samples: StudioSample[]; defaultId: string; status: StudioStatus; allowReveal: boolean }) {
  const [questionId, setQuestionId] = useState(defaultId);
  const [selected, setSelected] = useState<Interest[]>(DEFAULT_SET);
  const [mode, setMode] = useState<AiMode>("auto");
  const [cards, setCards] = useState<Record<string, Card_>>({});
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const ticket = useRef(0);

  const sample = samples.find((s) => s.id === questionId) ?? samples[0];

  const loadOne = useCallback(async (interest: Interest, qid: string, m: AiMode, id: number) => {
    setCards((c) => ({ ...c, [interest]: { phase: "loading" } }));
    try {
      const result = await requestRetheme({ questionId: qid, interest, mode: m }, { timeoutMs: 12000 });
      if (id === ticket.current) setCards((c) => ({ ...c, [interest]: { phase: "ready", result } }));
    } catch (e) {
      if (id === ticket.current) setCards((c) => ({ ...c, [interest]: { phase: "error", message: e instanceof DOMException && e.name === "AbortError" ? "This took too long." : "Couldn't theme this question." } }));
    }
  }, []);

  useEffect(() => {
    const id = ++ticket.current;
    setAnswer(null);
    setCards({});
    selected.forEach((i) => void loadOne(i, questionId, mode, id));
  }, [questionId, mode, selected, loadOne]);

  function toggle(i: Interest) {
    setSelected((cur) => (cur.includes(i) ? (cur.length > 1 ? cur.filter((x) => x !== i) : cur) : [...cur, i]));
  }

  async function reveal() {
    setRevealing(true);
    try {
      const res = await fetch(`/api/ai/reveal?questionId=${questionId}`);
      const json = await res.json();
      setAnswer(json.ok ? json.data.answer : "Disabled in this deployment");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Service status */}
      <div className="enter flex flex-wrap items-center gap-3" role="status">
        <Badge tone={status.configured ? "success" : "neutral"} dot>{status.label}</Badge>
        {!status.configured && <span className="t-small">Add an API key for any supported provider (OpenRouter, Groq, Gemini or NVIDIA) on the server to switch on live AI. Everything below works without it.</span>}
      </div>

      {/* Question + controls */}
      <Card className="enter" style={{ ["--i" as string]: 1 }}>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="studio-q" className="mb-2 block text-sm font-medium">Question</label>
            <div className="relative">
              <select id="studio-q" value={questionId} onChange={(e) => setQuestionId(e.target.value)} className="h-12 w-full appearance-none rounded-xl border border-line bg-surface pl-4 pr-10 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15">
                {samples.map((s) => <option key={s.id} value={s.id}>{s.topic} · Level {s.level} · {s.stem.slice(0, 70)}{s.stem.length > 70 ? "…" : ""}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Writer</p>
            <div role="radiogroup" aria-label="Writer" className="inline-flex rounded-xl border border-line bg-subtle p-1">
              {([["auto", "Auto (AI if available)"], ["template", "Built-in only"]] as const).map(([m, label]) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("h-10 rounded-lg px-3.5 text-sm font-medium transition", mode === m ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink")}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-subtle p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge source="original" />
            <span className="text-xs text-muted">Level {sample.level} · {sample.objective}</span>
          </div>
          <p className="text-xl font-medium leading-snug" data-testid="original-stem"><QuantityText text={sample.stem} /></p>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Student interests</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
            {INTEREST_IDS.map((id) => {
              const meta = INTEREST_OPTIONS.find((o) => o.id === id)!;
              const Icon = meta.icon;
              const on = selected.includes(id);
              return (
                <button key={id} type="button" aria-pressed={on} onClick={() => toggle(id)} className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition active:scale-95", on ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand/40 hover:text-ink")}>
                  <Icon className="size-4" aria-hidden /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Themed versions */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
        {selected.map((interest, idx) => (
          <ThemeCard key={interest} interest={interest} state={cards[interest]} index={idx} onRetry={() => void loadOne(interest, questionId, mode, ticket.current)} />
        ))}
      </div>

      {/* Same answer */}
      <Card className="enter border-success/30 bg-success-soft/40" style={{ ["--i" as string]: 4 }}>
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success text-brand-on"><ShieldCheck className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h3 className="t-heading">One academic problem, many stories</h3>
            <p className="t-body mt-1">Every version above keeps the same numbers and units, asks for the same quantity, has the same answer, the same learning objective and the same difficulty. Grading always uses the original question, so a themed wording can never change what counts as correct.</p>
            {allowReveal && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm" onClick={reveal} loading={revealing} iconLeft={<Eye className="size-4" />}>Reveal the answer key (demo)</Button>
                {answer && <span className="rounded-xl bg-surface px-4 py-2 text-sm">Answer for every version: <span className="t-num font-semibold" data-testid="answer-key">{answer}</span></span>}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ThemeCard({ interest, state, index, onRetry }: { interest: Interest; state?: Card_; index: number; onRetry: () => void }) {
  const meta = INTEREST_OPTIONS.find((o) => o.id === interest)!;
  const Icon = meta.icon;
  const [open, setOpen] = useState(false);
  return (
    <Card className="enter flex flex-col" style={{ ["--i" as string]: index + 2 }} data-testid={`card-${interest}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="size-4" aria-hidden /></span>{meta.label}</span>
        {state?.phase === "ready" && <SourceBadge source={state.result.source} />}
      </div>

      {(!state || state.phase === "loading") && (
        <div role="status" className="space-y-3">
          <div className="relative h-6 overflow-hidden rounded-lg bg-subtle"><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/70 to-transparent" /></div>
          <div className="relative h-6 w-3/4 overflow-hidden rounded-lg bg-subtle"><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/70 to-transparent" /></div>
          <p className="flex items-center gap-2 text-xs text-muted"><Loader2 className="size-3.5 animate-spin" aria-hidden /> Theming…</p>
        </div>
      )}

      {state?.phase === "error" && (
        <div role="alert" className="rounded-xl bg-warn-soft p-4 text-sm">
          <p>{state.message}</p>
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand"><RotateCcw className="size-3.5" aria-hidden /> Try again</button>
        </div>
      )}

      {state?.phase === "ready" && (
        <>
          <p className="text-[17px] font-medium leading-snug" data-testid={`stem-${interest}`}><QuantityText text={state.result.stem} /></p>
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Preserved from the original">
            {state.result.preserved.quantities.map((q) => <span key={q} className="rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold tabular-nums">{q}</span>)}
            <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted">Level {state.result.preserved.difficulty}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><ShieldCheck className="size-3" aria-hidden /> {state.result.validation.failed.length === 0 ? "All checks passed" : "Check failed"}</span>
          </div>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted transition hover:text-ink">
            <Sparkles className="size-4" aria-hidden /> How it was checked <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden />
          </button>
          {open && <div className="mt-3 rounded-2xl border border-line bg-subtle/60 p-4"><GuardrailList result={state.result} /></div>}
        </>
      )}
    </Card>
  );
}
