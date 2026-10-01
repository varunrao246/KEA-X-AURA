import { NextResponse } from "next/server";
import { getSerpApiUsageStats, getRecentUsageLogs, isSerpApiConfigured } from "@/lib/serpapi/service";

export async function GET() {
  const stats = getSerpApiUsageStats();
  const logs = getRecentUsageLogs(25);
  const configured = isSerpApiConfigured();

  return NextResponse.json({
    ok: true,
    data: {
      configured,
      stats,
      recentLogs: logs,
    },
  });
}
