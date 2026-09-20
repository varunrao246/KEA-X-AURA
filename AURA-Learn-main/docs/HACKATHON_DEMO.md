# AURA Learn — 3–5 Minute Hackathon Demo Script

**Core story:** Don't adapt the student to the lesson. Adapt the lesson to the student.

**Golden scenario:** Aarav, Grade 9, interested in Space. Resistance is weak (50%), which keeps
Ohm's Law locked. He struggles, AURA notices and recommends the interactive lab, his facilitator
(Ms. Rao) sees the case and steps in, and the loop closes with mastery recovering and the
prerequisite unlocking.

Everything below runs against the real app — the same adaptive engine, mastery model, struggle
detector, intervention state machine, AI guardrails and facilitator workflow verified in testing.
Nothing on screen is faked or hardcoded for the demo.

---

## Before you start

1. Run `npm run build` once beforehand so there's no first-load compile stutter, then `npm run
   start` (or `npm run dev` is fine too).
2. Sign in as **Aarav Sharma** (student, demo account) and open the account menu (top right) →
   **Reset demo data**. This restores the exact starting scenario below, deterministically, as
   many times as you need to rehearse.
3. Know the two demo accounts: **Aarav Sharma** (student) and **Ms. Priya Rao** (facilitator). No
   passwords — pick the account from the sign-in screen.

**Important sequencing note** (see `ARCHITECTURE.md` for why): the intervention engine has
hysteresis — if a student's struggle score drops back below 40 before anyone acts, AURA quietly
resolves the case on its own, because that's what a real facilitator would want (don't page someone
about a problem that already fixed itself). That means if you let Aarav fully recover mastery in
one uninterrupted run, the very case you wanted to show the facilitator may have already closed by
the time you switch views. The script below is split into **Part A** (struggle → lab → recovery →
unlock) and **Part B** (a *second*, fresh struggle → facilitator action) specifically so the
facilitator segment always has a genuinely open case to act on. This is intended behavior of the
intervention state machine, not a workaround for a bug.

---

### 0:00–0:30 — Problem

> "Traditional learning platforms give every student the same content, at the same pace, and only
> find out a student is struggling when a teacher happens to notice — often too late. AURA
> continuously observes how a student is actually doing, and adapts the learning experience in
> real time, not after the fact."

### 0:30–1:00 — Personalization

Show the onboarding flow: name → interests → learning style. Select **Space**.

> "The student isn't just picking a theme for fun. That choice becomes a signal AURA uses to
> personalize how content is presented, for the rest of their learning."

Land on the dashboard. Point at the "Continue learning → Resistance" card and the "Reach 60% to
unlock Ohm's Law" line.

### 1:00–1:45 — AI personalization

Open **Resistance → Practice**. A question appears with interest chips (Space / Original) above it.

Toggle between **Original** and **Space** for a question that has a themed version (any numeric
Ohm's-Law-family question works well — the canonical example is *"Calculate the current for V = 12
V and R = 6 Ω"* → *"Imagine a spacecraft instrument operating at 12 V with 6 Ω of resistance."*).

> "The learning objective didn't change. The numbers didn't change. The formula didn't change. The
> answer didn't change. Only the context changed — and everything I just said isn't a claim, it's
> checked automatically, every time, before the student ever sees it."

Optionally expand "Same question, new story" to show the guardrail checklist.

### 1:45–2:30 — Adaptive learning (struggle)

Answer (or skip) several Resistance questions incorrectly in a row.

Point out, as it happens:
- the mastery bar not moving up
- the struggle chip changing from "Watch" to "Intervention recommended"
- the supportive intervention card appearing: *"You've missed the last N questions in a row... A
  different explanation or hands-on practice may help."* — never "FAILED" or "bad score."

> "AURA isn't waiting for a teacher to notice this. It's already noticed, already explained *why*
> in plain language, and already has a recommendation ready."

### 2:30–3:15 — Virtual lab (Part A continues)

Click **Open the virtual lab** from the intervention card. Show the live Ohm's Law circuit
simulator (drag the voltage/resistance sliders, watch current respond in real time). Complete it.

> "The lab isn't a separate mini-game bolted on the side. Its result — the score, the mistakes —
> feeds directly into the same mastery engine that just scored the quiz questions."

Show the lab-result panel: mastery before → after. Continue practicing Resistance correctly a few
times. Show mastery crossing 60% and the **"Resistance passed, Ohm's Law is open"** transition on
My Path.

### 3:15–4:15 — Facilitator (Part B: a fresh, still-open case)

Trigger a **new** struggle on Resistance (a handful more wrong/skipped answers — Resistance stays
practiceable even after Ohm's Law unlocks). Confirm the intervention card reappears.

Switch to **Ms. Priya Rao** (facilitator). On the Overview, point out the stat tiles and Aarav's
case, visible with zero scrolling.

> "WHO needs help, WHY, and WHAT to do next — all in the first thing she sees. No dashboard to dig
> through."

Open Aarav's student detail page. Show learning progress, the active case, the recommended action.
Click **Mark reviewed**, then **Start helping**.

Switch back to Aarav. Reload the practice page. Point at the line under the intervention card:

> **"Your facilitator is helping."**

> "That's not a mocked message. It's the same intervention record, the same status field, read back
> live from the same store the facilitator just wrote to."

### 4:15–4:45 — Close

> "AURA creates a closed learning loop: detect, adapt, practice, measure, intervene, improve. The
> student adapts less, because the system adapts more — and a human is always the one who decides
> what happens next."

---

## Recovery script (if something goes sideways live)

- Any screen errors: open the account menu → **Reset demo data**, then re-enter the flow from
  wherever you are; the whole story is reproducible from a clean reset in under a minute.
- If the AI provider is slow or fails: this is fine to show live — the question still renders (via
  the built-in themed fallback), and it's a good moment to say *"and if the live model is ever slow
  or unavailable, the student never notices — watch, it still works."*
- If you skip the AI section for time: the adaptive/lab/facilitator loop stands completely on its
  own and is the stronger technical story regardless.
