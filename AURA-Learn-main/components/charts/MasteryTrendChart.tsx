"use client";

import { Table2, LineChart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWidth } from "./useWidth";

export interface TrendPoint { date: string; label: string; value: number }

const H = 220;
const PAD = { top: 16, right: 20, bottom: 30, left: 36 };

/** One series, one axis, 0-100. Hover (or touch) shows a crosshair and the exact value. */
export function MasteryTrendChart({ data }: { data: TrendPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * w);
  const y = (v: number) => PAD.top + (1 - v / 100) * h;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const active = hover ?? data.length - 1;
  const point = data[active];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round((px / Math.max(1, w)) * (data.length - 1)))));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="t-num text-3xl">{point?.value ?? 0}%</p>
          <p className="t-small">{point ? (hover === null ? `Today · ${point.label}` : point.label) : ""}</p>
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-subtle hover:text-ink">
          {table ? <LineChart className="size-4" aria-hidden /> : <Table2 className="size-4" aria-hidden />}
          {table ? "Chart" : "Table"}
        </button>
      </div>

      {table ? (
        <div className="max-h-56 overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Overall mastery by day</caption>
            <thead className="sticky top-0 bg-subtle text-left text-xs text-muted"><tr><th className="px-4 py-2 font-medium">Day</th><th className="px-4 py-2 text-right font-medium">Mastery</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => <tr key={d.date} className="border-t border-line"><td className="px-4 py-2">{d.label}</td><td className="t-num px-4 py-2 text-right">{d.value}%</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative w-full" style={{ height: H }}>
          {width > 0 && (
            <svg width={width} height={H} role="img" aria-label={`Overall mastery over the last ${data.length} days, from ${data[0]?.value}% to ${data.at(-1)?.value}%`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="touch-pan-y">
              {[0, 50, 100].map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={PAD.left + w} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
                  <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-faint text-[11px]">{t}</text>
                </g>
              ))}
              {data.map((d, i) => ((i % 3 === 0 && i <= data.length - 3) || i === data.length - 1) && (
                <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-faint text-[11px]">{d.label}</text>
              ))}
              <path d={area} className="fill-brand/10" />
              <path d={line} fill="none" className="stroke-brand" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {point && (
                <g>
                  {hover !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + h} className="stroke-faint" strokeWidth={1} strokeDasharray="3 3" />}
                  <circle cx={x(active)} cy={y(point.value)} r={5} className="fill-brand stroke-surface" strokeWidth={2} />
                </g>
              )}
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
