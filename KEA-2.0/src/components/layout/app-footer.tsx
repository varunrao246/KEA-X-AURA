import { BookOpen, Layers, Terminal } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/20 py-6 text-xs text-muted-foreground">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <p className="font-medium text-foreground">
            KEA Platform — Problem 01: Adaptive Learning &amp; Real-Time Intervention
          </p>
          <p>
            24-Hour Hackathon Implementation Sprint • Class 4 Mathematics • Invariant-Preserving AI
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 hover:text-foreground transition-colors">
            <BookOpen className="h-3.5 w-3.5" />
            <span>PRD Baseline</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Layers className="h-3.5 w-3.5" />
            <span>Architecture v1.0</span>
          </div>
          <span className="text-border">•</span>
          <div className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Terminal className="h-3.5 w-3.5" />
            <span>Task P0-01 Complete</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
