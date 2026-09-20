"use client";

/**
 * Module A — Saturated vs Unsaturated Hydrocarbon Visualizer
 *
 * Interactive SVG comparison: Alkane (C-C-C) vs Alkene (C=C-C) vs Alkyne (C≡C-C)
 * Switching changes bond rendering, labels, formula, saturation state, and explanation.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap } from "lucide-react";
import { ChemistryLearningEvidence } from "@/lib/chemistry/types";

interface SaturationVisualizerProps {
  onEvidenceProduced?: (evidence: ChemistryLearningEvidence) => void;
}

type MoleculeMode = "alkane" | "alkene" | "alkyne";

interface ModeData {
  label: string;
  formula: string;
  name: string;
  saturation: string;
  isSaturated: boolean;
  color: string;
  borderColor: string;
  explanation: string;
  bondBetweenCC: "single" | "double" | "triple";
}

const MODE_DATA: Record<MoleculeMode, ModeData> = {
  alkane: {
    label: "Alkane",
    formula: "C₃H₈",
    name: "Propane",
    saturation: "SATURATED",
    isSaturated: true,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/50",
    bondBetweenCC: "single",
    explanation:
      "All C–C single bonds. Maximum hydrogen attached — fully saturated. No reactive double bonds. General formula: CₙH₂ₙ₊₂",
  },
  alkene: {
    label: "Alkene",
    formula: "C₃H₆",
    name: "Propene",
    saturation: "UNSATURATED",
    isSaturated: false,
    color: "text-amber-400",
    borderColor: "border-amber-500/50",
    bondBetweenCC: "double",
    explanation:
      "One C=C double bond replaces two C–H bonds. Fewer hydrogens — unsaturated. Reactive site. General formula: CₙH₂ₙ",
  },
  alkyne: {
    label: "Alkyne",
    formula: "C₃H₄",
    name: "Propyne",
    saturation: "UNSATURATED",
    isSaturated: false,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/50",
    bondBetweenCC: "triple",
    explanation:
      "One C≡C triple bond. Even fewer hydrogens — highly unsaturated. Very reactive. General formula: CₙH₂ₙ₋₂",
  },
};

// SVG molecule diagram for a 3-carbon chain
function MoleculesSVG({ mode }: { mode: MoleculeMode }) {
  const data = MODE_DATA[mode];
  const cx = [60, 180, 300] as const;
  const cy = 60 as const;
  const r = 18;

  // Hydrogen positions for each carbon
  const hydrogens: Array<[number, number, number, number]> = [];

  if (mode === "alkane") {
    // C1: 3H (top, bottom-left, bottom-right) — 4 bonds: 1 to C2, 3 to H
    hydrogens.push([cx[0] - 24, cy - 24, cx[0] - 12, cy - 12]);
    hydrogens.push([cx[0] - 24, cy + 24, cx[0] - 12, cy + 12]);
    hydrogens.push([cx[0] - 32, cy, cx[0] - 18, cy]);
    // C2: 2H (top, bottom)
    hydrogens.push([cx[1], cy - 36, cx[1], cy - 18]);
    hydrogens.push([cx[1], cy + 36, cx[1], cy + 18]);
    // C3: 3H
    hydrogens.push([cx[2] + 24, cy - 24, cx[2] + 12, cy - 12]);
    hydrogens.push([cx[2] + 24, cy + 24, cx[2] + 12, cy + 12]);
    hydrogens.push([cx[2] + 32, cy, cx[2] + 18, cy]);
  } else if (mode === "alkene") {
    // C1=C2 double bond; C3 single
    // C1: 2H
    hydrogens.push([cx[0] - 24, cy - 24, cx[0] - 12, cy - 12]);
    hydrogens.push([cx[0] - 32, cy, cx[0] - 18, cy]);
    // C2: 1H
    hydrogens.push([cx[1], cy - 36, cx[1], cy - 18]);
    // C3: 3H
    hydrogens.push([cx[2] + 24, cy - 24, cx[2] + 12, cy - 12]);
    hydrogens.push([cx[2] + 24, cy + 24, cx[2] + 12, cy + 12]);
    hydrogens.push([cx[2] + 32, cy, cx[2] + 18, cy]);
  } else {
    // alkyne: C1≡C2 — C3
    // C1: 1H
    hydrogens.push([cx[0] - 32, cy, cx[0] - 18, cy]);
    // C2: 0H
    // C3: 3H
    hydrogens.push([cx[2] + 24, cy - 24, cx[2] + 12, cy - 12]);
    hydrogens.push([cx[2] + 24, cy + 24, cx[2] + 12, cy + 12]);
    hydrogens.push([cx[2] + 32, cy, cx[2] + 18, cy]);
  }

  const ccColor =
    mode === "alkane" ? "#10b981" : mode === "alkene" ? "#f59e0b" : "#06b6d4";

  return (
    <svg
      viewBox="0 0 360 120"
      className="w-full max-w-xs mx-auto"
      role="img"
      aria-label={`SVG representation of ${data.name} — ${data.label}`}
    >
      {/* Hydrogen lines */}
      {hydrogens.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#6b7280"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {/* H labels */}
      {hydrogens.map(([x1, y1], i) => (
        <text
          key={`h${i}`}
          x={x1}
          y={y1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#9ca3af"
          fontWeight="bold"
        >
          H
        </text>
      ))}

      {/* C1 — C2 bond (mode-dependent) */}
      {data.bondBetweenCC === "single" && (
        <line x1={cx[0] + r} y1={cy} x2={cx[1] - r} y2={cy} stroke={ccColor} strokeWidth="2.5" />
      )}
      {data.bondBetweenCC === "double" && (
        <>
          <line x1={cx[0] + r} y1={cy - 4} x2={cx[1] - r} y2={cy - 4} stroke={ccColor} strokeWidth="2.5" />
          <line x1={cx[0] + r} y1={cy + 4} x2={cx[1] - r} y2={cy + 4} stroke={ccColor} strokeWidth="2.5" />
        </>
      )}
      {data.bondBetweenCC === "triple" && (
        <>
          <line x1={cx[0] + r} y1={cy - 5} x2={cx[1] - r} y2={cy - 5} stroke={ccColor} strokeWidth="2.5" />
          <line x1={cx[0] + r} y1={cy} x2={cx[1] - r} y2={cy} stroke={ccColor} strokeWidth="2.5" />
          <line x1={cx[0] + r} y1={cy + 5} x2={cx[1] - r} y2={cy + 5} stroke={ccColor} strokeWidth="2.5" />
        </>
      )}

      {/* C2 — C3 bond (always single) */}
      <line x1={cx[1] + r} y1={cy} x2={cx[2] - r} y2={cy} stroke="#10b981" strokeWidth="2.5" />

      {/* Carbon atoms */}
      {([0, 1, 2] as const).map((i) => (
        <g key={`c${i}`}>
          <circle cx={cx[i]} cy={cy} r={r} fill="#1e293b" stroke={i === 0 ? ccColor : i === 1 && mode !== "alkane" ? ccColor : "#10b981"} strokeWidth="2" />
          <text x={cx[i]} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="white" fontWeight="bold">
            C
          </text>
        </g>
      ))}
    </svg>
  );
}

