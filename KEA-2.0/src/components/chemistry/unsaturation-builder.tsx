"use client";

/**
 * Module C — Alkene Builder (Introduce a Double Bond into a carbon chain)
 * Module D — Alkyne Builder (Introduce a Triple Bond into a carbon chain)
 *
 * Combined into one file since both modules share the same pattern:
 * Start from a C-C-C chain, introduce a bond multiplicity at position 1.
 * Show live SVG bond change, formula change, unsaturation indicator.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, CheckCircle2 } from "lucide-react";
import { getAlkeneFormula, getAlkyneFormula } from "@/lib/chemistry/hydrocarbon-classifier";
import { ChemistryLearningEvidence } from "@/lib/chemistry/types";

type BondType = "single" | "double" | "triple";

interface UnsaturationBuilderProps {
  mode: "alkene" | "alkyne";
  onEvidenceProduced?: (evidence: ChemistryLearningEvidence) => void;
}

// SVG for a 3-carbon chain with specified bond between C1-C2
function UnsaturationChainSVG({ bondType }: { bondType: BondType }) {
  const cx1 = 60, cx2 = 180, cx3 = 300, cy = 60, r = 18;

  const color1 =
    bondType === "double" ? "#f59e0b" : bondType === "triple" ? "#06b6d4" : "#10b981";
  const color2 = "#10b981";

  // Hydrogens: depends on bond multiplicity at C1-C2
  const hydrogenConfig = {
    single: { c1: 3, c2: 2, c3: 3 },
    double: { c1: 2, c2: 1, c3: 3 },
    triple: { c1: 1, c2: 0, c3: 3 },
  };

  const hCfg = hydrogenConfig[bondType];

  type HPos = { lx: number; ly: number; ex: number; ey: number };
  const hydrogens: HPos[] = [];

  // C1 hydrogens
  if (hCfg.c1 >= 1) hydrogens.push({ lx: cx1 - 34, ly: cy, ex: cx1 - r - 6, ey: cy });
  if (hCfg.c1 >= 2) hydrogens.push({ lx: cx1, ly: cy - 36, ex: cx1, ey: cy - r - 8 });
  if (hCfg.c1 >= 3) hydrogens.push({ lx: cx1, ly: cy + 36, ex: cx1, ey: cy + r + 8 });

  // C2 hydrogens
  if (hCfg.c2 >= 1) hydrogens.push({ lx: cx2, ly: cy - 36, ex: cx2, ey: cy - r - 8 });
  if (hCfg.c2 >= 2) hydrogens.push({ lx: cx2, ly: cy + 36, ex: cx2, ey: cy + r + 8 });

  // C3 hydrogens (always 3)
  hydrogens.push({ lx: cx3 + 34, ly: cy, ex: cx3 + r + 6, ey: cy });
  hydrogens.push({ lx: cx3, ly: cy - 36, ex: cx3, ey: cy - r - 8 });
  hydrogens.push({ lx: cx3, ly: cy + 36, ex: cx3, ey: cy + r + 8 });

  return (
    <svg
      viewBox="0 0 360 130"
      className="w-full max-w-xs mx-auto transition-all duration-300"
      role="img"
      aria-label={`3-carbon chain with ${bondType} bond between C1 and C2`}
    >
      {/* H lines */}
      {hydrogens.map((h, i) => (
        <line key={`hl-${i}`} x1={h.ex} y1={h.ey} x2={h.lx} y2={h.ly} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
      ))}

      {/* H labels */}
      {hydrogens.map((h, i) => (
        <text key={`ht-${i}`} x={h.lx} y={h.ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">
          H
        </text>
      ))}

      {/* C1–C2 bond */}
      {bondType === "single" && (
        <line x1={cx1 + r} y1={cy} x2={cx2 - r} y2={cy} stroke={color1} strokeWidth="2.5" />
      )}
      {bondType === "double" && (
        <>
          <line x1={cx1 + r} y1={cy - 4.5} x2={cx2 - r} y2={cy - 4.5} stroke={color1} strokeWidth="2.5" />
          <line x1={cx1 + r} y1={cy + 4.5} x2={cx2 - r} y2={cy + 4.5} stroke={color1} strokeWidth="2.5" />
        </>
      )}
      {bondType === "triple" && (
        <>
          <line x1={cx1 + r} y1={cy - 5.5} x2={cx2 - r} y2={cy - 5.5} stroke={color1} strokeWidth="2.5" />
          <line x1={cx1 + r} y1={cy} x2={cx2 - r} y2={cy} stroke={color1} strokeWidth="2.5" />
          <line x1={cx1 + r} y1={cy + 5.5} x2={cx2 - r} y2={cy + 5.5} stroke={color1} strokeWidth="2.5" />
        </>
      )}

      {/* C2–C3 bond (always single) */}
      <line x1={cx2 + r} y1={cy} x2={cx3 - r} y2={cy} stroke={color2} strokeWidth="2.5" />

      {/* C atoms */}
      {[
        { x: cx1, color: color1 },
        { x: cx2, color: color1 },
        { x: cx3, color: color2 },
      ].map(({ x, color }, i) => (
        <g key={`ca-${i}`}>
          <circle cx={x} cy={cy} r={r} fill="#0f172a" stroke={color} strokeWidth="2" />
          <text x={x} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="white" fontWeight="bold">
            C
          </text>
        </g>
      ))}

      {/* Bond label overlay */}
      <text
        x={(cx1 + cx2) / 2}
        y={cy + r + 20}
        textAnchor="middle"
        fontSize="9"
        fill={color1}
        fontWeight="bold"
      >
        {bondType === "single" && "C — C"}
        {bondType === "double" && "C = C"}
        {bondType === "triple" && "C ≡ C"}
      </text>
    </svg>
  );
}

