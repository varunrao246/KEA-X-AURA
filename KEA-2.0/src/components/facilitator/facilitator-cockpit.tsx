"use client";

import * as React from "react";
import { InterventionRecord } from "@/lib/intervention/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  Wrench,
  MessageSquare,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

import { ClassPaceHeatmap } from "./class-pace-heatmap";

interface FacilitatorCockpitProps {
  isOpen: boolean;
  onClose: () => void;
  onInterventionResolved?: (interventionId: string) => void;
}

export function FacilitatorCockpit({
  isOpen,
  onClose,
  onInterventionResolved,
}: FacilitatorCockpitProps) {
  const [activeTab, setActiveTab] = React.useState<"interventions" | "heatmap">("interventions");
  const [interventions, setInterventions] = React.useState<InterventionRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleManualRefresh = React.useCallback(() => {
    setLoading(true);
    fetch("/api/facilitator/interventions")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.interventions) {
          setInterventions(data.interventions);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const load = () => {
      fetch("/api/facilitator/interventions")
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.interventions) {
            setInterventions(data.interventions);
          }
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch("/api/facilitator/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", interventionId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setInterventions(prev => prev.map(i => (i.id === id ? data.intervention : i)));
      }
    } catch (err) {
      console.error("Failed to acknowledge", err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch("/api/facilitator/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve",
          interventionId: id,
          facilitatorId: "Ms. Priya (Class 4-B Teacher)",
          resolutionType: "manipulatives_used",
          notes: "Provided hands-on fraction comparison strips. Student verified 1/4 = 2/8.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInterventions(prev => prev.map(i => (i.id === id ? data.intervention : i)));
        onInterventionResolved?.(id);
      }
    } catch (err) {
      console.error("Failed to resolve", err);
    }
  };

  const pendingList = interventions.filter(i => i.status !== "resolved");
  const resolvedList = interventions.filter(i => i.status === "resolved");

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-primary/20">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-destructive text-destructive-foreground gap-1 font-mono text-[11px]">
                <AlertTriangle className="h-3 w-3" />
                <span>Live Intervention Feed</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                Ms. Priya • Class 4-B
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleManualRefresh} className="h-8 px-2 cursor-pointer">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs cursor-pointer">
                Close Cockpit
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold mt-2">
            Facilitator Real-Time Cockpit
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Triage struggling students in real time with prescriptive 3-minute physical manipulative activities.
          </CardDescription>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab("interventions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "interventions"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              🚨 Active Struggles ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "heatmap"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              📊 Class Pace & Bottleneck Heatmap
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "heatmap" ? (
            <ClassPaceHeatmap />
          ) : (
            <>
              {pendingList.length === 0 ? (
            <div className="p-8 text-center space-y-3 rounded-xl border border-dashed border-border/60 bg-muted/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">All Clear! No Active Struggles</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                All students are progressing smoothly. The system monitors for consecutive failed attempts and flags struggle immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Requires Teacher Attention ({pendingList.length})</span>
                </h3>
              </div>

              {pendingList.map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-xl border-2 border-destructive/30 bg-destructive/5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-foreground" />
                        <h4 className="text-sm font-bold text-foreground">
                          {item.studentName}
                        </h4>
                        <Badge variant="outline" className="text-[10px]">
                          Class {item.grade}-B
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Struggling on Concept: <strong className="text-foreground">{item.conceptTitle}</strong>
                      </p>
                    </div>

                    <Badge className="bg-destructive text-destructive-foreground text-[10px] uppercase font-bold">
                      {item.severity} Priority
                    </Badge>
                  </div>

                  {/* Diagnosed Misconception */}
                  <div className="p-3 rounded-lg bg-card border border-border/70 text-xs space-y-1">
                    <span className="font-bold text-destructive uppercase text-[10px] block">
                      Diagnosed Foundational Misconception:
                    </span>
                    <p className="font-medium text-foreground">
                      {item.diagnosedMisconception}
                    </p>
                  </div>

                  {/* 3-Minute Prescriptive Action Brief */}
                  <div className="p-4 rounded-xl bg-card border border-primary/20 space-y-3 text-xs">
                    <span className="font-bold text-primary uppercase text-[10px] flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Prescriptive 3-Minute Facilitator Action Brief:</span>
                    </span>

                    <div className="space-y-2 text-foreground">
                      <div className="flex items-start gap-2">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span><strong>1. Concrete Tool:</strong> {item.prescriptiveAction.physicalTool}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span><strong>2. Dialogue Prompt:</strong> {item.prescriptiveAction.dialoguePrompt}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span><strong>3. Verification Step:</strong> {item.prescriptiveAction.verificationStep}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    {item.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(item.id)}
                        className="cursor-pointer text-xs"
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleResolve(item.id)}
                      className="cursor-pointer text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Apply Manipulatives & Resolve</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resolved History */}
          {resolvedList.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolved Interventions ({resolvedList.length})
              </h4>
              {resolvedList.map(r => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border border-border/60 bg-card/50 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.studentName}</span>
                    <span className="text-muted-foreground ml-2">({r.conceptTitle})</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.facilitatorNotes}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                    Resolved
                  </Badge>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
