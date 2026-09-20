"use client";

import { Flame, Rocket, Target, Zap } from "lucide-react";
import { useState } from "react";
import { Avatar, Badge, Button, Card, CardHeader, Chip, EmptyState, ErrorState, Modal, ProgressBar, ProgressRing, Skeleton, StatTile, StatusPill, ThemeToggle, ToastProvider, useToast } from "@/components/ui";
import { Logo } from "@/components/brand/Logo";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="t-eyebrow">{title}</h2>
      {children}
    </section>
  );
}

function Inner() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(["space"]);
  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div className="page space-y-12 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <div>
        <p className="t-eyebrow mb-2">Design system</p>
        <h1 className="t-display">Learn your way.</h1>
        <p className="t-body mt-3 max-w-lg">Every screen is composed from these pieces so the product stays consistent.</p>
      </div>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Continue learning</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button size="sm" iconLeft={<Rocket className="size-4" />}>Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges and status">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand" dot>Brand</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warn">Watch</Badge>
          <Badge tone="danger" dot>Immediate attention</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status="mastered" />
          <StatusPill status="learning" />
          <StatusPill status="attention" />
          <StatusPill status="locked" />
        </div>
      </Section>

      <Section title="Progress">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center gap-5">
            <ProgressRing value={72} label="Mastery">
              <span className="t-num text-2xl">72%</span>
            </ProgressRing>
            <div>
              <p className="t-eyebrow">Mastery</p>
              <p className="mt-1 text-sm text-success">+8% this week</p>
            </div>
          </Card>
          <Card className="space-y-4 md:col-span-2">
            <ProgressBar value={88} tone="success" label="Current" />
            <ProgressBar value={48} tone="warn" label="Resistance" />
            <ProgressBar value={22} tone="danger" size="sm" label="Risk" />
          </Card>
        </div>
      </Section>

      <Section title="Stat tiles and cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Streak" value="6 days" icon={Flame} />
          <StatTile label="Accuracy" value="81%" icon={Target} delta={4} />
          <StatTile label="Pace" value="82%" icon={Zap} delta={-2} />
        </div>
        <Card interactive>
          <CardHeader title="Interactive card" subtitle="Lifts on hover, for cards that open something." action={<Avatar name="Aarav Sharma" />} />
          <p className="t-body">Rounded surfaces, soft shadow, generous spacing.</p>
        </Card>
      </Section>

      <Section title="Selection">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["space", "sports", "gaming", "animals"].map((k) => (
            <Chip key={k} selected={picked.includes(k)} onToggle={() => toggle(k)} icon={k === "space" ? <Rocket className="size-5" /> : undefined}>
              {k[0].toUpperCase() + k.slice(1)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Feedback">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setOpen(true)}>Open dialog</Button>
          <Button variant="secondary" onClick={() => toast.success("Saved", "Your interests were updated.")}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast.error("Couldn't save", "Please try again.")}>Error toast</Button>
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title="AURA noticed a prerequisite gap" description="Resistance needs more practice before you continue to Ohm's Law." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Not now</Button><Button onClick={() => setOpen(false)}>Practice Resistance</Button></>} />
      </Section>

      <Section title="States">
        <div className="grid gap-4 md:grid-cols-3">
          <Card padding="none"><EmptyState icon={Rocket} title="Nothing here yet" description="Start a topic and it will show up here." /></Card>
          <Card padding="none"><ErrorState onRetry={() => toast.info("Retrying…")} /></Card>
          <Card className="space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-20 w-full" /></Card>
        </div>
      </Section>
    </div>
  );
}

export function DesignShowcase() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  );
}
