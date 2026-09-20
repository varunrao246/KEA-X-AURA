"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IsomerMolecule,
  IsomerPair,
  PRESET_ISOMER_PAIRS,
  compareMolecules,
} from "@/lib/chemistry/isomerism";
import { ConnectivityDiffView } from "./connectivity-diff-view";
import {
  Sparkles,
  GitCompare,
  Thermometer,
  Compass,
  CheckCircle2,
} from "lucide-react";

interface IsomerComparisonProps {
  onRecordEvidence?: (
    conceptId: string,
    activityTitle: string,
    score: number,
    metadata?: Record<string, unknown>
  ) => void;
}

export function IsomerComparison({ onRecordEvidence }: IsomerComparisonProps) {
  const [selectedPairIndex, setSelectedPairIndex] = React.useState<number>(0);
  const [hoveredAtomA, setHoveredAtomA] = React.useState<string | null>(null);
  const [hoveredAtomB, setHoveredAtomB] = React.useState<string | null>(null);

  const currentPair: IsomerPair = PRESET_ISOMER_PAIRS[selectedPairIndex];
  const comparison = compareMolecules(currentPair.molA, currentPair.molB);

  const handleSelectPair = (idx: number) => {
    setSelectedPairIndex(idx);
    const pair = PRESET_ISOMER_PAIRS[idx];
    onRecordEvidence?.(
      "c-org-12",
      `Isomer Comparison: ${pair.title}`,
      90,
      { pairId: pair.id, category: pair.category }
    );
  };

  // Helper to get element visual color
  const getElementColor = (el: string) => {
    switch (el) {
      case "C":
        return { fill: "#334155", stroke: "#64748b", text: "#f8fafc" };
      case "H":
        return { fill: "#0284c7", stroke: "#38bdf8", text: "#ffffff" };
      case "O":
        return { fill: "#e11d48", stroke: "#fb7185", text: "#ffffff" };
      case "N":
        return { fill: "#4f46e5", stroke: "#818cf8", text: "#ffffff" };
      default:
        return { fill: "#475569", stroke: "#94a3b8", text: "#ffffff" };
    }
  };

  const renderMolecularSvg = (
    mol: IsomerMolecule,
    hoveredAtom: string | null,
    setHoveredAtom: (id: string | null) => void
  ) => {
    // Collect highlighted bond IDs connected to hovered atom
    const highlightedBondIds = new Set<string>();
    if (hoveredAtom) {
      for (const b of mol.bonds) {
        if (b.atomAId === hoveredAtom || b.atomBId === hoveredAtom) {
          highlightedBondIds.add(b.id);
        }
      }
    }

    return (
      <svg
        viewBox="0 0 420 260"
        className="w-full h-56 sm:h-64 bg-slate-950/60 rounded-xl border border-border/60 select-none"
      >
        <defs>
          <radialGradient id="carbonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#475569" stopOpacity="1" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Bonds */}
        {mol.bonds.map((bond) => {
          const atomA = mol.atoms.find((a) => a.id === bond.atomAId);
          const atomB = mol.atoms.find((a) => a.id === bond.atomBId);
          if (!atomA || !atomB) return null;

          const isHighlighted = highlightedBondIds.has(bond.id);
          const strokeColor = isHighlighted ? "#a855f7" : "#475569";
          const strokeWidth = isHighlighted ? 3 : 2;

          const x1 = atomA.x || 0;
          const y1 = atomA.y || 0;
          const x2 = atomB.x || 0;
          const y2 = atomB.y || 0;

          if (bond.order === 1) {
            return (
              <line
                key={bond.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
          }

          if (bond.order === 2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = (-dy / len) * 4;
            const ny = (dx / len) * 4;

            return (
              <g key={bond.id}>
                <line
                  x1={x1 + nx}
                  y1={y1 + ny}
                  x2={x2 + nx}
                  y2={y2 + ny}
                  stroke={isHighlighted ? "#c084fc" : "#a855f7"}
                  strokeWidth={isHighlighted ? 3.5 : 2.5}
                  strokeLinecap="round"
                />
                <line
                  x1={x1 - nx}
                  y1={y1 - ny}
                  x2={x2 - nx}
                  y2={y2 - ny}
                  stroke={isHighlighted ? "#c084fc" : "#a855f7"}
                  strokeWidth={isHighlighted ? 3.5 : 2.5}
                  strokeLinecap="round"
                />
              </g>
            );
          }

          return null;
        })}

        {/* Atoms */}
        {mol.atoms.map((atom) => {
          const colors = getElementColor(atom.element);
          const isHovered = hoveredAtom === atom.id;
          const isHeavy = atom.element !== "H";
          const radius = isHeavy ? 16 : 10;

          return (
            <g
              key={atom.id}
              className="cursor-pointer transition-transform duration-150"
              onMouseEnter={() => setHoveredAtom(atom.id)}
              onMouseLeave={() => setHoveredAtom(null)}
            >
              <circle
                cx={atom.x}
                cy={atom.y}
                r={radius}
                fill={colors.fill}
                stroke={isHovered ? "#ec4899" : colors.stroke}
                strokeWidth={isHovered ? 3 : 1.5}
                filter={isHovered ? "drop-shadow(0 0 6px rgba(236,72,153,0.7))" : undefined}
              />
              <text
                x={atom.x}
                y={(atom.y || 0) + (isHeavy ? 5 : 3.5)}
                fill={colors.text}
                fontSize={isHeavy ? 12 : 9}
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
              >
                {atom.element}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pair Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-foreground">
              Constitutional & Stereoisomer Comparator
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a curated isomer pair to inspect how connectivity or 3D geometry changes chemical identity.
          </p>
        </div>

        {/* Quick selector buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ISOMER_PAIRS.map((pair, idx) => (
            <Button
              key={pair.id}
              size="sm"
              variant={selectedPairIndex === idx ? "default" : "outline"}
              onClick={() => handleSelectPair(idx)}
              className={
                selectedPairIndex === idx
                  ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 cursor-pointer"
                  : "text-xs h-8 cursor-pointer"
              }
            >
              <span>{pair.formula}</span>
              <span className="opacity-70 text-[10px]">({pair.category})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Relationship Banner */}
      <Card className="border border-purple-500/30 bg-purple-950/20 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-purple-200">
                  {currentPair.title}
                </h4>
                <p className="text-xs text-purple-300/80">{currentPair.learningPrompt}</p>
              </div>
            </div>

            <Badge className="bg-purple-600 text-white text-xs font-bold gap-1 self-start sm:self-center">
              <CheckCircle2 className="h-3 w-3" />
              <span>{comparison.relationshipLabel}</span>
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {comparison.details}
          </p>
        </CardContent>
      </Card>

      {/* Side-by-Side Molecular View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Molecule A */}
        <Card className="border border-border/80 bg-card/70 shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Structure A
                </span>
                <h4 className="text-base sm:text-lg font-black text-foreground">
                  {currentPair.molA.name}
                </h4>
                <p className="text-xs text-muted-foreground">{currentPair.molA.description}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {currentPair.molA.formula}
              </Badge>
            </div>

            {/* Interactive SVG */}
            {renderMolecularSvg(currentPair.molA, hoveredAtomA, setHoveredAtomA)}

            {/* Properties row */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Boiling Point:</strong> {currentPair.molA.boilingPoint || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Compass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>
                  <strong>Density:</strong> {currentPair.molA.density || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Molecule B */}
        <Card className="border border-border/80 bg-card/70 shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Structure B
                </span>
                <h4 className="text-base sm:text-lg font-black text-foreground">
                  {currentPair.molB.name}
                </h4>
                <p className="text-xs text-muted-foreground">{currentPair.molB.description}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {currentPair.molB.formula}
              </Badge>
            </div>

            {/* Interactive SVG */}
            {renderMolecularSvg(currentPair.molB, hoveredAtomB, setHoveredAtomB)}

            {/* Properties row */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Boiling Point:</strong> {currentPair.molB.boilingPoint || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Compass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>
                  <strong>Density:</strong> {currentPair.molB.density || "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topological Invariant Signature Diff */}
      <ConnectivityDiffView molA={currentPair.molA} molB={currentPair.molB} />
    </div>
  );
}
