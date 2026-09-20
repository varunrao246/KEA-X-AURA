"use client";

import { ArrowRight, Check, FlaskConical, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { LabResult } from "@/lib/practice";
import { cn } from "@/lib/utils";

interface Props {
  labId: string;
  file: string;
  title: string;
  tasks: string[];
  relatedTopic: { id: string; name: string } | null;
}

/**
 * Embeds an existing HTML lab inside the AURA lesson. The lab talks to us with postMessage:
 *   { type: "aura:lab-result", labId, score, mistakes }
 * so any HTML lab can be integrated by including /labs/aura-bridge.js and calling AURA.complete().
 */
export function LabFrame({ labId, file, title, tasks, relatedTopic }: Props) {
  const toast = useToast();
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [nonce, setNonce] = useState(0);
  const savingRef = useRef(false);

  // Keep the lab's theme in step with the app's theme.
  useEffect(() => {
    const send = () => frame.current?.contentWindow?.postMessage({ type: "aura:theme", theme: document.documentElement.dataset.theme }, "*");
    const obs = new MutationObserver(send);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; labId?: string; score?: number; mistakes?: number } | null;
      if (d?.type !== "aura:lab-result" || typeof d.score !== "number") return;
      // Guards against a duplicate postMessage (e.g. a double-click inside the lab) firing a second
      // save while the first is still in flight, which would otherwise record two lab attempts.
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      try {
        const res = await fetch(`/api/labs/${labId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: d.score, mistakes: d.mistakes ?? 0 }) });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setResult(json.data as LabResult);
        toast.success("Lab complete", "Your result counts towards your mastery.");
      } catch {
        toast.error("Couldn't save your lab result", "Please try finishing the lab again.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [labId, toast]);

  // The iframe can finish loading before React attaches onLoad (fast or cached loads), so also check on mount.
  useEffect(() => {
    if (loaded || failed) return;
    const done = () => {
      try {
        return frame.current?.contentDocument?.readyState === "complete" && frame.current.contentDocument.location.href !== "about:blank";
      } catch {
        return false;
      }
    };
    if (done()) { onLoad(); return; }
    const poll = window.setInterval(() => { if (done()) { window.clearInterval(poll); onLoad(); } }, 150);
    const giveUp = window.setTimeout(() => { window.clearInterval(poll); setLoaded(true); }, 5000);
    return () => { window.clearInterval(poll); window.clearTimeout(giveUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, loaded, failed]);

  function onLoad() {
    setLoaded(true);
    frame.current?.contentWindow?.postMessage({ type: "aura:theme", theme: document.documentElement.dataset.theme }, "*");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          {!loaded && !failed && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-surface text-muted" role="status">
              <span className="flex items-center gap-2"><Loader2 className="size-5 animate-spin" aria-hidden /> Loading lab…</span>
            </div>
          )}
          {failed ? (
            <div role="alert" className="grid min-h-[420px] place-items-center p-8 text-center">
              <div>
                <TriangleAlert className="mx-auto mb-3 size-8 text-danger" aria-hidden />
                <p className="t-heading">The lab didn't load</p>
                <Button variant="secondary" className="mt-5" iconLeft={<RotateCcw className="size-4" />} onClick={() => { setFailed(false); setLoaded(false); setNonce((n) => n + 1); }}>Try again</Button>
              </div>
            </div>
          ) : (
            <iframe
              key={nonce} ref={frame} src={file} title={title} onLoad={onLoad} onError={() => setFailed(true)}
              sandbox="allow-scripts allow-same-origin"
              className={cn("block h-[78dvh] min-h-[520px] w-full border-0", !loaded && "opacity-0")}
            />
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <Card>
          <h3 className="t-heading">What to try</h3>
          <ol className="mt-4 space-y-3">
            {tasks.map((t, i) => (
              <li key={t} className="flex gap-3 text-[15px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
          <p className="t-small mt-4 border-t border-line pt-4">Finish the lab inside the window and your result is added to your mastery.</p>
        </Card>

        {saving && <Card><p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Saving your result…</p></Card>}

        {result && (
          <Card className="enter border-success/40 bg-success-soft/50">
            <div className="flex items-center gap-2 text-success"><Check className="size-5" strokeWidth={3} /><span className="font-semibold">Lab score {result.score}%</span></div>
            <ul className="mt-4 space-y-2 text-sm">
              {result.mastery.map((m) => (
                <li key={m.topicId} className="flex items-center justify-between gap-3">
                  <span>{m.name}</span>
                  <span className="t-num text-right">{m.started ? `${m.before}% → ${m.after}%` : <span className="text-xs font-normal text-muted">Answer questions to start counting it</span>}</span>
                </li>
              ))}
            </ul>
            {result.unlocked.length > 0 && (
              <p className="mt-4 rounded-xl bg-success px-4 py-3 text-sm font-semibold text-brand-on">{result.unlocked.map((u) => u.name).join(" and ")} unlocked</p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              {result.unlocked[0] ? (
                <Button href={`/student/learn/${result.unlocked[0].id}`} iconRight={<ArrowRight className="size-4" />}>Open {result.unlocked[0].name}</Button>
              ) : relatedTopic ? (
                <Button href={`/student/learn/${relatedTopic.id}?tab=practice`} iconRight={<ArrowRight className="size-4" />}>Practice {relatedTopic.name}</Button>
              ) : null}
              <Button href="/student/path" variant="secondary">See My Path</Button>
            </div>
          </Card>
        )}

        {!result && relatedTopic && (
          <Link href={`/student/learn/${relatedTopic.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-sm transition hover:border-brand/40">
            <FlaskConical className="size-5 text-accent" aria-hidden />
            <span className="flex-1">Related topic: <span className="font-semibold">{relatedTopic.name}</span></span>
            <ArrowRight className="size-4 text-faint" aria-hidden />
          </Link>
        )}
      </aside>
    </div>
  );
}
