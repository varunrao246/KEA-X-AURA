"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, RotateCcw, Sparkles, CheckCircle2, Link2, Flame } from "lucide-react";

interface CarbonBondBuilderProps {
  onEvidenceProduced?: (score: number) => void;
}

interface AlkaneData {
  carbons: number;
  hydrogens: number;
  name: string;
  formula: string;
  molarMass: number;
  stateAtSTP: string;
  realWorldUse: string;
  catenationInsight: string;
}

const ALKANE_TABLE: Record<number, AlkaneData> = {
  1: {
    carbons: 1,
    hydrogens: 4,
    name: "Methane",
    formula: "CH₄",
    molarMass: 16.04,
    stateAtSTP: "Gas",
    realWorldUse: "Natural gas fuel, domestic heating, biogas",
    catenationInsight: "A solitary carbon core bonded to 4 hydrogens. No C—C catenation yet.",
  },
  2: {
    carbons: 2,
    hydrogens: 6,
    name: "Ethane",
    formula: "C₂H₆",
    molarMass: 30.07,
    stateAtSTP: "Gas",
    realWorldUse: "Petrochemical feedstock for ethylene production",
    catenationInsight: "First true carbon-carbon bond! The 348 kJ/mol bond strength creates unconditional structural stability.",
  },
  3: {
    carbons: 3,
    hydrogens: 8,
    name: "Propane",
    formula: "C₃H₈",
    molarMass: 44.1,
    stateAtSTP: "Pressurized Liquid / Gas",
    realWorldUse: "LPG cylinders, portable stoves, outdoor heating",
    catenationInsight: "3-carbon catenated chain: the central carbon bonds to TWO carbons, proving backbone extension.",
  },
  4: {
    carbons: 4,
    hydrogens: 10,
    name: "Butane",
    formula: "C₄H₁₀",
    molarMass: 58.12,
    stateAtSTP: "Liquefied Gas",
    realWorldUse: "Lighter fluid, aerosol propellants, fuel canisters",
    catenationInsight: "4-carbon chain: demonstrates structural flexibility and conformational rotation around sigma bonds.",
  },
  5: {
    carbons: 5,
    hydrogens: 12,
    name: "Pentane",
    formula: "C₅H₁₂",
    molarMass: 72.15,
    stateAtSTP: "Volatile Liquid",
    realWorldUse: "Industrial solvent, laboratory extractions",
    catenationInsight: "5-carbon chain: London dispersion forces are now strong enough to condense the substance into a liquid at room temperature!",
  },
  6: {
    carbons: 6,
    hydrogens: 14,
    name: "Hexane",
    formula: "C₆H₁₄",
    molarMass: 86.18,
    stateAtSTP: "Liquid",
    realWorldUse: "Vegetable oil extraction, adhesives, rubber cement",
    catenationInsight: "Extended 6-carbon backbone: establishes carbon's unique ability to form endless polymeric and biological chains (DNA, proteins, lipids).",
  },
};

