"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  GitBranch,
  PenTool,
  Award,
  BarChart3,
  AlertTriangle,
  Users2,
  Rocket,
  GraduationCap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold tracking-tight text-base leading-tight truncate">
              KEA
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              Adaptive Learning
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Student Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-4 py-2">
            Student Learning
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/" />} isActive tooltip="Dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="#learning-path" />} tooltip="Learning Path">
                  <GitBranch className="h-4 w-4" />
                  <span>Learning Path</span>
                  <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1 font-mono">
                    7 Nodes
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Practice Canvas (P0-05)">
                  <PenTool className="h-4 w-4 opacity-50" />
                  <span className="opacity-70">Practice Canvas</span>
                  <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1 uppercase opacity-70">
                    P0-05
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Assessments (Coming Soon)">
                  <Award className="h-4 w-4 opacity-50" />
                  <span className="opacity-70">Assessments</span>
                  <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1 uppercase opacity-70">
                    Soon
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="My Progress (Coming Soon)">
                  <BarChart3 className="h-4 w-4 opacity-50" />
                  <span className="opacity-70">My Progress</span>
                  <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1 uppercase opacity-70">
                    Soon
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Facilitator Cockpit Group */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-4 py-2">
            Facilitator Cockpit
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="#facilitator-preview" />} tooltip="Active Interventions">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Interventions</span>
                  <Badge variant="outline" className="ml-auto text-[9px] py-0 px-1 border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono">
                    P0-07
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Class Overview (Coming Soon)">
                  <Users2 className="h-4 w-4 opacity-50" />
                  <span className="opacity-70">Class Overview</span>
                  <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1 uppercase opacity-70">
                    Soon
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer Profile */}
      <SidebarFooter className="border-t border-border/40 p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 bg-muted/40 hover:bg-muted/60 transition-colors">
          <Avatar className="h-8 w-8 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
            <AvatarFallback className="text-xs">AS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold truncate">Aarav Sharma</span>
              <Rocket className="h-3 w-3 text-purple-500 shrink-0" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate">
              Class 4-B • Space Explorer
            </span>
          </div>
          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
