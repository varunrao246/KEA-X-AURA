# AURA Learn — Product Requirements Document

**Product:** AURA Learn  
**Meaning:** Adaptive Understanding & Responsive Assistance  
**Motto:** **Learn your way. Master at your pace.**  
**Hackathon Goal:** Build a polished, working 24-hour prototype that directly satisfies the challenge requirements and is compelling to judges.

---

## 1. Product Vision

AURA Learn is an adaptive EdTech platform that creates a personalized learning path for every student.

Instead of giving every learner the same chapter, pace, examples, and difficulty, AURA continuously evaluates:

- prerequisite mastery
- learning pace
- accuracy
- repeated mistakes
- time spent
- hint dependency
- interests
- engagement
- confidence

It then adapts the learning journey and recommends human intervention when a student begins to struggle.

### Core promise

> **Every student gets a different path to the same learning outcome.**

### Core learning loop

```text
Understand
   ↓
Adapt
   ↓
Practice
   ↓
Detect Struggle
   ↓
Intervene
   ↓
Master
   ↓
Re-assess
   ↺
```

---

# 2. Problem Statement Alignment

The platform must directly address these four challenge requirements.

## 2.1 Prerequisite Knowledge Graph & Mastery Gating

AURA must represent learning as a prerequisite graph rather than a flat chapter list.

Example:

```text
Current
   ↓
Voltage
   ↓
Resistance
   ↓
Ohm's Law
   ↓
Circuits
```

A student cannot freely jump into a concept when a required prerequisite is insufficiently mastered.

The system should:

- track prerequisite relationships
- calculate topic mastery
- lock/unlock concepts
- identify missing prerequisites
- recommend remediation
- track mastery over time

---

## 2.2 AI-Driven Dynamic Context Re-theming

Students choose interests such as:

- Space
- Sports
- Gaming
- Animals
- Technology
- Environment
- Art

The system can re-theme the narrative/context of educational content around the student's interests.

Example:

Original:

> A circuit has a 12V source and 6Ω resistance. Calculate the current.

Space theme:

> Imagine a spacecraft instrument powered by a 12V supply with 6Ω resistance. Calculate the current.

### Critical rule

AI may change:

- story
- characters
- examples
- context
- vocabulary

AI must NOT change:

- numbers
- variables
- formula
- expected answer
- learning objective
- academic concept
- difficulty level

A validation/guardrail layer must ensure the generated question preserves the original academic structure.

---

## 2.3 Human-in-the-Loop Real-Time Intervention

AURA must not position AI as a replacement for teachers.

The system follows:

```text
AI detects
     ↓
AI explains why
     ↓
AI recommends action
     ↓
Human facilitator decides
```

When a student repeatedly struggles, the facilitator dashboard receives an actionable recommendation.

Example:

> **Aarav — High Intervention Risk**
>
> Topic: Ohm's Law  
> Struggle score: 86%  
> Main issue: Resistance prerequisite  
> Recommended action: Assign prerequisite refresher + virtual lab

The teacher can:

- view student
- assign remedial activity
- recommend a virtual lab
- send encouragement
- mark intervention started
- mark intervention resolved

---

## 2.4 End-to-End Architectural Coherence

The system must demonstrate that these components work together:

```text
Student Profile
      ↓
Curriculum / Prerequisite Graph
      ↓
Mastery Engine
      ↓
Adaptive Content
      ↓
Practice / Virtual Lab
      ↓
Struggle Detection
      ↓
AI Intervention Recommendation
      ↓
Facilitator
      ↓
Updated Student Mastery
      ↺
```

---

# 3. Target Users

## 3.1 Student

Primary user.

Needs:

- simple UI
- personalized content
- clear progress
- adaptive difficulty
- interactive learning
- immediate feedback
- interesting examples
- help when stuck

## 3.2 Facilitator / Teacher

Secondary user.

Needs:

- class overview
- student risk identification
- explanation of why a student is struggling
- recommended interventions
- ability to take action
- intervention history

---

# 4. MVP Scope

The 24-hour prototype must prioritize the following.

### MUST BUILD

1. Student/Facilitator login
2. Student dashboard
3. Student learning profile
4. Prerequisite learning graph
5. Mastery tracking
6. Adaptive question difficulty
7. AI contextual re-theming
8. Struggle detection
9. Facilitator intervention dashboard
10. Virtual lab integration
11. Three polished demonstration topics
12. Light/dark student-friendly UI

