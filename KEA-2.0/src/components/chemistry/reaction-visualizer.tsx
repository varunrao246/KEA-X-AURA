"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChemicalEntity,
  ReactionDefinition,
  STAGE5_REACTIONS,
} from "@/lib/chemistry/reactions";
import {
  ArrowRight,
  Zap,
  RotateCcw,
  Sparkles,
  Scale,
  Thermometer,
} from "lucide-react";

interface ReactionVisualizerProps {
  onReactionExplored?: (reactionId: string) => void;
}

export function ReactionVisualizer({ onReactionExplored }: ReactionVisualizerProps) {
  const [selectedRxId, setSelectedRxId] = React.useState<string>("rx-hydrogenation");
  const [isReacted, setIsReacted] = React.useState<boolean>(false);
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  const [hoveredAtomId, setHoveredAtomId] = React.useState<string | null>(null);

  const reaction: ReactionDefinition = STAGE5_REACTIONS[selectedRxId] || STAGE5_REACTIONS["rx-hydrogenation"];

  const handleSelectReaction = (id: string) => {
    setSelectedRxId(id);
    setIsReacted(false);
    setIsAnimating(false);
    onReactionExplored?.(id);
  };

  const handleRunReaction = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsReacted(true);
      onReactionExplored?.(reaction.id);
    }, 800);
  };

  const handleReset = () => {
    setIsReacted(false);
    setIsAnimating(false);
  };

  const renderEntityCard = (entity: ChemicalEntity, role: "reactant" | "product") => {
    const isProductInactive = role === "product" && !isReacted && !isAnimating;

    return (
      <div
        className={`flex-1 min-w-[240px] rounded-xl border p-4 transition-all duration-300 ${
          isProductInactive
            ? "border-dashed border-border/50 bg-muted/20 opacity-50"
            : role === "reactant"
            ? "border-blue-500/40 bg-blue-950/10 dark:bg-blue-950/20"
            : "border-emerald-500/40 bg-emerald-950/10 dark:bg-emerald-950/20 shadow-md shadow-emerald-500/5"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
              {role === "reactant" ? "Starting Material" : "Synthesized Product"}
            </span>
            <h4 className="text-sm font-bold text-foreground">{entity.name}</h4>
          </div>
          <Badge
            variant="outline"
            className={`font-mono text-xs font-semibold ${
              role === "reactant"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            {entity.formula}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground font-mono mb-3">
          {entity.condensed} • <span className="text-foreground/80 font-sans">{entity.functionalGroup}</span>
        </div>

        {/* SVG Molecule Diagram */}
        <div className="w-full h-36 bg-background/80 rounded-lg border border-border/60 flex items-center justify-center p-2 relative overflow-hidden">
          <svg viewBox="0 0 360 220" className="w-full h-full max-h-32">
            {/* Draw Bonds */}
            {entity.molecule.bonds.map((bond) => {
              const atomA = entity.molecule.atoms.find((a) => a.id === bond.atomAId);
              const atomB = entity.molecule.atoms.find((a) => a.id === bond.atomBId);
              if (!atomA || !atomB) return null;

              const ax = atomA.x ?? 100;
              const ay = atomA.y ?? 100;
              const bx = atomB.x ?? 200;
              const by = atomB.y ?? 100;

              const isHighlighted =
                hoveredAtomId === atomA.id || hoveredAtomId === atomB.id;

              if (bond.order === 1) {
                return (
                  <line
                    key={bond.id}
                    x1={ax}
                    y1={ay}
                    x2={bx}
                    y2={by}
                    stroke={isHighlighted ? "#38bdf8" : "#94a3b8"}
                    strokeWidth={isHighlighted ? "3.5" : "2"}
                    strokeLinecap="round"
                    className="transition-colors duration-200"
                  />
                );
              } else if (bond.order === 2) {
                const dx = bx - ax;
                const dy = by - ay;
                const len = Math.hypot(dx, dy) || 1;
                const nx = (-dy / len) * 3.5;
                const ny = (dx / len) * 3.5;

                return (
                  <g key={bond.id}>
                    <line
                      x1={ax + nx}
                      y1={ay + ny}
                      x2={bx + nx}
                      y2={by + ny}
                      stroke={isHighlighted ? "#f59e0b" : "#cbd5e1"}
                      strokeWidth={isHighlighted ? "3" : "2"}
                      strokeLinecap="round"
                    />
                    <line
                      x1={ax - nx}
                      y1={ay - ny}
                      x2={bx - nx}
                      y2={by - ny}
                      stroke={isHighlighted ? "#f59e0b" : "#cbd5e1"}
                      strokeWidth={isHighlighted ? "3" : "2"}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }
              return null;
            })}

            {/* Draw Atoms */}
            {entity.molecule.atoms.map((atom) => {
              const ax = atom.x ?? 100;
              const ay = atom.y ?? 100;
              const isHovered = hoveredAtomId === atom.id;

              const isCarbon = atom.element === "C";
              const isOxygen = atom.element === "O";
              const isHydrogen = atom.element === "H";

              const fill = isCarbon
                ? "#1e293b"
                : isOxygen
                ? "#dc2626"
                : "#64748b";

              const radius = isHydrogen ? 10 : 14;

              return (
                <g
                  key={atom.id}
                  onMouseEnter={() => setHoveredAtomId(atom.id)}
                  onMouseLeave={() => setHoveredAtomId(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={ax}
                    cy={ay}
                    r={isHovered ? radius + 3 : radius}
                    fill={fill}
                    stroke={isHovered ? "#38bdf8" : "#ffffff"}
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="transition-all duration-150"
                  />
                  <text
                    x={ax}
                    y={ay + (isHydrogen ? 3.5 : 4.5)}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={isHydrogen ? "10" : "11"}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {atom.element}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Reaction Selector Ribbon */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/60">
        {Object.values(STAGE5_REACTIONS).map((rx) => {
          const isSelected = rx.id === selectedRxId;
          return (
            <button
              key={rx.id}
              onClick={() => handleSelectReaction(rx.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              }`}
            >
              {rx.name}
            </button>
          );
        })}
      </div>

      {/* Main Reaction Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-bold text-primary border-primary/30">
                {reaction.reactionType.replace("_", " ")}
              </Badge>
              <h3 className="text-base font-bold text-foreground">{reaction.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{reaction.mechanismSummary}</p>
          </div>

          <div className="flex items-center gap-2">
            {!isReacted ? (
              <Button
                size="sm"
                onClick={handleRunReaction}
                disabled={isAnimating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className={`h-3.5 w-3.5 ${isAnimating ? "animate-spin" : ""}`} />
                {isAnimating ? "Transforming..." : "Execute Reaction"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="text-xs h-8 gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Reactants
              </Button>
            )}
          </div>
        </div>

        {/* Reaction Flow: Reactant(s) -> Arrow & Conditions -> Product(s) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3 bg-background/50 rounded-xl border border-border/60">
          {/* Reactants Column */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            {reaction.reactants.map((reactant, idx) => (
              <React.Fragment key={reactant.id}>
                {renderEntityCard(reactant, "reactant")}
                {idx < reaction.reactants.length - 1 && (
                  <span className="text-lg font-bold text-muted-foreground self-center px-1">+</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Central Conditions / Transition Arrow */}
          <div className="flex flex-col items-center justify-center p-3 text-center min-w-[160px] space-y-2">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-mono font-semibold">
                <Sparkles className="h-3 w-3" />
                {reaction.conditions.catalyst}
              </div>
              {reaction.conditions.temperature && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground font-mono">
                  <Thermometer className="h-3 w-3" />
                  {reaction.conditions.temperature}
                </div>
              )}
            </div>

            <div className="relative flex items-center justify-center w-full py-1">
              <div className={`h-1 w-24 rounded-full transition-all duration-700 ${
                isAnimating ? "bg-amber-500 animate-pulse" : isReacted ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`} />
              <ArrowRight className={`h-5 w-5 absolute right-4 transition-colors ${
                isReacted ? "text-emerald-500" : "text-muted-foreground"
              }`} />
            </div>

            <span className="text-[10px] text-muted-foreground max-w-[140px] leading-tight">
              {reaction.conditions.environmentDescription}
            </span>
          </div>

          {/* Products Column */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
            {reaction.products.map((product, idx) => (
              <React.Fragment key={product.id}>
                {renderEntityCard(product, "product")}
                {idx < reaction.products.length - 1 && (
                  <span className="text-lg font-bold text-muted-foreground self-center px-1">+</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Detailed Bond Accounting & Atom Conservation Drawer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Bonds Broken vs Formed */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Covalent Bond Accounting
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {reaction.energyChange === "exothermic" ? "Exothermic (ΔH < 0)" : "Endothermic (ΔH > 0)"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block">
                  Bonds Cleaved / Weakened:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {reaction.bondsBroken.map((b, i) => (
                    <li key={i}>{b.description}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block">
                  Bonds Formed:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {reaction.bondsFormed.map((b, i) => (
                    <li key={i}>{b.description}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Deterministic Atom Conservation */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Atomic Conservation Invariant
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono ${
                  reaction.atomConservation.isBalanced
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                {reaction.atomConservation.isBalanced ? "100% Conserved" : "Redox Catalyzed"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-card border border-border/40">
                <span className="text-[11px] text-muted-foreground font-mono block">Carbon (C)</span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {reaction.atomConservation.reactants.C} = {reaction.atomConservation.products.C}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/40">
                <span className="text-[11px] text-muted-foreground font-mono block">Hydrogen (H)</span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {reaction.atomConservation.reactants.H} = {reaction.atomConservation.products.H}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border/40">
                <span className="text-[11px] text-muted-foreground font-mono block">Oxygen (O)</span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {reaction.atomConservation.reactants.O} = {reaction.atomConservation.products.O}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic pt-1">
              All chemical reactions conserve mass and elemental identities. The KEA reaction engine deterministically validates stoichiometry without approximation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
