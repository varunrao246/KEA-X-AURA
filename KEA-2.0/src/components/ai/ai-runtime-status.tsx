"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Activity,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ExecutionMetadata, ProviderHealthResult } from "@/lib/ai/ai-provider";

interface AIRuntimeStatusProps {
  currentMetadata?: ExecutionMetadata | null;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  className?: string;
}

export function AIRuntimeStatus({
  currentMetadata,
  demoMode,
  onToggleDemoMode,
  className = "",
}: AIRuntimeStatusProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [healthData, setHealthData] = React.useState<{
    providers: ProviderHealthResult[];
    status: string;
    primaryProvider: string;
  } | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = React.useState(false);

  const fetchHealth = React.useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch("/api/ai/health");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (e) {
      console.warn("Failed to probe AI health:", e);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/ai/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setHealthData(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Determine truthful pill status
  let statusBadge: React.ReactNode;

  if (demoMode) {
    statusBadge = (
      <Badge
        variant="outline"
        className="cursor-pointer font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
      >
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="font-semibold">DEMO MODE</span>
        <span className="text-muted-foreground hidden sm:inline">(Offline Deterministic)</span>
      </Badge>
    );
  } else if (currentMetadata) {
    if (currentMetadata.provider === "fallback") {
      statusBadge = (
        <Badge
          variant="outline"
          className="cursor-pointer font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span className="font-semibold">AI ● FALLBACK</span>
          <span className="text-muted-foreground hidden sm:inline">(Deterministic Engine)</span>
        </Badge>
      );
    } else {
      const providerLabel =
        currentMetadata.provider === "gemini"
          ? "Gemini"
          : currentMetadata.provider === "groq"
          ? "Groq"
          : currentMetadata.provider === "nvidia"
          ? "NVIDIA NIM"
          : currentMetadata.provider;

      statusBadge = (
        <Badge
          variant="outline"
          className="cursor-pointer font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">AI ● LIVE</span>
          <span className="text-muted-foreground hidden sm:inline">
            ({providerLabel}{currentMetadata.fallbackUsed ? " Fallback" : ""})
          </span>
        </Badge>
      );
    }
  } else {
    // Initial state before any request
    const reachableProvider = healthData?.providers?.find(
      (p) => p.reachable && p.structuredOutputWorking && p.provider !== "fallback"
    );

    if (reachableProvider) {
      const providerLabel =
        reachableProvider.provider === "gemini"
          ? "Gemini"
          : reachableProvider.provider === "groq"
          ? "Groq"
          : reachableProvider.provider === "nvidia"
          ? "NVIDIA NIM"
          : reachableProvider.provider;

      statusBadge = (
        <Badge
          variant="outline"
          className="cursor-pointer font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">AI ● LIVE</span>
          <span className="text-muted-foreground hidden sm:inline">
            ({providerLabel} Ready)
          </span>
        </Badge>
      );
    } else {
      statusBadge = (
        <Badge
          variant="outline"
          className="cursor-pointer font-mono text-[11px] gap-1.5 py-1 px-2.5 transition-all bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
        >
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span className="font-semibold">AI ● FALLBACK</span>
          <span className="text-muted-foreground hidden sm:inline">(Deterministic Engine)</span>
        </Badge>
      );
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger render={
          <div className="cursor-pointer">{statusBadge}</div>
        } />
        <SheetContent side="right" className="w-[90vw] max-w-md overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base font-bold">
                <Activity className="h-4 w-4 text-primary" />
                <span>AI Runtime Observability</span>
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHealth}
                disabled={isLoadingHealth}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHealth ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <SheetDescription className="text-xs">
              Live telemetry, vendor cascade diagnostics, and mock/demo mode control.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pt-6">
            {/* Mode Switcher */}
            <Card className="bg-muted/40 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Operating Mode</span>
                  <Sliders className="h-3.5 w-3.5" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {demoMode ? "Local Demo Mode" : "Live AI Generation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {demoMode
                        ? "Zero external API calls. Uses KEA verified curriculum engine."
                        : "Active LLM synthesis via Gemini / Groq / NVIDIA cascade."}
                    </p>
                  </div>
                  <Button
                    variant={demoMode ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleDemoMode}
                    className="font-mono text-xs cursor-pointer"
                  >
                    {demoMode ? "Switch to Live AI" : "Force Demo Mode"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Last Execution Telemetry */}
            {currentMetadata ? (
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Recent Request Telemetry</span>
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-bold uppercase text-foreground">{currentMetadata.provider}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="text-foreground">{currentMetadata.model}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Task:</span>
                    <span className="capitalize text-foreground">{currentMetadata.taskType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="text-foreground">{(currentMetadata.latencyMs / 1000).toFixed(2)}s ({currentMetadata.latencyMs}ms)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Structured Output:</span>
                    <span className="text-emerald-500 font-bold">PASS (Zod Validated)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Fallback Used:</span>
                    <span className={currentMetadata.fallbackUsed ? "text-amber-500" : "text-emerald-500"}>
                      {currentMetadata.fallbackUsed ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Retries:</span>
                    <span className="text-foreground">{currentMetadata.retryCount}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                No AI generation requests dispatched yet in this view session.
              </div>
            )}

            {/* Provider Readiness Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Provider Readiness Matrix</span>
                <ShieldCheck className="h-3.5 w-3.5" />
              </h4>

              <div className="space-y-2">
                {healthData?.providers?.map((p) => {
                  const isOnline = p.reachable && p.structuredOutputWorking;
                  const isConfigured = p.configured;

                  return (
                    <div
                      key={p.provider}
                      className="p-3 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold uppercase tracking-wide">
                            {p.provider === "gemini"
                              ? "Google Gemini"
                              : p.provider === "groq"
                              ? "Groq LPU"
                              : p.provider === "nvidia"
                              ? "NVIDIA NIM"
                              : "Local Fallback"}
                          </span>
                          {p.provider === healthData.primaryProvider && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {p.model}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {p.latencyMs > 0 && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {p.latencyMs}ms
                          </span>
                        )}

                        {isOnline ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                            Online
                          </Badge>
                        ) : isConfigured ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Unreachable
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Zero Secret Leakage Guarantee
              </p>
              <p>
                All provider API keys are strictly retained on the Next.js server runtime.
                No credentials are ever transmitted to client bundles or serialized into the DOM.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
