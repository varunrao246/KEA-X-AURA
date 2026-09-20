"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Layers,
  FileCode2,
} from "lucide-react";

interface MoleculeStructureEditorProps {
  onRecordEvidence?: (
    conceptId: string,
    activityTitle: string,
    score: number,
    metadata?: Record<string, unknown>
  ) => void;
}

type RepresentationMode = "formula" | "condensed" | "expanded" | "skeletal";

export function MoleculeStructureEditor({
  onRecordEvidence,
}: MoleculeStructureEditorProps) {
  const [repMode, setRepMode] = React.useState<RepresentationMode>("expanded");
  const [selectedMolecule, setSelectedMolecule] = React.useState<"butane" | "isobutane">("butane");

  const handleSelectMode = (mode: RepresentationMode) => {
    setRepMode(mode);
    onRecordEvidence?.(
      "c-org-12",
      `Structural Representation Exploration: ${mode.toUpperCase()}`,
      90,
      { mode, molecule: selectedMolecule }
    );
  };

  const isButane = selectedMolecule === "butane";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-purple-400" />
            <h3 className="text-base font-bold text-foreground">
              Chemical Representation Hierarchy: Formula vs Structure
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Understand why molecular formulas hide atomic connectivity, and how chemists represent 3D molecules.
          </p>
        </div>

        {/* Molecule Switcher */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isButane ? "default" : "outline"}
            onClick={() => setSelectedMolecule("butane")}
            className={
              isButane
                ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            n-Butane
          </Button>
          <Button
            size="sm"
            variant={!isButane ? "default" : "outline"}
            onClick={() => setSelectedMolecule("isobutane")}
            className={
              !isButane
                ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
                : "text-xs h-8 cursor-pointer"
            }
          >
            Isobutane (2-Methylpropane)
          </Button>
        </div>
      </div>

      {/* Representation Mode Switcher Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        <Button
          size="sm"
          variant={repMode === "formula" ? "default" : "ghost"}
          onClick={() => handleSelectMode("formula")}
          className={
            repMode === "formula"
              ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
              : "text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
          }
        >
          1. Molecular Formula
        </Button>
        <Button
          size="sm"
          variant={repMode === "condensed" ? "default" : "ghost"}
          onClick={() => handleSelectMode("condensed")}
          className={
            repMode === "condensed"
              ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
              : "text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
          }
        >
          2. Condensed Formula
        </Button>
        <Button
          size="sm"
          variant={repMode === "expanded" ? "default" : "ghost"}
          onClick={() => handleSelectMode("expanded")}
          className={
            repMode === "expanded"
              ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
              : "text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
          }
        >
          3. Expanded Structural Formula
        </Button>
        <Button
          size="sm"
          variant={repMode === "skeletal" ? "default" : "ghost"}
          onClick={() => handleSelectMode("skeletal")}
          className={
            repMode === "skeletal"
              ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-8 cursor-pointer"
              : "text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
          }
        >
          4. Skeletal (Line-Angle)
        </Button>
      </div>

      {/* Main Representation Visualizer */}
      <Card className="border border-border/80 bg-card/70 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Current Level of Abstraction
              </span>
              <h4 className="text-lg font-black text-foreground capitalize">
                {repMode === "formula" && "Empirical Molecular Formula (C4H10)"}
                {repMode === "condensed" && "Condensed Structural Notation"}
                {repMode === "expanded" && "Full Lewis Expanded Covalent Grid"}
                {repMode === "skeletal" && "Organic Skeletal Line-Angle Notation"}
              </h4>
            </div>

            <Badge variant="outline" className="border-purple-500/40 text-purple-300 font-mono text-xs">
              Formula: C4H10
            </Badge>
          </div>

          {/* Visual Display Box */}
          <div className="flex items-center justify-center p-8 sm:p-12 rounded-xl bg-slate-950/80 border border-purple-500/20 min-h-[220px]">
            {repMode === "formula" && (
              <div className="text-center space-y-3">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-wider text-purple-300">
                  C₄H₁₀
                </span>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  <strong>The Limitation:</strong> Both n-butane and isobutane have the exact same molecular formula.
                  Looking at C₄H₁₀ alone, you cannot tell which molecule you are holding!
                </p>
              </div>
            )}

            {repMode === "condensed" && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 rounded-xl bg-purple-950/40 border border-purple-500/30">
                  <span className="text-2xl sm:text-3xl font-mono font-bold text-purple-200">
                    {isButane ? "CH₃—CH₂—CH₂—CH₃" : "CH(CH₃)₃  or  CH₃—CH(CH₃)—CH₃"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {isButane
                    ? "Condensed notation shows 4 carbons in a single unbroken linear chain."
                    : "Condensed notation explicitly reveals a central CH carbon attached to three separate CH₃ methyl branches."}
                </p>
              </div>
            )}

            {repMode === "expanded" && (
              <svg viewBox="0 0 380 180" className="w-full max-w-md h-48 select-none">
                {isButane ? (
                  // Expanded Butane
                  <g>
                    {/* C-C backbone */}
                    <line x1="70" y1="90" x2="150" y2="90" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="150" y1="90" x2="230" y2="90" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="230" y1="90" x2="310" y2="90" stroke="#64748b" strokeWidth="2.5" />

                    {/* Vertical H bonds */}
                    <line x1="70" y1="90" x2="70" y2="35" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="70" y1="90" x2="70" y2="145" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="70" y1="90" x2="25" y2="90" stroke="#0284c7" strokeWidth="1.5" />

                    <line x1="150" y1="90" x2="150" y2="35" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="150" y1="90" x2="150" y2="145" stroke="#0284c7" strokeWidth="1.5" />

                    <line x1="230" y1="90" x2="230" y2="35" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="230" y1="90" x2="230" y2="145" stroke="#0284c7" strokeWidth="1.5" />

                    <line x1="310" y1="90" x2="310" y2="35" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="310" y1="90" x2="310" y2="145" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="310" y1="90" x2="355" y2="90" stroke="#0284c7" strokeWidth="1.5" />

                    {/* Carbons */}
                    <circle cx="70" cy="90" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="70" y="94" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="150" cy="90" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="150" y="94" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="230" cy="90" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="230" y="94" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="310" cy="90" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="310" y="94" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    {/* Hydrogens */}
                    {[
                      { x: 25, y: 90 }, { x: 70, y: 35 }, { x: 70, y: 145 },
                      { x: 150, y: 35 }, { x: 150, y: 145 },
                      { x: 230, y: 35 }, { x: 230, y: 145 },
                      { x: 310, y: 35 }, { x: 310, y: 145 }, { x: 355, y: 90 },
                    ].map((h, i) => (
                      <g key={i}>
                        <circle cx={h.x} cy={h.y} r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
                        <text x={h.x} y={h.y + 3} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">H</text>
                      </g>
                    ))}
                  </g>
                ) : (
                  // Expanded Isobutane (branched)
                  <g>
                    {/* Horizontal C1-C2-C3 */}
                    <line x1="90" y1="120" x2="190" y2="120" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="190" y1="120" x2="290" y2="120" stroke="#64748b" strokeWidth="2.5" />
                    {/* Vertical branch to C4 */}
                    <line x1="190" y1="120" x2="190" y2="40" stroke="#10b981" strokeWidth="3" />

                    {/* Central C2 H bond */}
                    <line x1="190" y1="120" x2="190" y2="165" stroke="#0284c7" strokeWidth="1.5" />

                    {/* Left C1 H bonds */}
                    <line x1="90" y1="120" x2="50" y2="120" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="90" y1="120" x2="90" y2="75" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="90" y1="120" x2="90" y2="165" stroke="#0284c7" strokeWidth="1.5" />

                    {/* Right C3 H bonds */}
                    <line x1="290" y1="120" x2="330" y2="120" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="290" y1="120" x2="290" y2="75" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="290" y1="120" x2="290" y2="165" stroke="#0284c7" strokeWidth="1.5" />

                    {/* Branch C4 H bonds */}
                    <line x1="190" y1="40" x2="150" y2="40" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="190" y1="40" x2="230" y2="40" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="190" y1="40" x2="190" y2="10" stroke="#0284c7" strokeWidth="1.5" />

                    {/* Carbons */}
                    <circle cx="90" cy="120" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="90" y="124" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="190" cy="120" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="190" y="124" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="290" cy="120" r="14" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <text x="290" y="124" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    <circle cx="190" cy="40" r="14" fill="#059669" stroke="#34d399" strokeWidth="2" />
                    <text x="190" y="44" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C</text>

                    {/* Hydrogens */}
                    {[
                      { x: 50, y: 120 }, { x: 90, y: 75 }, { x: 90, y: 165 },
                      { x: 190, y: 165 },
                      { x: 330, y: 120 }, { x: 290, y: 75 }, { x: 290, y: 165 },
                      { x: 150, y: 40 }, { x: 230, y: 40 }, { x: 190, y: 10 },
                    ].map((h, i) => (
                      <g key={i}>
                        <circle cx={h.x} cy={h.y} r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
                        <text x={h.x} y={h.y + 3} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">H</text>
                      </g>
                    ))}
                  </g>
                )}
              </svg>
            )}

            {repMode === "skeletal" && (
              <svg viewBox="0 0 320 140" className="w-full max-w-sm h-36 select-none">
                {isButane ? (
                  // Zig-zag Butane line
                  <g>
                    <polyline
                      points="60,90 120,40 180,90 240,40"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="60" cy="90" r="4" fill="#a855f7" />
                    <circle cx="120" cy="40" r="4" fill="#a855f7" />
                    <circle cx="180" cy="90" r="4" fill="#a855f7" />
                    <circle cx="240" cy="40" r="4" fill="#a855f7" />
                    <text x="150" y="125" fill="#a855f7" fontSize="11" textAnchor="middle" fontWeight="bold">
                      n-Butane (4 Vertices)
                    </text>
                  </g>
                ) : (
                  // Branched Isobutane line (T/Y shape)
                  <g>
                    <polyline
                      points="70,90 150,90 230,90"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line x1="150" y1="90" x2="150" y2="30" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="70" cy="90" r="4" fill="#10b981" />
                    <circle cx="150" cy="90" r="5" fill="#10b981" />
                    <circle cx="230" cy="90" r="4" fill="#10b981" />
                    <circle cx="150" cy="30" r="4" fill="#10b981" />
                    <text x="150" y="125" fill="#34d399" fontSize="11" textAnchor="middle" fontWeight="bold">
                      2-Methylpropane (Branched Vertex)
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* Explanation footer */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
            <Layers className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Core Takeaway:</strong> In organic chemistry, the molecular formula tells you <em>what</em> atoms
              exist, while the structural formula tells you <em>how</em> they are connected in 3D space.
              Constitutional isomers share the formula, but differ fundamentally in their structural graph!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
