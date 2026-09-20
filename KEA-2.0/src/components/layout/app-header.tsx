"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Shield, Rocket } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1 font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                KEA
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                Class 4 Math
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                Fractions Knowledge Graph
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Theme Context */}
        <Badge variant="outline" className="hidden md:inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-normal border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300">
          <Rocket className="h-3 w-3 text-purple-500" />
          <span>Theme: Space Missions</span>
        </Badge>

        {/* Demo Persona Context */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1 border border-border/50">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-foreground">Demo: Aarav (Class 4)</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
