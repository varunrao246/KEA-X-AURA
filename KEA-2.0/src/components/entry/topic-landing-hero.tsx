"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Code2,
  BrainCircuit,
  Binary,
  Leaf,
  Search,
  Atom,
} from "lucide-react";

interface TopicLandingHeroProps {
  onSubmitTopic: (topic: string) => void;
  isLoading?: boolean;
}

const SAMPLE_CHIPS = [
  { label: "Organic Chemistry", icon: Atom, value: "Organic Chemistry" },
  { label: "Python", icon: Code2, value: "Python" },
  { label: "Machine Learning", icon: BrainCircuit, value: "Machine Learning" },
  { label: "Calculus", icon: Binary, value: "Calculus" },
  { label: "Photosynthesis", icon: Leaf, value: "Photosynthesis" },
];

export function TopicLandingHero({
  onSubmitTopic,
  isLoading = false,
}: TopicLandingHeroProps) {
  const [topicInput, setTopicInput] = React.useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = topicInput.trim();
    if (!trimmed || isLoading) return;
    onSubmitTopic(trimmed);
  };

  const handleChipClick = (topic: string) => {
    setTopicInput(topic);
    onSubmitTopic(topic);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 max-w-4xl mx-auto text-center space-y-10 animate-in fade-in duration-300">
      {/* 1. Visually Dominant KEA & Mission */}
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-foreground font-sans selection:bg-primary/20">
          KEA
        </h1>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase">
          WHAT DO YOU WANT TO LEARN?
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Enter any topic or discipline. KEA will structure your complete step-by-step path to mastery.
        </p>
      </div>

      {/* 2. Primary Input Card */}
      <Card className="w-full max-w-2xl shadow-xl border-2 border-primary/20 bg-card/95 backdrop-blur">
        <CardContent className="p-4 sm:p-6 space-y-4 text-left">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter any topic..."
                className="pl-12 h-14 text-base sm:text-lg bg-background shadow-inner rounded-xl"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!topicInput.trim() || isLoading}
              className="h-14 px-8 font-bold text-base gap-2 shadow-md shrink-0 cursor-pointer rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <span>{isLoading ? "Structuring..." : "Build My Learning Path"}</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          {/* Clean Examples (No demo labels) */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Explore:
              </span>
              {SAMPLE_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => handleChipClick(chip.value)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/60 hover:border-primary/40 transition-all cursor-pointer"
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
    </div>
  );
}
