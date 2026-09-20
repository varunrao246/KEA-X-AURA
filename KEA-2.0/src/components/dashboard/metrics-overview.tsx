import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Gauge, GitFork } from "lucide-react";

export function MetricsOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Active Focus Concept */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Concept
          </CardTitle>
          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Target className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-base font-bold text-foreground leading-snug">
            Equal Parts &amp; Unit Fractions
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              FRAC-01
            </Badge>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Ready to Learn
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Path Unlock Progress */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Path Unlock Status
          </CardTitle>
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-extrabold text-foreground">1 / 7</span>
            <span className="text-xs font-mono text-muted-foreground">14% Unlocked</span>
          </div>
          <Progress value={14} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground mt-2">
            6 concepts gated by prerequisites
          </p>
        </CardContent>
      </Card>

      {/* 3. Dynamic Learning Pace Mascot */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Learning Pace
          </CardTitle>
          <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Gauge className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐆</span>
            <div>
              <div className="text-sm font-bold text-foreground">Cheetah Pace</div>
              <div className="text-[10px] text-muted-foreground">Steady Explorer Rhythm</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground/90">
            Cadence indicator • Non-punitive
          </div>
        </CardContent>
      </Card>

      {/* 4. Graph Health & Gating */}
      <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prerequisite Engine
          </CardTitle>
          <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <GitFork className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold text-foreground">
            Gated Mastery: &ge; 80%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Topological DAG verified • 0 cycles
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-purple-600 dark:text-purple-400">
            <span>Class 4 Fractions Spec</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
