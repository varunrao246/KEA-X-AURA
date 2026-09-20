"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BondOrder,
  ChemistryLearningEvidence,
  Molecule,
  MoleculeTarget,
  MoleculeValidationResult,
} from "@/lib/chemistry/types";
import {
  createEtheneTarget,
  evaluateTargetMatch,
  getMolecularFormula,
  validateMoleculeValence,
} from "@/lib/chemistry/molecule-validator";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Hammer,
  Plus,
  Minus,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface MoleculeBuilderProps {
  conceptId?: string;
  onEvidenceProduced?: (evidence: ChemistryLearningEvidence) => void;
}

export function MoleculeBuilder({
  conceptId = "c-org-4",
  onEvidenceProduced,
}: MoleculeBuilderProps) {
  const target: MoleculeTarget = React.useMemo(() => createEtheneTarget(), []);

  // Workspace configuration state
  const [carbonCount, setCarbonCount] = React.useState<number>(2);
  const [hydrogenCount, setHydrogenCount] = React.useState<number>(2); // Start with deliberate deficiency (2 instead of 4)
  const [ccBondOrder, setCcBondOrder] = React.useState<BondOrder>(1); // Start with single bond (needs double bond for ethene)
  const [validationAttempted, setValidationAttempted] = React.useState<boolean>(false);
  const [attempts, setAttempts] = React.useState<number>(0);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Construct current student Molecule object deterministically from workspace state
  const currentMolecule: Molecule = React.useMemo(() => {
    const atoms = [
      ...Array.from({ length: carbonCount }).map((_, i) => ({
        id: `C${i + 1}`,
        element: "C" as const,
        label: `C${i + 1}`,
      })),
      ...Array.from({ length: hydrogenCount }).map((_, i) => ({
        id: `H${i + 1}`,
        element: "H" as const,
        label: `H${i + 1}`,
      })),
    ];

    const bonds = [];

    // Connect Carbons linearly if >= 2
    if (carbonCount >= 2) {
      for (let i = 0; i < carbonCount - 1; i++) {
        bonds.push({
          id: `bond-cc-${i + 1}`,
          atomAId: `C${i + 1}`,
          atomBId: `C${i + 2}`,
          order: ccBondOrder,
        });
      }
    }

    // Connect Hydrogens evenly to available carbons
    for (let hIdx = 0; hIdx < hydrogenCount; hIdx++) {
      if (carbonCount > 0) {
        const assignedCarbonIdx = (hIdx % carbonCount) + 1;
        bonds.push({
          id: `bond-ch-${hIdx + 1}`,
          atomAId: `C${assignedCarbonIdx}`,
          atomBId: `H${hIdx + 1}`,
          order: 1 as BondOrder,
        });
      }
    }

    return { atoms, bonds };
  }, [carbonCount, hydrogenCount, ccBondOrder]);

  // Real-time live valence evaluation for feedback
  const liveValenceResult: MoleculeValidationResult = React.useMemo(() => {
    return validateMoleculeValence(currentMolecule);
  }, [currentMolecule]);

  const currentFormula = React.useMemo(() => {
    return getMolecularFormula(currentMolecule.atoms);
  }, [currentMolecule.atoms]);

  const handleValidate = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setValidationAttempted(true);

    const matchResult = evaluateTargetMatch(currentMolecule, target);

    if (matchResult.matched) {
      setIsSuccess(true);
      setErrorMessage(null);

      const evidence: ChemistryLearningEvidence = {
        conceptId,
        activityId: "activity-build-ethene",
        evidenceType: "interactive",
        score: Math.max(70, 100 - (nextAttempts - 1) * 10),
        attempts: nextAttempts,
        timestamp: Date.now(),
        metadata: {
          formula: currentFormula,
          bondOrder: ccBondOrder,
          matched: true,
        },
      };

      onEvidenceProduced?.(evidence);
    } else {
      setIsSuccess(false);
      setErrorMessage(matchResult.reason || "Molecule structure does not match target specifications.");
    }
  };

  const handleReset = () => {
    setCarbonCount(2);
    setHydrogenCount(2);
    setCcBondOrder(1);
    setValidationAttempted(false);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  // Quick preset helper
  const handleApplyPreset = (c: number, h: number, order: BondOrder) => {
    setCarbonCount(c);
    setHydrogenCount(h);
    setCcBondOrder(order);
    setValidationAttempted(false);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono text-[11px]">
                Module E: Synthesis Challenge
              </Badge>
              <Badge variant="outline" className="text-xs">
                Deterministic Target Matcher
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Hammer className="h-4 w-4 text-amber-400" />
              Build Ethene Challenge: Target Synthesis Workspace
            </CardTitle>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Workspace
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Challenge Split View: Target Card vs Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Target Blueprint Card (5 Cols) */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-border/80 bg-muted/30 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[11px]">
                  Target Blueprint
                </Badge>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  Formula: C₂H₄
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-foreground">{target.name} (Ethylene)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The simplest alkene hydrocarbon. Features a planar double bond with sp² carbon hybridization.
                </p>
              </div>

              {/* Target SVG Schematic Diagram */}
              <div className="rounded-lg border border-border/60 bg-neutral-950/70 p-3 flex justify-center">
                <svg viewBox="0 0 240 130" className="w-full h-auto max-w-[220px]">
                  {/* Left C */}
                  <circle cx="80" cy="65" r="14" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
                  <text x="80" y="69" fill="#22d3ee" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    C
                  </text>

                  {/* Right C */}
                  <circle cx="160" cy="65" r="14" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
                  <text x="160" y="69" fill="#22d3ee" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    C
                  </text>

                  {/* C=C Double Bond */}
                  <line x1="94" y1="61" x2="146" y2="61" stroke="#06b6d4" strokeWidth="2.5" />
                  <line x1="94" y1="69" x2="146" y2="69" stroke="#06b6d4" strokeWidth="2.5" />

                  {/* Hydrogens Left */}
                  <line x1="80" y1="65" x2="40" y2="35" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="40" cy="35" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <text x="40" y="38" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle">H</text>

                  <line x1="80" y1="65" x2="40" y2="95" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="40" cy="95" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <text x="40" y="98" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle">H</text>

                  {/* Hydrogens Right */}
                  <line x1="160" y1="65" x2="200" y2="35" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="200" cy="35" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <text x="200" y="38" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle">H</text>

                  <line x1="160" y1="65" x2="200" y2="95" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="200" cy="95" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
                  <text x="200" y="98" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle">H</text>
                </svg>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-foreground block">Required Specifications:</span>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Carbon Atoms:</span>
                  <span className="font-mono text-foreground font-semibold">2</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Hydrogen Atoms:</span>
                  <span className="font-mono text-foreground font-semibold">4</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>C—C Bond Multiplicity:</span>
                  <span className="font-mono text-cyan-400 font-semibold">Double Bond (order 2)</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>All Octets & Duets:</span>
                  <span className="font-mono text-emerald-400 font-semibold">Fully Satisfied (C=4, H=1)</span>
                </div>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
                Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(2, 6, 1)}
                  className="text-[11px] h-7 px-2"
                >
                  Ethane (C₂H₆)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(2, 2, 3)}
                  className="text-[11px] h-7 px-2"
                >
                  Ethyne (C₂H₂)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(2, 4, 2)}
                  className="text-[11px] h-7 px-2 border-amber-500/40 text-amber-300"
                >
                  Correct Ethene
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: Student Construction Workspace (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Live Workspace Canvas */}
            <div className="relative rounded-xl border border-border/80 bg-neutral-950/80 p-4 flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted-foreground">
                  Workspace Formula: <strong className="text-foreground">{currentFormula}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  {liveValenceResult.isValid ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Valence Valid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-400 text-[10px] gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Valence Warning
                    </Badge>
                  )}
                </div>
              </div>

              {/* Dynamic Workspace SVG Render */}
              <div className="w-full max-w-[420px] flex justify-center py-2">
                <svg viewBox="0 0 420 180" className="w-full h-auto select-none">
                  {/* Grid */}
                  <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <line key={`w-v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="180" />
                    ))}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <line key={`w-h-${i}`} x1="0" y1={i * 50} x2="420" y2={i * 50} />
                    ))}
                  </g>

                  {/* Render Carbons and their bonds */}
                  {carbonCount === 1 && (
                    <g>
                      <circle cx="210" cy="90" r="20" fill="#18181b" stroke="#3b82f6" strokeWidth="2.5" />
                      <text x="210" y="95" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        C₁
                      </text>
                    </g>
                  )}

                  {carbonCount === 2 && (
                    <g>
                      {/* C-C Bond Lines depending on ccBondOrder */}
                      {ccBondOrder === 1 && (
                        <line x1="160" y1="90" x2="260" y2="90" stroke="#06b6d4" strokeWidth="3" />
                      )}
                      {ccBondOrder === 2 && (
                        <>
                          <line x1="160" y1="85" x2="260" y2="85" stroke="#06b6d4" strokeWidth="3" />
                          <line x1="160" y1="95" x2="260" y2="95" stroke="#06b6d4" strokeWidth="3" />
                        </>
                      )}
                      {ccBondOrder === 3 && (
                        <>
                          <line x1="160" y1="82" x2="260" y2="82" stroke="#06b6d4" strokeWidth="2.5" />
                          <line x1="160" y1="90" x2="260" y2="90" stroke="#06b6d4" strokeWidth="2.5" />
                          <line x1="160" y1="98" x2="260" y2="98" stroke="#06b6d4" strokeWidth="2.5" />
                        </>
                      )}

                      {/* Carbon C1 */}
                      <circle
                        cx="140"
                        cy="90"
                        r="20"
                        fill="#18181b"
                        stroke={
                          liveValenceResult.atomValences["C1"]?.isSatisfied
                            ? "#10b981"
                            : liveValenceResult.atomValences["C1"]?.isExceeded
                            ? "#f43f5e"
                            : "#f59e0b"
                        }
                        strokeWidth="2.5"
                      />
                      <text x="140" y="95" fill="#e2e8f0" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        C₁
                      </text>
                      <text x="140" y="62" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {liveValenceResult.atomValences["C1"]?.current || 0}/4
                      </text>

                      {/* Carbon C2 */}
                      <circle
                        cx="280"
                        cy="90"
                        r="20"
                        fill="#18181b"
                        stroke={
                          liveValenceResult.atomValences["C2"]?.isSatisfied
                            ? "#10b981"
                            : liveValenceResult.atomValences["C2"]?.isExceeded
                            ? "#f43f5e"
                            : "#f59e0b"
                        }
                        strokeWidth="2.5"
                      />
                      <text x="280" y="95" fill="#e2e8f0" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        C₂
                      </text>
                      <text x="280" y="62" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {liveValenceResult.atomValences["C2"]?.current || 0}/4
                      </text>
                    </g>
                  )}

                  {/* Render Hydrogens attached */}
                  {Array.from({ length: hydrogenCount }).map((_, hIdx) => {
                    const isEven = hIdx % 2 === 0;
                    const cIdx = (hIdx % carbonCount) + 1;
                    const parentX = cIdx === 1 ? 140 : 280;
                    const parentY = 90;

                    // Distribute around parent carbon
                    const angle = cIdx === 1 ? (isEven ? -135 : 135) : isEven ? -45 : 45;
                    const rad = (angle * Math.PI) / 180;
                    const hX = parentX + Math.cos(rad) * 60;
                    const hY = parentY + Math.sin(rad) * 60;

                    return (
                      <g key={`h-bond-${hIdx}`}>
                        <line x1={parentX} y1={parentY} x2={hX} y2={hY} stroke="#64748b" strokeWidth="1.5" />
                        <circle cx={hX} cy={hY} r="11" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x={hX} y={hY + 4} fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                          H{hIdx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="w-full text-center text-[11px] text-muted-foreground mt-1">
                Atoms display current valence over maximum: <span className="text-emerald-400 font-semibold">Green (4/4 Satisfied)</span>,{" "}
                <span className="text-amber-400 font-semibold">Amber (Under-bonded)</span>,{" "}
                <span className="text-rose-400 font-semibold">Red (Texas Carbon / Over-bonded)</span>
              </div>
            </div>

            {/* Interactive Manipulator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-border/70 bg-card">
              {/* Carbon Manipulator */}
              <div className="flex flex-col items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground mb-1">Carbon (C)</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCarbonCount(Math.max(1, carbonCount - 1))}
                    disabled={carbonCount <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-mono font-bold text-sm text-foreground w-6 text-center">{carbonCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCarbonCount(Math.min(3, carbonCount + 1))}
                    disabled={carbonCount >= 3}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Hydrogen Manipulator */}
              <div className="flex flex-col items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground mb-1">Hydrogen (H)</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHydrogenCount(Math.max(0, hydrogenCount - 1))}
                    disabled={hydrogenCount <= 0}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-mono font-bold text-sm text-foreground w-6 text-center">{hydrogenCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHydrogenCount(Math.min(6, hydrogenCount + 1))}
                    disabled={hydrogenCount >= 6}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* C-C Bond Order Selector */}
              <div className="flex flex-col items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                <span className="text-xs font-semibold text-muted-foreground mb-1">C—C Bond Order</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  {([1, 2, 3] as BondOrder[]).map((bo) => (
                    <button
                      key={bo}
                      onClick={() => setCcBondOrder(bo)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        ccBondOrder === bo
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {bo === 1 ? "1 (Single)" : bo === 2 ? "2 (Double)" : "3 (Triple)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Validation Action Button */}
            <Button
              onClick={handleValidate}
              className="w-full h-10 gap-2 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Hammer className="h-4 w-4" />
              Verify Molecule Against Target Ethene
            </Button>

            {/* Feedback Notifications */}
            {validationAttempted && isSuccess && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="text-sm font-bold text-emerald-400">Target Synthesized Successfully!</h5>
                  <p>
                    <strong>Concept Demonstrated:</strong> Ethene ($C_2H_4$) constructed with valid $C=C$ double bond and
                    complete octet/duet valence saturation.
                  </p>
                  <p className="text-emerald-400/80 font-mono">
                    Structured evidence logged: Score 100/100, {attempts} {attempts === 1 ? "attempt" : "attempts"}.
                  </p>
                </div>
              </div>
            )}

            {validationAttempted && !isSuccess && errorMessage && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="text-sm font-bold text-rose-400">Synthesis Validation Failed</h5>
                  <p>{errorMessage}</p>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <strong>Hint:</strong> Check the target formula (C₂H₄) and remember each carbon needs 4 total bonds.
                    Does your C—C bond need to be a double bond?
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
