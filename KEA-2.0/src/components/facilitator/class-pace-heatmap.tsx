"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Flame, Clock } from "lucide-react";

export interface StudentPaceRecord {
  id: string;
  name: string;
  theme: string;
  paceMascot: "falcon" | "cheetah" | "panda";
  avgSeconds: number;
  currentNodeId: string;
  currentNodeTitle: string;
  masteryScore: number;
  status: "mastered" | "in_progress" | "remediation" | "locked";
}

export const SEEDED_STUDENT_ROSTER: StudentPaceRecord[] = [
  {
    id: "student_aarav",
    name: "Aarav Sharma",
    theme: "space",
    paceMascot: "panda",
    avgSeconds: 65,
    currentNodeId: "NODE_03",
    currentNodeTitle: "Comparing Like Denominators",
    masteryScore: 35,
    status: "remediation",
  },
  {
    id: "student_diya",
    name: "Diya Patel",
    theme: "wildlife",
    paceMascot: "falcon",
    avgSeconds: 16,
    currentNodeId: "NODE_05",
    currentNodeTitle: "Adding Fractions with Like Denominators",
    masteryScore: 92,
    status: "mastered",
  },
  {
    id: "student_rohan",
    name: "Rohan Gupta",
    theme: "chef",
    paceMascot: "cheetah",
    avgSeconds: 38,
    currentNodeId: "NODE_03",
    currentNodeTitle: "Comparing Like Denominators",
    masteryScore: 68,
    status: "in_progress",
  },
  {
    id: "student_ananya",
    name: "Ananya Rao",
    theme: "superhero",
    paceMascot: "cheetah",
    avgSeconds: 32,
    currentNodeId: "NODE_04",
    currentNodeTitle: "Equivalent Fractions (1/2 and 2/4)",
    masteryScore: 78,
    status: "in_progress",
  },
  {
    id: "student_kabir",
    name: "Kabir Mehta",
    theme: "space",
    paceMascot: "panda",
    avgSeconds: 58,
    currentNodeId: "NODE_02",
    currentNodeTitle: "Numerator and Denominator",
    masteryScore: 42,
    status: "remediation",
  },
  {
    id: "student_zoya",
    name: "Zoya Khan",
    theme: "wildlife",
    paceMascot: "falcon",
    avgSeconds: 19,
    currentNodeId: "NODE_04",
    currentNodeTitle: "Equivalent Fractions (1/2 and 2/4)",
    masteryScore: 88,
    status: "mastered",
  },
];

interface NodeBottleneckSummary {
  nodeId: string;
  nodeTitle: string;
  masteredCount: number;
  inProgressCount: number;
  remediationCount: number;
  bottleneckSeverity: "none" | "moderate" | "high";
}

const CLASS_NODE_BOTTLENECKS: NodeBottleneckSummary[] = [
  {
    nodeId: "NODE_01",
    nodeTitle: "Equal Parts of a Whole",
    masteredCount: 24,
    inProgressCount: 1,
    remediationCount: 0,
    bottleneckSeverity: "none",
  },
  {
    nodeId: "NODE_02",
    nodeTitle: "Numerator and Denominator",
    masteredCount: 20,
    inProgressCount: 3,
    remediationCount: 2,
    bottleneckSeverity: "moderate",
  },
  {
    nodeId: "NODE_03",
    nodeTitle: "Comparing Like Denominators",
    masteredCount: 12,
    inProgressCount: 8,
    remediationCount: 5,
    bottleneckSeverity: "high", // Highest bottleneck in Class 4
  },
  {
    nodeId: "NODE_04",
    nodeTitle: "Equivalent Fractions (1/2 and 2/4)",
    masteredCount: 8,
    inProgressCount: 7,
    remediationCount: 1,
    bottleneckSeverity: "moderate",
  },
  {
    nodeId: "NODE_05",
    nodeTitle: "Adding Fractions with Like Denominators",
    masteredCount: 5,
    inProgressCount: 4,
    remediationCount: 0,
    bottleneckSeverity: "none",
  },
];

