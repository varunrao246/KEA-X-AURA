import { BookOpen, Cpu, Eye, FlaskConical, Gamepad2, Leaf, Palette, PawPrint, Rocket, Target, Trophy, type LucideIcon } from "lucide-react";
import type { Interest, LearningPreference } from "@/lib/types";

export const INTEREST_OPTIONS: { id: Interest; label: string; icon: LucideIcon }[] = [
  { id: "space", label: "Space", icon: Rocket },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "animals", label: "Animals", icon: PawPrint },
  { id: "technology", label: "Technology", icon: Cpu },
  { id: "environment", label: "Environment", icon: Leaf },
  { id: "art", label: "Art", icon: Palette },
];

export const PREFERENCE_OPTIONS: { id: LearningPreference; label: string; blurb: string; icon: LucideIcon }[] = [
  { id: "visual", label: "Visual", blurb: "Diagrams, graphs and animations first", icon: Eye },
  { id: "practice-first", label: "Practice-first", blurb: "Jump into questions, learn as I go", icon: Target },
  { id: "explanation-first", label: "Explanation-first", blurb: "Understand the idea before I practise", icon: BookOpen },
  { id: "interactive", label: "Interactive", blurb: "Labs and experiments I can play with", icon: FlaskConical },
];

export function interestLabel(id: Interest) {
  return INTEREST_OPTIONS.find((i) => i.id === id)?.label ?? id;
}
