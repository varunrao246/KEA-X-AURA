"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElementSymbol } from "@/lib/chemistry/types";

interface HeteroatomData {
  element: ElementSymbol;
  name: string;
  valenceElectrons: number;
  bondingCapacity: number;
  lonePairs: number;
  electronegativity: number;
  color: string;
  glowColor: string;
  role: string;
  keyGroups: string[];
  electronicConfiguration: string;
}

const HETEROATOMS: HeteroatomData[] = [
  {
    element: "C",
    name: "Carbon (Reference)",
    valenceElectrons: 4,
    bondingCapacity: 4,
    lonePairs: 0,
    electronegativity: 2.55,
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.4)",
    role: "The structural backbone of organic chemistry.",
    keyGroups: ["Alkanes", "Alkenes", "Alkynes"],
    electronicConfiguration: "1s² 2s² 2p²",
  },
  {
    element: "O",
    name: "Oxygen (Heteroatom)",
    valenceElectrons: 6,
    bondingCapacity: 2,
    lonePairs: 2,
    electronegativity: 3.44,
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.4)",
    role: "Highly electronegative. Pulls electron density to create polar reactive centers.",
    keyGroups: ["Alcohols (-OH)", "Carbonyls (C=O)", "Carboxylic Acids (-COOH)"],
    electronicConfiguration: "1s² 2s² 2p⁴",
  },
  {
    element: "N",
    name: "Nitrogen (Heteroatom)",
    valenceElectrons: 5,
    bondingCapacity: 3,
    lonePairs: 1,
    electronegativity: 3.04,
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.4)",
    role: "Basic heteroatom. Trivalent with an available lone pair to capture protons (H⁺).",
    keyGroups: ["Amines (-NH2)", "Amides (-CONH2)"],
    electronicConfiguration: "1s² 2s² 2p³",
  },
];

interface Props {
  onEvidence?: (score: number) => void;
}

