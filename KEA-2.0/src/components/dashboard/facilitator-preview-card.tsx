import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ShieldCheck, HeartHandshake } from "lucide-react";

export function FacilitatorPreviewCard() {
  return (
    <div id="facilitator-preview" className="scroll-mt-20">
      <Card className="border-border/60 bg-muted/20 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Facilitator Cockpit Preview (Ms. Priya)
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time student bottleneck diagnosis &amp; actionable intervention feed
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Human-in-the-Loop Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-foreground">Student Aarav Sharma: On Track</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Current Node: FRAC-01
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Struggle detection triggers automatically upon <span className="font-semibold text-foreground">&ge; 2 consecutive incorrect attempts</span> or detected misconceptions (e.g. denominator whole-number bias). The system immediately generates an actionable 3-step physical manipulative guide for the facilitator.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 text-[11px] text-muted-foreground">
            <div className="rounded-md border border-border/40 p-2.5 bg-background/50">
              <span className="font-medium text-foreground block mb-0.5">Automated Diagnosis</span>
              Flags root cause misconception, not just a score
            </div>
            <div className="rounded-md border border-border/40 p-2.5 bg-background/50">
              <span className="font-medium text-foreground block mb-0.5">Physical Manipulatives</span>
              Concrete fraction tile instructions provided
            </div>
            <div className="rounded-md border border-border/40 p-2.5 bg-background/50">
              <span className="font-medium text-foreground block mb-0.5">One-Click Remediation</span>
              Teacher applies intervention and student path refreshes
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 text-xs text-muted-foreground border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px]">Facilitator Triage Cockpit fully integrated in Task P0-07</span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-primary">
            <Eye className="h-3 w-3" />
            <span>Ready for Milestone 2</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
