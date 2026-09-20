"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BondOrder } from "@/lib/chemistry/types";
import { Sparkles, CheckCircle2, SplitSquareVertical, Zap } from "lucide-react";

interface BondOrderVisualizerProps {
  onEvidenceProduced?: (score: number) => void;
}

interface MoleculeStateData {
  order: BondOrder;
  name: string;
  formula: string;
  classification: string;
  bondLengthPm: number;
  bondEnergyKjMol: number;
  orbitalMakeup: string;
  rotation: string;
  reactivity: string;
  description: string;
}

const BOND_STATES: Record<BondOrder, MoleculeStateData> = {
  1: {
    order: 1,
    name: "Ethane",
    formula: "H₃C—CH₃ (C₂H₆)",
    classification: "Saturated Alkane",
    bondLengthPm: 154,
    bondEnergyKjMol: 348,
    orbitalMakeup: "1 σ (sigma) bond (head-on sp³–sp³ overlap)",
    rotation: "Free rotation around C—C single axis",
    reactivity: "Relatively inert; undergoes free-radical substitution",
    description:
      "A single pair of valence electrons is shared between the two carbon atoms. The bond is relatively long (154 pm) and allows conformational rotation.",
  },
  2: {
    order: 2,
    name: "Ethene (Ethylene)",
    formula: "H₂C=CH₂ (C₂H₄)",
    classification: "Unsaturated Alkene",
    bondLengthPm: 134,
    bondEnergyKjMol: 614,
    orbitalMakeup: "1 σ bond (sp²–sp²) + 1 π bond (lateral 2p–2p overlap)",
    rotation: "Restricted rotation (breaking π bond requires ~266 kJ/mol)",
    reactivity: "Highly reactive; undergoes electrophilic addition reactions",
    description:
      "Two pairs of electrons (4 electrons total) are shared. The additional sideways π-bond pulls the carbon nuclei closer together (134 pm) and locks the molecule in a flat planar geometry.",
  },
  3: {
    order: 3,
    name: "Ethyne (Acetylene)",
    formula: "HC≡CH (C₂H₂)",
    classification: "Unsaturated Alkyne",
    bondLengthPm: 120,
    bondEnergyKjMol: 839,
    orbitalMakeup: "1 σ bond (sp–sp) + 2 mutually perpendicular π bonds",
    rotation: "Completely rigid cylindrical electron cloud",
    reactivity: "Extremely reactive; burns with oxy-acetylene flame (>3300°C)",
    description:
      "Three pairs of electrons (6 electrons total) are shared. This is the shortest (120 pm) and strongest (839 kJ/mol) carbon-carbon linkage, locking the molecule into a rigid 180° linear axis.",
  },
};

