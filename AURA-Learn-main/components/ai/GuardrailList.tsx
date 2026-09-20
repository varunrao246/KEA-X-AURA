import { Check, Lock, X } from "lucide-react";
import type { RethemeResult } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const REASON: Record<string, string> = {
  ai_off: "Re-theming is switched off",
  not_configured: "No AI service is configured, so AURA's built-in themes are used",
  rate_limited: "Too many AI requests just now",
  temporarily_unavailable: "The AI service is paused after repeated failures",
  timeout: "The AI service took too long",
  http_error: "The AI service is unavailable",
  invalid_response: "The AI's reply couldn't be used",
  validation_failed: "The AI's wording failed a guardrail, so it was discarded",
  no_theme_available: "There is no theme for this kind of question yet",
};

/** The full audit for one re-themed question: what was checked, what the server guarantees, and how it got here. */
export function GuardrailList({ result }: { result: RethemeResult }) {
  const validated = result.validation.checks.filter((c) => c.kind === "validated");
  const fixed = result.validation.checks.filter((c) => c.kind === "by-construction");
  return (
    <div className="space-y-5 text-sm">
      <div>
        <p className="t-eyebrow mb-2">Checked against the new wording</p>
        <ul className="space-y-2">
          {validated.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-brand-on", c.passed ? "bg-success" : "bg-danger")}>
                {c.passed ? <Check className="size-3" strokeWidth={3} aria-label="passed" /> : <X className="size-3" strokeWidth={3} aria-label="failed" />}
              </span>
              <span><span className="font-medium">{c.label}</span> <span className="text-muted">· {c.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="t-eyebrow mb-2">Guaranteed by AURA</p>
        <ul className="space-y-2">
          {fixed.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-subtle text-muted"><Lock className="size-3" aria-hidden /></span>
              <span><span className="font-medium">{c.label}</span> <span className="text-muted">· {c.detail}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="t-eyebrow mb-2">How it got here</p>
        <ol className="space-y-1.5">
          {result.pipeline.map((p, i) => (
            <li key={i} className="flex gap-2 text-muted">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", p.outcome === "used" ? "bg-success" : p.outcome === "skipped" ? "bg-faint" : "bg-warn")} aria-hidden />
              <span><span className="font-medium text-ink">{p.step === "ai" ? "AI service" : p.step === "template" ? "Built-in theme" : p.step === "cache" ? "Saved rewrite" : "Original"}</span> {p.outcome}: {p.detail}</span>
            </li>
          ))}
        </ol>
        {result.fallbackReason && <p className="mt-2 text-xs text-faint">{REASON[result.fallbackReason] ?? result.fallbackReason}</p>}
        <p className="mt-2 text-xs text-faint">{result.latencyMs} ms{result.cached ? " · from cache" : ""}{result.model ? ` · ${result.model}` : ""}</p>
      </div>
    </div>
  );
}
