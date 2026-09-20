"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type CompoundKey = "ethanol" | "acetaldehyde" | "acetone";

interface CompoundDetails {
  key: CompoundKey;
  name: string;
  category: "Alcohol" | "Aldehyde" | "Ketone";
  formula: string;
  condensed: string;
  groupName: string;
  groupFormula: string;
  description: string;
  dipoleStrength: string;
  boilingPoint: string;
  solubility: string;
}

const COMPOUNDS: Record<CompoundKey, CompoundDetails> = {
  ethanol: {
    key: "ethanol",
    name: "Ethanol",
    category: "Alcohol",
    formula: "C2H6O",
    condensed: "CH3—CH2—OH",
    groupName: "Hydroxyl Group",
    groupFormula: "—OH",
    description: "Contains a single-bonded oxygen linked to a hydrogen. Strong hydrogen bonds produce high water solubility and an elevated boiling point (78°C).",
    dipoleStrength: "Strong (O—H dipole = 1.69 D)",
    boilingPoint: "78.4 °C",
    solubility: "Miscible in water",
  },
  acetaldehyde: {
    key: "acetaldehyde",
    name: "Acetaldehyde (Ethanal)",
    category: "Aldehyde",
    formula: "C2H4O",
    condensed: "CH3—CH=O",
    groupName: "Terminal Carbonyl Group",
    groupFormula: "—CH=O",
    description: "The carbonyl group (C=O) is situated at the terminal carbon of the chain, directly bound to hydrogen. Very reactive and readily oxidizes.",
    dipoleStrength: "Very Strong (C=O dipole = 2.7 D)",
    boilingPoint: "20.2 °C",
    solubility: "Soluble in water",
  },
  acetone: {
    key: "acetone",
    name: "Acetone (Propanone)",
    category: "Ketone",
    formula: "C3H6O",
    condensed: "CH3—C(=O)—CH3",
    groupName: "Internal Carbonyl Group",
    groupFormula: "—C(=O)—",
    description: "The carbonyl group (C=O) is positioned inside the chain between two carbon atoms. Highly versatile polar solvent with moderate boiling point.",
    dipoleStrength: "Very Strong (C=O dipole = 2.88 D)",
    boilingPoint: "56.0 °C",
    solubility: "Miscible in water",
  },
};

interface Props {
  onEvidence?: (score: number) => void;
}

