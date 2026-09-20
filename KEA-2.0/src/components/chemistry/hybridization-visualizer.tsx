"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HybridizationState } from "@/lib/chemistry/types";
import { CheckCircle2, Compass, Orbit } from "lucide-react";

interface HybridizationVisualizerProps {
  onEvidenceProduced?: (score: number) => void;
}

interface GeometryData {
  state: HybridizationState;
  name: string;
  angle: number;
  electronDomains: number;
  sCharacterPct: number;
  pCharacterPct: number;
  exampleMolecule: string;
  exampleFormula: string;
  spatialDescription: string;
  vseprInsight: string;
}

const GEOMETRY_STATES: Record<HybridizationState, GeometryData> = {
  sp3: {
    state: "sp3",
    name: "Tetrahedral",
    angle: 109.5,
    electronDomains: 4,
    sCharacterPct: 25,
    pCharacterPct: 75,
    exampleMolecule: "Methane",
    exampleFormula: "CH₄",
    spatialDescription:
      "Four equivalent sp³ hybrid orbitals point toward the four vertices of a regular tetrahedron, maximizing distance between 4 bonding pairs in 3D space.",
    vseprInsight:
      "Steric number 4: 109.5° is the ideal angle that minimizes electron-pair repulsion around a spherical central atom.",
  },
  sp2: {
    state: "sp2",
    name: "Trigonal Planar",
    angle: 120.0,
    electronDomains: 3,
    sCharacterPct: 33.3,
    pCharacterPct: 66.7,
    exampleMolecule: "Ethene",
    exampleFormula: "H₂C=CH₂",
    spatialDescription:
      "Three sp² hybrid orbitals lie flat in a single two-dimensional plane, separated by 120° angles. An unhybridized 2p orbital sits perpendicular above and below.",
    vseprInsight:
      "Steric number 3: 120° planar distribution evenly divides 360° of a 2D plane among 3 electron domains.",
  },
  sp: {
    state: "sp",
    name: "Linear",
    angle: 180.0,
    electronDomains: 2,
    sCharacterPct: 50,
    pCharacterPct: 50,
    exampleMolecule: "Ethyne",
    exampleFormula: "HC≡CH",
    spatialDescription:
      "Two sp hybrid orbitals point in diametrically opposite directions (180°), creating a rigid collinear molecular backbone.",
    vseprInsight:
      "Steric number 2: 180° angle positions the two electron clouds as far apart from each other as physically possible.",
  },
};

