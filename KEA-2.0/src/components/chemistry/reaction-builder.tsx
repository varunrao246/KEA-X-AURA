"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  predictReactionOutcome,
  ReactionDefinition,
} from "@/lib/chemistry/reactions";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";

interface ReactionBuilderProps {
  onSuccessfulSynthesis?: (reaction: ReactionDefinition) => void;
}

export function ReactionBuilder({ onSuccessfulSynthesis }: ReactionBuilderProps) {
  const [substrateId, setSubstrateId] = React.useState<string>("ent-ethene");
  const [reagentId, setReagentId] = React.useState<string>("ent-h2");
  const [conditionKey, setConditionKey] = React.useState<string>("ni-catalyst");
  const [synthesisResult, setSynthesisResult] = React.useState<{
    success: boolean;
    reaction?: ReactionDefinition;
    explanation: string;
  } | null>(null);

  const substrates = [
    { id: "ent-ethene", name: "Ethene (CH2=CH2)", type: "Alkene", formula: "C2H4" },
    { id: "ent-ethanol", name: "Ethanol (CH3CH2OH)", type: "Alcohol", formula: "C2H6O" },
    { id: "ent-ethanoic-acid", name: "Ethanoic Acid (CH3COOH)", type: "Carboxylic Acid", formula: "C2H4O2" },
    { id: "ent-ethane", name: "Ethane (CH3CH3)", type: "Alkane", formula: "C2H6" },
  ];

  const reagents = [
    { id: "ent-h2", name: "Hydrogen Gas (H2)", note: "Reducing agent" },
    { id: "ent-h2o", name: "Water (H2O steam)", note: "Hydration nucleophile" },
    { id: "none", name: "No Reagent Added", note: "Thermal elimination/decomposition" },
    { id: "ent-ethanol", name: "Ethanol (C2H5OH)", note: "Alcohol condensation partner" },
    { id: "ent-o2", name: "Oxygen Gas (O2)", note: "Combustion oxidizer" },
  ];

  const conditions = [
    { key: "ni-catalyst", label: "Nickel (Ni) Catalyst, 150°C", note: "Hydrogenation surface" },
    { key: "acid-300-h3po4", label: "H3PO4 Acid Catalyst, 300°C steam", note: "Electrophilic hydration" },
    { key: "170-h2so4-dehydrat", label: "Concentrated H2SO4, 170°C heat", note: "Strong acid dehydration" },
    { key: "reflux-acid-ester", label: "H+ Acid Catalyst, 60°C gentle reflux", note: "Fischer esterification" },
    { key: "ambient-no-catalyst", label: "Room Temperature, No Catalyst", note: "Standard ambient conditions" },
  ];

  const handleTestSynthesis = () => {
    const res = predictReactionOutcome(substrateId, reagentId, conditionKey);
    setSynthesisResult(res);
    if (res.success && res.reaction) {
      onSuccessfulSynthesis?.(res.reaction);
    }
  };

  const handleReset = () => {
    setSubstrateId("ent-ethene");
    setReagentId("ent-h2");
    setConditionKey("ni-catalyst");
    setSynthesisResult(null);
  };

  return (
    <div className="w-full space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Organic Reaction Synthesis Laboratory
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select starting substrates, reagents, and catalytic conditions to synthesize target functional groups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="text-xs h-8 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Lab
            </Button>
            <Button
              size="sm"
              onClick={handleTestSynthesis}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 gap-1.5 cursor-pointer font-semibold shadow-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              Test Synthesis
            </Button>
          </div>
        </div>

        {/* 3 Step Interactive Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Substrate */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              1. Starting Substrate:
            </span>
            <div className="space-y-1.5">
              {substrates.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSubstrateId(s.id);
                    setSynthesisResult(null);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all border cursor-pointer ${
                    substrateId === s.id
                      ? "border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary/30"
                      : "border-border/40 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {s.formula}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans block mt-0.5">
                    {s.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Added Reagent */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              2. Added Reagent:
            </span>
            <div className="space-y-1.5">
              {reagents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setReagentId(r.id);
                    setSynthesisResult(null);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all border cursor-pointer ${
                    reagentId === r.id
                      ? "border-amber-500 bg-amber-500/10 font-bold text-foreground ring-1 ring-amber-500/30"
                      : "border-border/40 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-foreground">{r.name}</div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {r.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Catalytic & Thermal Conditions */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-background/60 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              3. Reaction Condition:
            </span>
            <div className="space-y-1.5">
              {conditions.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setConditionKey(c.key);
                    setSynthesisResult(null);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all border cursor-pointer ${
                    conditionKey === c.key
                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-foreground ring-1 ring-emerald-500/30"
                      : "border-border/40 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-foreground">{c.label}</div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {c.note}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Synthesis Result Display */}
        {synthesisResult && (
          <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
              synthesisResult.success
                ? "border-emerald-500/40 bg-emerald-950/20 text-foreground"
                : "border-rose-500/40 bg-rose-950/20 text-foreground"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {synthesisResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Reaction Verified: {synthesisResult.reaction?.name}
                  </h4>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    Reaction Mismatch: Transformation Chemically Incompatible
                  </h4>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground mb-3">
              {synthesisResult.explanation}
            </p>

            {synthesisResult.success && synthesisResult.reaction && (
              <div className="p-3 bg-background/80 rounded-lg border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Product Synthesized
                  </span>
                  <span className="font-bold text-foreground">
                    {synthesisResult.reaction.products.map((p) => p.name).join(" + ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                    {synthesisResult.reaction.reactionType.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/30">
                    100% Deterministic Evidence Emitted
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
