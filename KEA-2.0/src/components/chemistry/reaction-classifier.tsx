"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ReactionType,
} from "@/lib/chemistry/reactions";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ClassificationItem {
  id: string;
  equation: string;
  reactants: string;
  products: string;
  condition: string;
  correctType: ReactionType;
  rationale: string;
  bondClue: string;
}

const CLASSIFICATION_ITEMS: ClassificationItem[] = [
  {
    id: "cls-1",
    equation: "CH2=CH2 + H2 ──(Ni, 150°C)──> CH3-CH3",
    reactants: "Ethene (Alkene) + Hydrogen Gas",
    products: "Ethane (Alkane)",
    condition: "Nickel (Ni) metal catalyst, heat",
    correctType: "addition",
    rationale: "Two reactant molecules combine to form a single product. The alkene pi bond breaks and two new C-H sigma bonds form across the double bond.",
    bondClue: "1 pi bond breaks; 2 sigma bonds form. No atoms are eliminated.",
  },
  {
    id: "cls-2",
    equation: "CH3-CH2-OH ──(conc. H2SO4, 170°C)──> CH2=CH2 + H2O",
    reactants: "Ethanol (Primary Alcohol)",
    products: "Ethene (Alkene) + Water",
    condition: "Hot concentrated sulfuric acid",
    correctType: "elimination",
    rationale: "A single reactant molecule splits into two: small molecule (H2O) is eliminated from adjacent carbons, generating a new carbon-carbon double bond (pi bond).",
    bondClue: "Adjacent C-H and C-OH bonds break to form a new C=C pi bond.",
  },
  {
    id: "cls-3",
    equation: "CH3-CH2-OH + [O] ──(KMnO4, reflux)──> CH3-COOH",
    reactants: "Ethanol (Primary Alcohol) + Nascent Oxygen",
    products: "Ethanoic Acid (Carboxylic Acid)",
    condition: "Acidified potassium permanganate under reflux",
    correctType: "oxidation",
    rationale: "Primary alcohol gains oxygen atoms and loses hydrogen atoms, increasing the carbon oxidation state from -1 to +3.",
    bondClue: "C-H bonds replaced by multiple C-O bonds at the functional carbon.",
  },
  {
    id: "cls-4",
    equation: "CH3-COOH + CH3CH2OH ──(H+, heat)──> CH3COOCH2CH3 + H2O",
    reactants: "Ethanoic Acid + Ethanol",
    products: "Ethyl Acetate (Ester) + Water",
    condition: "Acid catalyst, gentle warming",
    correctType: "condensation_esterification",
    rationale: "Two organic molecules combine with the simultaneous elimination of a small water molecule (condensation to yield an ester).",
    bondClue: "Acyl C-OH and alcohol O-H fragments condense to form an ester linkage (-COO-).",
  },
  {
    id: "cls-5",
    equation: "CH3CH2OH + 3 O2 ──(spark/flame)──> 2 CO2 + 3 H2O + Heat",
    reactants: "Ethanol + Excess Oxygen Gas",
    products: "Carbon Dioxide + Water",
    condition: "Ignition / Thermal activation",
    correctType: "combustion",
    rationale: "Rapid highly exothermic oxidation in oxygen gas resulting in complete breakdown of the carbon skeleton into inorganic CO2 and H2O.",
    bondClue: "All C-C and C-H bonds are cleaved into carbon dioxide and water.",
  },
];

interface ReactionClassifierProps {
  onClassificationCompleted?: (score: number) => void;
}

