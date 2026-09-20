"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Code2,
  PieChart,
  BrainCircuit,
  Leaf,
  Layers,
  CheckCircle2,
  GitFork,
  Search,
} from "lucide-react";

interface TopicHeroProps {
  onGeneratePath: (topic: string) => void;
  isLoading?: boolean;
}

const SAMPLE_CHIPS = [
  { label: "Python", icon: Code2, value: "Python" },
  { label: "Fractions", icon: PieChart, value: "Fractions" },
  { label: "Machine Learning", icon: BrainCircuit, value: "Machine Learning" },
  { label: "Photosynthesis", icon: Leaf, value: "Photosynthesis" },
];

export function TopicHero({ onGeneratePath, isLoading = false }: TopicHeroProps) {
  const [inputVal, setInputVal] = React.useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || isLoading) return;
    onGeneratePath(trimmed);
  };

  const handleChipClick = (topic: string) => {
    setInputVal(topic);
    onGeneratePath(topic);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4 max-w-4xl mx-auto text-center space-y-10">
      {/* 1. Hero Headline & Mission */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Intelligent Prerequisite Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground font-sans">
          KEA
        </h1>

        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90">
          Learn anything. Follow the path. Master it.
        </p>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Tell KEA what you want to learn. We&apos;ll structure the concepts, identify what you need to know first, and build a personalized path to mastery.
        </p>
      </div>

      {/* 2. Main Input Card */}
      <Card className="w-full max-w-2xl shadow-lg border-primary/15 bg-card/95 backdrop-blur">
        <CardContent className="p-4 sm:p-6 space-y-5 text-left">
          <div className="space-y-1">
            <label
              htmlFor="topic-input"
              className="text-base sm:text-lg font-bold text-foreground block"
            >
              What do you want to learn?
            </label>
            <p className="text-xs text-muted-foreground">
              Enter any subject, chapter, programming language, or conceptual topic.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="topic-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. Python, Fractions, Machine Learning, Photosynthesis..."
                className="pl-10 h-12 text-sm sm:text-base bg-background shadow-inner"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!inputVal.trim() || isLoading}
              className="h-12 px-6 font-semibold gap-2 shadow-sm shrink-0 cursor-pointer"
            >
              <span>{isLoading ? "Analyzing..." : "Generate Learning Path"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Example topic chips */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                Explore examples:
              </span>
              {SAMPLE_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleChipClick(chip.value)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/60 hover:border-primary/30 cursor-pointer"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Three Core Pillars / Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-2">
        <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <GitFork className="h-4 w-4" />
            <span>1. Prerequisite Tree</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Deconstructs complex subjects into strict dependency trees. Never get stuck on advanced material without foundations.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>2. Diagnostic Calibration</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Checks what you already know first. Skip redundant material and pinpoint exact foundational gaps.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card/60 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Layers className="h-4 w-4" />
            <span>3. Stage-Wise Mastery</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Progress through structured milestones with multi-modal checks, dynamic pacing, and human-in-the-loop intervention.
          </p>
        </div>
      </div>
    </div>
  );
}
