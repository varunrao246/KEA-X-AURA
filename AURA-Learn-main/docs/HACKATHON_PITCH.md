# AURA Learn — Pitch Summary

### One-liner

AURA Learn is an adaptive learning platform that changes the learning experience based on what each
student actually needs.

### Problem

Generic learning paths treat students too similarly: same content, same pace, same examples —
regardless of what a student already knows, where they're stuck, or what would make the material
click for them. Struggle is usually noticed by a teacher only after it's already cost a student
real time and confidence.

### Solution

AURA continuously connects:

**performance → mastery → struggle → intervention → personalized learning**

A prerequisite graph gates what a student can move on to. A transparent mastery model scores every
topic from real quiz and lab performance. A struggle detector watches for the specific patterns
that predict a student is stuck — before a teacher would otherwise notice. When it crosses a
threshold, AURA explains *why*, in plain language, and hands a facilitator a specific, actionable
case. And the question content itself adapts to what the student is interested in, without ever
touching the academic problem underneath.

### Differentiator

**AI is not the product. The adaptive feedback loop is the product.**

AI makes the learning context more relevant — it does not decide what "correct" means, does not set
mastery, does not resolve a struggling student's case on its own. Human facilitators remain in the
loop for exactly the decision that should stay human: what to do about a student who's stuck.

### Technical differentiation

- **Real adaptive state** — one mastery/struggle/intervention record per student per topic,
  computed from real attempt and lab history, not mocked for a demo.
- **Prerequisite graph** — topics are locked server-side (not just hidden in the UI) until
  dependencies reach a measured mastery threshold.
- **Transparent mastery model** — a documented weighted formula, inspectable per-student in the
  product itself.
- **Struggle detection** — five weighted, explainable signals, not a black-box score.
- **Intervention engine** — a real state machine (detected → recommended → viewed → started →
  responding → resolved) driving both the student's supportive messaging and the facilitator's
  queue from the same record.
- **AI guardrails** — 12+ deterministic checks (numbers, units, variables, formula, concept,
  answer-leak, MCQ options, difficulty, objective) applied identically regardless of which
  provider answered.
- **Virtual lab telemetry** — real interactive labs whose score genuinely feeds the mastery model,
  weighted and gated so a lab alone can't fabricate mastery.
- **Facilitator workflow** — a real, server-authorized action path (review → start → resolve) that
  the student sees reflected live, not a static mockup screen.
- **Multi-provider AI fallback** — OpenRouter, Groq, Gemini and NVIDIA behind one interface, with a
  deterministic template and the original question as the safety net if every live provider fails.

Every item above is implemented, tested, and was demonstrated working live — including against a
real AI provider failure during development, which the fallback chain absorbed without the student
ever seeing a broken question.