### NICE TO HAVE

- AI tutor
- student notes
- semantic/vector retrieval
- badges
- leaderboard
- voice interaction
- advanced analytics

Do not sacrifice core functionality for optional features.

---

# 5. Demonstration Curriculum

The prototype should use three representative subjects/topics.

## 5.1 Physics — Ohm's Law

Prerequisites:

```text
Electric Current
      ↓
Voltage
      ↓
Resistance
      ↓
Ohm's Law
```

Demonstrate:

- concept explanation
- adaptive questions
- difficulty changes
- AI re-theming
- virtual lab
- struggle detection
- intervention

---

## 5.2 Chemistry — Acid–Base Titration

Prerequisites:

```text
Acids & Bases
      ↓
pH
      ↓
Indicators
      ↓
Titration
```

Demonstrate:

- concept explanation
- interactive virtual lab
- question practice
- mastery progression

---

## 5.3 Biology — Human Senses

Prerequisites:

```text
Sense Organs
      ↓
Stimulus
      ↓
Sensory Receptors
      ↓
Brain Response
```

Use a younger/student-friendly presentation style.

---

# 6. Student Onboarding

The onboarding flow should be short.

## Step 1 — Student information

- Name
- Grade
- School (optional)

## Step 2 — Interests

Interactive cards:

```text
🚀 Space
⚽ Sports
🎮 Gaming
🐾 Animals
💻 Technology
🌍 Environment
🎨 Art
```

Students can select multiple interests.

## Step 3 — Learning preference

Optional:

- Visual
- Practice-first
- Explanation-first
- Interactive

This data feeds the student profile.

---

# 7. Student Dashboard

The dashboard should feel like a modern student product, not a traditional LMS.

### Header

```text
Good afternoon, Aarav 👋
Ready to continue your learning journey?
```

### Learning Pulse

Show:

- overall mastery
- learning streak
- current topic
- improvement this week
- current learning pace

Example:

```text
MASTERy
72%

██████████████░░░░
+8% this week
```

### Continue Learning Card

```text
⚡ Ohm's Law

72% complete

[ Continue Learning → ]
```

### Recommended For You

Examples:

- Resistance refresher
- Continue Ohm's Law
- Try virtual lab
- Practice weak concept

---

# 8. Student Learning Profile

The profile should show more than marks.

Example:

```text
Learning Pace       82%
Concept Mastery     74%
Confidence          61%
Engagement          89%
Practice Accuracy   81%
```

### Strengths

- visual examples
- real-world scenarios
- interactive experiments

### Needs Attention

- mathematical application
- multi-step problems

The profile must be understandable to students.

---

# 9. Curriculum Graph UI

Create an interactive graph/tree.

Example:

```text
Voltage             ✓ Mastered
   ↓
Resistance          ⚠ Learning
   ↓
Ohm's Law           🔒 Locked
   ↓
Circuits            🔒 Locked
```

Statuses:

- Mastered
- Learning
- Needs Attention
- Locked

If the user attempts to open a locked topic:

> **AURA noticed a prerequisite gap.**

> “Resistance needs more practice before you continue to Ohm's Law.”

Then show:

**[ Practice Resistance ]**

---

# 10. Mastery Engine

The prototype should use a transparent deterministic model.

Suggested mastery formula:

```text
Mastery Score =
40% Quiz Accuracy
+ 20% Recent Performance
+ 15% Prerequisite Mastery
+ 15% Retention
+ 10% Virtual Lab Performance
```

Suggested states:

```text
0–39    Not Ready
40–59   Learning
60–79   Proficient
80–100  Mastered
```

The implementation can simplify the formula if necessary, but it must produce believable adaptive behavior.

---

# 11. Adaptive Difficulty

Difficulty should change based on recent performance.

Example:

```text
5/5 correct
    ↓
Increase difficulty

3/5 correct
    ↓
Maintain difficulty

1/5 correct
    ↓
Reduce difficulty
+ check prerequisites
```

Example progression for Ohm's Law:

### Level 1

Identify voltage/current/resistance.

### Level 2

Apply the basic relationship.

### Level 3

Calculate a missing variable.

### Level 4

Solve a multi-step circuit problem.

---

# 12. Struggle Detection Engine

The system must detect early signs of difficulty.