export function UnsaturationBuilder({ mode, onEvidenceProduced }: UnsaturationBuilderProps) {
  const [carbonCount, setCarbonCount] = React.useState(3);
  const [hasBond, setHasBond] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [evidenceSent, setEvidenceSent] = React.useState(false);

  const bondType: BondType = hasBond ? (mode === "alkene" ? "double" : "triple") : "single";

  const formulaData =
    hasBond
      ? mode === "alkene"
        ? getAlkeneFormula(carbonCount, 1)
        : getAlkyneFormula(carbonCount, 1)
      : null;

  const currentFormula = formulaData
    ? formulaData.formula
    : `C${carbonCount}H${2 * carbonCount + 2}`;

  const conceptId = mode === "alkene" ? "c-org-7" : "c-org-7";
  const activityId = mode === "alkene" ? "alkene-builder" : "alkyne-builder";
  const accentColor = mode === "alkene" ? "text-amber-400" : "text-cyan-400";
  const borderColor = mode === "alkene" ? "border-amber-500/30" : "border-cyan-500/30";
  const bgColor = mode === "alkene" ? "bg-amber-950/10" : "bg-cyan-950/10";
  const btnColor = mode === "alkene" ? "bg-amber-600 hover:bg-amber-700" : "bg-cyan-700 hover:bg-cyan-800";
  const bondSymbol = mode === "alkene" ? "C = C" : "C ≡ C";
  const removeBondSymbol = mode === "alkene" ? "C — C" : "C — C";

  const handleIntroduceBond = () => {
    setHasBond(true);
    setAttempts((p) => p + 1);
    if (!evidenceSent) {
      setEvidenceSent(true);
      onEvidenceProduced?.({
        conceptId,
        activityId,
        evidenceType: "interactive",
        score: 100,
        attempts: attempts + 1,
        timestamp: Date.now(),
        metadata: { carbonCount, bondMode: mode },
      });
    }
  };

  const handleRemoveBond = () => {
    setHasBond(false);
    setAttempts((p) => p + 1);
  };

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-bold text-foreground flex items-center gap-2`}>
            <FlaskConical className={`h-4 w-4 ${accentColor}`} />
            {mode === "alkene" ? "Module C — Alkene Builder" : "Module D — Alkyne Builder"}
          </CardTitle>
          <Badge variant="outline" className={`text-[10px] font-mono ${borderColor} ${accentColor}`}>
            {hasBond ? "Unsaturated" : "Saturated"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "alkene"
            ? "Introduce a C=C double bond into a carbon chain and see the formula change."
            : "Introduce a C≡C triple bond and observe how hydrogen count drops further."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* SVG Diagram */}
        <div className={`p-3 rounded-xl border ${borderColor} bg-card/60 overflow-x-auto`}>
          <UnsaturationChainSVG bondType={bondType} />
        </div>

        {/* Formula comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/10 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">Before</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              C{carbonCount}H{2 * carbonCount + 2}
            </div>
            <div className="text-[10px] text-muted-foreground">Alkane (saturated)</div>
          </div>
          <div className={`p-2.5 rounded-lg border ${borderColor} text-center transition-all ${hasBond ? (mode === "alkene" ? "bg-amber-950/20" : "bg-cyan-950/20") : "bg-muted/20 opacity-50"}`}>
            <div className="text-[10px] text-muted-foreground mb-0.5">After</div>
            <div className={`text-sm font-bold font-mono ${accentColor}`}>
              {hasBond ? currentFormula : "— —"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {hasBond ? (mode === "alkene" ? "Alkene (unsaturated)" : "Alkyne (unsaturated)") : "Introduce bond →"}
            </div>
          </div>
        </div>

        {/* Unsaturation indicator */}
        {hasBond && (
          <div className={`p-2.5 rounded-lg border ${borderColor} text-xs`}>
            <span className={`font-bold ${accentColor}`}>{bondSymbol} bond introduced:</span>
            <span className="text-muted-foreground ml-1">
              Hydrogen count drops by {mode === "alkene" ? 2 : 4} — degree of unsaturation = {mode === "alkene" ? 1 : 2}
            </span>
          </div>
        )}

        {/* Chain size selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold">Chain Length:</span>
          {([2, 3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              onClick={() => { setCarbonCount(n); setHasBond(false); }}
              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                carbonCount === n
                  ? `bg-card border ${borderColor} ${accentColor}`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              C{n}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {!hasBond ? (
            <Button
              size="sm"
              onClick={handleIntroduceBond}
              className={`h-8 px-4 text-xs font-bold ${btnColor} text-white gap-1.5`}
            >
              Introduce {bondSymbol}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemoveBond}
              className="h-8 px-4 text-xs gap-1.5"
            >
              Revert to {removeBondSymbol}
            </Button>
          )}
        </div>

        {hasBond && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${accentColor}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {mode === "alkene" ? "Alkene built!" : "Alkyne built!"} Evidence recorded.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
