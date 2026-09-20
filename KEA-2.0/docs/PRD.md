# Product Requirements Document (PRD)
## Project: KEA (Knowledge Elevation & Adaptation) — AI-Powered Topic-to-Mastery Adaptive Learning Platform
**Hackathon Target**: 24-Hour Hackathon MVP | Problem 01  
**Product Category**: Adaptive Learning & Real-Time Intervention Platform  
**Document Status**: Final Architecture Review Baseline  

---

## 1. Problem Statement & Platform Mission

### 1.1 The Core Educational Breakdown
In traditional instructional models, learning is paced by calendar schedules and rigid syllabi rather than demonstrated understanding. This creates compounding deficits across all domains:
1. **Hidden Prerequisite Gaps**: When a learner has not internalized foundational concepts, they are nevertheless pushed forward into advanced applications. Lacking prerequisites, they resort to superficial memorization or procedural guessing without conceptual comprehension.
2. **One-Size-Fits-All Pacing**: Learners absorb concepts at variable speeds. Slower paces often trigger anxiety and self-doubt, while fast learners disengage when held back by redundant drills.
3. **Facilitator Blindspots**: Mentors, coaches, and teachers managing large cohorts typically discover mastery failures only after summative exams or failed projects—far too late for low-friction remediation.
4. **Context Alienation**: Generic textbook exercises feel abstract, dry, and disconnected from the learner's intrinsic passions (e.g., space, technology, gaming, sports, storytelling).

### 1.2 The Platform Mission
**KEA is an AI-powered topic-to-mastery adaptive learning platform.**

The core interaction begins with an open question:
> **"What do you want to learn?"**

The learner enters any learning topic or goal (*e.g., "I want to learn Python", "I want to learn Calculus", "I want to learn Photosynthesis", "I want to learn Fractions"*).

KEA then transforms that goal into an individualized, structured path to mastery. The platform dynamically determines:
- **WHAT** to learn (topic decomposition into core concepts, prerequisites, and stages).
- **HOW** to learn it (multi-modal explanations, interactive sandboxes, and interest-aligned contextual narratives).
- **AT WHAT PACE** (dynamic interaction velocity with friendly rhythm indicators).
- **WHEN** to assess (stage milestones and diagnostic checkpoints).
- **WHEN** to remediate (prerequisite rerouting upon repeated struggle).
- **WHEN** to advance (strict mastery threshold verification).
- **WHEN** human intervention is needed (actionable briefs dispatched to facilitators).

---

## 2. Target Users & Learner Personas

KEA accommodates diverse learning styles, prior experience levels, and facilitator workflows.

### 2.1 Primary User: The Learner
Learners are defined by their individual cognitive context, prior knowledge, pacing needs, and personal interests—not by rigid age or school grade constraints.

**Learner Persona A: Aarav (Deliberate Explorer)**
- **Learner Context**: Creative, enthusiastic about narrative settings (space exploration, robotics), but experiences cognitive overload when confronted with abstract theory without concrete foundational models.
- **Pain Points**: Prone to superficial pattern-matching and procedural confusion when rushed. Freezes or guesses under arbitrary time limits.
- **Needs**: Visual representations, contextual narratives (e.g., space station fuel cells, rover navigation), low-stakes conversational checks, and gentle remediation when stuck.

**Learner Persona B: Diya (Accelerated Explorer)**
- **Learner Context**: Fast-paced, grasps structural relationships rapidly, disengages when forced to repeat redundant exercises.
- **Needs**: Accelerated pacing (*Falcon/Cheetah* cadence), rapid promotion across concepts once mastery is proven, and enrichment challenges.

### 2.2 Secondary User: The Facilitator / Learning Coach
**Facilitator Persona: Ms. Priya (Educator & Learning Coach)**
- **Context**: Dedicated mentor guiding a diverse group of learners. Wants to provide individualized support but lacks the time to manually audit every student's work step-by-step.
- **Pain Points**: Analytics dashboards that merely display red percentages without diagnosing *why* a learner is struggling or *what concrete 5-minute action* to take right now.
- **Needs**: A real-time triage feed highlighting who needs immediate human intervention, the specific diagnosed misconception, and a concrete pedagogical script or manipulative prompt to resolve it.

---

## 3. Primary User Flow: Topic-to-Mastery Journey

KEA is built around an open, 9-step topic-to-mastery adaptive learning pipeline:

```
1. TOPIC ENTRY ("What do you want to learn?")
     ↓
2. AI TOPIC UNDERSTANDING (Concept & Prerequisite Extraction)
     ↓
3. PREREQUISITE / DIAGNOSTIC CHECK (Required vs. Current Knowledge)
     ↓
4. PERSONALIZED STAGE-WISE PLAN (Foundations → Core → Applied → Mastery)
     ↓
5. INTERACTIVE LEARNING (Visual models, AI tutor, Contextual re-theming)
     ↓
6. AI MOCK TEST / MILESTONE (Objective, Written reasoning, Oral probe)
     ↓
7. DETERMINISTIC MASTERY CHECK (W-EMM Formula)
     ↓
8. ADAPTIVE PATH ROUTING (Advance / Scaffolding / Prerequisite Reroute / Facilitator Alert)
     ↓
9. TOPIC KNOWLEDGE GRAPH PROGRESSION & MASTERY
```

### 3.1 Step 1 — Topic Entry
- The experience begins with a clean, focused question:
  > **"What do you want to learn?"**
- A prominent central input accepts any topic or goal (*"e.g. Python, Photosynthesis, Fractions, Machine Learning, Calculus..."*) with the primary CTA: **"Generate Learning Path"**.
- Optional exploratory chips demonstrate versatility across domains without restricting learner intent.
- The platform does not assume a predefined chapter, grade, or static syllabus.

### 3.2 Step 2 — Topic Understanding
- Upon topic submission, KEA uses AI to parse the domain semantics and identify:
  1. Core concepts and constituent sub-concepts.
  2. Essential foundational prerequisites.
  3. Concept dependency hierarchy (DAG topology).
  4. Expected milestone outcomes and mastery definitions.

### 3.3 Step 3 — Prerequisite / Diagnostic Check
- Before launching into curriculum delivery, KEA determines the learner's baseline.
- Generates a lightweight, low-stakes diagnostic check to calibrate **Required Knowledge vs. Current Knowledge**.
- Example (*Topic: Python Programming*): Verifies basic logic and variables before assigning control flow stages.
- Example (*Topic: Quadratic Equations*): Verifies basic arithmetic and linear equations before assigning factoring stages.
- Accurately identifies existing proficiencies (to skip redundant material) and unaddressed foundational gaps.

### 3.4 Step 4 — Stage-Wise Learning Plan
- Synthesizes a structured, stage-wise learning path tailored to the specific domain (*e.g., Stage 1: Foundations, Stage 2: Core Concepts, Stage 3: Applied Problem Solving, Stage 4: Mastery*). Stage counts and names are dynamic and domain-dependent—never hardcoded.
- Each stage explicitly defines:
  - **Title & Objective**: What the learner aims to accomplish.
  - **Constituent Concepts**: Specific knowledge nodes in the stage.
  - **Prerequisites**: Strict requirements before entry.
  - **Learning Activities**: Multi-modal modalities (visual explanations, interactive sandboxes, contextual stories).
  - **Assessment / Milestone**: Checkpoint to evaluate readiness.
  - **Mastery Condition**: Concrete metric required to unlock subsequent stages.

### 3.5 Step 5 — Learning
- Defines the active "HOW" of learning tailored to the learner:
  - Conceptual explanations using plain language and progressive disclosure.
  - Interactive visual models and manipulative sandboxes.
  - Guided deliberate practice with immediate feedback.
  - Conversational AI tutor guidance.
  - Narrative framing aligned with learner-selected interests.

### 3.6 Step 6 — AI Mock Test / Milestone Assessment
- Following each stage or critical milestone, KEA delivers an AI-assisted multi-modal assessment:
  - Objective verification questions.
  - Step-by-step problem-solving scratchpad.
  - Written reasoning and justification.
  - Optional oral/conversational probe (*Web Speech API*).
- The assessment evaluates deep conceptual understanding, diagnoses latent misconceptions, and determines readiness for stage promotion.

### 3.7 Step 7 — AI Re-Theming & Personalization
- Learners choose or change their interest theme (*e.g., Space Exploration, Wildlife Safari, Master Chef, Superhero Academy*).
- The AI context engine re-themes problem narratives, analogies, and visual metaphors while strictly preserving academic and logical invariants (exact numbers, relationships, constraints, and answer keys).

