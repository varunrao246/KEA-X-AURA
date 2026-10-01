import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

interface StoredAnalyticsEvent {
  id: string;
  studentId: string;
  topicId: string;
  challengeId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const memoryEvents: StoredAnalyticsEvent[] = [];

export async function POST(req: Request) {
  try {
    const user = await requireUser("student").catch(() => null);
    const body = await req.json().catch(() => ({}));

    const event: StoredAnalyticsEvent = {
      id: `mbe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: user?.id || body.studentId || "anonymous",
      topicId: String(body.topicId || "unknown"),
      challengeId: String(body.challengeId || "unknown"),
      eventType: String(body.eventType || "master_brain_shown"),
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
    };

    memoryEvents.unshift(event);
    if (memoryEvents.length > 1000) memoryEvents.pop();

    // Also persist to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      void fetch(`${supabaseUrl}/rest/v1/master_brain_events`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: event.studentId,
          topic_id: event.topicId,
          challenge_id: event.challengeId,
          event_type: event.eventType,
          metadata: event.metadata,
          created_at: event.createdAt,
        }),
      }).catch((err) => {
        console.warn("[Master Brain Analytics] Supabase log failed (non-fatal):", err);
      });
    }

    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Tracking failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    totalEvents: memoryEvents.length,
    recentEvents: memoryEvents.slice(0, 50),
  });
}
