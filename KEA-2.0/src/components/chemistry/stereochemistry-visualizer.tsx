"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  RotateCw,
  ShieldAlert,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface StereochemistryVisualizerProps {
  onRecordEvidence?: (
    conceptId: string,
    activityTitle: string,
    score: number,
    metadata?: Record<string, unknown>
  ) => void;
}

export function StereochemistryVisualizer({
  onRecordEvidence,
}: StereochemistryVisualizerProps) {
  const [isomerType, setIsomerType] = React.useState<"cis" | "trans">("cis");
  const [isRotating, setIsRotating] = React.useState(false);
  const [showRotationBarrierNotice, setShowRotationBarrierNotice] = React.useState(false);

  const handleToggleIsomer = (target: "cis" | "trans") => {
    setIsomerType(target);
    setShowRotationBarrierNotice(false);
    onRecordEvidence?.(
      "c-org-14",
      `Geometric Stereoisomer Switch: ${target.toUpperCase()}-2-Butene`,
      95,
      { isomerType: target }
    );
  };

  const handleAttemptRotation = () => {
    setIsRotating(true);
    setShowRotationBarrierNotice(true);
    setTimeout(() => {
      setIsRotating(false);
    }, 1200);

    onRecordEvidence?.(
      "c-org-14",
      "Rotational Barrier Investigation (Pi Bond Rigidity)",
      100,
      { energeticBarrierKj: 260 }
    );
  };

  const isCis = isomerType === "cis";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-bold text-foreground">
              Geometric Stereochemistry: Cis vs Trans 2-Butene
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore why the carbon-carbon double bond (C=C) locks atoms in rigid 3D spatial configurations.
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isCis ? "default" : "outline"}
            onClick={() => handleToggleIsomer("cis")}
            className={
              isCis
                ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            cis-2-Butene (Z)
          </Button>
          <Button
            size="sm"
            variant={!isCis ? "default" : "outline"}
            onClick={() => handleToggleIsomer("trans")}
            className={
              !isCis
                ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            trans-2-Butene (E)
          </Button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive 2D/3D SVG Representation */}
        <Card className="lg:col-span-7 border border-border/80 bg-card/70 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Active Conformer
                </span>
                <h4 className="text-lg font-black text-foreground">
                  {isCis ? "cis-2-Butene ((2Z)-But-2-ene)" : "trans-2-Butene ((2E)-But-2-ene)"}
                </h4>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs border-cyan-500/40 text-cyan-300"
              >
                C4H8
              </Badge>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative">
              <svg
                viewBox="0 0 460 280"
                className={`w-full h-64 sm:h-72 bg-slate-950/80 rounded-xl border border-cyan-500/20 transition-all ${
                  isRotating ? "animate-pulse ring-2 ring-amber-500/50" : ""
                }`}
              >
                <defs>
                  {/* Pi bond electron cloud gradient */}
                  <linearGradient id="piCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                  </linearGradient>

                  {/* Dipole arrow marker */}
                  <marker
                    id="dipoleArrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Pi-Bond Overlap Shaded Region (Above and Below double bond) */}
                <ellipse
                  cx="230"
                  cy="140"
                  rx="75"
                  ry="45"
                  fill="url(#piCloudGrad)"
                  stroke="#0891b2"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x="230"
                  y="85"
                  fill="#22d3ee"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  π (pi) bond electron density (rigid overlap)
                </text>

                {/* Rigid Double Bond Axis */}
                <line
                  x1="180"
                  y1="135"
                  x2="280"
                  y2="135"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="180"
                  y1="145"
                  x2="280"
                  y2="145"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Left substituents (Fixed) */}
                {/* C1 (CH3 top-left) */}
                <line x1="120" y1="80" x2="180" y2="140" stroke="#64748b" strokeWidth="2.5" />
                {/* H (bottom-left) */}
                <line x1="130" y1="200" x2="180" y2="140" stroke="#0284c7" strokeWidth="1.8" />

                {/* Right substituents (Cis vs Trans) */}
                {isCis ? (
                  <>
                    {/* Cis: C4 (CH3 top-right) on SAME side as C1 */}
                    <line x1="280" y1="140" x2="340" y2="80" stroke="#64748b" strokeWidth="2.5" />
                    {/* Cis: H on bottom-right */}
                    <line x1="280" y1="140" x2="330" y2="200" stroke="#0284c7" strokeWidth="1.8" />

                    {/* Net Dipole vector for Cis (Pointing Upwards) */}
                    <line
                      x1="230"
                      y1="140"
                      x2="230"
                      y2="40"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      markerEnd="url(#dipoleArrow)"
                    />
                    <text x="245" y="45" fill="#38bdf8" fontSize="11" fontWeight="bold">
                      Net Dipole (μ = 0.25 D)
                    </text>
                  </>
                ) : (
                  <>
                    {/* Trans: C4 (CH3 bottom-right) on OPPOSITE side */}
                    <line x1="280" y1="140" x2="340" y2="200" stroke="#64748b" strokeWidth="2.5" />
                    {/* Trans: H on top-right */}
                    <line x1="280" y1="140" x2="330" y2="80" stroke="#0284c7" strokeWidth="1.8" />

                    {/* Opposing vectors cancel out */}
                    <text x="230" y="45" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
                      Dipoles Cancel (μ = 0.00 D)
                    </text>
                  </>
                )}

                {/* Central Carbons */}
                {/* C2 */}
                <circle cx="180" cy="140" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="180" y="145" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                  C2
                </text>

                {/* C3 */}
                <circle cx="280" cy="140" r="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="280" y="145" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">
                  C3
                </text>

                {/* Substituent Nodes */}
                {/* Top-Left CH3 (C1) */}
                <circle cx="120" cy="80" r="18" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                <text x="120" y="84" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  -CH₃
                </text>

                {/* Bottom-Left H */}
                <circle cx="130" cy="200" r="11" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="130" y="204" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  H
                </text>

                {/* Right side substituent nodes */}
                {isCis ? (
                  <>
                    {/* Top-Right CH3 (C4) */}
                    <circle cx="340" cy="80" r="18" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="340" y="84" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                      -CH₃
                    </text>
                    {/* Bottom-Right H */}
                    <circle cx="330" cy="200" r="11" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="330" y="204" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      H
                    </text>
                  </>
                ) : (
                  <>
                    {/* Bottom-Right CH3 (C4) */}
                    <circle cx="340" cy="200" r="18" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="340" y="204" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                      -CH₃
                    </text>
                    {/* Top-Right H */}
                    <circle cx="330" cy="80" r="11" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="330" y="84" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      H
                    </text>
                  </>
                )}
              </svg>

              {/* Attempt Rotation Button overlay */}
              <div className="flex justify-center mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAttemptRotation}
                  disabled={isRotating}
                  className="gap-2 cursor-pointer border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 font-semibold text-xs"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isRotating ? "animate-spin text-amber-400" : ""}`} />
                  <span>{isRotating ? "Resisting Rotation..." : "Test Free Rotation Around C=C"}</span>
                </Button>
              </div>
            </div>

            {/* Energetic Barrier Notification */}
            {showRotationBarrierNotice && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  <span>High Energy Barrier: Free Rotation Blocked (~260 kJ/mol)</span>
                </div>
                <p className="leading-relaxed">
                  Rotating around a double bond breaks the sideways <strong>pi (π) overlap</strong> of the 2p orbitals.
                  Because thermal energy at room temperature is only ~2.5 kJ/mol, the molecule is permanently locked in its
                  stereochemical orientation!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Stereochemical Properties Breakdown */}
        <Card className="lg:col-span-5 border border-border/80 bg-card/70 shadow-sm space-y-4">
          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Physical Property Divergence
              </h4>
            </div>

            {/* Contrast Table */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  1. Dipole Moment & Polarity:
                </span>
                <p className="leading-relaxed text-foreground">
                  {isCis ? (
                    <>
                      <strong>Polar (μ = 0.25 D):</strong> Both electron-releasing methyl groups lie on the same side,
                      producing a constructive net dipole pointing toward the hydrogens.
                    </>
                  ) : (
                    <>
                      <strong>Nonpolar (μ = 0.00 D):</strong> The two methyl groups point in opposite directions at 180°,
                      causing their individual dipole vectors to exactly cancel out.
                    </>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  2. Boiling Point:
                </span>
                <p className="leading-relaxed text-foreground">
                  {isCis ? (
                    <>
                      <strong>3.7°C (Higher):</strong> Intermolecular dipole-dipole attractions require slightly higher
                      thermal kinetic energy to vaporize into the gas phase.
                    </>
                  ) : (
                    <>
                      <strong>0.9°C (Lower):</strong> Absence of net molecular polarity reduces intermolecular attraction
                      to London dispersion forces alone.
                    </>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/80 border border-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  3. Crystal Packing & Melting Point:
                </span>
                <p className="leading-relaxed text-foreground">
                  {isCis ? (
                    <>
                      <strong>Melting Point: -138.9°C:</strong> The U-shaped bent geometry packs less efficiently in a
                      solid crystal lattice.
                    </>
                  ) : (
                    <>
                      <strong>Melting Point: -105.6°C (Higher):</strong> The highly symmetric linear trans shape packs
                      much more tightly and tightly in crystalline structures.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Summary Tag */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Mastery Core:</strong> Stereoisomers have identical formulas and identical connectivity, but
                differ in spatial arrangement due to constrained geometry.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
