"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Plus, Minus, CheckCircle2, Atom as AtomIcon } from "lucide-react";

interface CarbonAtomVisualizerProps {
  onEvidenceProduced?: (score: number) => void;
}

export function CarbonAtomVisualizer({ onEvidenceProduced }: CarbonAtomVisualizerProps) {
  const [bondsCount, setBondsCount] = React.useState<number>(0);
  const [hasCompleted, setHasCompleted] = React.useState<boolean>(false);

  const slotPositions = [
    { name: "Top (North)", angle: -90, x: 150, y: 50 },
    { name: "Right (East)", angle: 0, x: 250, y: 150 },
    { name: "Bottom (South)", angle: 90, x: 150, y: 250 },
    { name: "Left (West)", angle: 180, x: 50, y: 150 },
  ];

  const handleAddBond = () => {
    if (bondsCount < 4) {
      const next = bondsCount + 1;
      setBondsCount(next);
      if (next === 4 && !hasCompleted) {
        setHasCompleted(true);
        onEvidenceProduced?.(100);
      }
    }
  };

  const handleRemoveBond = () => {
    if (bondsCount > 0) {
      setBondsCount(bondsCount - 1);
    }
  };

  const handleReset = () => {
    setBondsCount(0);
  };

  const totalElectrons = 4 + bondsCount;
  const isOctetFull = bondsCount === 4;

  const stateExplanations: Record<number, { title: string; desc: string; badge: string }> = {
    0: {
      title: "Neutral Carbon Atom (Unbonded)",
      desc: "Carbon has 4 valence electrons in its outer shell (configuration 2, 4). All 4 bonding positions are open and seeking covalent partners.",
      badge: "4 Open Slots",
    },
    1: {
      title: "1 Covalent Bond Formed",
      desc: "1 hydrogen atom shares an electron pair with carbon. Carbon now effectively has 5 valence electrons. 3 open slots remain.",
      badge: "5/8 Octet Electrons",
    },
    2: {
      title: "2 Covalent Bonds Formed",
      desc: "2 electron pairs are now covalently shared. Carbon now has 6 valence electrons (carbenoid intermediate state). 2 open slots remain.",
      badge: "6/8 Octet Electrons",
    },
    3: {
      title: "3 Covalent Bonds Formed",
      desc: "3 shared pairs formed (methyl radical / ion state). Carbon now has 7 valence electrons, just 1 electron shy of octet stability!",
      badge: "7/8 Octet Electrons",
    },
    4: {
      title: "Stable Octet Achieved (Methane CH4)",
      desc: "All 4 valence electrons are paired into stable covalent single bonds! Carbon has completed its noble-gas octet (8 electrons).",
      badge: "Octet Complete (8/8)!",
    },
  };

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-[11px]">
                Module A: Why Carbon?
              </Badge>
              <Badge variant="outline" className="text-xs">
                Tetravalency Explorer
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AtomIcon className="h-4 w-4 text-primary" />
              Carbon Tetravalency & 4 Covalent Bonding Slots
            </CardTitle>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Atom
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Interactive SVG Diagram */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          <div className="relative w-[300px] h-[300px] bg-background/50 rounded-2xl border border-border/80 flex items-center justify-center p-2 shadow-inner">
            <svg viewBox="0 0 300 300" className="w-full h-full select-none">
              {/* Outer Valence Orbital Circle */}
              <circle
                cx="150"
                cy="150"
                r="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className={`transition-colors duration-500 ${
                  isOctetFull ? "text-emerald-500/80" : "text-primary/30"
                }`}
              />

              {/* Glowing Aura on Octet Complete */}
              {isOctetFull && (
                <circle
                  cx="150"
                  cy="150"
                  r="115"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  className="animate-pulse opacity-60"
                />
              )}

              {/* 4 Orbital Slots & Covalent Bonds */}
              {slotPositions.map((slot, index) => {
                const isBonded = index < bondsCount;
                return (
                  <g key={slot.name}>
                    {/* Radial bond stick if bonded */}
                    {isBonded && (
                      <line
                        x1="150"
                        y1="150"
                        x2={slot.x}
                        y2={slot.y}
                        stroke="#0284c7"
                        strokeWidth="5"
                        strokeLinecap="round"
                        className="animate-in fade-in zoom-in duration-300"
                      />
                    )}

                    {/* Outer Hydrogen Sphere or Open Orbital Slot */}
                    <circle
                      cx={slot.x}
                      cy={slot.y}
                      r={isBonded ? 20 : 15}
                      fill={isBonded ? "#38bdf8" : "#1e293b"}
                      stroke={isBonded ? "#0284c7" : "#64748b"}
                      strokeWidth={isBonded ? 2.5 : 1.5}
                      strokeDasharray={isBonded ? "none" : "3 3"}
                      className="transition-all duration-300 shadow-sm"
                    />

                    {/* Atom Symbol or Plus Slot */}
                    <text
                      x={slot.x}
                      y={slot.y + (isBonded ? 5 : 4)}
                      textAnchor="middle"
                      fill={isBonded ? "#ffffff" : "#94a3b8"}
                      fontSize={isBonded ? "14" : "12"}
                      fontWeight="bold"
                      className="font-mono"
                    >
                      {isBonded ? "H" : "+"}
                    </text>

                    {/* Shared electron dots */}
                    {isBonded && (
                      <>
                        <circle
                          cx={(150 + slot.x) / 2 - 3}
                          cy={(150 + slot.y) / 2}
                          r="3"
                          fill="#38bdf8"
                        />
                        <circle
                          cx={(150 + slot.x) / 2 + 3}
                          cy={(150 + slot.y) / 2}
                          r="3"
                          fill="#f59e0b"
                        />
                      </>
                    )}
                  </g>
                );
              })}

              {/* Central Carbon Nucleus & Core */}
              <circle
                cx="150"
                cy="150"
                r="38"
                fill="#0f172a"
                stroke={isOctetFull ? "#10b981" : "#0284c7"}
                strokeWidth={isOctetFull ? "4" : "3"}
                className="transition-all duration-300 shadow-lg"
              />

              <text
                x="150"
                y="156"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="22"
                fontWeight="900"
                className="font-mono tracking-wide"
              >
                C
              </text>

              <text
                x="150"
                y="173"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
                className="font-mono"
              >
                6C: 2, 4
              </text>
            </svg>

            {/* Octet Badge Indicator */}
            <div className="absolute bottom-2 right-2">
              <Badge
                className={`text-[10px] font-mono font-bold ${
                  isOctetFull
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {bondsCount}/4 Bonds
              </Badge>
            </div>
          </div>

          {/* Interactive Controls & State Details */}
          <div className="flex-1 space-y-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Current State:
                </span>
                <Badge
                  className={
                    isOctetFull
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-primary/20 text-primary border-primary/30"
                  }
                >
                  {stateExplanations[bondsCount].badge}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-foreground">
                {stateExplanations[bondsCount].title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stateExplanations[bondsCount].desc}
              </p>
            </div>

            {/* Valence Metric Counter */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-center">
              <div>
                <span className="block text-[10px] text-muted-foreground font-mono">Valence Electrons</span>
                <span className="text-base font-bold font-mono text-foreground">{totalElectrons}/8</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground font-mono">Bonds Formed</span>
                <span className="text-base font-bold font-mono text-primary">{bondsCount}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground font-mono">Open Slots</span>
                <span className="text-base font-bold font-mono text-amber-500">{4 - bondsCount}</span>
              </div>
            </div>

            {/* Step Controls */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveBond}
                disabled={bondsCount === 0}
                className="gap-1.5 text-xs font-semibold"
              >
                <Minus className="h-3.5 w-3.5" />
                Remove Bond
              </Button>

              <Button
                size="sm"
                onClick={handleAddBond}
                disabled={bondsCount === 4}
                className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add C—H Bond ({bondsCount}/4)
              </Button>
            </div>

            {/* Success Celebration */}
            {isOctetFull && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Concept Demonstrated: Tetravalency Confirmed!
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    Evidence emitted (+100% practice mastery signal for c-org-1).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
