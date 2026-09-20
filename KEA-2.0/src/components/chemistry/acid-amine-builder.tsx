"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

type CompoundKey = "acid" | "amine";

interface Props {
  onEvidence?: (score: number) => void;
}

export function AcidAmineBuilder({ onEvidence }: Props) {
  const [selectedKey, setSelectedKey] = React.useState<CompoundKey>("acid");
  const [isIonized, setIsIonized] = React.useState(false);
  const [interactedBoth, setInteractedBoth] = React.useState<Record<CompoundKey, boolean>>({
    acid: true,
    amine: false,
  });

  const handleSelect = (key: CompoundKey) => {
    setSelectedKey(key);
    setIsIonized(false);
    const next = { ...interactedBoth, [key]: true };
    setInteractedBoth(next);

    if (next.acid && next.amine) {
      onEvidence?.(95);
    } else {
      onEvidence?.(75);
    }
  };

  const handleToggleIonize = () => {
    setIsIonized((prev) => !prev);
    onEvidence?.(90);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={selectedKey === "acid" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect("acid")}
            className={`cursor-pointer gap-2 ${
              selectedKey === "acid" ? "bg-rose-600 hover:bg-rose-700 text-white font-bold" : ""
            }`}
          >
            <span>Acetic Acid (-COOH)</span>
            <Badge variant="secondary" className="text-[10px]">
              Organic Acid
            </Badge>
          </Button>

          <Button
            variant={selectedKey === "amine" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect("amine")}
            className={`cursor-pointer gap-2 ${
              selectedKey === "amine" ? "bg-cyan-600 hover:bg-cyan-700 text-white font-bold" : ""
            }`}
          >
            <span>Methylamine (-NH2)</span>
            <Badge variant="secondary" className="text-[10px]">
              Organic Base
            </Badge>
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleIonize}
          className="cursor-pointer gap-1.5 text-xs font-semibold border-primary/40 text-primary"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{isIonized ? "Reset to Neutral Molecule" : "Simulate Acid/Base Dissociation"}</span>
        </Button>
      </div>

      {/* Main Visual Arena */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Display */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border/80 shadow-xs relative">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              {selectedKey === "acid"
                ? isIonized ? "Acetate Ion (CH3COO⁻) + H⁺" : "Acetic Acid (CH3COOH)"
                : isIonized ? "Methylammonium Ion (CH3NH3⁺)" : "Methylamine (CH3NH2)"}
            </span>
            <Badge
              variant="outline"
              className={`text-[11px] font-mono ${
                isIonized ? "border-amber-500/50 text-amber-400 bg-amber-950/20" : "border-border text-foreground"
              }`}
            >
              State: {isIonized ? "Ionized (Dissociated)" : "Neutral"}
            </Badge>
          </div>

          <svg width="320" height="200" viewBox="0 0 320 200" className="select-none">
            {/* ACETIC ACID SVG */}
            {selectedKey === "acid" && (
              <g>
                {/* C1 - C2 */}
                <line x1="100" y1="110" x2="180" y2="110" stroke="#94a3b8" strokeWidth="3" />

                {/* C1 Hydrogens */}
                <line x1="100" y1="110" x2="60" y2="110" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="100" y1="110" x2="100" y2="70" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="100" y1="110" x2="100" y2="150" stroke="#cbd5e1" strokeWidth="2" />

                {/* C2 = O (Double bond going up-right) */}
                <line x1="178" y1="110" x2="228" y2="60" stroke="#ef4444" strokeWidth="3" />
                <line x1="184" y1="114" x2="234" y2="64" stroke="#ef4444" strokeWidth="3" />

                {/* C2 - O (Single bond going down-right) */}
                <line x1="180" y1="110" x2="230" y2="150" stroke="#ef4444" strokeWidth="3" />

                {/* O - H single bond (if neutral) */}
                {!isIonized ? (
                  <line x1="230" y1="150" x2="270" y2="150" stroke="#ef4444" strokeWidth="2.5" />
                ) : (
                  /* Dissociated H+ freely floating */
                  <g className="animate-bounce">
                    <circle cx="280" cy="120" r="10" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="280" y="124" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">H⁺</text>
                  </g>
                )}

                {/* Atoms */}
                <circle cx="100" cy="110" r="16" fill="#3b82f6" />
                <text x="100" y="115" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                <circle cx="180" cy="110" r="16" fill="#3b82f6" />
                <text x="180" y="115" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                {/* Carbonyl Oxygen */}
                <circle cx="230" cy="62" r="16" fill="#ef4444" />
                <text x="230" y="67" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">O</text>

                {/* Hydroxyl Oxygen */}
                <circle cx="230" cy="150" r="16" fill="#ef4444" />
                <text x="230" y="155" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">O</text>

                {/* H atom on hydroxyl if neutral */}
                {!isIonized ? (
                  <g>
                    <circle cx="270" cy="150" r="10" fill="#f87171" />
                    <text x="270" y="154" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H</text>
                  </g>
                ) : (
                  /* Negative charge on oxygen */
                  <text x="230" y="180" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
                    ⊖ Negative Charge (Resonance)
                  </text>
                )}
              </g>
            )}

            {/* METHYLAMINE SVG */}
            {selectedKey === "amine" && (
              <g>
                {/* C - N */}
                <line x1="120" y1="100" x2="200" y2="100" stroke="#06b6d4" strokeWidth="3" />

                {/* C Hydrogens */}
                <line x1="120" y1="100" x2="80" y2="100" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="120" y1="100" x2="120" y2="60" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="120" y1="100" x2="120" y2="140" stroke="#cbd5e1" strokeWidth="2" />

                {/* N - H1 & N - H2 */}
                <line x1="200" y1="100" x2="245" y2="70" stroke="#06b6d4" strokeWidth="2.5" />
                <line x1="200" y1="100" x2="245" y2="130" stroke="#06b6d4" strokeWidth="2.5" />

                {/* N - H3 (Extra proton if ionized) */}
                {isIonized && (
                  <line x1="200" y1="100" x2="200" y2="40" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
                )}

                {/* Atoms */}
                <circle cx="120" cy="100" r="16" fill="#3b82f6" />
                <text x="120" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">C</text>

                {/* Nitrogen (Cyan) */}
                <circle cx="200" cy="100" r="16" fill="#06b6d4" />
                <text x="200" y="105" textAnchor="middle" fill="white" fontWeight="bold" fontSize="13">N</text>

                {/* H1 & H2 */}
                <circle cx="245" cy="70" r="10" fill="#67e8f9" />
                <text x="245" y="74" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H</text>

                <circle cx="245" cy="130" r="10" fill="#67e8f9" />
                <text x="245" y="134" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H</text>

                {/* Lone pair or protonated H+ */}
                {!isIonized ? (
                  <g fill="#22d3ee">
                    <circle cx="195" cy="65" r="3.5" />
                    <circle cx="205" cy="65" r="3.5" />
                    <text x="200" y="55" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold">
                      Lone Pair :
                    </text>
                  </g>
                ) : (
                  <g>
                    <circle cx="200" cy="40" r="10" fill="#f59e0b" />
                    <text x="200" y="44" textAnchor="middle" fill="white" fontWeight="bold" fontSize="10">H⁺</text>
                    <text x="200" y="170" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold">
                      ⊕ Positive Charge (Protonated)
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Detailed Explanation Column */}
        <div className="md:col-span-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">
              {selectedKey === "acid" ? "Carboxylic Acid (-COOH)" : "Amine (-NH2)"}
            </h3>
            <p className="text-xs font-mono text-muted-foreground">
              {selectedKey === "acid" ? "Proton Donor (Acidic)" : "Proton Acceptor (Basic)"}
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedKey === "acid"
              ? "Carboxylic acids have both a C=O double bond and an -OH single bond on the same carbon. The oxygen of the C=O strongly withdraws electron density, weakening the O-H bond and allowing the H⁺ proton to dissociate readily in water."
              : "Amines contain nitrogen with an unshared lone pair of electrons. Because nitrogen is less electronegative than oxygen, its lone pair is readily available to form a coordinate covalent bond with an incoming proton (H⁺), making amines organic bases."}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Functional Formula
              </span>
              <p className="text-base font-bold text-foreground">
                {selectedKey === "acid" ? "—COOH" : "—NH2"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                Chemical Role
              </span>
              <p className="text-xs font-semibold text-foreground">
                {selectedKey === "acid" ? "Weak Acid (pKa ~ 4.76)" : "Organic Base (pKb ~ 3.36)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
