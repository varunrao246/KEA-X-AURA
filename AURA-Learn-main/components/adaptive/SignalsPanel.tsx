import type { StruggleSignalSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The five weighted signals behind the struggle score, each with the reason in plain words. */
export function SignalsPanel({ signals, score, insufficientEvidence }: { signals: StruggleSignalSnapshot[]; score: number; insufficientEvidence?: boolean }) {
  return (
    <div>
      <ul className="space-y-4">
        {signals.map((s) => (
          <li key={s.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {s.label} <span className="font-normal text-faint">{Math.round(s.weight * 100)}%</span>
              </span>
              <span className="t-num text-muted">+{s.points.toFixed(1)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={s.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${s.label} signal`}>
              <div className={cn("h-full rounded-full transition-[width] duration-700", s.value >= 60 ? "bg-danger" : s.value >= 30 ? "bg-warn" : "bg-success")} style={{ width: `${s.value}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{s.detail}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="font-medium">Struggle score</span>
        <span className="t-num">{score}</span>
      </div>
      {insufficientEvidence && <p className="t-small mt-2">Not enough answers yet (needs 3) to judge, so the score stays at 0.</p>}
    </div>
  );
}