export function HeteroatomValenceVisualizer({ onEvidence }: Props) {
  const [selectedElement, setSelectedElement] = React.useState<ElementSymbol>("O");
  const [hasInteracted, setHasInteracted] = React.useState<Record<ElementSymbol, boolean>>({
    C: false,
    H: false,
    O: true,
    N: false,
  });

  const selectedData = HETEROATOMS.find((h) => h.element === selectedElement) || HETEROATOMS[1];

  const handleSelect = (el: ElementSymbol) => {
    setSelectedElement(el);
    const nextInteracted = { ...hasInteracted, [el]: true };
    setHasInteracted(nextInteracted);

    // If user explored both heteroatoms (O and N), emit full mastery evidence
    if (nextInteracted.O && nextInteracted.N) {
      onEvidence?.(95);
    } else {
      onEvidence?.(75);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {HETEROATOMS.map((h) => {
          const isSelected = selectedElement === h.element;
          return (
            <Button
              key={h.element}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(h.element)}
              className={`gap-2 cursor-pointer transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:border-primary/50"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: h.color }}
              />
              <span className="font-bold">{h.element}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {h.name.split(" ")[0]}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Main Interactive Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Orbital & Lewis Dot Visualizer */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-500"
            style={{
              background: `radial-gradient(circle at center, ${selectedData.color} 0%, transparent 70%)`,
            }}
          />

          <svg width="240" height="240" viewBox="0 0 240 240" className="select-none">
            {/* Outer Valence Orbit Ring */}
            <circle
              cx="120"
              cy="120"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="text-muted-foreground/30 animate-[spin_20s_linear_infinite]"
            />

            {/* Inner Core Orbit */}
            <circle
              cx="120"
              cy="120"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground/20"
            />

            {/* Nucleus Glow */}
            <circle
              cx="120"
              cy="120"
              r="26"
              fill={selectedData.color}
              fillOpacity="0.25"
              stroke={selectedData.color}
              strokeWidth="2"
            />

            {/* Nucleus Label */}
            <text
              cx="120"
              cy="124"
              x="120"
              y="126"
              textAnchor="middle"
              fill={selectedData.color}
              fontSize="20"
              fontWeight="bold"
            >
              {selectedData.element}
            </text>

            {/* Valence Electrons Rendering */}
            {selectedData.element === "C" && (
              <>
                {/* 4 single unpaired electrons (Bonding sites) */}
                <circle cx="120" cy="40" r="5" fill="#3b82f6" />
                <circle cx="200" cy="120" r="5" fill="#3b82f6" />
                <circle cx="120" cy="200" r="5" fill="#3b82f6" />
                <circle cx="40" cy="120" r="5" fill="#3b82f6" />
                <text x="120" y="30" textAnchor="middle" fill="#3b82f6" fontSize="10">e⁻ (bond)</text>
                <text x="120" y="218" textAnchor="middle" fill="#3b82f6" fontSize="10">e⁻ (bond)</text>
              </>
            )}

            {selectedData.element === "O" && (
              <>
                {/* 2 Bonding electrons */}
                <circle cx="40" cy="120" r="5" fill="#ef4444" />
                <circle cx="120" cy="200" r="5" fill="#ef4444" />
                {/* 2 Lone Pairs (4 electrons paired up) */}
                <g fill="#f87171">
                  <circle cx="114" cy="40" r="5" />
                  <circle cx="126" cy="40" r="5" />
                  <circle cx="200" cy="114" r="5" />
                  <circle cx="200" cy="126" r="5" />
                </g>
                <text x="120" y="28" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">Lone Pair :</text>
                <text x="200" y="145" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">Lone Pair :</text>
              </>
            )}

            {selectedData.element === "N" && (
              <>
                {/* 3 Bonding electrons */}
                <circle cx="40" cy="120" r="5" fill="#06b6d4" />
                <circle cx="120" cy="200" r="5" fill="#06b6d4" />
                <circle cx="200" cy="120" r="5" fill="#06b6d4" />
                {/* 1 Lone Pair */}
                <g fill="#22d3ee">
                  <circle cx="114" cy="40" r="5" />
                  <circle cx="126" cy="40" r="5" />
                </g>
                <text x="120" y="28" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="bold">Lone Pair (Basic) :</text>
              </>
            )}
          </svg>

          <div className="mt-2 text-center">
            <span className="font-mono text-xs text-muted-foreground">
              Configuration: {selectedData.electronicConfiguration}
            </span>
          </div>
        </div>

        {/* Detailed Properties Card */}
        <div className="md:col-span-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">
                {selectedData.name}
              </h3>
              <Badge
                variant="outline"
                style={{ borderColor: selectedData.color, color: selectedData.color }}
                className="font-mono"
              >
                Valence: {selectedData.bondingCapacity} Bonds
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedData.role}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Bonding Capacity
              </span>
              <p className="text-lg font-bold text-foreground">
                {selectedData.bondingCapacity} Covalent {selectedData.bondingCapacity === 1 ? "Bond" : "Bonds"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Lone Pairs (Non-bonding)
              </span>
              <p className="text-lg font-bold text-foreground">
                {selectedData.lonePairs} {selectedData.lonePairs === 1 ? "Pair" : "Pairs"} ({selectedData.lonePairs * 2} e⁻)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Pauling Electronegativity
              </span>
              <p className="text-lg font-bold text-foreground">
                {selectedData.electronegativity}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Chemical Behavior
              </span>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {selectedData.element === "O"
                  ? "Polar Dipoles & H-Bonds"
                  : selectedData.element === "N"
                  ? "Organic Base (H⁺ Acceptor)"
                  : "Non-polar Backbone"}
              </p>
            </div>
          </div>

          {/* Key Functional Groups Enabled */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">
              Signature Functional Groups:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedData.keyGroups.map((grp) => (
                <Badge key={grp} variant="secondary" className="text-xs">
                  {grp}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
