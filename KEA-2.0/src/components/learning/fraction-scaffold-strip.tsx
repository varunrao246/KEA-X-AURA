"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, CheckCircle2, RotateCcw, ArrowRight, Eye } from "lucide-react";

interface FractionScaffoldStripProps {
  onCompleteRemediation?: () => void;
}

interface StripConfig {
  denominator: number;
  numerator: number;
  color: string;
}

const AVAILABLE_DENOMINATORS = [2, 3, 4, 6, 8];

const COLOR_MAP: Record<number, { fill: string; stroke: string; label: string }> = {
  2: { fill: "fill-blue-500/80", stroke: "stroke-blue-600", label: "Halves (1/2)" },
  3: { fill: "fill-purple-500/80", stroke: "stroke-purple-600", label: "Thirds (1/3)" },
  4: { fill: "fill-emerald-500/80", stroke: "stroke-emerald-600", label: "Fourths (1/4)" },
  6: { fill: "fill-amber-500/80", stroke: "stroke-amber-600", label: "Sixths (1/6)" },
  8: { fill: "fill-cyan-500/80", stroke: "stroke-cyan-600", label: "Eighths (1/8)" },
};

export function FractionScaffoldStrip({ onCompleteRemediation }: FractionScaffoldStripProps) {
  // Strip 1: Default 3/8
  const [stripA, setStripA] = React.useState<StripConfig>({
    denominator: 8,
    numerator: 3,
    color: "cyan",
  });

  // Strip 2: Default 5/8
  const [stripB, setStripB] = React.useState<StripConfig>({
    denominator: 8,
    numerator: 5,
    color: "cyan",
  });

  const valueA = stripA.numerator / stripA.denominator;
  const valueB = stripB.numerator / stripB.denominator;

  const comparison =
    valueA > valueB ? ">" : valueA < valueB ? "<" : "=";

  return (
    <Card className="border-border/80 shadow-md bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-mono">
                Interactive Remediation Manipulative (P1-04)
              </Badge>
              <Badge variant="outline" className="text-xs">
                Visual Comparison Bars
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Hands-On Fraction Strip Comparison Bar
            </CardTitle>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStripA({ denominator: 8, numerator: 3, color: "cyan" });
              setStripB({ denominator: 8, numerator: 5, color: "cyan" });
            }}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to 3/8 vs 5/8
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Click on any fraction block to shade or unshade it. Notice how dividing a whole bar into equal parts allows you to compare quantities directly!
        </p>

        {/* Strip A */}
        <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Strip A:</span>
              <span className="font-mono text-sm font-bold text-primary">
                {stripA.numerator}/{stripA.denominator}
              </span>
              <span className="text-xs text-muted-foreground">
                ({stripA.numerator} of {stripA.denominator} shaded • {COLOR_MAP[stripA.denominator]?.label})
              </span>
            </div>

            {/* Denominator Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-1">Parts:</span>
              {AVAILABLE_DENOMINATORS.map(d => (
                <button
                  key={d}
                  onClick={() =>
                    setStripA({
                      denominator: d,
                      numerator: Math.min(stripA.numerator, d),
                      color: "cyan",
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    stripA.denominator === d
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  1/{d}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual Strip A */}
          <div className="w-full h-12 rounded-lg border-2 border-border/80 overflow-hidden flex bg-muted/30">
            {Array.from({ length: stripA.denominator }).map((_, idx) => {
              const isShaded = idx < stripA.numerator;
              return (
                <button
                  key={idx}
                  onClick={() => setStripA(prev => ({ ...prev, numerator: idx + 1 }))}
                  className={`flex-1 h-full border-r border-border/60 last:border-r-0 flex items-center justify-center transition-all ${
                    isShaded
                      ? "bg-sky-500/80 text-white font-bold"
                      : "bg-background/40 hover:bg-muted/60 text-muted-foreground"
                  }`}
                  title={`Click to set shaded parts to ${idx + 1}/${stripA.denominator}`}
                >
                  <span className="text-[10px] font-mono select-none">
                    1/{stripA.denominator}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Comparison Gauge */}
        <div className="flex items-center justify-center gap-4 py-1">
          <div className="text-center font-mono text-base font-bold text-foreground">
            {stripA.numerator}/{stripA.denominator}
          </div>
          <Badge
            className={`text-base font-bold px-3 py-1 font-mono ${
              comparison === "="
                ? "bg-amber-500 text-white"
                : comparison === "<"
                ? "bg-purple-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {comparison}
          </Badge>
          <div className="text-center font-mono text-base font-bold text-foreground">
            {stripB.numerator}/{stripB.denominator}
          </div>
        </div>

        {/* Strip B */}
        <div className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Strip B:</span>
              <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                {stripB.numerator}/{stripB.denominator}
              </span>
              <span className="text-xs text-muted-foreground">
                ({stripB.numerator} of {stripB.denominator} shaded • {COLOR_MAP[stripB.denominator]?.label})
              </span>
            </div>

            {/* Denominator Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-1">Parts:</span>
              {AVAILABLE_DENOMINATORS.map(d => (
                <button
                  key={d}
                  onClick={() =>
                    setStripB({
                      denominator: d,
                      numerator: Math.min(stripB.numerator, d),
                      color: "cyan",
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    stripB.denominator === d
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  1/{d}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual Strip B */}
          <div className="w-full h-12 rounded-lg border-2 border-border/80 overflow-hidden flex bg-muted/30">
            {Array.from({ length: stripB.denominator }).map((_, idx) => {
              const isShaded = idx < stripB.numerator;
              return (
                <button
                  key={idx}
                  onClick={() => setStripB(prev => ({ ...prev, numerator: idx + 1 }))}
                  className={`flex-1 h-full border-r border-border/60 last:border-r-0 flex items-center justify-center transition-all ${
                    isShaded
                      ? "bg-purple-600/80 text-white font-bold"
                      : "bg-background/40 hover:bg-muted/60 text-muted-foreground"
                  }`}
                  title={`Click to set shaded parts to ${idx + 1}/${stripB.denominator}`}
                >
                  <span className="text-[10px] font-mono select-none">
                    1/{stripB.denominator}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Concrete Pedagogical Takeaway */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Eye className="h-4 w-4" />
            <span>Key Takeaway:</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {stripA.denominator === stripB.denominator ? (
              <>
                Both bars are divided into equal-sized <strong>1/{stripA.denominator}</strong> pieces.
                Since {stripA.numerator} {stripA.numerator === 1 ? "piece" : "pieces"} is{" "}
                {stripA.numerator < stripB.numerator ? "fewer than" : stripA.numerator > stripB.numerator ? "more than" : "equal to"}{" "}
                {stripB.numerator} pieces,{" "}
                <strong>
                  {stripA.numerator}/{stripA.denominator} {comparison} {stripB.numerator}/{stripB.denominator}
                </strong>.
              </>
            ) : (
              <>
                Notice how changing the denominator changes the size of each piece! Cutting into {stripA.denominator} pieces makes each piece{" "}
                {stripA.denominator > stripB.denominator ? "smaller than" : "larger than"} cutting into {stripB.denominator} pieces.
              </>
            )}
          </p>
        </div>

        {/* Return Button */}
        {onCompleteRemediation && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={onCompleteRemediation}
              className="gap-2 text-xs font-bold bg-primary text-primary-foreground"
            >
              <CheckCircle2 className="h-4 w-4" />
              I Understand Now! Return to Challenge
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