export function BondOrderVisualizer({ onEvidenceProduced }: BondOrderVisualizerProps) {
  const [selectedOrder, setSelectedOrder] = React.useState<BondOrder>(1);
  const [inspectedOrders, setInspectedOrders] = React.useState<Set<BondOrder>>(new Set([1]));
  const [showOrbitals, setShowOrbitals] = React.useState<boolean>(true);

  const stateData = BOND_STATES[selectedOrder];

  const handleSelectOrder = (order: BondOrder) => {
    setSelectedOrder(order);
    const updated = new Set(inspectedOrders).add(order);
    setInspectedOrders(updated);

    if (updated.size === 3) {
      onEvidenceProduced?.(100);
    }
  };

  // SVG parameters dynamically modulated by bond length
  // 154 pm -> distance 190
  // 134 pm -> distance 160
  // 120 pm -> distance 135
  const cDistanceMap: Record<BondOrder, number> = {
    1: 190,
    2: 155,
    3: 130,
  };

  const centerDist = cDistanceMap[selectedOrder];
  const c1X = 300 - centerDist / 2;
  const c2X = 300 + centerDist / 2;
  const cY = 135;

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono text-[11px]">
                Module C: Bond Multiplicity
              </Badge>
              <Badge variant="outline" className="text-xs">
                Single vs Double vs Triple
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <SplitSquareVertical className="h-4 w-4 text-cyan-400" />
              Bond Multiplicity: C—C vs C=C vs C≡C
            </CardTitle>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOrbitals(!showOrbitals)}
            className="text-xs h-8 px-2.5"
          >
            {showOrbitals ? "Hide Orbital Clouds" : "Show π/σ Clouds"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Interactive Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/60">
          {([1, 2, 3] as BondOrder[]).map((order) => {
            const isSelected = selectedOrder === order;
            const data = BOND_STATES[order];
            return (
              <button
                key={order}
                onClick={() => handleSelectOrder(order)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="font-mono text-base font-bold">
                  {order === 1 ? "C — C" : order === 2 ? "C = C" : "C ≡ C"}
                </span>
                <span className="text-xs opacity-90 mt-0.5">
                  {order === 1 ? "Single" : order === 2 ? "Double" : "Triple"} ({data.name})
                </span>
              </button>
            );
          })}
        </div>

        {/* Quantitative Metrics Comparator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bond Length</span>
            <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {stateData.bondLengthPm} pm
            </span>
            <span className="text-[10px] text-muted-foreground">Picometers (10⁻¹² m)</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Dissociation Energy</span>
            <span className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {stateData.bondEnergyKjMol} kJ/mol
            </span>
            <span className="text-[10px] text-muted-foreground">Bond Strength</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Shared Electrons</span>
            <span className="text-lg font-bold font-mono text-foreground mt-0.5">
              {selectedOrder * 2} e⁻ ({selectedOrder} pairs)
            </span>
            <span className="text-[10px] text-muted-foreground">Valence Pair Cloud</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saturation State</span>
            <span className="text-sm font-bold text-foreground mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-cyan-400" />
              {stateData.classification}
            </span>
          </div>
        </div>

        {/* Interactive SVG Rendering */}
        <div className="relative rounded-xl border border-border/80 bg-neutral-950/80 p-4 flex flex-col items-center justify-center overflow-x-auto">
          <div className="w-full max-w-[600px] flex justify-center">
            <svg
              viewBox="0 0 600 270"
              className="w-full h-auto max-h-[270px] select-none"
              style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.6))" }}
            >
              <defs>
                <linearGradient id="bondGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="piGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid backdrop */}
              <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`gv-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="270" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`gh-${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} />
                ))}
              </g>

              {/* Pi-electron cloud diffuse lobes (if showOrbitals) */}
              {showOrbitals && selectedOrder >= 2 && (
                <g filter="url(#piGlow)">
                  {/* Top Pi Lobe */}
                  <ellipse
                    cx="300"
                    cy={cY - 36}
                    rx={centerDist * 0.42}
                    ry="24"
                    fill="rgba(56, 189, 248, 0.22)"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                  <text
                    x="300"
                    y={cY - 33}
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    π-electron lobe (top)
                  </text>

                  {/* Bottom Pi Lobe */}
                  <ellipse
                    cx="300"
                    cy={cY + 36}
                    rx={centerDist * 0.42}
                    ry="24"
                    fill="rgba(56, 189, 248, 0.22)"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                  <text
                    x="300"
                    y={cY + 39}
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    π-electron lobe (bottom)
                  </text>
                </g>
              )}

              {/* Second Pi Lobe for Triple Bond (Perpendicular) */}
              {showOrbitals && selectedOrder === 3 && (
                <g>
                  <ellipse
                    cx="300"
                    cy={cY}
                    rx={centerDist * 0.38}
                    ry="14"
                    fill="rgba(244, 63, 94, 0.2)"
                    stroke="rgba(244, 63, 94, 0.6)"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                  <text
                    x="300"
                    y={cY - 12}
                    fill="#fb7185"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    2nd perpendicular π-cloud
                  </text>
                </g>
              )}

              {/* Render Carbon-Carbon Bonds according to selectedOrder */}
              {selectedOrder === 1 && (
                <g>
                  <line
                    x1={c1X + 22}
                    y1={cY}
                    x2={c2X - 22}
                    y2={cY}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <text
                    x="300"
                    y={cY - 12}
                    fill="#38bdf8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    1 σ-bond
                  </text>
                </g>
              )}

              {selectedOrder === 2 && (
                <g>
                  <line
                    x1={c1X + 22}
                    y1={cY - 7}
                    x2={c2X - 22}
                    y2={cY - 7}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <line
                    x1={c1X + 22}
                    y1={cY + 7}
                    x2={c2X - 22}
                    y2={cY + 7}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <text
                    x="300"
                    y={cY - 14}
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    1 σ + 1 π
                  </text>
                </g>
              )}

              {selectedOrder === 3 && (
                <g>
                  <line
                    x1={c1X + 22}
                    y1={cY - 10}
                    x2={c2X - 22}
                    y2={cY - 10}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={c1X + 22}
                    y1={cY}
                    x2={c2X - 22}
                    y2={cY}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={c1X + 22}
                    y1={cY + 10}
                    x2={c2X - 22}
                    y2={cY + 10}
                    stroke="url(#bondGradCyan)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <text
                    x="300"
                    y={cY - 16}
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    1 σ + 2 π
                  </text>
                </g>
              )}

              {/* Hydrogens attached to Left Carbon (C1) */}
              {selectedOrder === 1 && (
                <g>
                  {/* Top-left H */}
                  <line x1={c1X} y1={cY} x2={c1X - 55} y2={cY - 55} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 55} cy={cY - 55} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 55} y={cY - 51} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Mid-left H */}
                  <line x1={c1X} y1={cY} x2={c1X - 70} y2={cY} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 70} cy={cY} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 70} y={cY + 4} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Bottom-left H */}
                  <line x1={c1X} y1={cY} x2={c1X - 55} y2={cY + 55} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 55} cy={cY + 55} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 55} y={cY + 59} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Top-right H */}
                  <line x1={c2X} y1={cY} x2={c2X + 55} y2={cY - 55} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 55} cy={cY - 55} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 55} y={cY - 51} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Mid-right H */}
                  <line x1={c2X} y1={cY} x2={c2X + 70} y2={cY} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 70} cy={cY} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 70} y={cY + 4} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Bottom-right H */}
                  <line x1={c2X} y1={cY} x2={c2X + 55} y2={cY + 55} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 55} cy={cY + 55} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 55} y={cY + 59} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>
                </g>
              )}

              {selectedOrder === 2 && (
                <g>
                  {/* C1 Top-Left (120 deg) */}
                  <line x1={c1X} y1={cY} x2={c1X - 60} y2={cY - 45} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 60} cy={cY - 45} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 60} y={cY - 41} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* C1 Bottom-Left (120 deg) */}
                  <line x1={c1X} y1={cY} x2={c1X - 60} y2={cY + 45} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 60} cy={cY + 45} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 60} y={cY + 49} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* C2 Top-Right (120 deg) */}
                  <line x1={c2X} y1={cY} x2={c2X + 60} y2={cY - 45} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 60} cy={cY - 45} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 60} y={cY - 41} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  {/* C2 Bottom-Right (120 deg) */}
                  <line x1={c2X} y1={cY} x2={c2X + 60} y2={cY + 45} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 60} cy={cY + 45} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 60} y={cY + 49} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>
                </g>
              )}

              {selectedOrder === 3 && (
                <g>
                  {/* Linear H-C ... C-H (180 deg) */}
                  <line x1={c1X} y1={cY} x2={c1X - 70} y2={cY} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c1X - 70} cy={cY} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c1X - 70} y={cY + 4} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>

                  <line x1={c2X} y1={cY} x2={c2X + 70} y2={cY} stroke="#64748b" strokeWidth="2" />
                  <circle cx={c2X + 70} cy={cY} r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={c2X + 70} y={cY + 4} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">H</text>
                </g>
              )}

              {/* Carbon C1 */}
              <circle cx={c1X} cy={cY} r="22" fill="#18181b" stroke="#06b6d4" strokeWidth="3" />
              <text x={c1X} y={cY + 6} fill="#22d3ee" fontSize="15" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                C₁
              </text>

              {/* Carbon C2 */}
              <circle cx={c2X} cy={cY} r="22" fill="#18181b" stroke="#06b6d4" strokeWidth="3" />
              <text x={c2X} y={cY + 6} fill="#22d3ee" fontSize="15" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                C₂
              </text>

              {/* Dimension measurement line underneath */}
              <g stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3">
                <line x1={c1X} y1={cY + 75} x2={c2X} y2={cY + 75} />
                <line x1={c1X} y1={cY + 68} x2={c1X} y2={cY + 82} strokeDasharray="none" />
                <line x1={c2X} y1={cY + 68} x2={c2X} y2={cY + 82} strokeDasharray="none" />
              </g>
              <text
                x="300"
                y={cY + 92}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="monospace"
                textAnchor="middle"
              >
                d(C—C) = {stateData.bondLengthPm} pm
              </text>
            </svg>
          </div>
        </div>

        {/* Deep Scientific Explanation */}
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Molecular Orbital & Spatial Mechanics
            </span>
            <Badge variant="outline" className="text-[11px] font-mono border-cyan-500/40 text-cyan-300">
              {stateData.formula}
            </Badge>
          </div>

          <p className="text-sm text-foreground/90 font-medium">{stateData.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2 rounded bg-background/50 border border-border/50">
              <span className="text-muted-foreground block font-semibold mb-0.5">Orbital Hybridization:</span>
              <span className="text-foreground">{stateData.orbitalMakeup}</span>
            </div>
            <div className="p-2 rounded bg-background/50 border border-border/50">
              <span className="text-muted-foreground block font-semibold mb-0.5">Axial Rotation:</span>
              <span className="text-foreground">{stateData.rotation}</span>
            </div>
          </div>
        </div>

        {/* Exploration Progress Check */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Modes Explored:</span>
            <div className="flex gap-1.5 font-mono">
              {[1, 2, 3].map((order) => (
                <span
                  key={order}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    inspectedOrders.has(order as BondOrder)
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {order === 1 ? "Single" : order === 2 ? "Double" : "Triple"}
                </span>
              ))}
            </div>
          </div>

          {inspectedOrders.size === 3 && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Bond Multiplicity Mastered (100%)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