export function FunctionalGroupExplorer({ onEvidence }: Props) {
  const [selectedKey, setSelectedKey] = React.useState<CompoundKey>("ethanol");
  const [spotlightGroup, setSpotlightGroup] = React.useState(true);
  const [exploredKeys, setExploredKeys] = React.useState<Record<CompoundKey, boolean>>({
    ethanol: true,
    acetaldehyde: false,
    acetone: false,
  });

  const compound = COMPOUNDS[selectedKey];

  const handleSelect = (key: CompoundKey) => {
    setSelectedKey(key);
    const nextExplored = { ...exploredKeys, [key]: true };
    setExploredKeys(nextExplored);

    const count = Object.values(nextExplored).filter(Boolean).length;
    if (count === 3) {
      onEvidence?.(95);
    } else if (count === 2) {
      onEvidence?.(80);
    } else {
      onEvidence?.(65);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {Object.values(COMPOUNDS).map((item) => {
            const isSelected = selectedKey === item.key;
            return (
              <Button
                key={item.key}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(item.key)}
                className={`cursor-pointer gap-2 ${
                  isSelected ? "bg-primary text-primary-foreground font-bold shadow-xs" : ""
                }`}
              >
                <span>{item.name}</span>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {item.category}
                </Badge>
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSpotlightGroup((prev) => !prev)}
          className="gap-1.5 cursor-pointer text-xs"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span>{spotlightGroup ? "Hide Spotlight" : "Spotlight Functional Group"}</span>
        </Button>
      </div>

      {/* Main Visual Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Molecule Diagram */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/80 shadow-xs relative">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">{compound.condensed}</span>
            <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary">
              Formula: {compound.formula}
            </Badge>
          </div>

          <svg width="320" height="200" viewBox="0 0 320 200" className="select-none">
            {/* ETHANOL SVG */}
            {selectedKey === "ethanol" && (
              <g>
                {/* Spotlight Circle on -OH */}
                {spotlightGroup && (
                  <circle
                    cx="240"
                    cy="100"
                    r="45"
                    fill="#ef4444"
                    fillOpacity="0.12"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* Bonds */}
                {/* C1 - C2 */}
                <line x1="90" y1="100" x2="160" y2="100" stroke="#94a3b8" strokeWidth="3" />
                {/* C2 - O */}
                <line x1="160" y1="100" x2="230" y2="100" stroke="#94a3b8" strokeWidth="3" />
                {/* O - H */}
                <line x1="230" y1="100" x2="270" y2="70" stroke="#ef4444" strokeWidth="2.5" />

                {/* C1 Hydrogens */}
                <line x1="90" y1="100" x2="50" y2="100" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="90" y1="100" x2="90" y2="60" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="90" y1="100" x2="90" y2="140" stroke="#cbd5e1" strokeWidth="2" />

                {/* C2 Hydrogens */}
                <line x1="160" y1="100" x2="160" y2="60" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="160" y1="100" x2="160" y2="140" stroke="#cbd5e1" strokeWidth="2" />

                {/* Atoms */}
                {/* C1 */}
                <circle cx="90" cy="100" r="16" fill="#3b82f6" />
                <text x="90" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>
                {/* C2 */}
                <circle cx="160" cy="100" r="16" fill="#3b82f6" />
                <text x="160" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>
                {/* O (Red) */}
                <circle cx="230" cy="100" r="16" fill="#ef4444" />
                <text x="230" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">O</text>
                {/* H on O */}
                <circle cx="270" cy="70" r="10" fill="#f87171" />
                <text x="270" y="74" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H</text>

                {/* Partial Charges */}
                <text x="160" y="80" fill="#38bdf8" fontSize="10" fontWeight="bold">δ⁺</text>
                <text x="230" y="80" fill="#f87171" fontSize="10" fontWeight="bold">δ⁻</text>

                {/* Group label */}
                {spotlightGroup && (
                  <text x="250" y="160" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                    Hydroxyl (-OH)
                  </text>
                )}
              </g>
            )}

            {/* ACETALDEHYDE SVG */}
            {selectedKey === "acetaldehyde" && (
              <g>
                {/* Spotlight on -CH=O */}
                {spotlightGroup && (
                  <circle
                    cx="200"
                    cy="85"
                    r="55"
                    fill="#f59e0b"
                    fillOpacity="0.12"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* C1 - C2 */}
                <line x1="110" y1="110" x2="190" y2="110" stroke="#94a3b8" strokeWidth="3" />
                {/* C2 = O (Double bond) */}
                <line x1="187" y1="110" x2="227" y2="60" stroke="#ef4444" strokeWidth="3" />
                <line x1="193" y1="114" x2="233" y2="64" stroke="#ef4444" strokeWidth="3" />
                {/* C2 - H */}
                <line x1="190" y1="110" x2="230" y2="145" stroke="#cbd5e1" strokeWidth="2" />

                {/* C1 Hydrogens */}
                <line x1="110" y1="110" x2="70" y2="110" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="110" y1="110" x2="110" y2="70" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="110" y1="110" x2="110" y2="150" stroke="#cbd5e1" strokeWidth="2" />

                {/* Atoms */}
                <circle cx="110" cy="110" r="16" fill="#3b82f6" />
                <text x="110" y="115" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="190" cy="110" r="16" fill="#3b82f6" />
                <text x="190" y="115" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="230" cy="62" r="16" fill="#ef4444" />
                <text x="230" y="67" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">O</text>

                <circle cx="230" cy="145" r="10" fill="#94a3b8" />
                <text x="230" y="149" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H</text>

                {/* Label */}
                {spotlightGroup && (
                  <text x="210" y="175" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold">
                    Terminal Carbonyl (-CHO)
                  </text>
                )}
              </g>
            )}

            {/* ACETONE SVG */}
            {selectedKey === "acetone" && (
              <g>
                {/* Spotlight on C=O */}
                {spotlightGroup && (
                  <circle
                    cx="160"
                    cy="85"
                    r="48"
                    fill="#8b5cf6"
                    fillOpacity="0.12"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* C1 - C2 - C3 */}
                <line x1="80" y1="120" x2="160" y2="120" stroke="#94a3b8" strokeWidth="3" />
                <line x1="160" y1="120" x2="240" y2="120" stroke="#94a3b8" strokeWidth="3" />

                {/* C2 = O (Double bond going up) */}
                <line x1="157" y1="120" x2="157" y2="55" stroke="#ef4444" strokeWidth="3" />
                <line x1="163" y1="120" x2="163" y2="55" stroke="#ef4444" strokeWidth="3" />

                {/* C1 Hydrogens */}
                <line x1="80" y1="120" x2="40" y2="120" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="80" y1="120" x2="80" y2="80" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="80" y1="120" x2="80" y2="160" stroke="#cbd5e1" strokeWidth="2" />

                {/* C3 Hydrogens */}
                <line x1="240" y1="120" x2="280" y2="120" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="240" y1="120" x2="240" y2="80" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="240" y1="120" x2="240" y2="160" stroke="#cbd5e1" strokeWidth="2" />

                {/* Atoms */}
                <circle cx="80" cy="120" r="16" fill="#3b82f6" />
                <text x="80" y="125" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="160" cy="120" r="16" fill="#3b82f6" />
                <text x="160" y="125" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="240" cy="120" r="16" fill="#3b82f6" />
                <text x="240" y="125" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="160" cy="55" r="16" fill="#ef4444" />
                <text x="160" y="60" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">O</text>

                {/* Label */}
                {spotlightGroup && (
                  <text x="160" y="170" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold">
                    Internal Carbonyl (-CO-) Ketone
                  </text>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Detailed Explanation Column */}
        <div className="md:col-span-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{compound.name}</h3>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {compound.groupName}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              Functional Center: <strong className="text-foreground">{compound.groupFormula}</strong>
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {compound.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Dipole Moment
              </span>
              <p className="text-xs font-semibold text-foreground">
                {compound.dipoleStrength}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Boiling Point
              </span>
              <p className="text-xs font-semibold text-foreground">
                {compound.boilingPoint}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1 col-span-2">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Water Solubility
              </span>
              <p className="text-xs font-semibold text-foreground">
                {compound.solubility} (due to polar oxygen interaction with water dipoles)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
