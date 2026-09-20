import { Sparkles, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-semibold text-xs text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              Class 4 Mathematics
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs">
              <Rocket className="mr-1 h-3 w-3" />
              Space Missions Theme
            </Badge>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
            Welcome back, Aarav!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            You are exploring <span className="font-medium text-foreground">Understanding Fractions</span>. Complete concepts sequentially to unlock downstream missions on your adaptive learning path.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
          <div className="rounded-xl border border-border/60 bg-background/80 p-3 text-center min-w-[110px] shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Curriculum</div>
            <div className="text-lg font-bold text-foreground mt-0.5">7 Concepts</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Prerequisite DAG</div>
          </div>
        </div>
      </div>
    </div>
  );
}
