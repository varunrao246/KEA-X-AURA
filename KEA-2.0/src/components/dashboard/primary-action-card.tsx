import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle, Mic, Rocket, BookOpen, Shapes } from "lucide-react";

export function PrimaryActionCard() {
  return (
    <div id="action-module" className="scroll-mt-20">
      <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                Current Learning Target
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 text-purple-600 dark:text-purple-400 text-xs">
                <Rocket className="mr-1 h-3 w-3" />
                Space Mission Narrative
              </Badge>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Order #1 of 7</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold mt-2 text-foreground">
            Mission 1: Equal Parts &amp; Unit Fractions
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Explore fair sharing and partition wholes into unit fractions (1/2, 1/3, 1/4) using circle pie visualizers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-muted/40 p-4 border border-border/50 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Target Competencies:
              </span>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Distinguish equal partitions from unequal partitions</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Identify and name unit fractions: 1/2, 1/3, and 1/4</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Model fair sharing of space fuel canisters</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 sm:border-l sm:border-border/60 sm:pl-4">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Shapes className="h-3.5 w-3.5 text-primary" />
                Assessment Modalities:
              </span>
              <div className="space-y-2 text-muted-foreground text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-md bg-background/80 border border-border/40">
                  <span className="font-medium text-foreground">1. Practice Questions</span>
                  <Badge variant="secondary" className="text-[10px]">Weight: 0.25</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-background/80 border border-border/40">
                  <span className="font-medium text-foreground">2. Step-by-Step Written</span>
                  <Badge variant="secondary" className="text-[10px]">Weight: 0.35</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-background/80 border border-border/40">
                  <span className="font-medium text-foreground">3. AI Oral Check</span>
                  <Badge variant="secondary" className="text-[10px]">Weight: 0.40</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="text-xs text-muted-foreground">
            Mastery goal: <span className="font-semibold text-foreground">&ge; 80%</span> to unlock Numerator &amp; Denominator Roles
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs opacity-70">
              <Mic className="h-3.5 w-3.5" />
              <span>Oral Probe</span>
              <Badge variant="secondary" className="text-[9px] py-0 px-1 uppercase">P1-01</Badge>
            </Button>
            <Button size="sm" disabled className="gap-1.5 text-xs shadow-sm opacity-80">
              <PlayCircle className="h-4 w-4" />
              <span>Launch Practice Canvas</span>
              <Badge variant="secondary" className="text-[9px] py-0 px-1 uppercase bg-primary-foreground/20 text-primary-foreground">P0-05</Badge>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
