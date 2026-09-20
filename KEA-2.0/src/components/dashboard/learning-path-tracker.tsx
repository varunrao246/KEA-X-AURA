"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Shapes,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { class4FractionsGraph } from "@/lib/knowledge-graph";

const EMPTY_MASTERY_SET = new Set<string>();

export function LearningPathTracker() {
  const nodes = class4FractionsGraph.getAllNodes();

  return (
    <div id="learning-path" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Class 4 Fractions Learning Pathway
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sequential prerequisite Directed Acyclic Graph (DAG) • Progression gated at &ge; 80% mastery
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="text-xs font-mono">
            Kahn Topological Sequence
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node, index) => {
          const isUnlocked = class4FractionsGraph.isUnlocked(node.id, EMPTY_MASTERY_SET);
          const prereqs = class4FractionsGraph.getDirectPrerequisites(node.id);
          const dependents = class4FractionsGraph.getDirectDependents(node.id);

          return (
            <Card
              key={node.id}
              className={`flex flex-col justify-between transition-all shadow-2xs ${
                isUnlocked
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : "border-border/60 bg-card/60 opacity-85 hover:opacity-100"
              }`}
            >
              <CardHeader className="pb-2.5">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {node.code}
                    </Badge>
                  </div>

                  {isUnlocked ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] py-0 gap-1">
                      <Unlock className="h-2.5 w-2.5" />
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 gap-1 text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" />
                      Gated
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-sm font-semibold leading-tight text-foreground">
                  {node.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {node.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5 text-xs text-muted-foreground pt-1 pb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {node.estimatedMinutes} mins
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Shapes className="h-3 w-3" />
                    {node.visualModel}
                  </span>
                </div>

                {/* Prerequisite Tags */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Prerequisites:
                  </span>
                  {prereqs.length === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      None (Root Concept)
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {prereqs.map((p) => (
                        <span
                          key={p.id}
                          className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/60"
                        >
                          {p.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unlocks Downstream */}
                {dependents.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Enables Downstream:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dependents.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground"
                        >
                          <ArrowRight className="h-2.5 w-2.5" />
                          {d.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 text-xs border-t border-border/40">
                {isUnlocked ? (
                  <Button size="sm" className="w-full gap-1.5 text-xs h-8 shadow-xs" render={<a href="#action-module" />}>
                    <Sparkles className="h-3 w-3" />
                    Active Mission
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="w-full text-xs h-8 opacity-60">
                    <Lock className="h-3 w-3 mr-1" />
                    Complete Prerequisites First
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
