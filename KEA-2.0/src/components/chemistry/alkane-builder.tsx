"use client";

/**
 * Module B — Alkane Chain Builder
 *
 * Interactive carbon chain builder C1→C6.
 * Shows carbon atoms, C-C single bonds, hydrogen count, and molecular formula.
 * Reuses getAlkaneFormula() from hydrocarbon-classifier — no duplicate logic.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ChevronRight, CheckCircle2, RotateCcw } from "lucide-react";
import { getAlkaneFormula } from "@/lib/chemistry/hydrocarbon-classifier";
import { ChemistryLearningEvidence } from "@/lib/chemistry/types";

interface AlkaneBuilderProps {
  onEvidenceProduced?: (evidence: ChemistryLearningEvidence) => void;
}

// SVG for alkane chain of n carbons (C1–C6)
function AlkaneChainSVG({ n }: { n: number }) {
  const spacing = 64;
  const cy = 50;
  const r = 16;
  const totalW = Math.max(200, n * spacing + 20);

  const cx = Array.from({ length: n }, (_, i) => 20 + r + i * spacing);

  // Hydrogen lines and positions above/below each carbon
  // End carbons: 3H, middle carbons: 2H
  const hydrogens: Array<{ x: number; y: number; lx: number; ly: number }> = [];

  for (let i = 0; i < n; i++) {
    const isEnd = i === 0 || i === n - 1;
    const hCount = n === 1 ? 4 : isEnd ? 3 : 2;

    if (n === 1) {
      // Methane: 4H
      hydrogens.push({ lx: cx[0], ly: cy - r - 20, x: cx[0], y: cy - r - 8 });
      hydrogens.push({ lx: cx[0], ly: cy + r + 20, x: cx[0], y: cy + r + 8 });
      hydrogens.push({ lx: cx[0] - 30, ly: cy, x: cx[0] - r - 6, y: cy });
      hydrogens.push({ lx: cx[0] + 30, ly: cy, x: cx[0] + r + 6, y: cy });
    } else {
      // Top H always
      hydrogens.push({ lx: cx[i], ly: cy - r - 22, x: cx[i], y: cy - r - 8 });
      // Bottom H always
      hydrogens.push({ lx: cx[i], ly: cy + r + 22, x: cx[i], y: cy + r + 8 });
      if (hCount === 3) {
        // left or right end H
        if (i === 0) {
          hydrogens.push({ lx: cx[i] - 28, ly: cy, x: cx[i] - r - 6, y: cy });
        } else {
          hydrogens.push({ lx: cx[i] + 28, ly: cy, x: cx[i] + r + 6, y: cy });
        }
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${totalW} 120`}
      className="w-full transition-all duration-300"
      role="img"
      aria-label={`Alkane chain with ${n} carbon atoms`}
    >
      {/* Hydrogen bonds (lines) */}
      {hydrogens.map((h, i) => (
        <line key={`hl-${i}`} x1={h.x} y1={h.y} x2={h.lx} y2={h.ly} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      ))}

      {/* H labels */}
      {hydrogens.map((h, i) => (
        <text key={`ht-${i}`} x={h.lx} y={h.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9ca3af" fontWeight="bold">
          H
        </text>
      ))}

      {/* C-C bonds */}
      {Array.from({ length: n - 1 }, (_, i) => (
        <line
          key={`cc-${i}`}
          x1={cx[i] + r}
          y1={cy}
          x2={cx[i + 1] - r}
          y2={cy}
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}

      {/* Carbon atoms */}
      {cx.map((x, i) => (
        <g key={`c-${i}`}>
          <circle cx={x} cy={cy} r={r} fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <text x={x} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#10b981" fontWeight="bold">
            C
          </text>
          <text x={x} y={cy + r + 36} textAnchor="middle" fontSize="9" fill="#6b7280">
            C{i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AlkaneBuilder({ onEvidenceProduced }: AlkaneBuilderProps) {
  const [carbonCount, setCarbonCount] = React.useState(1);
  const [attempts, setAttempts] = React.useState(0);
  const [maxReached, setMaxReached] = React.useState(false);
  const [evidenceSent, setEvidenceSent] = React.useState(false);

  const formula = getAlkaneFormula(carbonCount);

  const addCarbon = () => {
    if (carbonCount < 6) {
      const next = carbonCount + 1;
      setCarbonCount(next);
      setAttempts((p) => p + 1);
      if (next === 6) setMaxReached(true);
      if (next === 6 && !evidenceSent) {
        setEvidenceSent(true);
        onEvidenceProduced?.({
          conceptId: "c-org-6",
          activityId: "alkane-builder",
          evidenceType: "interactive",
          score: 100,
          attempts: attempts + 1,
          timestamp: Date.now(),
          metadata: { builtC6: true },
        });
      }
    }
  };

  const removeCarbon = () => {
    if (carbonCount > 1) {
      setCarbonCount((p) => p - 1);
      setMaxReached(false);
    }
  };

  const reset = () => {
    setCarbonCount(1);
    setMaxReached(false);
  };

  return (
    <Card className="border-emerald-500/30 bg-emerald-950/10">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-400" />
            Module B — Alkane Chain Builder
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-300">
            C{carbonCount} — {formula.name}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Grow a saturated carbon chain from C1 (Methane) to C6 (Hexane). Watch the formula update.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Chain diagram */}
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-card/60 overflow-x-auto">
          <AlkaneChainSVG n={carbonCount} />
        </div>

        {/* Formula + stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Carbons</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{formula.carbonCount}</div>
          </div>
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Hydrogens</div>
            <div className="text-lg font-bold font-mono text-foreground">{formula.hydrogenCount}</div>
          </div>
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Formula</div>
            <div className="text-sm font-bold font-mono text-emerald-400">{formula.formula}</div>
          </div>
        </div>

        {/* Formula pattern note */}
        <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10 text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">Pattern: </span>
          CₙH₂ₙ₊₂ → For C{carbonCount}: 2×{carbonCount}+2 = <span className="text-emerald-400 font-mono">{formula.hydrogenCount}</span> hydrogens
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={removeCarbon}
            disabled={carbonCount <= 1}
            className="h-8 px-3 text-xs gap-1"
          >
            − Remove Carbon
          </Button>
          <Button
            size="sm"
            onClick={addCarbon}
            disabled={carbonCount >= 6}
            className="h-8 px-3 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            + Add Carbon
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={reset}
            className="h-8 px-2 text-xs gap-1 text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>

          {/* Chain name chips */}
          <div className="flex gap-1 flex-wrap ml-auto">
            {([1, 2, 3, 4, 5, 6] as const).map((n) => (
              <button
                key={n}
                onClick={() => { setCarbonCount(n); setAttempts((p) => p + 1); }}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                  carbonCount === n
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                C{n}
              </button>
            ))}
          </div>
        </div>

        {maxReached && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Built C6 Hexane! You&apos;ve explored the full homologous alkane series. Evidence recorded.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
