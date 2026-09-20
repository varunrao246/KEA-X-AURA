"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, Layers, Network, ShieldCheck } from "lucide-react";
import { IsomerMolecule, getHeavyAtomConnectivitySignature } from "@/lib/chemistry/isomerism";

interface ConnectivityDiffViewProps {
  molA: IsomerMolecule;
  molB: IsomerMolecule;
}

export function ConnectivityDiffView({ molA, molB }: ConnectivityDiffViewProps) {
  const sigA = getHeavyAtomConnectivitySignature(molA);
  const sigB = getHeavyAtomConnectivitySignature(molB);
  const isIdentical = sigA === sigB;

  // Calculate carbon degrees for each molecule
  const getCarbonDegrees = (mol: IsomerMolecule) => {
    const carbons = mol.atoms.filter(a => a.element === "C");
    const counts = { primary: 0, secondary: 0, tertiary: 0, quaternary: 0 };
    
    for (const c of carbons) {
      // count bonded other carbons
      let bondedCarbons = 0;
      for (const b of mol.bonds) {
        let neighborId: string | null = null;
        if (b.atomAId === c.id) neighborId = b.atomBId;
        else if (b.atomBId === c.id) neighborId = b.atomAId;
        if (neighborId) {
          const neighbor = mol.atoms.find(a => a.id === neighborId);
          if (neighbor && neighbor.element === "C") bondedCarbons++;
        }
      }
      if (bondedCarbons === 1) counts.primary++;
      else if (bondedCarbons === 2) counts.secondary++;
      else if (bondedCarbons === 3) counts.tertiary++;
      else if (bondedCarbons === 4) counts.quaternary++;
    }
    return counts;
  };

  const degA = getCarbonDegrees(molA);
  const degB = getCarbonDegrees(molB);

  return (
    <Card className="border border-border/80 bg-card/60 shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-purple-400" />
            <h4 className="text-sm font-bold text-foreground tracking-tight">
              Topological Connectivity Invariant Inspector
            </h4>
          </div>
          <Badge
            variant="outline"
            className={
              isIdentical
                ? "border-emerald-500/40 text-emerald-400 text-xs gap-1"
                : "border-purple-500/40 text-purple-400 text-xs gap-1"
            }
          >
            {isIdentical ? <ShieldCheck className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
            <span>{isIdentical ? "Identical Topology" : "Distinct Topology (Isomer)"}</span>
          </Badge>
        </div>

        {/* Side-by-side signature comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-border/70 bg-background/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{molA.name}</span>
              <span className="text-[11px] font-mono text-muted-foreground">{molA.formula}</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Heavy Atom Signature:
              </span>
              <code className="text-[11px] font-mono text-purple-300 bg-purple-950/40 p-1.5 rounded block break-all">
                {sigA}
              </code>
            </div>

            {/* Carbon degree distribution */}
            <div className="pt-2 border-t border-border/40 space-y-1 text-xs text-muted-foreground">
              <span className="text-[10px] uppercase font-semibold block text-foreground/80">
                Carbon Classification:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-muted/60 font-mono">1° (Primary): {degA.primary}</span>
                <span className="px-1.5 py-0.5 rounded bg-muted/60 font-mono">2° (Secondary): {degA.secondary}</span>
                {degA.tertiary > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                    3° (Tertiary): {degA.tertiary}
                  </span>
                )}
                {degA.quaternary > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                    4° (Quaternary): {degA.quaternary}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-background/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{molB.name}</span>
              <span className="text-[11px] font-mono text-muted-foreground">{molB.formula}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                Heavy Atom Signature:
              </span>
              <code className="text-[11px] font-mono text-purple-300 bg-purple-950/40 p-1.5 rounded block break-all">
                {sigB}
              </code>
            </div>

            {/* Carbon degree distribution */}
            <div className="pt-2 border-t border-border/40 space-y-1 text-xs text-muted-foreground">
              <span className="text-[10px] uppercase font-semibold block text-foreground/80">
                Carbon Classification:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-muted/60 font-mono">1° (Primary): {degB.primary}</span>
                <span className="px-1.5 py-0.5 rounded bg-muted/60 font-mono">2° (Secondary): {degB.secondary}</span>
                {degB.tertiary > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                    3° (Tertiary): {degB.tertiary}
                  </span>
                )}
                {degB.quaternary > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                    4° (Quaternary): {degB.quaternary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytical takeaway */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground/90 flex items-start gap-2.5">
          <Layers className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Pedagogical Insight:</strong> Even though both molecules share the molecular formula{" "}
            <code className="font-mono text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">{molA.formula}</code>,
            their topological graph signatures differ because covalent bonds connect the atoms in a different sequence.
            This structural variation directly causes distinct boiling points, densities, and physical properties.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
