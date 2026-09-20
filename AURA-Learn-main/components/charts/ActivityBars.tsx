"use client";

import { LineChart, Table2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWidth } from "./useWidth";

export interface ActivityPoint { date: string; label: string; count: number; today: boolean }

const H = 180;
const PAD = { top: 12, right: 8, bottom: 26, left: 8 };

/** Questions answered per day for the last week. Bars are thin and anchored to the baseline. */
export function ActivityBars({ data }: { data: ActivityPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(4, ...data.map((d) => d.count));
  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = H - PAD.top - PAD.bottom;
  const slot = w / data.length;
  const bar = Math.min(28, slot * 0.5);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="t-num text-3xl">{hover !== null ? data[hover].count : total}</p>
          <p className="t-small">{hover !== null ? `${data[hover].label}${data[hover].today ? " (today)" : ""}` : "questions this week"}</p>
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-subtle hover:text-ink">
          {table ? <LineChart className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
          {table ? "Chart" : "Table"}
        </button>
      </div>

      {table ? (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Questions answered per day</caption>
            <thead className="bg-subtle text-left text-xs text-muted"><tr><th className="px-4 py-2 font-medium">Day</th><th className="px-4 py-2 text-right font-medium">Questions</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.date} className="border-t border-line"><td className="px-4 py-2">{d.label}{d.today ? " (today)" : ""}</td><td className="t-num px-4 py-2 text-right">{d.count}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="w-full" style={{ height: H }}>
          {width > 0 && (
            <svg width={width} height={H} role="img" aria-label={`Questions answered per day this week: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`} onPointerLeave={() => setHover(null)}>
              <line x1={PAD.left} x2={PAD.left + w} y1={PAD.top + h} y2={PAD.top + h} className="stroke-line" strokeWidth={1} />
              {data.map((d, i) => {
                const cx = PAD.left + slot * i + slot / 2;
                const bh = d.count === 0 ? 0 : Math.max(6, (d.count / max) * h);
                const top = PAD.top + h - bh;
                const r = Math.min(4, bh);
                return (
                  <g key={d.date} onPointerEnter={() => setHover(i)} onPointerMove={() => setHover(i)}>
                    <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={h + PAD.bottom} fill="transparent" />
                    {bh > 0 && <path d={`M${cx - bar / 2},${PAD.top + h} V${top + r} Q${cx - bar / 2},${top} ${cx - bar / 2 + r},${top} H${cx + bar / 2 - r} Q${cx + bar / 2},${top} ${cx + bar / 2},${top + r} V${PAD.top + h} Z`} className={cn(hover === null || hover === i ? "fill-brand" : "fill-brand/40", "transition-[fill]")} />}
                    <text x={cx} y={H - 8} textAnchor="middle" className={cn("text-[11px]", d.today ? "fill-ink font-semibold" : "fill-faint")}>{d.label}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
