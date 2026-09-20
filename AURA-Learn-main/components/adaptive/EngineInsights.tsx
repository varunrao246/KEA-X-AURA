import { ArrowDown, ArrowUp, Check, Equal, Lock, LockOpen } from "lucide-react";
import { AdaptiveTimeline } from "@/components/adaptive/AdaptiveTimeline";
import { SignalsPanel } from "@/components/adaptive/SignalsPanel";
import { StruggleMeter } from "@/components/adaptive/StruggleMeter";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LEVEL_NAMES, LEVEL_WINDOW } from "@/lib/adaptive";
import type { TopicEngine } from "@/lib/engine";
import { BAND_LABEL, WEIGHTS } from "@/lib/mastery";
import { cn } from "@/lib/utils";

/**
 * "How AURA sees this topic": every number the adaptive engine uses, with its weight and reason.
 * Nothing here is decorative. It renders the same values the engine computed on the server.
 */
export function EngineInsights({ engine }: { engine: TopicEngine }) {
  const { mastery, level, struggle, tracking, prerequisites, prerequisiteCheck, unlock } = engine;
  const hasLab = engine.labIds.length > 0;
  const p = mastery.parts;
  const rows = [
    { label: "Quiz accuracy", weight: hasLab ? WEIGHTS.quiz : WEIGHTS.quiz + WEIGHTS.lab, value: p.quiz, note: "Harder questions count more" },
    { label: "Recent performance", weight: WEIGHTS.recent, value: p.recent, note: "Your last 5 answers" },
    { label: "Prerequisite mastery", weight: WEIGHTS.prereq, value: p.prereq, note: prerequisites.length ? prerequisites.map((x) => `${x.name} ${x.score}%`).join(", ") : "No prerequisites" },
    { label: "Retention", weight: WEIGHTS.retention, value: p.retention, note: "Fades 4 points for each day away" },
    ...(hasLab ? [{ label: "Virtual lab", weight: WEIGHTS.lab, value: p.lab, note: p.lab > 0 ? "Best lab score" : "Not done yet" }] : []),
  ];
  const raw = rows.reduce((s, r) => s + r.weight * r.value, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Mastery */}
      <Card>
        <CardHeader title="Mastery" subtitle="Five weighted parts, shown exactly as calculated" action={<span className="t-num text-2xl">{mastery.score}%</span>} />
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{r.label} <span className="font-normal text-faint">{Math.round(r.weight * 100)}%</span></span>
                <span className="t-num text-muted">{Math.round(r.value)} → +{(r.weight * r.value).toFixed(1)}</span>
              </div>
              <ProgressBar value={r.value} size="sm" label={r.label} />
              <p className="mt-1 text-xs text-muted">{r.note}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Sum of parts</dt><dd className="t-num">{raw.toFixed(1)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Evidence factor <span className="text-faint">(under 8 answers scales it down)</span></dt><dd className="t-num whitespace-nowrap pl-3">× {p.evidence.toFixed(2)}</dd></div>
          <div className="flex justify-between font-medium"><dt>Mastery · {BAND_LABEL[mastery.band]}</dt><dd className="t-num">{mastery.score}%</dd></div>
        </dl>
      </Card>

      {/* Struggle */}
      <Card>
        <CardHeader title="Struggle detection" subtitle="Looks at your last 8 answers on this topic" />
        <StruggleMeter score={struggle.score} level={struggle.level} />
        <div className="mt-6"><SignalsPanel signals={struggle.signals} score={struggle.score} insufficientEvidence={struggle.insufficientEvidence} /></div>
      </Card>

      {/* Difficulty */}
      <Card>
        <CardHeader title="Difficulty" subtitle={`Level ${level.current} · ${LEVEL_NAMES[level.current]}`} />
        <div className="flex items-center gap-2" aria-label="Answers since the level last changed">
          {Array.from({ length: LEVEL_WINDOW }, (_, i) => {
            const d = level.window.dots[i];
            return (
              <span key={i} className={cn("grid size-9 place-items-center rounded-xl text-sm font-semibold", d === undefined ? "border border-dashed border-line text-faint" : d ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
                {d === undefined ? "·" : d ? <Check className="size-4" strokeWidth={3} aria-label="correct" /> : <span aria-label="wrong">✕</span>}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-sm font-medium">{level.window.summary}</p>
        <p className="t-small mt-0.5">{level.window.next}</p>
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <li className="flex items-center gap-2"><ArrowUp className="size-4 text-success" aria-hidden /> <span><b>5 of 5</b> correct raises the difficulty</span></li>
          <li className="flex items-center gap-2"><Equal className="size-4 text-brand" aria-hidden /> <span><b>3 of 5</b> correct keeps it the same</span></li>
          <li className="flex items-center gap-2"><ArrowDown className="size-4 text-warn" aria-hidden /> <span><b>1 of 5</b> lowers it and checks the prerequisites</span></li>
        </ul>
      </Card>

      {/* Prerequisites and unlocking */}
      <Card>
        <CardHeader title="Prerequisites and unlocking" subtitle="A topic opens when every prerequisite reaches 60%" />
        {prerequisites.length > 0 ? (
          <ul className="space-y-4">
            {prerequisites.map((x) => (
              <li key={x.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={cn("grid size-5 place-items-center rounded-full text-brand-on", x.ok ? "bg-success" : "bg-warn")}>{x.ok ? <Check className="size-3" strokeWidth={3} /> : <span className="text-[11px] font-bold">!</span>}</span>
                    {x.name}
                  </span>
                  <span className="t-num">{x.score}%</span>
                </div>
                <div className="relative"><ProgressBar value={x.score} size="sm" tone={x.ok ? "success" : "warn"} label={`${x.name} mastery`} /><span className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink/40" style={{ left: "60%" }} aria-hidden /></div>
              </li>
            ))}
          </ul>
        ) : <p className="t-small">This topic has no prerequisites.</p>}
        <p className={cn("mt-4 rounded-xl px-3.5 py-3 text-sm", prerequisiteCheck.solid ? "bg-success-soft" : "bg-warn-soft")}>{prerequisiteCheck.message}</p>
        {unlock.unlocks.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            {unlock.unlocks.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                {u.locked ? <Lock className="size-4 text-faint" aria-hidden /> : <LockOpen className="size-4 text-success" aria-hidden />}
                <span><b>{u.name}</b> {u.locked ? `opens when ${engine.topicName} reaches ${unlock.threshold}% (now ${mastery.score}%)` : "is open"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Tracking */}
      <Card>
        <CardHeader title="What AURA tracks" subtitle={`Your last ${tracking.attempts} answers on this topic`} />
        <dl className="grid grid-cols-2 gap-4">
          {[
            ["Accuracy", `${tracking.accuracy}%`],
            ["Average time", `${tracking.avgSeconds}s`],
            ["Hints used", `${Math.round(tracking.hintRate * 100)}%`],
            ["Misses in a row", String(tracking.wrongStreak)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-subtle p-4">
              <dt className="t-eyebrow">{k}</dt>
              <dd className="t-num mt-1.5 text-2xl">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="t-small mt-3">Time and hints are recorded by the server when a question is shown, so they can't be changed from the browser.</p>
      </Card>

      {/* Decisions */}
      <Card>
        <CardHeader title="What AURA decided" subtitle="Newest first" />
        <AdaptiveTimeline events={engine.events} />
      </Card>
    </div>
  );
}