### 3.8 Step 8 — Adaptive Path Routing
- Following assessment, KEA executes deterministic routing:
  - **Mastered ($\ge 80\%$)**: Advances learner to the next eligible concept/stage.
  - **Partially Understood ($60\% - 79\%$)**: Deploys targeted scaffolding and secondary practice items.
  - **Prerequisite Gap**: Reroutes learner back to the missing foundational prerequisite node.
  - **Repeated Struggle ($\ge 2$ consecutive failures)**: Triggers remediation path and dispatches an Actionable Intervention Brief to the Facilitator Dashboard.
  - **Strong Prior Knowledge**: Compresses or skips already-mastered concepts, respecting the learner's time.

### 3.9 Step 9 — Topic Knowledge Graph
- The learner and facilitator are provided a visual, interactive representation of the generated topic graph:
  - Topic root and stage milestones.
  - Individual concept nodes and prerequisite dependency edges.
  - Real-time node states (*Mastered, In Progress, Available/Unlocked, Locked/Gated*).
  - Remediation loops and dynamic pacing indicators.
  - The graph serves as a functional navigation and transparent progress tracker, not merely decorative art.

---

## 4. Dynamic Topic & Knowledge Graph Architecture

KEA treats all educational subjects through a universal, topic-agnostic Knowledge Graph model.

### 4.1 Generic Topic Model Concepts
- **Learning Goal / Topic**: The high-level intent entered by the learner (*e.g., "Python Programming", "Cellular Biology", "Calculus"*).
- **Concept Node**: An atomic, demonstrable unit of knowledge with clear learning objectives and evaluation criteria.
- **Prerequisite Dependency**: A directional edge ($A \rightarrow B$) indicating that Concept $A$ must reach verified mastery before Concept $B$ can be unlocked.
- **Topological Stage**: A group of concepts sharing compatible prerequisite depths, structured sequentially from Foundations to Capstone Mastery.
- **Learner Knowledge State**: A dynamic mapping of each concept node to its current mastery status (`locked`, `unlocked`, `in_progress`, `mastered`, `remediation`).

### 4.2 Division of System Responsibilities

| Subsystem | AI Responsibilities (Generative / Semantic) | Deterministic Logic Responsibilities (Auditable / Invariant) |
|---|---|---|
| **Topic Deconstruction** | Semantically parses user prompt; extracts candidate concepts, prerequisites, and milestone descriptions. | Validates graph for cycles (DAG); ensures topological validity via Kahn's algorithm. |
| **Prerequisite Gating** | Synthesizes diagnostic questions to test prerequisite candidates. | Enforces strict lock/unlock state transitions; cannot unlock node unless all parent prerequisites $\ge 80\%$. |
| **Learning & Explanations** | Generates tailored analogies, progressive disclosures, and interactive examples. | Serves validated activity templates and maintains interaction state. |
| **Context Re-theming** | Adapts narrative framing to learner interests (Space, Safari, Chef, etc.). | Validates mathematical/logical invariants; rejects re-themed items if numbers or answer keys deviate. |
| **Assessment & Evaluation** | Evaluates free-text written reasoning and speech transcripts; extracts qualitative misconceptions. | Calculates numerical mastery via Weighted Exponential Moving Mastery (W-EMM); scores objective answers. |
| **Path Adaptation** | Suggests remedial focus areas and crafts facilitator intervention dialogues. | Enforces struggle trigger rules ($\ge 2$ consecutive failures); routes learner back to prerequisite node. |

---

## 5. Core Features & Functional Requirements

### 5.1 Dynamic Curriculum & Knowledge Graph Progression
- **Requirement 5.1.1 (Graph-Enforced Gating)**: A learner cannot attempt a node unless all parent prerequisite nodes have met the minimum mastery threshold ($\ge 80\%$).
- **Requirement 5.1.2 (Branching & Remediation)**: If a learner fails a node repeatedly ($\ge 2$ consecutive failed evaluations), the system automatically unlocks a remedial sub-node or reverts active focus to the weakest prerequisite ancestor node.

### 5.2 Triangulated Multi-Modal Assessment
- **Requirement 5.2.1 (Practice Items)**: Rapid-fire objective questions and interactive visual/numeric input with instant validation.
- **Requirement 5.2.2 (Written / Step-by-Step Questions)**: Structured multi-step breakdown evaluating intermediate reasoning steps.
- **Requirement 5.2.3 (AI-Assisted Oral Probe)**: Short 1–2 question conversational check where the learner explains reasoning in their own words via voice (Web Speech API) or text. An LLM evaluates conceptual understanding vs procedural guessing.