export function ReactionClassifier({ onClassificationCompleted }: ReactionClassifierProps) {
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [selectedType, setSelectedType] = React.useState<ReactionType | null>(null);
  const [hasChecked, setHasChecked] = React.useState<boolean>(false);
  const [scoreCount, setScoreCount] = React.useState<number>(0);

  const currentItem = CLASSIFICATION_ITEMS[currentIndex];
  const isCorrect = selectedType === currentItem.correctType;

  const typeOptions: { type: ReactionType; label: string; badge: string }[] = [
    { type: "addition", label: "Addition", badge: "A + B → AB" },
    { type: "elimination", label: "Elimination", badge: "AB → A + B (pi bond)" },
    { type: "oxidation", label: "Oxidation", badge: "Gain O / Lose H" },
    { type: "condensation_esterification", label: "Condensation (Ester)", badge: "A + B → AB + H2O" },
    { type: "combustion", label: "Combustion", badge: "+ O2 → CO2 + H2O" },
  ];

  const handleSelectOption = (type: ReactionType) => {
    if (hasChecked) return;
    setSelectedType(type);
  };

  const handleCheck = () => {
    if (!selectedType || hasChecked) return;
    setHasChecked(true);
    if (selectedType === currentItem.correctType) {
      const nextScore = scoreCount + 1;
      setScoreCount(nextScore);
      if (currentIndex === CLASSIFICATION_ITEMS.length - 1) {
        onClassificationCompleted?.(Math.round((nextScore / CLASSIFICATION_ITEMS.length) * 100));
      }
    }
  };

  const handleNext = () => {
    setSelectedType(null);
    setHasChecked(false);
    if (currentIndex < CLASSIFICATION_ITEMS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setScoreCount(0);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/60 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase font-bold text-primary border-primary/30">
                Reaction Classification Engine
              </Badge>
              <h3 className="text-base font-bold text-foreground">
                Classify Organic Transformations
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyze the chemical equation and bond changes to categorize each reaction type.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              Item {currentIndex + 1} of {CLASSIFICATION_ITEMS.length}
            </span>
            <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/30">
              Score: {scoreCount} / {CLASSIFICATION_ITEMS.length}
            </Badge>
          </div>
        </div>

        {/* Chemical Equation Prompt Card */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider block">
            Target Chemical Reaction Equation:
          </span>
          <div className="p-3 bg-background/90 rounded-lg border border-border/60 text-center">
            <span className="text-sm sm:text-base font-mono font-bold text-foreground tracking-wide">
              {currentItem.equation}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
            <div>
              <strong className="text-foreground">Reactants: </strong>
              {currentItem.reactants}
            </div>
            <div>
              <strong className="text-foreground">Products: </strong>
              {currentItem.products}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-card/60 border border-border/40 text-[11px] text-muted-foreground">
            <strong className="text-amber-500">Condition Clue: </strong>
            {currentItem.condition} • {currentItem.bondClue}
          </div>
        </div>

        {/* Classification Options */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground block">
            Select the Matching Reaction Classification:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {typeOptions.map((opt) => {
              const isSelected = selectedType === opt.type;
              const showCorrect = hasChecked && opt.type === currentItem.correctType;
              const showWrong = hasChecked && isSelected && !isCorrect;

              return (
                <button
                  key={opt.type}
                  disabled={hasChecked}
                  onClick={() => handleSelectOption(opt.type)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                      : showWrong
                      ? "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                      : isSelected
                      ? "border-primary bg-primary/10 text-foreground font-bold ring-1 ring-primary/40"
                      : "border-border/60 bg-background/60 hover:bg-background/90 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{opt.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button & Explanatory Feedback */}
        <div className="space-y-3 pt-1">
          {!hasChecked ? (
            <Button
              onClick={handleCheck}
              disabled={!selectedType}
              className="w-full bg-primary text-primary-foreground text-xs font-bold h-9 cursor-pointer"
            >
              Verify Classification
            </Button>
          ) : (
            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isCorrect
                    ? "border-emerald-500/40 bg-emerald-950/20 text-foreground"
                    : "border-rose-500/40 bg-rose-950/20 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">Correct Classification!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-rose-500">
                        Incorrect. This is an {currentItem.correctType.replace("_", " ")} reaction.
                      </span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{currentItem.rationale}</p>
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-primary text-primary-foreground text-xs font-bold h-9 cursor-pointer"
              >
                {currentIndex < CLASSIFICATION_ITEMS.length - 1 ? "Next Reaction" : "Restart Classification"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