export function SaturationVisualizer({ onEvidenceProduced }: SaturationVisualizerProps) {
  const [mode, setMode] = React.useState<MoleculeMode>("alkane");
  const [exploredModes, setExploredModes] = React.useState<Set<MoleculeMode>>(new Set(["alkane"]));
  const [attempts, setAttempts] = React.useState(0);

  const data = MODE_DATA[mode];

  const handleModeSwitch = (m: MoleculeMode) => {
    setMode(m);
    setAttempts((p) => p + 1);
    setExploredModes((prev) => {
      const next = new Set(prev);
      next.add(m);
      if (next.size === 3 && onEvidenceProduced) {
        onEvidenceProduced({
          conceptId: "c-org-6",
          activityId: "saturation-visualizer",
          evidenceType: "interactive",
          score: 100,
          attempts: attempts + 1,
          timestamp: Date.now(),
          metadata: { exploredAll: true },
        });
      }
      return next;
    });
  };

  return (
    <Card className="border-amber-500/30 bg-amber-950/10">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Module A — Saturated vs Unsaturated
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300">
            {exploredModes.size}/3 explored
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Switch between molecule types to see how bond order changes formula, saturation, and reactivity.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Mode switcher */}
        <div className="grid grid-cols-3 gap-2">
          {(["alkane", "alkene", "alkyne"] as MoleculeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              aria-pressed={mode === m}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold uppercase tracking-wide ${
                mode === m
                  ? `${MODE_DATA[m].borderColor} bg-card shadow-sm ring-1 ${MODE_DATA[m].color}`
                  : "border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              {MODE_DATA[m].label}
              {exploredModes.has(m) && m !== mode && (
                <span className="block text-[9px] font-normal text-muted-foreground/70 mt-0.5">visited</span>
              )}
            </button>
          ))}
        </div>

        {/* SVG Molecule + Info side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className={`p-3 rounded-xl border ${data.borderColor} bg-card/60 transition-all`}>
            <MoleculesSVG mode={mode} />
            <div className="text-center mt-2 space-y-0.5">
              <div className={`text-lg font-bold font-mono ${data.color}`}>{data.formula}</div>
              <div className="text-xs text-muted-foreground">{data.name}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${
              data.isSaturated
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                : "border-amber-500/40 bg-amber-950/20 text-amber-400"
            }`}>
              {data.isSaturated ? "✓ Saturated" : "⚡ Unsaturated"}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Bond Type
              </div>
              <div className={`text-sm font-bold font-mono ${data.color}`}>
                {data.bondBetweenCC === "single" && "C — C (Single)"}
                {data.bondBetweenCC === "double" && "C = C (Double)"}
                {data.bondBetweenCC === "triple" && "C ≡ C (Triple)"}
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed border-l-2 border-border/60 pl-3">
              {data.explanation}
            </p>

            {exploredModes.size === 3 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                All three types explored! Evidence recorded.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