Signals:

- repeated incorrect answers
- low accuracy
- excessive time
- repeated hints
- repeated topic revisits
- skipped questions
- prerequisite weakness

Suggested model:

```text
Struggle Score =
25% Repeated Errors
+ 25% Low Accuracy
+ 20% Excessive Time
+ 15% Prerequisite Weakness
+ 15% Hint Dependency
```

Risk levels:

```text
0–39   Normal
40–59  Watch
60–79  Intervention Recommended
80+    Immediate Facilitator Attention
```

---

# 13. AI Intervention

When struggle score crosses the intervention threshold, show a specific intervention.

Example:

```text
⚠ AURA Intervention

You seem to be struggling with the relationship
between voltage and resistance.

Recommended:

[ Try Simpler Explanation ]
[ Practice Prerequisite ]
[ Open Virtual Lab ]
[ Ask Facilitator ]
```

Do not simply display:

> “Your score is low.”

The system must explain the likely cause and recommend a next action.

---

# 14. AI Dynamic Re-Theming

The AI prompt should receive structured academic content.

Example input:

```json
{
  "topic": "Ohm's Law",
  "question": "Calculate current for V=12V and R=6Ω",
  "correctAnswer": "2A",
  "difficulty": 2,
  "learningObjective": "Apply Ohm's Law",
  "studentInterest": "Space"
}
```

The AI generates a new narrative around the same academic structure.

### Required guardrails

The AI response must preserve:

- numerical values
- mathematical relationships
- answer
- learning objective
- difficulty
- required reasoning

If validation fails, discard the generation and use the original question.

---

# 15. Virtual Lab Integration

Existing HTML virtual labs should be reused.

The platform should embed them inside the learning experience rather than opening a completely separate application.

Example:

```text
AURA Lesson
     ↓
Concept
     ↓
Practice
     ↓
Virtual Lab
     ↓
Lab Result
     ↓
Mastery Update
```

Target demonstrations:

- Ohm's Law lab
- Acid–Base Titration lab
- Other existing HTML labs where available

If full lab result integration is too time-consuming, embed the lab and record completion as a prototype event.

---

# 16. Facilitator Dashboard

Teacher login should open a monitoring dashboard.

### Class overview

```text
CLASS 5A

Students              32
On Track              24
Needs Attention        6
Critical               2
```

### Intervention Queue

Example card:

```text
🔴 HIGH PRIORITY

Aarav
Topic: Ohm's Law

Struggle Score: 91%

Repeated mistakes:
Voltage / Resistance

Prerequisite:
Resistance — Weak

Recommendation:
Assign prerequisite refresher

[ View Student ]
[ Assign Activity ]
[ Contact Student ]
```

---

# 17. Student Detail for Facilitator

Show:

```text
Aarav

Mastery
████████░░ 78%

Current Topic
Ohm's Law

Strengths
✓ Current
✓ Voltage

Weaknesses
⚠ Resistance

Recent Activity
3 incorrect attempts
2 hints
1 skipped question

AURA Recommendation
Assign prerequisite refresher
```

Teacher actions:

- assign lesson
- assign lab
- send message
- start intervention
- mark resolved

---

# 18. Human-in-the-Loop State Machine

Intervention states:

```text
Detected
   ↓
Recommended
   ↓
Facilitator Viewed
   ↓
Intervention Started
   ↓
Student Responding
   ↓
Resolved
```

This should be visible in the prototype.

---

# 19. Student Notes

Optional feature.

Students can write notes:

> “I still don't understand why increasing resistance reduces current.”

Notes can be stored and optionally used by the AI tutor.

If vector search is implemented:

```text
Student Notes
     ↓
Embedding
     ↓
Vector Store
     ↓
Semantic Retrieval
     ↓
Student Context
     ↓
AI Tutor
```

Do not make this a core dependency for the hackathon.

---

# 20. Gamification

Use lightweight meaningful gamification.

### XP for

- completing a lesson
- mastering a prerequisite
- completing a virtual lab
- improving a weak concept

### Badges

- First Mastery
- Lab Explorer
- Concept Master
- Comeback Learner

Avoid turning the product into a generic leaderboard.

---

# 21. Navigation

## Student

```text
🏠 Home
🗺️ My Path
📚 Learn
🧪 Labs
🤖 AURA AI
🏆 Progress
📝 Notes
👤 Profile
```

