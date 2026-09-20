import { AlertTriangle, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { INTEREST_OPTIONS } from "@/components/student/interests";
import { MetricBar } from "@/components/student/MetricBar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { paceLabel } from "@/lib/format";
import { getStudentState, PREFERENCE_LABELS, profileInsights } from "@/lib/student";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("student");
  const store = getStore();
  const state = getStudentState(store, user.id);
  const { strengths, attention } = profileInsights(store, user.id, state);
  const { profile, overall } = state;
  const chosen = INTEREST_OPTIONS.filter((o) => profile.interests.includes(o.id));
  const pref = profile.learningPreference;

  return (
    <div className="page py-8 lg:py-10">
      <PageHeader eyebrow="Profile" title="Your learning profile" description="More than marks: how you learn, what you're strong at, and where AURA can help." />

      <Card padding="lg" className="enter mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={user.name} size="lg" className="!size-16 !text-xl" />
          <div className="min-w-0 flex-1">
            <h2 className="t-heading text-xl">{user.name}</h2>
            <p className="t-small">Grade {user.grade}{user.school ? ` · ${user.school}` : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chosen.map(({ id, label, icon: Icon }) => <Badge key={id} tone="brand" className="py-1.5 pl-2 pr-3"><Icon className="size-3.5" aria-hidden /> {label}</Badge>)}
              {pref && <Badge tone="accent" className="py-1.5">{PREFERENCE_LABELS[pref]} learner</Badge>}
            </div>
          </div>
          <Button href="/student/onboarding?edit=1" variant="secondary" iconLeft={<Pencil className="size-4" />}>Edit</Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="enter lg:col-span-2" style={{ ["--i" as string]: 1 }}>
          <CardHeader title="Learning snapshot" subtitle="Updated as you practise" />
          <div className="grid gap-6 sm:grid-cols-2">
            <MetricBar label="Learning pace" value={profile.learningPace} note={`${paceLabel(profile.learningPace)}. How quickly you move through topics.`} />
            <MetricBar label="Concept mastery" value={overall.mastery} note="Average across topics you've started." tone="success" />
            <MetricBar label="Confidence" value={profile.confidence} note="How sure you are on harder questions." tone="accent" />
            <MetricBar label="Engagement" value={profile.engagement} note="How regularly you show up and practise." />
            <MetricBar label="Practice accuracy" value={overall.accuracy} note="Your last 20 answers." tone="success" />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="enter" style={{ ["--i" as string]: 2 }}>
            <CardHeader title="Strengths" />
            {strengths.length ? (
              <ul className="space-y-4">
                {strengths.map((s) => (
                  <li key={s.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                    <div><p className="font-medium">{s.title}</p><p className="t-small">{s.detail}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="t-small">Answer a few more questions and your strengths will show up here.</p>}
          </Card>
          <Card className="enter" style={{ ["--i" as string]: 3 }}>
            <CardHeader title="Needs attention" />
            {attention.length ? (
              <ul className="space-y-4">
                {attention.map((s) => (
                  <li key={s.title} className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
                    <div><p className="font-medium">{s.title}</p><p className="t-small">{s.detail}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="t-small">Nothing stands out. Keep going.</p>}
          </Card>
        </div>
      </div>

      <Card className="enter mt-6 border-brand/30 bg-brand-soft/50" style={{ ["--i" as string]: 4 }}>
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-on"><Sparkles className="size-5" aria-hidden /></span>
          <div>
            <h3 className="t-heading">How AURA adapts to you</h3>
            <ul className="t-body mt-2 space-y-1.5">
              <li>Examples and analogies come from {chosen.length ? chosen.map((c) => c.label).join(", ") : "your interests"}.</li>
              <li>{pref ? `Recommendations lead with ${PREFERENCE_LABELS[pref].toLowerCase()} activities.` : "Recommendations balance explanations, practice and labs."}</li>
              <li>Question difficulty moves up and down with your last few answers, and topics unlock as you master what they build on.</li>
            </ul>
            <Link href="/student/onboarding?edit=1" className="mt-3 inline-block text-sm font-semibold text-brand">Change your interests</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