### 5.3 Deterministic Mastery & Adaptive Pace Engine
- **Requirement 5.3.1 (Deterministic Auditability)**: Mastery is calculated using a transparent Weighted Exponential Moving Mastery (W-EMM) formula combining weighted assessment evidence ($w_P=0.25, w_W=0.35, w_O=0.40$). It is never an opaque or hallucinated score.
- **Requirement 5.3.2 (Pace as Dynamic Rhythm)**: Learners receive friendly, dynamic pace indicators (*Sloth / Careful Panda* for deliberate explorer, *Cheetah* for steady rhythm, *Falcon* for rapid acceleration).
- **Requirement 5.3.3 (Non-Labeling Invariant)**: Pace indicators strictly reflect current interaction velocity; they are recomputed continuously and never act as permanent ability tracking.

### 5.4 AI Context Re-Theming with Invariant Preservation
- **Requirement 5.4.1 (Interest Themes)**: Learners can choose among engaging themes (e.g., Space Exploration, Wildlife Safari, Master Chef, Superhero Academy).
- **Requirement 5.4.2 (Invariant Lock)**: The re-theming pipeline modifies only narrative setting and framing. It strictly preserves:
  - Academic learning objective
  - Exact numerical values and core parameters
  - Logical constraints and equations
  - Correct answer keys
  - A programmatic post-check verifies invariant preservation before rendering to the learner.

### 5.5 Actionable Facilitator Cockpit & Interventions
- **Requirement 5.5.1 (Real-Time Triage Feed)**: Displays learners ranked by urgency of intervention.
- **Requirement 5.5.2 (Prescriptive Remediation Brief)**: Generates human-in-the-loop recommendations with 3 components:
  1. Identified root-cause misconception.
  2. Concrete pedagogical activity or manipulative prompt.
  3. A 2-minute dialogue script for the facilitator.
- **Requirement 5.5.3 (One-Click Status Lifecycle)**: Facilitators can mark interventions `Pending` $\rightarrow$ `Acknowledged` $\rightarrow$ `Resolved`.

---

## 6. Success Criteria

| ID | Metric | Target for Platform Demonstration |
|---|---|---|
| **SC-01** | **End-to-End Loop Time** | Complete loop (Topic Entry $\rightarrow$ Diagnostic $\rightarrow$ Stage Plan $\rightarrow$ Adaptation $\rightarrow$ Struggle $\rightarrow$ Intervention $\rightarrow$ Remediation) demonstrated in $< 5$ minutes. |
| **SC-02** | **Deterministic Integrity** | 100% of node progression, locks, and mastery state driven by deterministic code and DAG checks. |
| **SC-03** | **Invariant Preservation** | 0% numerical, logical, or key discrepancy in AI re-themed questions vs canonical templates. |
| **SC-04** | **Actionable Interventions** | 100% of generated interventions contain concrete physical/verbal teaching instructions, not raw stats. |
| **SC-05** | **Offline/Fallback Resilience** | The platform runs smoothly with zero crashes even if the external LLM API is throttled or offline (via built-in fallback engine). |

---

## 7. Explicit Non-Goals & Architectural Boundaries

To maintain focus and engineering excellence, the following items are strictly out of scope:
1. **Hardcoded Fixed Curricula**: KEA does not constrain itself to a single hardcoded textbook chapter or fixed grade syllabus; topic curricula are generated and mapped dynamically.
2. **Generative Video / Heavy Diffusion APIs**: No mid-session video generation or heavy diffusion models that add latency and unreliability. Visuals use structured SVG, CSS models, and Lucide iconography.
3. **Heavy Native Mobile Apps**: No React Native or Flutter builds. A responsive, mobile-friendly web application running on Next.js is the single target.
4. **Complex External Python Services**: No secondary FastAPI / Flask / Celery backend. All deterministic calculations and AI gateway abstractions run within the Next.js TypeScript runtime.
5. **Multi-Tenant Enterprise Administration**: No complex district admin roles, billing portals, or state compliance exports.
6. **Open Knowledge Format Standardization**: No premature integration with external semantic ontologies (e.g., QTI, IMS Global). Knowledge graph nodes are stored in clean relational structures.
