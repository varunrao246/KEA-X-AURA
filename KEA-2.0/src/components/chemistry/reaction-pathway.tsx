"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  GitFork,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface PathwayStep {
  id: string;
  stepNumber: number;
  startingMaterial: string;
  formulaFrom: string;
  product: string;
  formulaTo: string;
  transformationType: string;
  reagentCondition: string;
  functionalGroupShift: string;
  industrialUtility: string;
  mechanisticNote: string;
}

const CANONICAL_PATHWAYS: {
  id: string;
  name: string;
  summary: string;
  targetProduct: string;
  steps: PathwayStep[];
}[] = [
  {
    id: 'pathway-acid-synthesis',
    name: 'Industrial Route: Alkene to Carboxylic Acid',
    summary: 'A 2-step synthesis converting cracked petroleum ethene into pure ethanoic acid for food and textile production.',
    targetProduct: 'Ethanoic Acid (CH3COOH)',
    steps: [
      {
        stepNumber: 1,
        id: 'step-1-hydration',
        startingMaterial: 'Ethene (C2H4)',
        formulaFrom: 'C2H4',
        product: 'Ethanol (C2H5OH)',
        formulaTo: 'C2H6O',
        transformationType: 'Electrophilic Addition (Hydration)',
        reagentCondition: 'Steam (H2O), Phosphoric Acid (H3PO4) on silica, 300°C, 65 atm',
        functionalGroupShift: 'Alkene (C=C) → Primary Alcohol (-OH)',
        industrialUtility: 'High-volume production of industrial ethanol without fermentation broth impurities.',
        mechanisticNote: 'H+ protonates the double bond to form an ethyl carbocation, followed by water attack and deprotonation.',
      },
      {
        stepNumber: 2,
        id: 'step-2-oxidation',
        startingMaterial: 'Ethanol (C2H5OH)',
        formulaFrom: 'C2H6O',
        product: 'Ethanoic Acid (CH3COOH)',
        formulaTo: 'C2H4O2',
        transformationType: 'Stepwise Oxidation (Reflux)',
        reagentCondition: 'Acidified Potassium Dichromate (K2Cr2O7) or KMnO4, heat under reflux',
        functionalGroupShift: 'Primary Alcohol (-OH) → Carboxylic Acid (-COOH)',
        industrialUtility: 'Feedstock for vinegar, cellulose acetate fibers, and vinyl acetate polymers.',
        mechanisticNote: 'Oxidizes through ethanal intermediate; reflux ensures volatile aldehyde cannot escape and oxidizes fully.',
      },
    ],
  },
  {
    id: 'pathway-ester-synthesis',
    name: 'Fragrance Formulation: Alkene to Fruity Ester',
    summary: 'A 3-step green synthesis converting basic olefin feedstocks into sweet ethyl acetate solvent and artificial fruit flavor.',
    targetProduct: 'Ethyl Ethanoate (CH3COOCH2CH3)',
    steps: [
      {
        stepNumber: 1,
        id: 'step-ester-1',
        startingMaterial: 'Ethene (C2H4)',
        formulaFrom: 'C2H4',
        product: 'Ethanol (C2H5OH)',
        formulaTo: 'C2H6O',
        transformationType: 'Electrophilic Addition (Hydration)',
        reagentCondition: 'H2O steam, H3PO4, 300°C',
        functionalGroupShift: 'Alkene → Primary Alcohol',
        industrialUtility: 'Supplies the alcohol partner for subsequent esterification.',
        mechanisticNote: 'Double bond acts as nucleophile attacking electrophilic proton.',
      },
      {
        stepNumber: 2,
        id: 'step-ester-2',
        startingMaterial: 'Ethanol (50% batch)',
        formulaFrom: 'C2H6O',
        product: 'Ethanoic Acid',
        formulaTo: 'C2H4O2',
        transformationType: 'Controlled Oxidation',
        reagentCondition: '[O] oxidizer, reflux heat',
        functionalGroupShift: 'Primary Alcohol → Carboxylic Acid',
        industrialUtility: 'Supplies the second partner (carboxylic acid) from the same initial feedstock.',
        mechanisticNote: 'Alcohol carbon increases oxidation state from -1 to +3.',
      },
      {
        stepNumber: 3,
        id: 'step-ester-3',
        startingMaterial: 'Ethanoic Acid + Ethanol',
        formulaFrom: 'C2H4O2 + C2H6O',
        product: 'Ethyl Ethanoate + Water',
        formulaTo: 'C4H8O2 + H2O',
        transformationType: 'Fischer Esterification (Condensation)',
        reagentCondition: 'Concentrated H2SO4, gentle warming (60°C)',
        functionalGroupShift: 'Acid + Alcohol → Ester (-COO-)',
        industrialUtility: 'Pleasant aroma used in cosmetics, perfumery, and non-toxic nail varnish remover.',
        mechanisticNote: 'Reversible equilibrium shifted forward by dehydrating concentrated sulfuric acid.',
      },
    ],
  },
];

interface ReactionPathwayProps {
  onStepSelected?: (stepId: string) => void;
}

export function ReactionPathway({ onStepSelected }: ReactionPathwayProps) {
  const [selectedPathwayId, setSelectedPathwayId] = React.useState<string>('pathway-acid-synthesis');
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0);

  const pathway = CANONICAL_PATHWAYS.find((p) => p.id === selectedPathwayId) || CANONICAL_PATHWAYS[0];
  const currentStep = pathway.steps[activeStepIndex] || pathway.steps[0];

  return (
    <div className="w-full space-y-6">
      {/* Pathway Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/60">
        {CANONICAL_PATHWAYS.map((p) => {
          const isSelected = p.id === selectedPathwayId;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPathwayId(p.id);
                setActiveStepIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Pathway Summary Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase font-bold text-primary border-primary/30">
                Multi-Step Synthesis Route
              </Badge>
              <h3 className="text-base font-bold text-foreground">{pathway.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{pathway.summary}</p>
          </div>

          <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold self-start sm:self-center">
            Target: {pathway.targetProduct}
          </Badge>
        </div>

        {/* Interactive Step Progress Chain */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pathway.steps.map((st, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <div
                key={st.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  onStepSelected?.(st.id);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                    : "border-border/60 bg-background/60 hover:bg-background/90"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    Step {st.stepNumber} of {pathway.steps.length}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {st.transformationType.split(' ')[0]}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1">
                  <span>{st.startingMaterial}</span>
                  <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-primary">{st.product}</span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {st.functionalGroupShift}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Step Detailed Diagnostic Canvas */}
        <div className="p-4 rounded-xl border border-primary/20 bg-background/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono font-bold text-xs">
                {currentStep.stepNumber}
              </span>
              <h4 className="text-sm font-bold text-foreground">
                {currentStep.transformationType}: {currentStep.startingMaterial} → {currentStep.product}
              </h4>
            </div>

            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              {currentStep.functionalGroupShift}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Catalytic & Thermal Conditions
                </span>
                <p className="text-foreground font-mono text-[11px] leading-relaxed">
                  {currentStep.reagentCondition}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  Mechanistic Rationale
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {currentStep.mechanisticNote}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card border border-border/50 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Industrial Real-World Application
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {currentStep.industrialUtility}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-mono">Reactant Formula</span>
                  <span className="text-sm font-bold text-foreground font-mono">{currentStep.formulaFrom}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block font-mono">Product Formula</span>
                  <span className="text-sm font-bold text-emerald-500 font-mono">{currentStep.formulaTo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