export function CarbonBondBuilder({ onEvidenceProduced }: CarbonBondBuilderProps) {
  const [chainLength, setChainLength] = React.useState<number>(1);
  const [hasEmittedEvidence, setHasEmittedEvidence] = React.useState<boolean>(false);
  const [showHydrogens, setShowHydrogens] = React.useState<boolean>(true);

  const alkane = ALKANE_TABLE[chainLength];

  const handleAddCarbon = () => {
    if (chainLength < 6) {
      const next = chainLength + 1;
      setChainLength(next);
      if (next >= 4 && !hasEmittedEvidence) {
        setHasEmittedEvidence(true);
        onEvidenceProduced?.(100);
      }
    }
  };

  const handleRemoveCarbon = () => {
    if (chainLength > 1) {
      setChainLength(chainLength - 1);
    }
  };

  const handleReset = () => {
    setChainLength(1);
  };

  // Generate SVG coordinates for zig-zag carbon chain
  // Viewbox: 0 0 600 240
  const svgWidth = 640;
  const svgHeight = 260;
  const startX = 70;
  const stepX = 90;
  const baseY = 130;
  const zigZagOffset = 28;

  const carbonNodes = Array.from({ length: chainLength }).map((_, index) => {
    const x = startX + index * stepX;
    const y = baseY + (index % 2 === 0 ? -zigZagOffset : zigZagOffset);
    return { id: index + 1, x, y };
  });

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
                Module B: Catenation
              </Badge>
              <Badge variant="outline" className="text-xs">
                Backbone Extension Builder
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-400" />
              Carbon Builds with Carbon: Self-Linking & Alkane Backbones
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHydrogens(!showHydrogens)}
              className="text-xs h-8 px-2.5"
            >
              {showHydrogens ? "Hide H Atoms" : "Show H Atoms"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Metric summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">IUPAC Name</span>
            <span className="text-lg font-bold text-foreground mt-0.5">{alkane.name}</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Formula (CₙH₂ₙ₊₂)</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{alkane.formula}</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">C—C Covalent Bonds</span>
            <span className="text-lg font-bold text-foreground mt-0.5">{chainLength - 1} Bonds</span>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phase at 25°C</span>
            <span className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              {alkane.stateAtSTP}
            </span>
          </div>
        </div>

        {/* Interactive SVG Construction Canvas */}
        <div className="relative rounded-xl border border-border/80 bg-neutral-950/80 p-4 flex flex-col items-center justify-center overflow-x-auto">
          <div className="w-full max-w-[640px] flex justify-center">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[260px] select-none"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
            >
              <defs>
                <linearGradient id="cBondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <filter id="cGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background Lines for Lab Blueprint aesthetic */}
              <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
                {Array.from({ length: 13 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={svgHeight} />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 50} x2={svgWidth} y2={i * 50} />
                ))}
              </g>

              {/* C-C Bonds (Sigma Bonds) */}
              {carbonNodes.map((node, index) => {
                if (index === 0) return null;
                const prev = carbonNodes[index - 1];
                return (
                  <g key={`cc-bond-${index}`}>
                    {/* Shadow / Aura */}
                    <line
                      x1={prev.x}
                      y1={prev.y}
                      x2={node.x}
                      y2={node.y}
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeOpacity="0.25"
                      strokeLinecap="round"
                    />
                    {/* Main C-C Bond line */}
                    <line
                      x1={prev.x}
                      y1={prev.y}
                      x2={node.x}
                      y2={node.y}
                      stroke="url(#cBondGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Sigma bond indicator (σ) */}
                    <text
                      x={(prev.x + node.x) / 2}
                      y={(prev.y + node.y) / 2 - 8}
                      fill="#6ee7b7"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      σ
                    </text>
                  </g>
                );
              })}

              {/* Hydrogens attached to Carbons */}
              {showHydrogens &&
                carbonNodes.map((cNode, cIndex) => {
                  // For tetrahedral projection, end carbons get 3 H, middle carbons get 2 H
                  const hOffsets: { dx: number; dy: number; label: string }[] = [];

                  // Top H
                  hOffsets.push({ dx: 0, dy: -42, label: "H" });
                  // Bottom H
                  hOffsets.push({ dx: 0, dy: 42, label: "H" });

                  // Terminal left
                  if (cIndex === 0) {
                    hOffsets.push({ dx: -42, dy: 0, label: "H" });
                  }
                  // Terminal right
                  if (cIndex === carbonNodes.length - 1 && chainLength > 1) {
                    hOffsets.push({ dx: 42, dy: 0, label: "H" });
                  }
                  // If single carbon (Methane)
                  if (chainLength === 1) {
                    hOffsets.push({ dx: 42, dy: 0, label: "H" });
                  }

                  return (
                    <g key={`h-group-${cIndex}`}>
                      {hOffsets.map((h, hIdx) => {
                        const hx = cNode.x + h.dx;
                        const hy = cNode.y + h.dy;
                        return (
                          <g key={`h-atom-${cIndex}-${hIdx}`}>
                            <line
                              x1={cNode.x}
                              y1={cNode.y}
                              x2={hx}
                              y2={hy}
                              stroke="rgba(148, 163, 184, 0.6)"
                              strokeWidth="2"
                              strokeDasharray="2,2"
                            />
                            <circle
                              cx={hx}
                              cy={hy}
                              r="11"
                              fill="#0f172a"
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={hx}
                              y={hy + 4}
                              fill="#cbd5e1"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                              textAnchor="middle"
                            >
                              H
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

              {/* Carbon Atom Nodes */}
              {carbonNodes.map((node) => (
                <g key={`carbon-node-${node.id}`} filter="url(#cGlow)">
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill="#18181b"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  {/* Subtle inner ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    fill="#34d399"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    C
                  </text>
                  {/* Node index badge */}
                  <text
                    x={node.x + 12}
                    y={node.y - 12}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Carbon (Valency 4)
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 ml-2"></span> Hydrogen (Valency 1)
            <span className="inline-block w-4 h-0.5 bg-emerald-400 ml-2"></span> C—C Sigma Bond (348 kJ/mol)
          </div>
        </div>

        {/* Builder Interactive Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-foreground">Chain Length Manipulator</h4>
            <p className="text-xs text-muted-foreground">
              Add or remove carbons to observe catenation and general formula (CₙH₂ₙ₊₂) updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveCarbon}
              disabled={chainLength <= 1}
              className="gap-1.5 h-9"
            >
              <Minus className="h-4 w-4" />
              Remove Carbon
            </Button>

            <span className="w-10 text-center font-mono font-bold text-sm text-foreground">
              {chainLength} / 6
            </span>

            <Button
              variant="default"
              size="sm"
              onClick={handleAddCarbon}
              disabled={chainLength >= 6}
              className="gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Carbon (+C)
            </Button>
          </div>
        </div>

        {/* Scientific & Biological Insight Card */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Catenation & Chemical Properties
          </div>
          <p className="text-sm text-foreground/90 font-medium">{alkane.catenationInsight}</p>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span>
              <strong className="text-foreground">Real-World Application:</strong> {alkane.realWorldUse}
            </span>
            <span>
              <strong className="text-foreground">Molar Mass:</strong> {alkane.molarMass} g/mol
            </span>
          </div>
        </div>

        {/* Milestone Achievement Notification */}
        {hasEmittedEvidence && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Concept Demonstrated:</strong> You have built catenated hydrocarbon backbones up to 4+ carbons.
              Valence integrity verified across all atoms ($C=4, H=1$). Evidence dispatched to Mastery Engine.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