export function HybridizationVisualizer({ onEvidenceProduced }: HybridizationVisualizerProps) {
  const [selectedState, setSelectedState] = React.useState<HybridizationState>("sp3");
  const [inspectedStates, setInspectedStates] = React.useState<Set<HybridizationState>>(new Set(["sp3"]));

  const current = GEOMETRY_STATES[selectedState];

  const handleSelectState = (state: HybridizationState) => {
    setSelectedState(state);
    const updated = new Set(inspectedStates).add(state);
    setInspectedStates(updated);

    if (updated.size === 3) {
      onEvidenceProduced?.(100);
    }
  };

  const centerX = 300;
  const centerY = 145;

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-[11px]">
                Module D: Carbon Geometry
              </Badge>
              <Badge variant="outline" className="text-xs">
                Orbital Hybridization & Angles
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-purple-400" />
              Carbon Geometry: sp³ (109.5°) → sp² (120°) → sp (180°)
            </CardTitle>
          </div>

          <Badge variant="secondary" className="font-mono text-xs">
            VSEPR Steric Law
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* State Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/60">
          {(["sp3", "sp2", "sp"] as HybridizationState[]).map((state) => {
            const isSelected = selectedState === state;
            const data = GEOMETRY_STATES[state];
            return (
              <button
                key={state}
                onClick={() => handleSelectState(state)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-md ring-1 ring-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="font-mono text-base font-bold">
                  {state === "sp3" ? "sp³" : state === "sp2" ? "sp²" : "sp"}
                </span>
                <span className="text-xs opacity-90 mt-0.5">
                  {data.name} ({data.angle}°)
                </span>
              </button>
            );
          })}
        </div>

        {/* Spatial Properties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bond Angle</span>
            <span className="text-xl font-bold font-mono text-purple-400 mt-0.5">{current.angle}°</span>
            <span className="text-[10px] text-muted-foreground">Repulsion Minimum</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Geometry</span>
            <span className="text-sm font-bold text-foreground mt-1">{current.name}</span>
            <span className="text-[10px] text-muted-foreground">{current.electronDomains} Electron Domains</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">s-Character</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{current.sCharacterPct}%</span>
            <span className="text-[10px] text-muted-foreground">{current.pCharacterPct}% p-Character</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Archetype</span>
            <span className="text-sm font-bold text-foreground mt-1">{current.exampleMolecule}</span>
            <span className="text-[10px] font-mono text-purple-300">{current.exampleFormula}</span>
          </div>
        </div>

        {/* Interactive SVG Geometry Canvas */}
        <div className="relative rounded-xl border border-border/80 bg-neutral-950/80 p-4 flex flex-col items-center justify-center overflow-x-auto">
          <div className="w-full max-w-[600px] flex justify-center">
            <svg
              viewBox="0 0 600 290"
              className="w-full h-auto max-h-[290px] select-none"
              style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.6))" }}
            >
              <defs>
                <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Lab Grid */}
              <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="290" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} />
                ))}
              </g>

              {/* RENDER GEOMETRY BASED ON STATE */}

              {/* 1. Tetrahedral sp3 (109.5°) */}
              {selectedState === "sp3" && (
                <g>
                  {/* Top Bond (In plane) */}
                  <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - 90} stroke="#a855f7" strokeWidth="3" />
                  <circle cx={centerX} cy={centerY - 90} r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={centerX} y={centerY - 86} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">H₁</text>

                  {/* Right-down Bond (In plane) */}
                  <line x1={centerX} y1={centerY} x2={centerX + 85} y2={centerY + 45} stroke="#a855f7" strokeWidth="3" />
                  <circle cx={centerX + 85} cy={centerY + 45} r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={centerX + 85} y={centerY + 49} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">H₂</text>

                  {/* Left-down Wedge Bond (Pointing OUTWARD toward viewer) */}
                  <polygon
                    points={`${centerX},${centerY} ${centerX - 75},${centerY + 65} ${centerX - 60},${centerY + 78}`}
                    fill="#c084fc"
                    opacity="0.9"
                  />
                  <circle cx={centerX - 67} cy={centerY + 72} r="15" fill="#1e1b4b" stroke="#c084fc" strokeWidth="2.5" />
                  <text x={centerX - 67} y={centerY + 76} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">H₃</text>
                  <text x={centerX - 105} y={centerY + 95} fill="#c084fc" fontSize="10" fontFamily="monospace">
                    ▲ Wedge (Outward)
                  </text>

                  {/* Left-mid Dash Bond (Pointing INWARD away from viewer) */}
                  <g stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3,3">
                    <line x1={centerX} y1={centerY} x2={centerX - 75} y2={centerY + 10} />
                  </g>
                  <circle cx={centerX - 75} cy={centerY + 10} r="13" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x={centerX - 75} y={centerY + 14} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">H₄</text>
                  <text x={centerX - 120} y={centerY + 14} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                    {"/// Dash (Inward)"}
                  </text>

                  {/* Angle Arc Indicator: between Top and Right bond (~109.5°) */}
                  <path
                    d={`M ${centerX} ${centerY - 45} A 45 45 0 0 1 ${centerX + 39} ${centerY + 22}`}
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <rect x={centerX + 24} y={centerY - 22} width="58" height="20" rx="4" fill="#581c87" />
                  <text x={centerX + 53} y={centerY - 8} fill="#f5d0fe" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    109.5°
                  </text>
                </g>
              )}

              {/* 2. Trigonal Planar sp2 (120°) */}
              {selectedState === "sp2" && (
                <g>
                  {/* Top-Right Bond (30 deg above horizontal = 120 deg from bottom) */}
                  <line x1={centerX} y1={centerY} x2={centerX + 85} y2={centerY - 50} stroke="#a855f7" strokeWidth="3" />
                  <circle cx={centerX + 85} cy={centerY - 50} r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={centerX + 85} y={centerY - 46} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">R₁</text>

                  {/* Top-Left Bond (150 deg) */}
                  <line x1={centerX} y1={centerY} x2={centerX - 85} y2={centerY - 50} stroke="#a855f7" strokeWidth="3" />
                  <circle cx={centerX - 85} cy={centerY - 50} r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={centerX - 85} y={centerY - 46} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">R₂</text>

                  {/* Bottom Double Bond (270 deg / vertical down) */}
                  <line x1={centerX - 4} y1={centerY} x2={centerX - 4} y2={centerY + 90} stroke="#a855f7" strokeWidth="2.5" />
                  <line x1={centerX + 4} y1={centerY} x2={centerX + 4} y2={centerY + 90} stroke="#a855f7" strokeWidth="2.5" />
                  <circle cx={centerX} cy={centerY + 90} r="16" fill="#18181b" stroke="#38bdf8" strokeWidth="2" />
                  <text x={centerX} y={centerY + 95} fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">CH₂</text>

                  {/* Angle Arc Indicator: between R1 and R2 (120°) */}
                  <path
                    d={`M ${centerX - 35} ${centerY - 20} A 40 40 0 0 1 ${centerX + 35} ${centerY - 20}`}
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <rect x={centerX - 24} y={centerY - 50} width="48" height="20" rx="4" fill="#581c87" />
                  <text x={centerX} y={centerY - 36} fill="#f5d0fe" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    120.0°
                  </text>

                  <text x={centerX + 120} y={centerY + 10} fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
                    Flat Planar (All in-plane)
                  </text>
                </g>
              )}

              {/* 3. Linear sp (180°) */}
              {selectedState === "sp" && (
                <g>
                  {/* Left Triple Bond */}
                  <line x1={centerX} y1={centerY - 6} x2={centerX - 100} y2={centerY - 6} stroke="#a855f7" strokeWidth="2.5" />
                  <line x1={centerX} y1={centerY} x2={centerX - 100} y2={centerY} stroke="#a855f7" strokeWidth="2.5" />
                  <line x1={centerX} y1={centerY + 6} x2={centerX - 100} y2={centerY + 6} stroke="#a855f7" strokeWidth="2.5" />
                  <circle cx={centerX - 100} cy={centerY} r="16" fill="#18181b" stroke="#38bdf8" strokeWidth="2" />
                  <text x={centerX - 100} y={centerY + 5} fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">CH</text>

                  {/* Right Single Bond */}
                  <line x1={centerX} y1={centerY} x2={centerX + 100} y2={centerY} stroke="#a855f7" strokeWidth="3" />
                  <circle cx={centerX + 100} cy={centerY} r="14" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={centerX + 100} y={centerY + 4} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">H</text>

                  {/* 180° Angle Arc Indicator */}
                  <path
                    d={`M ${centerX - 35} ${centerY} A 35 35 0 0 1 ${centerX + 35} ${centerY}`}
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <rect x={centerX - 24} y={centerY - 50} width="48" height="20" rx="4" fill="#581c87" />
                  <text x={centerX} y={centerY - 36} fill="#f5d0fe" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    180.0°
                  </text>

                  <text x={centerX} y={centerY + 40} fill="#94a3b8" fontSize="11" fontFamily="sans-serif" textAnchor="middle">
                    Rigid Collinear Axis
                  </text>
                </g>
              )}

              {/* Central Carbon Core */}
              <circle cx={centerX} cy={centerY} r="22" fill="#18181b" stroke="#a855f7" strokeWidth="3" filter="url(#purpleGlow)" />
              <text x={centerX} y={centerY + 6} fill="#e9d5ff" fontSize="15" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                C
              </text>
            </svg>
          </div>
        </div>

        {/* Orbital Mechanics & VSEPR Explanation */}
        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <Orbit className="h-3.5 w-3.5" />
              Hybridization Mechanics & Spatial Distribution
            </span>
            <Badge variant="outline" className="text-[11px] font-mono border-purple-500/40 text-purple-300">
              {current.state.toUpperCase()} Hybridization
            </Badge>
          </div>

          <p className="text-sm text-foreground/90 font-medium">{current.spatialDescription}</p>
          <p className="text-xs text-muted-foreground">{current.vseprInsight}</p>
        </div>

        {/* Completion Progress Tracker */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Geometries Analyzed:</span>
            <div className="flex gap-1.5 font-mono">
              {(["sp3", "sp2", "sp"] as HybridizationState[]).map((st) => (
                <span
                  key={st}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    inspectedStates.has(st)
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {st.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          {inspectedStates.size === 3 && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Geometry Mastery Confirmed (100%)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