## Facilitator

```text
📊 Overview
👥 Students
🚨 Intervention Queue
🗺️ Curriculum
📈 Analytics
⚙️ Settings
```

---

# 22. UI/UX Requirements

The UI must feel:

- modern
- friendly
- responsive
- student-specific
- visually engaging
- easy to understand
- accessible

Avoid:

- dense tables
- old-fashioned LMS layouts
- excessive text
- too many charts
- unnecessary settings

Use:

- rounded cards
- clear hierarchy
- progress indicators
- subtle animations
- meaningful icons
- large touch-friendly controls
- empty states
- loading states
- clear success/error feedback

Support:

- light theme
- dark theme

---

# 23. Technical Architecture

Recommended stack:

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API routes

Use FastAPI only if already established.

### Database

- Supabase PostgreSQL

### AI

- OpenRouter or another reliable configured LLM API

### Vector Search

- Supabase pgvector, optional

### Deployment

- Vercel

### Existing labs

- HTML/CSS/JS
- embedded through iframe or integrated routes

---

# 24. High-Level Architecture

```text
                     AURA LEARN
                          │
              ┌───────────┴───────────┐
              │   STUDENT PROFILE     │
              │ Pace • Interest •     │
              │ Mastery • Behavior    │
              └───────────┬───────────┘
                          ↓
                 CURRICULUM GRAPH
                          │
                          ↓
                   MASTERY ENGINE
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
       CONTENT ENGINE          STRUGGLE ENGINE
              │                       │
              ↓                       ↓
        AI RE-THEMING           INTERVENTION
              │                       │
              └───────────┬───────────┘
                          ↓
                    VIRTUAL LABS
                          │
                          ↓
                     ASSESSMENT
                          │
                          ↓
                  UPDATED MASTERY
                          │
                          ↺
```

---

# 25. Database Schema

## users

```text
id
name
email
role
grade
avatar
created_at
```

## student_profiles

```text
student_id
learning_pace
confidence
engagement
preferred_interests
learning_preference
```

## subjects

```text
id
name
grade
```

## topics

```text
id
subject_id
name
description
difficulty
```

## prerequisites

```text
topic_id
prerequisite_id
```

## mastery

```text
student_id
topic_id
mastery_score
attempts
accuracy
last_activity
status
```

## questions

```text
id
topic_id
question
answer
difficulty
learning_objective
metadata
```

## attempts

```text
student_id
question_id
answer
correct
time_taken
hints_used
created_at
```

## interventions

```text
id
student_id
topic_id
risk_score
reason
recommended_action
status
created_at
resolved_at
```

## notes

```text
id
student_id
topic_id
content
created_at
```

---

# 26. API Requirements

Suggested API routes:

```text
POST /api/auth/login
GET  /api/student/profile
GET  /api/student/dashboard
GET  /api/curriculum
GET  /api/topics/:id
GET  /api/topics/:id/prerequisites

POST /api/attempts
GET  /api/mastery/:studentId

POST /api/adaptive/recommend
POST /api/ai/retheme
POST /api/ai/explain

GET  /api/interventions
POST /api/interventions
PATCH /api/interventions/:id

POST /api/labs/:id/complete
```

Keep API responses structured and predictable.

---

# 27. Security / AI Guardrails

Never expose LLM API keys in frontend code.

Use environment variables.

Example:

```text
OPENROUTER_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

AI-generated educational content must be validated before being shown.

The system should reject:

- changed numerical values
- changed answers
- changed formulas
- inappropriate content
- off-topic generated content

---

# 28. Demo Scenario

The entire presentation/demo should revolve around one student.

### Student: Aarav

Aarav wants to learn **Ohm's Law**.

1. Aarav logs in.
2. Selects **Space** as an interest.
3. AURA shows his personalized learning path.
4. Resistance is identified as a weak prerequisite.
5. Ohm's Law remains locked.
6. Aarav practices Resistance.
7. AURA re-themes an example around Space.
8. Aarav enters the virtual lab.
9. Aarav makes repeated mistakes.
10. Struggle score rises to 84%.
11. AURA recommends intervention.
12. Facilitator sees Aarav in the intervention queue.
13. Teacher assigns a prerequisite refresher.
14. Aarav completes the refresher and lab.
15. Mastery rises.
16. Ohm's Law unlocks.
17. Facilitator sees the student move from high-risk to improving.

This should be the primary happy-path demo.

---

# 29. Judge-Facing Differentiation

If judges ask “What makes this different from ChatGPT or an LMS?”, answer:

> **AURA is not simply an AI tutor. It is an adaptive learning system with a prerequisite graph, mastery gating, measurable struggle detection, interest-based contextual re-theming, interactive learning experiences, and human-in-the-loop intervention.**

If asked about teachers:

> **AI detects and recommends; the teacher remains in control of intervention.**

If asked about AI hallucination:

> **Academic content is structured first. AI only changes the narrative layer, while validation protects the numbers, formulas, answer and learning objective.**

If asked about scalability:

> **The architecture separates curriculum, student state, adaptive decisions and content generation, allowing more subjects and grades to be added without redesigning the entire platform.**

---

# 30. 24-Hour Implementation Plan

## Hours 0–3

Foundation:

- project setup
- authentication
- database
- base UI
- routing

## Hours 3–7

Student experience:

- onboarding
- dashboard
- profile
- navigation
- curriculum graph

## Hours 7–11

Learning engine:

- topics
- prerequisites
- questions
- mastery
- difficulty

## Hours 11–15

Adaptive system:

- struggle detection
- recommendations
- intervention logic

## Hours 15–18

AI:

- re-theming
- explanations
- validation
- guardrails

## Hours 18–20

Virtual labs:

- integrate existing HTML labs
- record completion

## Hours 20–22

Facilitator:

- dashboard
- intervention queue
- student details
- intervention actions

## Hours 22–24

Finalization:

- responsive UI
- animations
- bug fixes
- seed demo data
- deployment
- presentation
- demo rehearsal

**Do not add major features during the final two hours.**

---

# 31. Definition of Done

The MVP is successful when a judge can:

### Student

1. Log in
2. Select interests
3. See personalized dashboard
4. Open learning path
5. See prerequisite status
6. Attempt questions
7. See adaptive difficulty
8. Experience AI re-theming
9. Open a virtual lab
10. Trigger a struggle state
11. Receive an intervention

### Facilitator

12. Log in
13. See class overview
14. See at-risk student
15. Understand why the student is struggling
16. Receive recommended action
17. Assign intervention
18. Mark intervention status
19. See student improvement

If these work reliably, the prototype is ready.

---

# 32. Claude Code Implementation Rules

Claude Code should follow these rules while implementing.

### Rule 1 — Do not over-engineer

Prefer the simplest reliable implementation.

### Rule 2 — Build the demo path first

The Aarav → Ohm's Law → struggle → intervention → mastery flow must work before optional features.

### Rule 3 — Reuse existing assets

Do not rebuild existing HTML virtual labs unnecessarily.

### Rule 4 — Avoid fake AI claims

If an AI feature is simulated for the prototype, structure the interface so the underlying architecture can be replaced by a real model.

### Rule 5 — No hardcoded UI-only demo

Demo data can be seeded, but core behavior must actually work.

### Rule 6 — Preserve academic correctness

AI must never alter the mathematical/academic core of a question.

### Rule 7 — Mobile/responsive first

The student experience should work well on laptop and mobile-sized screens.

### Rule 8 — Handle loading/error/empty states

No broken blank screens.

### Rule 9 — Keep components modular

Suggested structure:

```text
/components
  /student
  /facilitator
  /learning
  /curriculum
  /labs
  /ai
  /ui

/lib
  mastery.ts
  struggle.ts
  adaptive.ts
  ai.ts
  curriculum.ts

/app
  /student
  /facilitator
  /api
```

### Rule 10 — Test the critical path

Before final deployment, verify:

```text
Login
→ Dashboard
→ Learning Path
→ Topic
→ Question
→ Struggle
→ Intervention
→ Lab
→ Mastery Update
→ Unlock Next Topic
```

---

# 33. Final Product Statement

## AURA Learn

**Adaptive Understanding & Responsive Assistance**

> AURA Learn is an adaptive learning platform that continuously understands a student's mastery, pace, interests and learning behavior to create a personalized path toward the same academic outcome.

### The core differentiator:

> **AURA doesn't wait for students to fail. It identifies where they are struggling, adapts how they learn, and brings the right human intervention at the right time.**

### Final tagline:

> **Learn your way. Master at your pace.**
