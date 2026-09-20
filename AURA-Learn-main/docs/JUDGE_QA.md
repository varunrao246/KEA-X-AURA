# AURA Learn — Judge Q&A

Answers reflect the actual, tested implementation. No invented metrics.

---

**1. What is actually AI here?**

One thing: rewriting a question's narrative context around a student's chosen interest (e.g.
"Space"), while the academic content — numbers, units, formula, answer, learning objective,
difficulty — stays identical. Mastery, struggle detection, prerequisite unlocking and the
intervention state machine are all deterministic arithmetic, not model calls.

**2. Why isn't this just ChatGPT?**

There's no chat interface anywhere in the student experience, no free-form conversation, and the
model never grades anything or decides what a student should do next. It performs exactly one
constrained, structured rewrite task, its output is checked against 12+ deterministic rules before
a student ever sees it, and if it fails any one of them the rewrite is thrown away in favor of a
built-in template or the original question. A general chatbot could change the actual problem;
this system is built so that it structurally cannot.

**3. How does personalization work?**

A student picks interests during onboarding (Space, Sports, Gaming, Animals, Technology,
Environment, Art). When practicing, the question's stem/story is rewritten around that interest —
live by an LLM if one is configured and available, or by a deterministic built-in template if not.
Both paths are validated identically before display.

**4. How do you know the student is struggling?**

A weighted score (0–100) from five signals over their recent attempts on a topic: repeated wrong
answers in a row (25%), low recent accuracy (25%), taking much longer than expected for the
question's difficulty (20%), prerequisite weakness (15%), and hint dependency (15%). Below 40 is
"on track," 40–59 is "watch," 60–79 opens an intervention, 80+ escalates to "needs attention now."
Every signal and its exact contribution is visible in the student's own Insights tab — nothing is
hidden from the student it's about.

**5. How does mastery work?**

40% quiz accuracy (weighted so a correct hard question counts more than an easy one) + 20% recent
performance (last 5 answers) + 15% prerequisite mastery + 15% retention (fades 4 points/day of
inactivity, floor 40) + 10% virtual lab performance. Below 8 total attempts, the score is scaled
down by an "evidence factor" so one lucky early answer can't look like mastery.

**6. How do prerequisites work?**

Each topic lists its prerequisite topic(s) (e.g. Ohm's Law requires Resistance). A topic is locked
until every prerequisite reaches 60% mastery ("proficient"). This is enforced server-side on every
question fetch and every answer submission — not just hidden in the UI — so a locked topic cannot
be reached by navigating directly to its URL either.

**7. How do virtual labs affect learning?**

Each lab is a real interactive simulation (e.g. an Ohm's Law circuit you can adjust the voltage and
resistance sliders on) that reports a genuine score and mistake count back to the app. That result
is weighted at a fixed 10% of the mastery formula — the same formula every question attempt feeds —
so a lab is not a side quest; it moves the same number practice does, and it can't move it alone: a
topic with zero question attempts still scores 0 regardless of lab performance.

**8. What does the facilitator see?**

An overview with real counts (students needing attention, active interventions, resolved in the
last 24h), an intervention queue ranked by urgency showing each student, topic, the specific reason
("missed the last 9 questions in a row... the gap is inside Resistance"), the risk score, and a
recommended action — plus a student detail page with learning progress, current blockers, active
interventions and a recommended next step. No charts for their own sake.

**9. Can AI hallucinate an answer?**

It can attempt to (and in testing, occasionally did try to change a number or reveal the answer);
it cannot get away with it. Grading is always computed server-side against the original, authored
question — never the text the student was shown — so even if a themed rewrite were somehow wrong,
scoring would be unaffected. Separately, the guardrail layer rejects any rewrite that changes a
number, unit, variable, formula, or leaks the answer, before it's ever displayed.

**10. What happens if the AI API fails?**

The pipeline catches timeouts, HTTP errors and malformed responses, and falls back automatically:
first to a deterministic built-in themed version (checked by the identical guardrails), then to the
original authored question if no template exists. A circuit breaker also stops calling a
repeatedly-failing provider for 60 seconds rather than retrying it on every request. This was
verified against a real, live provider failure during testing (not simulated) — the student's
question stayed fully usable throughout.

**11. How are API keys protected?**

Server-only environment variables, read in code that throws if it's ever accidentally imported into
a browser bundle. Keys are sent only in the provider's own `Authorization`/`x-goog-api-key` header,
never in a URL, never returned in any API response, and stripped from error messages and logs by a
redaction helper. This was verified by grepping every captured live-test response for the literal
key value.

**12. Why use multiple AI providers?**

Reliability and demo resilience, not marketing. Different providers can be slow, rate-limited, or
have model-availability changes at different times (this happened live during testing — a
documented default model wasn't available on one API key, and the system degraded gracefully rather
than breaking). One clean interface (`generateRetheme`-shaped client) is implemented once and
reused; the app talks to exactly one provider per request, chosen by configuration.

**13. How would this scale?**

The current persistence (a single JSON file) was a deliberate choice for a 24-hour, fully
inspectable prototype — it needs a persistent server process rather than a serverless platform. The
codebase already isolates all storage access behind `getStore()`/`mutate()`, specifically so it can
be swapped for a real database (Postgres/Supabase, already sketched in `.env.example`) without
touching the adaptive engine, guardrails, or UI.

**14. Why not just use a traditional LMS?**

A traditional LMS delivers the same content to everyone and reports on progress after the fact. It
doesn't gate content on measured prerequisite mastery, doesn't compute a live struggle score from
recent behavior, and doesn't hand a facilitator a specific, explained, actionable case the moment a
pattern crosses a threshold — it waits for a person to look at a report.

**15. How would you validate educational effectiveness?**

Honestly: this prototype has not been run with real students, so there is no learning-outcome data
to report, and we won't claim any. The right next step is a small controlled pilot comparing time-
to-mastery and retention between themed and un-themed practice, and tracking whether facilitator
intervention actually shortens how long a student stays stuck (measurable directly from the existing
`Intervention` records: time from `detected` to `resolved`).

**16. What would you build next?**

In order: a real database behind the same storage interface (removing the single-file limitation);
richer lab telemetry where the lab content supports it (which values a student tried, not just a
final score); expanding the facilitator view with the intervention-history data already being
recorded but not yet surfaced as trends; and only then, more subjects/topics — the architecture
doesn't change to add a fourth topic chain, just content.

**17. What is the biggest current technical limitation?**

The file-backed store: it works perfectly for a demo and even a small deployed pilot on a
persistent server, but it is a single point of write contention and isn't deployable as-is to a
serverless platform like Vercel. It was an explicit, documented tradeoff for shipping a fully
working, fully inspectable prototype in the time available, not an oversight.