export function ClassPaceHeatmap() {
  const totalStudents = 25;
  const falconCount = 7;
  const cheetahCount = 13;
  const pandaCount = 5;

  return (
    <div className="space-y-6">
      {/* 1. Class Pace Distribution Overview */}
      <div className="p-4 rounded-xl border border-border/80 bg-background/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Class 4-B Learning Pace Distribution (25 Students)
            </h3>
            <p className="text-xs text-muted-foreground">
              Dynamic pace clusters computed without penalizing individual scores.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            3 Active Mascots
          </Badge>
        </div>

        {/* Pace Distribution Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Falcon Card */}
          <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                <span>🦅</span> Aero the Falcon
              </span>
              <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono text-[10px]">
                {Math.round((falconCount / totalStudents) * 100)}%
              </Badge>
            </div>
            <div className="text-xl font-bold font-mono text-foreground">{falconCount} students</div>
            <p className="text-[11px] text-muted-foreground">
              Accelerated velocity (&lt;25s avg), ready for extension problems.
            </p>
          </div>

          {/* Cheetah Card */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span>🐆</span> Dash the Cheetah
              </span>
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px]">
                {Math.round((cheetahCount / totalStudents) * 100)}%
              </Badge>
            </div>
            <div className="text-xl font-bold font-mono text-foreground">{cheetahCount} students</div>
            <p className="text-[11px] text-muted-foreground">
              Steady rhythm (25s–55s avg), balanced progression.
            </p>
          </div>

          {/* Panda Card */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span>🐼</span> Bamboo the Panda
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                {Math.round((pandaCount / totalStudents) * 100)}%
              </Badge>
            </div>
            <div className="text-xl font-bold font-mono text-foreground">{pandaCount} students</div>
            <p className="text-[11px] text-muted-foreground">
              Mindful deep reflection (&gt;55s avg), benefits from visual strips.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Concept Node Bottleneck Heatmap */}
      <div className="p-4 rounded-xl border border-border/80 bg-background/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              Curriculum Node Bottleneck Analysis
            </h3>
            <p className="text-xs text-muted-foreground">
              Identifies which prerequisite concepts generate the highest remediation reroutes.
            </p>
          </div>
          <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 text-xs font-mono">
            NODE_03: Critical Bottleneck
          </Badge>
        </div>

        <div className="space-y-2.5">
          {CLASS_NODE_BOTTLENECKS.map(node => (
            <div
              key={node.nodeId}
              className={`p-3 rounded-xl border transition-all ${
                node.bottleneckSeverity === "high"
                  ? "border-rose-500/40 bg-rose-500/5"
                  : node.bottleneckSeverity === "moderate"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border/60 bg-card"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {node.nodeId}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">{node.nodeTitle}</span>
                  {node.bottleneckSeverity === "high" && (
                    <Badge className="bg-rose-600 text-white text-[10px] gap-1 py-0 font-bold">
                      <AlertTriangle className="h-3 w-3" />
                      Highest Bottleneck
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                    ✓ {node.masteredCount} Mastered
                  </span>
                  <span className="text-muted-foreground font-mono">
                    ⏳ {node.inProgressCount} Active
                  </span>
                  {node.remediationCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
                      ⚠️ {node.remediationCount} in Remediation
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Live Student Pace Roster */}
      <div className="p-4 rounded-xl border border-border/80 bg-background/60 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Active Student Session Matrix
        </h3>

        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
          {SEEDED_STUDENT_ROSTER.map(student => (
            <div key={student.id} className="p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {student.paceMascot === "falcon"
                    ? "🦅"
                    : student.paceMascot === "cheetah"
                    ? "🐆"
                    : "🐼"}
                </span>
                <div>
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{student.name}</span>
                    <Badge variant="outline" className="capitalize text-[10px] py-0 px-1 font-mono">
                      {student.theme}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Node: {student.currentNodeTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {student.avgSeconds}s / item
                </span>
                <Badge
                  className={
                    student.status === "mastered"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : student.status === "remediation"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold"
                      : "bg-primary/20 text-primary border-primary/30"
                  }
                >
                  {student.masteryScore}% • {student.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
