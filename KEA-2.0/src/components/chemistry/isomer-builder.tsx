"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IsomerMolecule,
  PRESET_ISOMER_PAIRS,
  compareMolecules,
} from "@/lib/chemistry/isomerism";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  GitBranch,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";

interface IsomerBuilderProps {
  onRecordEvidence?: (
    conceptId: string,
    activityTitle: string,
    score: number,
    metadata?: Record<string, unknown>
  ) => void;
}

export function IsomerBuilder({ onRecordEvidence }: IsomerBuilderProps) {
  // Mode 1: Butane (C4H10) -> Isobutane
  // Mode 2: 1-Propanol (C3H8O) -> 2-Propanol
  // Mode 3: Pentane (C5H12) -> Isopentane / Neopentane
  const [targetId, setTargetId] = React.useState<"c4h10" | "c3h8o">("c4h10");
  
  // Dynamic workspace structure configuration:
  // For C4H10: branching state: 'linear' (n-butane) vs 'branched' (isobutane)
  // For C3H8O: OH position: 1 (1-propanol) vs 2 (2-propanol)
  const [c4BranchState, setC4BranchState] = React.useState<"linear" | "branched">("linear");
  const [c3OhPosition, setC3OhPosition] = React.useState<1 | 2>(1);
  const [hasEvaluated, setHasEvaluated] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const referenceMolA: IsomerMolecule =
    targetId === "c4h10"
      ? PRESET_ISOMER_PAIRS[0].molA // Butane
      : PRESET_ISOMER_PAIRS[1].molA; // 1-Propanol

  const currentConstructedMol: IsomerMolecule =
    targetId === "c4h10"
      ? c4BranchState === "linear"
        ? PRESET_ISOMER_PAIRS[0].molA
        : PRESET_ISOMER_PAIRS[0].molB
      : c3OhPosition === 1
      ? PRESET_ISOMER_PAIRS[1].molA
      : PRESET_ISOMER_PAIRS[1].molB;

  const comparison = compareMolecules(referenceMolA, currentConstructedMol);

  const handleEvaluate = () => {
    setHasEvaluated(true);
    const valid = comparison.isIsomer && comparison.isConstitutional;
    setIsSuccess(valid);

    if (valid) {
      onRecordEvidence?.(
        "c-org-13",
        `Isomer Construction Success: ${currentConstructedMol.name}`,
        100,
        {
          target: targetId,
          constructedId: currentConstructedMol.id,
          formula: currentConstructedMol.formula,
        }
      );
    } else {
      onRecordEvidence?.(
        "c-org-13",
        `Isomer Construction Attempt: Identical Structure`,
        60,
        { target: targetId }
      );
    }
  };

  const handleReset = () => {
    setC4BranchState("linear");
    setC3OhPosition(1);
    setHasEvaluated(false);
    setIsSuccess(false);
  };

  const handleSwitchTarget = (id: "c4h10" | "c3h8o") => {
    setTargetId(id);
    setC4BranchState("linear");
    setC3OhPosition(1);
    setHasEvaluated(false);
    setIsSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Target Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-foreground">
              Interactive Isomer Construction Laboratory
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rearrange covalent connectivity on the canvas to synthesize a constitutional isomer without altering molecular formula.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={targetId === "c4h10" ? "default" : "outline"}
            onClick={() => handleSwitchTarget("c4h10")}
            className={
              targetId === "c4h10"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            Target: C4H10 (Butane)
          </Button>
          <Button
            size="sm"
            variant={targetId === "c3h8o" ? "default" : "outline"}
            onClick={() => handleSwitchTarget("c3h8o")}
            className={
              targetId === "c3h8o"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            Target: C3H8O (Propanol)
          </Button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Manipulative Workspace Canvas */}
        <Card className="lg:col-span-8 border border-border/80 bg-card/70 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Active Molecule in Workspace
                </span>
                <h4 className="text-lg font-black text-foreground">
                  {currentConstructedMol.name}
                </h4>
                <p className="text-xs text-muted-foreground">{currentConstructedMol.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
                  {currentConstructedMol.formula}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <svg
              viewBox="0 0 420 250"
              className="w-full h-60 sm:h-72 bg-slate-950/80 rounded-xl border border-border/60 select-none"
            >
              {/* Bonds */}
              {currentConstructedMol.bonds.map((bond) => {
                const atomA = currentConstructedMol.atoms.find((a) => a.id === bond.atomAId);
                const atomB = currentConstructedMol.atoms.find((a) => a.id === bond.atomBId);
                if (!atomA || !atomB) return null;

                const isBranch = bond.id === "b-c2c4" || bond.id === "b-c2o1";

                return (
                  <line
                    key={bond.id}
                    x1={atomA.x || 0}
                    y1={atomA.y || 0}
                    x2={atomB.x || 0}
                    y2={atomB.y || 0}
                    stroke={isBranch ? "#10b981" : "#475569"}
                    strokeWidth={isBranch ? 3.5 : 2}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Atoms */}
              {currentConstructedMol.atoms.map((atom) => {
                const isHeavy = atom.element !== "H";
                const isBranchAtom = atom.id === "C4" || atom.id === "O1";

                return (
                  <g key={atom.id}>
                    <circle
                      cx={atom.x}
                      cy={atom.y}
                      r={isHeavy ? 16 : 10}
                      fill={
                        atom.element === "O"
                          ? "#e11d48"
                          : atom.element === "H"
                          ? "#0284c7"
                          : isBranchAtom && c4BranchState === "branched"
                          ? "#059669"
                          : "#334155"
                      }
                      stroke={
                        isBranchAtom
                          ? "#34d399"
                          : atom.element === "O"
                          ? "#fb7185"
                          : atom.element === "H"
                          ? "#38bdf8"
                          : "#64748b"
                      }
                      strokeWidth={isHeavy ? 2 : 1.2}
                    />
                    <text
                      x={atom.x}
                      y={(atom.y || 0) + (isHeavy ? 5 : 3.5)}
                      fill="#ffffff"
                      fontSize={isHeavy ? 12 : 9}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {atom.element}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Rearrangement Controls */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/80 space-y-3">
              <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                Manipulate Atomic Connectivity:
              </span>

              {targetId === "c4h10" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={c4BranchState === "linear" ? "default" : "outline"}
                    onClick={() => {
                      setC4BranchState("linear");
                      setHasEvaluated(false);
                    }}
                    className={
                      c4BranchState === "linear"
                        ? "bg-slate-700 text-white text-xs h-8 font-semibold cursor-pointer"
                        : "text-xs h-8 cursor-pointer"
                    }
                  >
                    Linear Chain (C1-C2-C3-C4)
                  </Button>
                  <Button
                    size="sm"
                    variant={c4BranchState === "branched" ? "default" : "outline"}
                    onClick={() => {
                      setC4BranchState("branched");
                      setHasEvaluated(false);
                    }}
                    className={
                      c4BranchState === "branched"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-bold cursor-pointer gap-1.5"
                        : "text-xs h-8 cursor-pointer gap-1.5"
                    }
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>Branch Terminal C4 onto Central C2</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={c3OhPosition === 1 ? "default" : "outline"}
                    onClick={() => {
                      setC3OhPosition(1);
                      setHasEvaluated(false);
                    }}
                    className={
                      c3OhPosition === 1
                        ? "bg-slate-700 text-white text-xs h-8 font-semibold cursor-pointer"
                        : "text-xs h-8 cursor-pointer"
                    }
                  >
                    Attach -OH to Terminal Carbon (C1)
                  </Button>
                  <Button
                    size="sm"
                    variant={c3OhPosition === 2 ? "default" : "outline"}
                    onClick={() => {
                      setC3OhPosition(2);
                      setHasEvaluated(false);
                    }}
                    className={
                      c3OhPosition === 2
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-bold cursor-pointer gap-1.5"
                        : "text-xs h-8 cursor-pointer gap-1.5"
                    }
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>Migrate -OH to Central Carbon (C2)</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Target formula requirement: <strong>{referenceMolA.formula}</strong>
              </span>
              <Button
                size="sm"
                onClick={handleEvaluate}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Verify Isomer Construction</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Real-time Evaluation Card */}
        <Card className="lg:col-span-4 border border-border/80 bg-card/70 shadow-sm space-y-4">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <FlaskConical className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Deterministic Audit
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border border-border/60">
                <span className="text-muted-foreground font-medium">Formula Status:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {currentConstructedMol.formula} (Matched)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border border-border/60">
                <span className="text-muted-foreground font-medium">Valence Rules:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  0 Violations
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 border border-border/60">
                <span className="text-muted-foreground font-medium">Connectivity Relation:</span>
                <span className="font-bold text-foreground">
                  {comparison.relationshipLabel}
                </span>
              </div>
            </div>

            {/* Evaluation Result Feedback Banner */}
            {hasEvaluated && (
              <div
                className={`p-3.5 rounded-xl border space-y-2 text-xs animate-in fade-in duration-200 ${
                  isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Valid Isomer Synthesized!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>Identical to Starting Molecule</span>
                    </>
                  )}
                </div>

                <p className="leading-relaxed">
                  {isSuccess
                    ? `Outstanding! You rearranged the bonds to create a distinct constitutional isomer (${currentConstructedMol.name}). 100% evidence emitted to MasteryEngine.`
                    : "The atoms are currently arranged in the exact same linear sequence as the starting reference molecule. Use the branch control to alter the covalent connectivity!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
