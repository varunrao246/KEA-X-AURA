/**
 * KEA Platform — Deterministic Fallback Provider
 * 
 * Provides offline/resilient pedagogical learning artifacts, mock test generation,
 * semantic evaluation heuristics, and multi-turn interview progression when real
 * LLM API keys are absent or external services are unreachable.
 * 
 * 100% topic-aware: dynamically extracts topic from prompts and synthesizes
 * topic-specific curriculum, questions, code examples, and explanations
 * without leaking chemistry into non-chemistry subjects.
 */

import { z } from "zod";
import { AIProvider, GenerationOptions, ProviderHealthResult, ProviderType } from "./ai-provider";
import {
  GeneratedLearningContent,
  GeneratedMockTest,
  AssessmentEvaluation,
  InterviewTurnEvaluation,
  InterviewSummary,
  RemediationPlan,
} from "./schemas";

export type DetectedTopicKind = "python" | "calculus" | "photosynthesis" | "chemistry" | "general";

export interface DetectedTopicInfo {
  kind: DetectedTopicKind;
  displayName: string;
  conceptTitle?: string;
  conceptId?: string;
  stageNumber?: number;
}

export function detectTopicFromPrompt(prompt: string): DetectedTopicInfo {
  const p = prompt.toLowerCase();

  // 1. Explicit Topic: "..." or Topic: ...
  let explicitTopic = "";
  const topicMatch = prompt.match(/Topic:\s*["']?([^"'\n\r\(\);,]+)["']?/i);
  if (topicMatch && topicMatch[1]) {
    explicitTopic = topicMatch[1].trim();
  }

  // 2. Explicit Stage
  let stageNumber: number | undefined;
  const stageMatch = prompt.match(/(?:Stage|Current Stage):\s*(\d+)/i);
  if (stageMatch && stageMatch[1]) {
    stageNumber = parseInt(stageMatch[1], 10);
  }

  // 3. Target Concept Title / ID
  let conceptTitle: string | undefined;
  const conceptTitleMatch = prompt.match(/Target Concept Title:\s*["']?([^"'\n\r]+)["']?/i);
  if (conceptTitleMatch && conceptTitleMatch[1]) {
    conceptTitle = conceptTitleMatch[1].trim();
  }

  let conceptId: string | undefined;
  const conceptIdMatch = prompt.match(/Target Concept ID:\s*["']?([^"'\n\r]+)["']?/i);
  if (conceptIdMatch && conceptIdMatch[1]) {
    conceptId = conceptIdMatch[1].trim();
  }

  if (explicitTopic) {
    const etLower = explicitTopic.toLowerCase();
    if (etLower.includes("python") || etLower.includes("programming") || etLower.includes("coding")) {
      return { kind: "python", displayName: explicitTopic, conceptTitle, conceptId, stageNumber };
    }
    if (etLower.includes("calculus") || etLower.includes("derivative") || etLower.includes("integral") || etLower.includes("calc")) {
      return { kind: "calculus", displayName: explicitTopic, conceptTitle, conceptId, stageNumber };
    }
    if (etLower.includes("photosynthesis") || etLower.includes("chloroplast") || etLower.includes("plant biology")) {
      return { kind: "photosynthesis", displayName: explicitTopic, conceptTitle, conceptId, stageNumber };
    }
    if (
      etLower.includes("organic chemistry") ||
      etLower.includes("chemistry") ||
      etLower.includes("carbon") ||
      etLower.includes("hydrocarbon") ||
      etLower.includes("alkene") ||
      etLower.includes("alkane") ||
      etLower.includes("isomer")
    ) {
      return { kind: "chemistry", displayName: explicitTopic, conceptTitle, conceptId, stageNumber };
    }
    return { kind: "general", displayName: explicitTopic, conceptTitle, conceptId, stageNumber };
  }

  // Fallback to keyword inspection when explicit Topic: is absent
  if (p.includes("python") || (p.includes("def ") && p.includes("list")) || (p.includes("mutable") && p.includes("tuple"))) {
    return { kind: "python", displayName: "Python Programming", conceptTitle, conceptId, stageNumber };
  }
  if (p.includes("calculus") || p.includes("derivative") || p.includes("integral") || (p.includes("limit") && p.includes("rate of change"))) {
    return { kind: "calculus", displayName: "Calculus", conceptTitle, conceptId, stageNumber };
  }
  if (p.includes("photosynthesis") || p.includes("chlorophyll") || p.includes("calvin cycle") || p.includes("thylakoid")) {
    return { kind: "photosynthesis", displayName: "Photosynthesis", conceptTitle, conceptId, stageNumber };
  }
  if (
    p.includes("organic chemistry") ||
    p.includes("chemistry") ||
    p.includes("catalytic hydrogenation") ||
    p.includes("catalyst") ||
    p.includes("reactants") ||
    p.includes("platinum surface") ||
    p.includes("activation barrier") ||
    p.includes("ethene") ||
    p.includes("alkene") ||
    p.includes("alkane") ||
    p.includes("stereoisomer") ||
    p.includes("functional group") ||
    p.includes("sp3") ||
    p.includes("valence electron") ||
    p.includes("covalent architecture")
  ) {
    return { kind: "chemistry", displayName: "Organic Chemistry", conceptTitle, conceptId, stageNumber };
  }

  return { kind: "general", displayName: "General Knowledge", conceptTitle, conceptId, stageNumber };
}

export class FallbackProvider implements AIProvider {
  public readonly id: ProviderType = "fallback";
  public readonly displayName = "KEA Local Curriculum Engine (Fallback)";
  public readonly modelName = "kea-deterministic-v1";

  public isConfigured(): boolean {
    return true; // Always available offline
  }

  public async healthCheck(): Promise<ProviderHealthResult> {
    return {
      provider: this.id,
      configured: true,
      reachable: true,
      model: this.modelName,
      structuredOutputWorking: true,
      latencyMs: 1,
    };
  }

  public async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    const maxChars = options?.maxTokens ? options.maxTokens * 4 : 100;
    return `[KEA Deterministic Engine Response] Processing: ${prompt.slice(0, maxChars)}...`;
  }

  public async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: GenerationOptions
  ): Promise<T> {
    const taskType = options?.taskType || this.inferTaskType(prompt);

    let result: unknown;

    switch (taskType) {
      case "learning":
        if (prompt.toLowerCase().includes("re-theme") || prompt.toLowerCase().includes("passion theme")) {
          result = this.generateFallbackRethemedQuestion(prompt);
        } else {
          result = this.generateFallbackLearningContent(prompt);
        }
        break;
      case "mock_test":
        result = this.generateFallbackMockTest(prompt);
        break;
      case "evaluation":
        result = this.generateFallbackEvaluation(prompt);
        break;
      case "interview":
        if (prompt.includes("summary") || prompt.includes("conclude") || prompt.includes("final evaluation")) {
          result = this.generateFallbackInterviewSummary(prompt);
        } else {
          result = this.generateFallbackInterviewTurn(prompt);
        }
        break;
      default:
        result = this.generateFallbackLearningContent(prompt);
        break;
    }

    // Validate with provided Zod schema
    const parsed = schema.safeParse(result);
    if (!parsed.success) {
      // If the direct mock didn't match the exact schema, attempt alternate mocks with prompt context
      const altRetheme = schema.safeParse(this.generateFallbackRethemedQuestion(prompt));
      if (altRetheme.success) return altRetheme.data;

      const altSummary = schema.safeParse(this.generateFallbackInterviewSummary(prompt));
      if (altSummary.success) return altSummary.data;

      const altEval = schema.safeParse(this.generateFallbackEvaluation(prompt));
      if (altEval.success) return altEval.data;

      const altTest = schema.safeParse(this.generateFallbackMockTest(prompt));
      if (altTest.success) return altTest.data;

      const altRemediation = schema.safeParse(this.generateFallbackRemediation(prompt));
      if (altRemediation.success) return altRemediation.data;

      const altTopicPlan = schema.safeParse(this.generateFallbackTopicPlan(prompt));
      if (altTopicPlan.success) return altTopicPlan.data;

      const altOpening = schema.safeParse(this.generateFallbackOpeningQuestion(prompt));
      if (altOpening.success) return altOpening.data;

      throw new Error(`Fallback output failed schema validation: ${parsed.error.message}`);
    }

    return parsed.data;
  }

  private inferTaskType(prompt: string): "learning" | "mock_test" | "evaluation" | "interview" {
    const p = prompt.toLowerCase();
    if (p.includes("interview") || p.includes("interviewer") || p.includes("transcript") || p.includes("follow-up")) {
      return "interview";
    }
    if (p.includes("mock test") || p.includes("exam") || (p.includes("questions") && p.includes("rubric"))) {
      return "mock_test";
    }
    if (p.includes("evaluate") || p.includes("grading") || p.includes("rubric hits")) {
      return "evaluation";
    }
    return "learning";
  }

  public generateFallbackRethemedQuestion(prompt: string) {
    const isWildlife = prompt.toLowerCase().includes("wildlife");
    const isChef = prompt.toLowerCase().includes("chef");
    const isSuperhero = prompt.toLowerCase().includes("superhero");

    if (isWildlife) {
      return {
        thematicContext: "Serengeti Wildlife Safari Waterhole",
        questionText:
          "The Lion Pride drank 3/8 of the water trough, while the Elephant Herd drank 5/8 of the water trough. Which animal group drank less water?",
        options: [
          { id: "opt-1", text: "The Lion Pride drank more than the Elephant Herd (3/8 > 5/8)", isCorrect: false },
          { id: "opt-2", text: "The Lion Pride drank less than the Elephant Herd (3/8 < 5/8)", isCorrect: true },
          { id: "opt-3", text: "Both groups drank equal water (3/8 = 5/8)", isCorrect: false },
          { id: "opt-4", text: "They cannot be compared because the denominators are the same", isCorrect: false },
        ],
      };
    }
    if (isChef) {
      return {
        thematicContext: "Junior Chef Cupcake Bakery",
        questionText:
          "Chef Leo needs 3/8 cup of sugar for Vanilla Frosting, and 5/8 cup of sugar for Chocolate Frosting. Which frosting uses less sugar?",
        options: [
          { id: "opt-1", text: "Vanilla Frosting uses more sugar than Chocolate (3/8 > 5/8)", isCorrect: false },
          { id: "opt-2", text: "Vanilla Frosting uses less sugar than Chocolate (3/8 < 5/8)", isCorrect: true },
          { id: "opt-3", text: "Both frostings use equal sugar (3/8 = 5/8)", isCorrect: false },
          { id: "opt-4", text: "They cannot be compared because the denominators are the same", isCorrect: false },
        ],
      };
    }
    if (isSuperhero) {
      return {
        thematicContext: "Superhero Academy Energy Shields",
        questionText:
          "Laser Shield Alpha is charged to 3/8 power, while Laser Shield Beta is charged to 5/8 power. Which shield has less power?",
        options: [
          { id: "opt-1", text: "Shield Alpha has more energy than Beta (3/8 > 5/8)", isCorrect: false },
          { id: "opt-2", text: "Shield Alpha has less energy than Beta (3/8 < 5/8)", isCorrect: true },
          { id: "opt-3", text: "Both shields have equal energy (3/8 = 5/8)", isCorrect: false },
          { id: "opt-4", text: "They cannot be compared because the denominators are the same", isCorrect: false },
        ],
      };
    }
    return {
      thematicContext: "Commander Leo's Starship Fuel Tanks",
      questionText:
        "Starship Pod Alpha has 3/8 of a tank remaining, while Pod Beta has 5/8 of a tank remaining. Which statement correctly compares the fuel pods?",
      options: [
        { id: "opt-1", text: "Pod Alpha has more fuel than Beta (3/8 > 5/8)", isCorrect: false },
        { id: "opt-2", text: "Pod Alpha has less fuel than Beta (3/8 < 5/8)", isCorrect: true },
        { id: "opt-3", text: "Both pods have equal fuel (3/8 = 5/8)", isCorrect: false },
        { id: "opt-4", text: "They cannot be compared because the denominators are the same", isCorrect: false },
      ],
    };
  }

  // =========================================================================
  // 1. LEARNING CONTENT GENERATION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackLearningContent(prompt: string): GeneratedLearningContent {
    const topicInfo = detectTopicFromPrompt(prompt);
    const p = prompt.toLowerCase();

    // -----------------------------------------------------------------------
    // PYTHON PROGRAMMING
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "python") {
      const isLoopsOrFunctions = p.includes("function") || p.includes("loop") || topicInfo.stageNumber === 2;
      const isDataStructures = p.includes("dictionary") || p.includes("list") || topicInfo.stageNumber === 3;

      if (isLoopsOrFunctions) {
        return {
          conceptId: topicInfo.conceptId || "concept_py_functions",
          conceptTitle: topicInfo.conceptTitle || "Functions, Scope & Control Flow",
          personalizedExplanation:
            "In Python, functions are first-class citizens that encapsulate reusable logic and define local variable namespaces. When a function executes, Python creates a local execution frame on the call stack. Variables defined inside this frame resolve via the LEGB rule (Local, Enclosing, Global, Built-in), preventing unintended modifications to outer variables while enabling clean procedural decomposition.",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Define function signature with explicit parameters and docstring",
              reasoning: "Functions declare formal parameters that bind to positional or keyword arguments upon invocation.",
            },
            {
              stepNumber: 2,
              action: "Execute loop iterations and accumulate return values locally",
              reasoning: "Local accumulator variables remain isolated within the local function frame, avoiding global pollution.",
            },
            {
              stepNumber: 3,
              action: "Return transformed result to the caller",
              reasoning: "The return statement pops the frame off the stack and passes the object reference back to the caller.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Using a mutable object (like a list or dict) as a default parameter in function definitions.",
            howToAvoid: "Default arguments are evaluated once at definition time, not at invocation. Use None as default and initialize inside.",
          },
          practiceQuestion: {
            id: "pq_py_functions_1",
            prompt: "What occurs when a Python function specifies a mutable default argument such as `def append_item(val, target=[])` across multiple calls?",
            options: [
              "The same list instance is shared across all function calls, accumulating modifications",
              "A fresh empty list is instantiated every time the function is called",
              "Python raises a SyntaxError during module compilation",
              "The list is automatically frozen into an immutable tuple",
            ],
            correctOptionIndex: 0,
            explanation: "Default parameter values are bound when the function definition is executed, so mutable objects are shared across subsequent invocations.",
            difficulty: "intermediate",
          },
          hint: "Consider when Python evaluates default arguments: at function definition time or each time it is called?",
          stretchChallenge: "Rewrite the function using the `target=None` sentinel pattern and explain why this isolates state.",
          recommendedNextStep: "Analyze variable closures and higher-order decorators.",
        };
      }

      if (isDataStructures) {
        return {
          conceptId: topicInfo.conceptId || "concept_py_datastructures",
          conceptTitle: topicInfo.conceptTitle || "Data Structures: Lists, Dictionaries & Tuples",
          personalizedExplanation:
            "Python collections provide distinct operational trade-offs based on their internal memory structures. Lists are dynamic arrays offering O(1) random indexed access but O(n) element search. In contrast, dictionaries and sets are implemented as open-addressing hash tables, providing average O(1) lookup, insertion, and deletion by hashing keys into bucket indices.",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Select appropriate collection type based on access pattern",
              reasoning: "Use dictionaries when key-value association and constant-time key lookup are paramount.",
            },
            {
              stepNumber: 2,
              action: "Hash key object using built-in hash() function",
              reasoning: "Python requires dictionary keys to be hashable and immutable, ensuring stable hash codes.",
            },
            {
              stepNumber: 3,
              action: "Resolve collision via open addressing perturbation sequence",
              reasoning: "Internal hash buckets handle collisions deterministically without corrupting mappings.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Attempting to use a mutable list as a dictionary key or set element.",
            howToAvoid: "Dictionary keys must be hashable. Use immutable tuples instead of lists when composite keys are needed.",
          },
          practiceQuestion: {
            id: "pq_py_collections_1",
            prompt: "Why does membership testing with `x in my_collection` run significantly faster on a Python set than on a Python list for large datasets?",
            options: [
              "Sets use hash tables offering O(1) average lookup, whereas lists require O(n) sequential scans",
              "Sets are stored in CPU registers while lists reside on disk",
              "Lists sort their elements before searching, adding O(n log n) overhead",
              "Sets automatically compress elements into binary trees",
            ],
            correctOptionIndex: 0,
            explanation: "Sets compute the hash of the target element to probe the hash table in O(1) average time, avoiding the linear traversal of lists.",
            difficulty: "intermediate",
          },
          hint: "Think about the algorithmic difference between checking every element in an array versus computing an index from a hash key.",
          stretchChallenge: "Explain what happens when two different keys produce the identical hash in a Python dictionary and how collision resolution operates.",
          recommendedNextStep: "Implement custom collection classes using collections.abc protocols.",
        };
      }

      // Default Python: Variables & Memory Model
      return {
        conceptId: topicInfo.conceptId || "concept_py_memory",
        conceptTitle: topicInfo.conceptTitle || "Variables, Object References & Mutability",
        personalizedExplanation:
          "In Python, variables do not store raw data values directly in fixed memory locations; instead, variables are named references bound to objects in heap memory. This distinguishes mutable collections like lists, where internal elements can be altered in place without changing object identity, from immutable types like integers, strings, and tuples, where any modification generates an entirely new object with a distinct id.",
        workedExamples: [
          {
            stepNumber: 1,
            action: "Bind a variable identifier to an initial list object: `a = [10, 20]`",
            reasoning: "Python allocates a list object in heap memory and assigns its pointer reference to the name `a`.",
          },
          {
            stepNumber: 2,
            action: "Create a reference alias: `b = a` and append: `b.append(30)`",
            reasoning: "Both names `a` and `b` reference the identical underlying heap object, so mutating `b` reflects in `a`.",
          },
          {
            stepNumber: 3,
            action: "Verify object identity with `id(a) == id(b)` or `a is b`",
            reasoning: "The identity operator `is` verifies whether both pointers target the exact same heap memory address.",
          },
        ],
        misconceptionAlert: {
          commonPitfall: "Assuming variable assignment (`b = a`) creates an independent duplicate copy of a list.",
          howToAvoid: "Assignment copies references, not objects. Use `b = a.copy()` or `list(a)` for a shallow clone.",
        },
        practiceQuestion: {
          id: "pq_py_memory_1",
          prompt: "What is the output of the following Python code?\n```python\nx = [1, 2]\ny = x\ny.append(3)\nprint(len(x))\n```",
          options: ["3", "2", "1", "Raises AttributeError"],
          correctOptionIndex: 0,
          explanation: "Because lists are mutable and assignment binds `y` to the same object as `x`, appending to `y` modifies `x`, making its length 3.",
          difficulty: "foundational",
        },
        hint: "Remember that assignment in Python copies the pointer reference, not the underlying array.",
        stretchChallenge: "Contrast shallow copying via `list.copy()` with deep copying via `copy.deepcopy()` for nested lists.",
        recommendedNextStep: "Explore function parameter passing and object lifetime with reference counting.",
      };
    }

    // -----------------------------------------------------------------------
    // CALCULUS
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "calculus") {
      const isIntegrals = p.includes("integral") || p.includes("area") || topicInfo.stageNumber === 4;

      if (isIntegrals) {
        return {
          conceptId: topicInfo.conceptId || "concept_calc_integrals",
          conceptTitle: topicInfo.conceptTitle || "Definite Integrals & Fundamental Theorem of Calculus",
          personalizedExplanation:
            "Integration represents the continuous summation of infinitesimal quantities to measure accumulation, area under curves, and net change. The Fundamental Theorem of Calculus bridges differential and integral calculus by proving that differentiation and integration are inverse operations: evaluating a definite integral of a continuous rate function from a to b equals the net difference in its antiderivative F(b) - F(a).",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Partition domain [a, b] into n subintervals of width dx",
              reasoning: "Constructing Riemann sums approximates total accumulation through discrete rectangle heights f(x_i).",
            },
            {
              stepNumber: 2,
              action: "Take the limit as rectangle width dx approaches zero",
              reasoning: "The limit of the Riemann sum defines the exact Riemann integral as continuous accumulation.",
            },
            {
              stepNumber: 3,
              action: "Evaluate net change via antiderivative F(x)",
              reasoning: "Applying FTC Part 2 computes the exact accumulated quantity without calculating infinite limits.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Confusing definite integrals (numerical values) with indefinite integrals (families of functions).",
            howToAvoid: "Definite integrals evaluate over bounds [a, b] to yield a scalar net value; indefinite integrals require the constant + C.",
          },
          practiceQuestion: {
            id: "pq_calc_integrals_1",
            prompt: "What is the definite integral of f(x) = 2x from x = 1 to x = 4?",
            options: ["15", "16", "14", "8"],
            correctOptionIndex: 0,
            explanation: "The antiderivative of 2x is x^2. Evaluating F(4) - F(1) = 4^2 - 1^2 = 16 - 1 = 15.",
            difficulty: "intermediate",
          },
          hint: "Find the antiderivative of 2x using the reverse power rule, then evaluate F(4) - F(1).",
          stretchChallenge: "Explain geometrically why the integral of an odd function f(-x) = -f(x) over symmetric bounds [-a, a] is always 0.",
          recommendedNextStep: "Investigate integration by substitution and integration by parts.",
        };
      }

      // Default Calculus: Derivatives & Rates of Change
      return {
        conceptId: topicInfo.conceptId || "concept_calc_derivatives",
        conceptTitle: topicInfo.conceptTitle || "Derivatives as Instantaneous Rates of Change",
        personalizedExplanation:
          "In calculus, the derivative represents the instantaneous rate of change of a function. Rather than measuring the average slope over a finite interval between two points (a secant line), the derivative takes the limit of the difference quotient as the interval h approaches zero, yielding the exact slope of the tangent line to the curve at a single point.",
        workedExamples: [
          {
            stepNumber: 1,
            action: "Formulate the difference quotient: `[f(x + h) - f(x)] / h` for `f(x) = x^2`",
            reasoning: "This quotient calculates the average slope across the secant line over interval h.",
          },
          {
            stepNumber: 2,
            action: "Expand numerator algebraically: `[(x^2 + 2xh + h^2) - x^2] / h = (2xh + h^2) / h = 2x + h`",
            reasoning: "Simplifying eliminates the indeterminate zero denominator before limit evaluation.",
          },
          {
            stepNumber: 3,
            action: "Evaluate the limit as `h -> 0`: `lim (2x + h) = 2x`",
            reasoning: "As h shrinks to zero, secant slope converges to the exact tangent slope 2x.",
          },
        ],
        misconceptionAlert: {
          commonPitfall: "Treating the limit ratio 0/0 as undefined division rather than an indeterminate form.",
          howToAvoid: "0/0 indicates that algebraic cancellation or analytical limits must be applied to reveal the true rate.",
        },
        practiceQuestion: {
          id: "pq_calc_derivatives_1",
          prompt: "What is the derivative of f(x) = 3x^2 + 5x - 7 with respect to x?",
          options: ["6x + 5", "3x + 5", "6x - 7", "6x^2 + 5"],
          correctOptionIndex: 0,
          explanation: "Applying the power rule d/dx(x^n) = n*x^(n-1) gives d/dx(3x^2) = 6x, d/dx(5x) = 5, and d/dx(-7) = 0.",
          difficulty: "foundational",
        },
        hint: "Apply the power rule term-by-term and recall that the derivative of a constant is 0.",
        stretchChallenge: "Use the product rule to derive the derivative of `f(x) = x^2 * sin(x)` and interpret its rate behavior.",
        recommendedNextStep: "Study the Chain Rule for composite functions and implicit differentiation.",
      };
    }

    // -----------------------------------------------------------------------
    // PHOTOSYNTHESIS
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "photosynthesis") {
      const isCalvin = p.includes("calvin") || p.includes("stroma") || p.includes("rubisco") || topicInfo.stageNumber === 3;

      if (isCalvin) {
        return {
          conceptId: topicInfo.conceptId || "concept_photo_calvin",
          conceptTitle: topicInfo.conceptTitle || "The Calvin Cycle & Carbon Fixation",
          personalizedExplanation:
            "The Calvin cycle occurs in the stroma of chloroplasts and constitutes the light-independent phase of photosynthesis. It consumes the ATP and NADPH produced during the light reactions to fix atmospheric carbon dioxide (CO2) into high-energy triose phosphate sugars (G3P). The process is catalyzed by the enzyme RuBisCO through three core phases: carbon fixation, reduction, and regeneration of ribulose-1,5-bisphosphate (RuBP).",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Fix inorganic CO2 onto 5-carbon RuBP via RuBisCO",
              reasoning: "The 6-carbon intermediate immediately splits into two molecules of 3-phosphoglycerate (3-PGA).",
            },
            {
              stepNumber: 2,
              action: "Reduce 3-PGA to G3P using NADPH and ATP",
              reasoning: "ATP provides phosphorylation energy and NADPH donates high-energy electrons.",
            },
            {
              stepNumber: 3,
              action: "Regenerate RuBP starting substrate using additional ATP",
              reasoning: "For every 6 G3P produced, 1 net G3P exits for glucose synthesis while 5 G3P regenerate 3 RuBP.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Believing the 'dark reactions' exclusively occur at night in darkness.",
            howToAvoid: "The Calvin cycle is light-independent in mechanism, but requires continuous ATP and NADPH produced by active light reactions.",
          },
          practiceQuestion: {
            id: "pq_photo_calvin_1",
            prompt: "What is the critical enzyme responsible for fixing atmospheric CO2 onto RuBP in the Calvin cycle?",
            options: ["RuBisCO", "ATP Synthase", "DNA Polymerase", "Amylase"],
            correctOptionIndex: 0,
            explanation: "RuBisCO (ribulose-1,5-bisphosphate carboxylase-oxygenase) catalyzes the primary carbon fixation reaction.",
            difficulty: "intermediate",
          },
          hint: "It is widely considered the most abundant enzyme on Earth.",
          stretchChallenge: "Explain why high temperatures cause RuBisCO to bind oxygen instead of CO2, leading to photorespiration.",
          recommendedNextStep: "Analyze C4 and CAM plant adaptations that concentrate CO2 around RuBisCO.",
        };
      }

      // Default Photosynthesis: Light-Dependent Reactions
      return {
        conceptId: topicInfo.conceptId || "concept_photo_light",
        conceptTitle: topicInfo.conceptTitle || "Photochemical Excitation & Light-Dependent Reactions",
        personalizedExplanation:
          "Photosynthesis converts solar photon energy into chemical bond energy within chloroplasts. In the thylakoid membrane, photon absorption by chlorophyll excites electrons to higher orbital states within Photosystem II and I. These electrons traverse an electron transport chain, pumping protons into the thylakoid lumen to create a chemiosmotic gradient that drives ATP synthase and reduces NADP+ to NADPH, while water photolysis replenishes electrons and releases molecular oxygen.",
        workedExamples: [
          {
            stepNumber: 1,
            action: "Photon excites P680 reaction center in Photosystem II",
            reasoning: "Light energy excites valence electrons to a high-energy electron acceptor.",
          },
          {
            stepNumber: 2,
            action: "Photolysis splits water: `2H2O -> 4H+ + 4e- + O2`",
            reasoning: "Electrons from water replenish PSII, releasing oxygen gas as a biological byproduct.",
          },
          {
            stepNumber: 3,
            action: "Chemiosmotic proton motive force drives ATP synthesis",
            reasoning: "Protons flowing from the lumen back into the stroma through ATP synthase phosphorylate ADP to ATP.",
          },
        ],
        misconceptionAlert: {
          commonPitfall: "Assuming the oxygen released during photosynthesis comes from carbon dioxide (CO2).",
          howToAvoid: "Isotopic tracer experiments confirm that all byproduct O2 originates exclusively from water photolysis (H2O).",
        },
        practiceQuestion: {
          id: "pq_photo_light_1",
          prompt: "What is the immediate source of replacement electrons for Photosystem II during light-dependent reactions?",
          options: [
            "Photolysis of water molecules (H2O)",
            "Carbon dioxide (CO2)",
            "Glucose (C6H12O6)",
            "NADPH oxidation",
          ],
          correctOptionIndex: 0,
          explanation: "Water splitting at the oxygen-evolving complex of PSII supplies replacement electrons and generates O2.",
          difficulty: "intermediate",
        },
        hint: "Consider which molecule is cleaved to generate the oxygen gas we breathe.",
        stretchChallenge: "Trace cyclic photophosphorylation around Photosystem I and explain under what cellular conditions it is favored.",
        recommendedNextStep: "Examine how ATP and NADPH drive the enzymatic steps of the Calvin cycle.",
      };
    }

    // -----------------------------------------------------------------------
    // ORGANIC CHEMISTRY (STRICTLY FOR CHEMISTRY TOPICS)
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "chemistry") {
      const isIsomerism = p.includes("isomer") || topicInfo.stageNumber === 4;
      const isReactions = p.includes("reaction") || topicInfo.stageNumber === 5;
      const isFunctional = p.includes("functional") || topicInfo.stageNumber === 3;

      if (isFunctional) {
        return {
          conceptId: topicInfo.conceptId || "concept_functional_groups",
          conceptTitle: topicInfo.conceptTitle || "Functional Groups & Intermolecular Polarity",
          personalizedExplanation:
            "Functional groups are specific clusters of atoms that dictate the reactivity, polarity, and physical properties of organic molecules. Primary alcohols feature the polar hydroxyl (-OH) group, capable of participating in intermolecular hydrogen bonding with water and elevating boiling points compared to non-polar alkanes of comparable molar mass.",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Identify the heteroatom electronegativity difference",
              reasoning: "Oxygen (3.44) is substantially more electronegative than hydrogen (2.20), creating a strong permanent dipole.",
            },
            {
              stepNumber: 2,
              action: "Assess intermolecular hydrogen bonding capacity",
              reasoning: "The partially positive hydrogen atom associates with the lone pairs on adjacent oxygen atoms.",
            },
            {
              stepNumber: 3,
              action: "Predict physical boiling point and solubility trends",
              reasoning: "Hydrogen bonding requires significantly more thermal energy to disrupt than London dispersion forces alone.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Confusing the neutral covalent alcohol -OH group with basic ionic hydroxide ions (OH-).",
            howToAvoid: "Alcohols contain covalent C-O bonds and do not spontaneously dissociate into hydroxide ions in water.",
          },
          practiceQuestion: {
            id: "pq_functional_1",
            prompt: "Why does ethanol (C2H5OH) have a significantly higher boiling point (78°C) than dimethyl ether (CH3OCH3, -24°C) despite both sharing molecular formula C2H6O?",
            options: [
              "Ethanol forms intermolecular hydrogen bonds, whereas dimethyl ether cannot",
              "Dimethyl ether has a greater molecular weight",
              "Ethanol is completely non-polar",
              "Dimethyl ether contains ionic bonds",
            ],
            correctOptionIndex: 0,
            explanation: "Ethanol possesses an -OH group capable of hydrogen bonding, requiring vastly higher thermal energy to vaporize.",
            difficulty: "intermediate",
          },
          hint: "Look for hydrogen directly bound to a highly electronegative atom (N, O, F).",
          stretchChallenge: "Rank ethanol, ethanethiol (C2H5SH), and ethane by boiling point and justify using dipole strengths.",
          recommendedNextStep: "Analyze carbonyl functional groups in aldehydes and ketones.",
        };
      }

      if (isIsomerism) {
        return {
          conceptId: topicInfo.conceptId || "concept_isomers_foundations",
          conceptTitle: topicInfo.conceptTitle || "Structural & Stereoisomerism",
          personalizedExplanation:
            "Isomers are molecules sharing the identical molecular formula but differing fundamentally in how their constituent atoms are arranged in physical space. In constitutional isomers, the connectivity of the carbon scaffold itself varies (e.g. butane vs 2-methylpropane). In stereoisomers, atoms connect in the same order but point in distinct 3D spatial directions, creating dramatically different chemical and biological interactions.",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Count total carbons, hydrogens, and heteroatoms",
              reasoning: "Both butane and isobutane evaluate to C4H10, verifying they are isomers.",
            },
            {
              stepNumber: 2,
              action: "Trace the longest continuous carbon chain",
              reasoning: "Butane has an unbranched 4-carbon chain, whereas 2-methylpropane has a branched 3-carbon parent chain.",
            },
            {
              stepNumber: 3,
              action: "Verify physical properties differentiation",
              reasoning: "Branching reduces molecular surface area, leading to lower boiling points.",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Assuming bent or rotated 2D drawings represent different constitutional isomers.",
            howToAvoid: "Verify actual chemical connectivity: single C-C bonds freely rotate without forming a new isomer.",
          },
          practiceQuestion: {
            id: "pq_isomers_1",
            prompt: "Which pair represents constitutional (structural) isomers?",
            options: [
              "Butane and 2-methylpropane (isobutane)",
              "Propane and butane",
              "Cyclohexane and benzene",
              "Methane and ethane",
            ],
            correctOptionIndex: 0,
            explanation: "Both butane and 2-methylpropane possess formula C4H10 but have distinct connectivity.",
            difficulty: "intermediate",
          },
          hint: "Count total atoms in both candidates before checking branching patterns.",
          stretchChallenge: "Explain why cis-2-butene and trans-2-butene cannot interconvert at room temperature without breaking the pi bond.",
          recommendedNextStep: "Analyze stereoisomeric mirror images and chirality.",
        };
      }

      if (isReactions) {
        return {
          conceptId: topicInfo.conceptId || "concept_organic_reactions",
          conceptTitle: topicInfo.conceptTitle || "Electrophilic Addition & Functional Transformations",
          personalizedExplanation:
            "Organic reactions transform starting materials into higher-value products by systematically breaking and forming covalent bonds. In catalytic hydrogenation, molecular hydrogen (H2) adds across a carbon-carbon double bond over a transition metal catalyst (Pt, Pd, or Ni), converting an unsaturated alkene into a saturated alkane while releasing exothermic heat.",
          workedExamples: [
            {
              stepNumber: 1,
              action: "Identify the reactive functional center",
              reasoning: "The electron-rich pi bond of ethene acts as the nucleophilic reaction site.",
            },
            {
              stepNumber: 2,
              action: "Adsorb reactants onto the solid metal catalyst surface",
              reasoning: "The metal catalyst weakens the H-H bond and coordinates the alkene molecules.",
            },
            {
              stepNumber: 3,
              action: "Transfer hydrogens via syn-addition across the double bond",
              reasoning: "Both hydrogen atoms add from the same face, yielding saturated ethane (C2H6).",
            },
          ],
          misconceptionAlert: {
            commonPitfall: "Believing that the catalyst supplies energy or is permanently consumed in the reaction.",
            howToAvoid: "Remember catalysts lower the activation energy barrier and emerge chemically unchanged at reaction completion.",
          },
          practiceQuestion: {
            id: "pq_reactions_1",
            prompt: "What is the primary organic product when ethene (C2H4) undergoes catalytic hydrogenation with H2 over Ni?",
            options: ["Ethane (C2H6)", "Ethyne (C2H2)", "Ethanol (C2H5OH)", "Acetic acid (CH3COOH)"],
            correctOptionIndex: 0,
            explanation: "Hydrogenation adds two hydrogen atoms across the C=C double bond, converting alkene to alkane.",
            difficulty: "intermediate",
          },
          hint: "A double bond requires two hydrogen atoms to become completely saturated.",
          stretchChallenge: "Determine whether the addition of D2 (deuterium) to cyclohexene yields cis- or trans-1,2-dideuterocyclohexane.",
          recommendedNextStep: "Investigate acid-catalyzed hydration of alkenes to synthesize alcohols.",
        };
      }

      // Default Chemistry: Carbon Bonding
      return {
        conceptId: topicInfo.conceptId || "concept_carbon_bonding",
        conceptTitle: topicInfo.conceptTitle || "Tetrahedral Carbon & Covalent Architecture",
        personalizedExplanation:
          "Carbon occupies a unique position in chemistry due to its valency of 4 and intermediate electronegativity. In sp3 hybridization, carbon promotes an electron and hybridizes its 2s and three 2p orbitals into four degenerate sp3 hybrid orbitals oriented at 109.5° angles, forming extraordinarily stable tetrahedral lattices and chains.",
        workedExamples: [
          {
            stepNumber: 1,
            action: "Determine valence electron count for carbon (Z=6)",
            reasoning: "Carbon has electron configuration 1s2 2s2 2p2, providing 4 valence electrons.",
          },
          {
            stepNumber: 2,
            action: "Promote and hybridize to maximize bond formation",
            reasoning: "Hybridizing into 4 sp3 orbitals allows 4 identical sigma bonds with hydrogen in methane.",
          },
          {
            stepNumber: 3,
            action: "Measure VSEPR steric geometry",
            reasoning: "Four electron domains mutually repel to achieve a 109.5° tetrahedral equilibrium.",
          },
        ],
        misconceptionAlert: {
          commonPitfall: "Picturing methane as a flat 90° cross in space as drawn on 2D paper.",
          howToAvoid: "Think in 3D: three-dimensional tetrahedral repulsion expands bond angles from 90° to 109.5°.",
        },
        practiceQuestion: {
          id: "pq_carbon_1",
          prompt: "What is the bond angle in a fully saturated sp3 hybridized carbon center?",
          options: ["109.5°", "120°", "180°", "90°"],
          correctOptionIndex: 0,
          explanation: "Tetrahedral geometry minimizes electron repulsion at 109.5°.",
          difficulty: "foundational",
        },
        hint: "Remember three-dimensional geometry repels further than a flat square.",
        stretchChallenge: "Compare the bond angle of methane (109.5°) to water (104.5°) based on lone pair repulsion.",
        recommendedNextStep: "Explore carbon-carbon concatenation in straight and branched alkanes.",
      };
    }

    // -----------------------------------------------------------------------
    // GENERAL / ARBITRARY TOPIC (STRICTLY TOPIC-AGNOSTIC & ZERO CHEMISTRY)
    // -----------------------------------------------------------------------
    const topicTitle = topicInfo.displayName;
    const conceptHeading = topicInfo.conceptTitle || `Foundations and Core Principles of ${topicTitle}`;
    const cleanConceptId = topicInfo.conceptId || `concept_${topicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    return {
      conceptId: cleanConceptId,
      conceptTitle: conceptHeading,
      personalizedExplanation:
        `A comprehensive and rigorous examination of ${topicTitle}. Mastering ${topicTitle} requires understanding its foundational principles, analyzing the systematic relationships between core elements, and applying structured conceptual problem-solving techniques to realistic domain challenges.`,
      workedExamples: [
        {
          stepNumber: 1,
          action: `Identify foundational axioms and primary definitions in ${topicTitle}`,
          reasoning: `Establishing clear initial assumptions and scope boundaries is essential for sound analysis in ${topicTitle}.`,
        },
        {
          stepNumber: 2,
          action: `Analyze interactions and operational mechanics systematically`,
          reasoning: `Tracing how core components influence system behavior reveals the underlying mechanisms of ${topicTitle}.`,
        },
        {
          stepNumber: 3,
          action: `Synthesize conclusions and verify problem constraints`,
          reasoning: `Cross-checking the derived result against domain principles guarantees analytical rigor and accuracy.`,
        },
      ],
      misconceptionAlert: {
        commonPitfall: `Overgeneralizing introductory rules in ${topicTitle} without verifying specific boundary constraints.`,
        howToAvoid: `Carefully examine initial conditions and trace step-by-step logic rather than relying on superficial heuristic shortcuts.`,
      },
      practiceQuestion: {
        id: `pq_${topicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_1`,
        prompt: `Which statement best describes the primary foundational principle of ${topicTitle}?`,
        options: [
          `It establishes systematic rules and relationships that govern behavior and problem-solving within ${topicTitle}`,
          `It operates purely through random uncoordinated changes with no observable structure`,
          `It replaces all domain principles with unrelated arbitrary definitions`,
          `It requires ignoring foundational axioms in favor of uncontrolled conjecture`,
        ],
        correctOptionIndex: 0,
        explanation: `In ${topicTitle}, foundational principles establish the coherent, systematic framework necessary for analytical problem-solving and accurate reasoning.`,
        difficulty: "intermediate",
      },
      hint: `Focus on how structural rules and clear definitions support rigorous reasoning in ${topicTitle}.`,
      stretchChallenge: `Analyze an edge case in ${topicTitle} where standard baseline rules must be adapted to account for non-standard constraints.`,
      recommendedNextStep: `Advance to intermediate applications and multi-step synthesis in ${topicTitle}.`,
    };
  }

  // =========================================================================
  // 2. MOCK TEST GENERATION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackMockTest(prompt: string = ""): GeneratedMockTest {
    const topicInfo = detectTopicFromPrompt(prompt);
    const testId = `mock_test_${Date.now()}`;

    // -----------------------------------------------------------------------
    // PYTHON PROGRAMMING MOCK TEST
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "python") {
      return {
        id: testId,
        title: "Python Programming Mastery Diagnostic Exam",
        topic: "Python Programming",
        stageNumber: topicInfo.stageNumber || 2,
        targetDifficulty: "adaptive",
        questions: [
          {
            id: "mt_py_1",
            type: "multiple_choice",
            conceptId: "concept_py_memory",
            conceptTitle: "Immutability & Types",
            difficulty: "foundational",
            prompt: "In Python, which of the following standard built-in data types is immutable?",
            options: ["Tuple", "List", "Dictionary", "Set"],
            correctOptionIndex: 0,
            expectedConcepts: ["immutability", "data_types", "tuples"],
            rubric: [{ criterion: "Identifies Tuple as an immutable sequence", weight: 1.0 }],
            explanation: "Tuples cannot be modified in place after creation, making them immutable sequences in Python.",
          },
          {
            id: "mt_py_2",
            type: "multiple_choice",
            conceptId: "concept_py_iteration",
            conceptTitle: "Range & Iteration",
            difficulty: "intermediate",
            prompt: "What sequence is produced by evaluating `list(range(1, 8, 2))` in Python?",
            options: ["[1, 3, 5, 7]", "[1, 2, 3, 4, 5, 6, 7]", "[2, 4, 6, 8]", "[1, 3, 5]"],
            correctOptionIndex: 0,
            expectedConcepts: ["range_function", "iteration", "step_arguments"],
            rubric: [{ criterion: "Calculates correct elements with start=1, stop=8, step=2", weight: 1.0 }],
            explanation: "The range function begins at 1, increments by 2, and terminates strictly before reaching the stop value 8.",
          },
          {
            id: "mt_py_3",
            type: "short_answer",
            conceptId: "concept_py_variables",
            conceptTitle: "Variables & Object Reference Model",
            difficulty: "intermediate",
            prompt: "Explain how variable assignment works in Python and how it differs between primitive numbers and mutable lists.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["object_references", "pointers", "mutability"],
            rubric: [
              { criterion: "Explains that variables store references/pointers to objects in heap memory", weight: 0.5 },
              { criterion: "Contrasts immutability of numbers with in-place mutability of lists", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "Variables in Python store object references rather than direct values. When assigning an immutable integer, modifications rebind the variable to a new object. For mutable lists, operations like append() modify the existing heap object in place, affecting all variable names that reference it.",
            explanation: "Python uses a call-by-object-reference model where variables are bound to heap objects.",
          },
          {
            id: "mt_py_4",
            type: "reasoning",
            conceptId: "concept_py_datastructures",
            conceptTitle: "Collection Lookup Complexity",
            difficulty: "advanced",
            prompt: "Analyze the time complexity and operational mechanisms of checking membership with `x in collection` for a Python list versus a Python dictionary/set.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["time_complexity", "hash_tables", "linear_search", "hash_functions"],
            rubric: [
              { criterion: "Identifies O(n) linear scan for lists vs O(1) average hash lookup for dicts/sets", weight: 0.5 },
              { criterion: "Explains underlying array traversal vs hash code computation and bucket indexing", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "Checking membership in a Python list requires an O(n) sequential scan across array elements. In contrast, sets and dictionaries use hash tables that compute hash(x) to probe bucket indices directly in O(1) average time, trading higher memory footprint for constant-time lookups.",
            explanation: "Hash tables achieve average O(1) lookups via deterministic key hashing, whereas lists require linear search.",
          },
          {
            id: "mt_py_5",
            type: "reasoning",
            conceptId: "concept_py_functions",
            conceptTitle: "Mutable Default Arguments Anti-Pattern",
            difficulty: "advanced",
            prompt: "Why is defining a function like `def append_item(val, items=[])` considered a dangerous anti-pattern in Python, and what is the idiomatic solution?",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["default_parameter_evaluation", "shared_state", "sentinel_none"],
            rubric: [
              { criterion: "Explains that default arguments are evaluated once at definition time, sharing the mutable list across invocations", weight: 0.6 },
              { criterion: "Provides idiomatic fix using items=None sentinel with internal initialization", weight: 0.4 },
            ],
            sampleIdealAnswer:
              "In Python, default arguments are evaluated once when the function is defined, not on each invocation. Consequently, subsequent calls that mutate the default argument alter the same shared list in memory. The idiomatic fix is `def append_item(val, items=None): if items is None: items = []`.",
            explanation: "Default parameters bind once at function definition time, making mutable defaults persist state across calls.",
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // CALCULUS MOCK TEST
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "calculus") {
      return {
        id: testId,
        title: "Calculus Foundations & Analytic Methods Exam",
        topic: "Calculus",
        stageNumber: topicInfo.stageNumber || 2,
        targetDifficulty: "adaptive",
        questions: [
          {
            id: "mt_calc_1",
            type: "multiple_choice",
            conceptId: "concept_calc_limits",
            conceptTitle: "Trigonometric Limits",
            difficulty: "foundational",
            prompt: "What is the limit of `(sin x) / x` as x approaches 0?",
            options: ["1", "0", "Undefined", "Infinity"],
            correctOptionIndex: 0,
            expectedConcepts: ["limits", "trigonometric_limits", "squeeze_theorem"],
            rubric: [{ criterion: "Identifies fundamental limit value of 1", weight: 1.0 }],
            explanation: "By the squeeze theorem and L'Hopital's rule, the limit of sin(x)/x as x approaches 0 is exactly 1.",
          },
          {
            id: "mt_calc_2",
            type: "multiple_choice",
            conceptId: "concept_calc_rules",
            conceptTitle: "Composite Differentiation",
            difficulty: "intermediate",
            prompt: "Which differentiation rule is required to calculate the derivative of a composite function `f(g(x))`?",
            options: ["The Chain Rule", "The Product Rule", "The Quotient Rule", "The Power Rule"],
            correctOptionIndex: 0,
            expectedConcepts: ["chain_rule", "composite_functions", "differentiation"],
            rubric: [{ criterion: "Selects the Chain Rule", weight: 1.0 }],
            explanation: "The Chain Rule states that d/dx[f(g(x))] = f'(g(x)) * g'(x).",
          },
          {
            id: "mt_calc_3",
            type: "short_answer",
            conceptId: "concept_calc_derivatives",
            conceptTitle: "Geometric & Physical Meaning of Derivative",
            difficulty: "intermediate",
            prompt: "Explain the geometric and physical meaning of the first derivative of a position function s(t).",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["tangent_slope", "instantaneous_velocity", "rate_of_change"],
            rubric: [
              { criterion: "Articulates geometric meaning as slope of tangent line to the curve", weight: 0.5 },
              { criterion: "Articulates physical meaning as instantaneous velocity at time t", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "Geometrically, the first derivative represents the exact slope of the tangent line to the function s(t) at time t. Physically, it represents the instantaneous velocity, showing how rapidly position is changing at that precise moment.",
            explanation: "The derivative transforms average secant slopes into the instantaneous rate of change.",
          },
          {
            id: "mt_calc_4",
            type: "reasoning",
            conceptId: "concept_calc_continuity",
            conceptTitle: "Continuity vs Differentiability",
            difficulty: "advanced",
            prompt: "Explain why differentiability at a point implies continuity, but continuity does not guarantee differentiability. Provide a classic counterexample.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["continuity", "differentiability", "difference_quotient", "sharp_cusp"],
            rubric: [
              { criterion: "Explains that existence of difference quotient limit forces lim f(x) = f(c)", weight: 0.5 },
              { criterion: "Provides counterexample like f(x) = |x| at x = 0 with differing left and right derivatives", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "If f is differentiable at c, lim [f(x) - f(c)] = lim [f'(c) * (x - c)] = 0, proving continuity. However, continuity does not guarantee differentiability: f(x) = |x| is continuous at x = 0, but possesses no derivative because the left-hand slope (-1) and right-hand slope (+1) do not agree at the sharp cusp.",
            explanation: "Differentiability requires smooth smoothness, which is stricter than continuous connectivity.",
          },
          {
            id: "mt_calc_5",
            type: "reasoning",
            conceptId: "concept_calc_ftc",
            conceptTitle: "Fundamental Theorem of Calculus",
            difficulty: "advanced",
            prompt: "State the Fundamental Theorem of Calculus (both parts) and articulate how it unifies the differential and integral branches of mathematics.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["ftc_part1", "ftc_part2", "accumulation_function", "antiderivative"],
            rubric: [
              { criterion: "Articulates Part 1: differentiation and integration are inverse operations (d/dx ∫ f(t)dt = f(x))", weight: 0.5 },
              { criterion: "Articulates Part 2: definite integrals evaluate via antiderivative net change (∫ f(x)dx = F(b) - F(a))", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "The Fundamental Theorem establishes that differentiation and integration are inverse processes. Part 1 proves that differentiating an integral accumulation function recovers the integrand: d/dx ∫[a,x] f(t)dt = f(x). Part 2 allows evaluating area under curves via antiderivative net change F(b) - F(a) without infinite Riemann sums.",
            explanation: "The FTC bridges rate calculation with total accumulation.",
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // PHOTOSYNTHESIS MOCK TEST
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "photosynthesis") {
      return {
        id: testId,
        title: "Photosynthesis & Cellular Bioenergetics Diagnostic Exam",
        topic: "Photosynthesis",
        stageNumber: topicInfo.stageNumber || 2,
        targetDifficulty: "adaptive",
        questions: [
          {
            id: "mt_photo_1",
            type: "multiple_choice",
            conceptId: "concept_photo_light",
            conceptTitle: "Thylakoid Architecture",
            difficulty: "foundational",
            prompt: "In which chloroplast structure do the light-dependent reactions of photosynthesis take place?",
            options: ["Thylakoid membranes", "Stroma", "Outer membrane", "Mitochondrial matrix"],
            correctOptionIndex: 0,
            expectedConcepts: ["thylakoid_membrane", "chloroplast", "light_reactions"],
            rubric: [{ criterion: "Identifies thylakoid membranes", weight: 1.0 }],
            explanation: "Chlorophyll pigments and electron transport complexes are embedded within the thylakoid membranes.",
          },
          {
            id: "mt_photo_2",
            type: "multiple_choice",
            conceptId: "concept_photo_products",
            conceptTitle: "Light Reaction Products",
            difficulty: "intermediate",
            prompt: "What two high-energy chemical products generated by light-dependent reactions are consumed by the Calvin cycle?",
            options: ["ATP and NADPH", "Glucose and O2", "CO2 and H2O", "Pyruvate and FADH2"],
            correctOptionIndex: 0,
            expectedConcepts: ["atp", "nadph", "calvin_cycle_coupling"],
            rubric: [{ criterion: "Identifies ATP and NADPH", weight: 1.0 }],
            explanation: "ATP provides phosphorylation energy and NADPH donates reducing equivalents to drive carbon fixation.",
          },
          {
            id: "mt_photo_3",
            type: "short_answer",
            conceptId: "concept_photo_rubisco",
            conceptTitle: "RuBisCO & Carbon Fixation",
            difficulty: "intermediate",
            prompt: "Explain the biological function of the enzyme RuBisCO in the Calvin cycle and why it is essential for the biosphere.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["rubisco", "carbon_fixation", "rubp"],
            rubric: [
              { criterion: "Identifies RuBisCO catalyzes the carboxylation of RuBP with atmospheric CO2", weight: 0.5 },
              { criterion: "Explains it is the primary entry point for inorganic carbon into biological food chains", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "RuBisCO catalyzes the initial fixation of atmospheric CO2 onto the 5-carbon sugar RuBP. This incorporates inorganic carbon into organic 3-carbon carbohydrates, providing the organic carbon backbone that sustains virtually all terrestrial and aquatic food webs.",
            explanation: "RuBisCO mediates the primary conversion of abiotic carbon into organic biomass.",
          },
          {
            id: "mt_photo_4",
            type: "reasoning",
            conceptId: "concept_photo_chemiosmosis",
            conceptTitle: "Proton Gradient & Chemiosmosis",
            difficulty: "advanced",
            prompt: "Explain how a proton gradient is established across the thylakoid membrane during electron transport, and how it couples to ATP synthesis.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["proton_motive_force", "photolysis", "cytochrome_b6f", "atp_synthase"],
            rubric: [
              { criterion: "Articulates proton accumulation in lumen via water photolysis and cytochrome b6f pumping", weight: 0.5 },
              { criterion: "Explains proton motive force driving ATP synthase rotation via chemiosmosis into the stroma", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "Protons accumulate in the thylakoid lumen through water splitting at Photosystem II and active pumping by the cytochrome b6f complex during electron transport. This creates an electrochemical proton gradient. As protons flow down this gradient through ATP synthase into the stroma, mechanical rotation drives ADP phosphorylation to ATP.",
            explanation: "Chemiosmotic coupling translates an electrochemical proton gradient into chemical bond energy in ATP.",
          },
          {
            id: "mt_photo_5",
            type: "reasoning",
            conceptId: "concept_photo_c4",
            conceptTitle: "Photorespiration & C4 Plant Adaptations",
            difficulty: "advanced",
            prompt: "Contrast standard C3 photosynthesis with the C4 pathway, explaining the structural adaptation that prevents photorespiration in hot environments.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["c3_vs_c4", "photorespiration", "kranz_anatomy", "bundle_sheath_cells"],
            rubric: [
              { criterion: "Describes oxygenase activity of RuBisCO causing wasteful photorespiration in C3 plants", weight: 0.5 },
              { criterion: "Explains spatial separation in C4 plants using PEP carboxylase in mesophyll and RuBisCO in bundle sheath cells", weight: 0.5 },
            ],
            sampleIdealAnswer:
              "In C3 plants under high heat and closed stomata, RuBisCO binds O2 instead of CO2, initiating wasteful photorespiration. C4 plants circumvent this using Kranz anatomy: PEP carboxylase fixes CO2 into a 4-carbon acid in mesophyll cells, which is pumped into bundle sheath cells to concentrate CO2 around RuBisCO, suppressing oxygenase competition.",
            explanation: "C4 plants use spatial separation to concentrate CO2 and minimize photorespiratory energy loss.",
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // ORGANIC CHEMISTRY MOCK TEST (STRICTLY CHEMISTRY)
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "chemistry") {
      return {
        id: testId,
        title: "Organic Chemistry Mastery Diagnostic Exam",
        topic: "Organic Chemistry",
        stageNumber: topicInfo.stageNumber || 3,
        targetDifficulty: "adaptive",
        questions: [
          {
            id: "mt_q1",
            type: "multiple_choice",
            conceptId: "concept_carbon_bonding",
            conceptTitle: "Carbon Fundamentals",
            difficulty: "foundational",
            prompt: "How many covalent bonds does a neutral carbon atom form to fulfill its octet?",
            options: ["2", "3", "4", "6"],
            correctOptionIndex: 2,
            expectedConcepts: ["valency", "octet_rule", "carbon_bonding"],
            rubric: [{ criterion: "Identifies 4 covalent bonds", weight: 1.0 }],
            explanation: "Carbon has 4 valence electrons and requires 4 shared electron pairs to complete its valence shell.",
          },
          {
            id: "mt_q2",
            type: "multiple_choice",
            conceptId: "concept_hydrocarbons",
            conceptTitle: "Alkanes vs Alkenes",
            difficulty: "intermediate",
            prompt: "What distinguishes an alkene from an alkane in terms of chemical bonding?",
            options: [
              "Alkenes contain at least one carbon-carbon double bond",
              "Alkenes only contain single C-H bonds",
              "Alkenes have no hydrogen atoms",
              "Alkenes contain triple bonds exclusively",
            ],
            correctOptionIndex: 0,
            expectedConcepts: ["alkene_structure", "pi_bonds", "saturation"],
            rubric: [{ criterion: "Selects option noting C=C double bond presence", weight: 1.0 }],
            explanation: "Alkenes are unsaturated hydrocarbons containing one or more C=C double bonds composed of a sigma and pi bond.",
          },
          {
            id: "mt_q3",
            type: "short_answer",
            conceptId: "concept_functional_groups",
            conceptTitle: "Functional Groups",
            difficulty: "intermediate",
            prompt: "State the characteristic functional group present in all primary alcohols, and explain how it affects solubility in water.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["hydroxyl_group", "hydrogen_bonding", "polarity"],
            rubric: [
              { criterion: "Names hydroxyl group (-OH)", weight: 0.5 },
              { criterion: "Mentions hydrogen bonding or polar interaction with water molecules", weight: 0.5 },
            ],
            sampleIdealAnswer: "Alcohols contain the hydroxyl group (-OH). The polar O-H bond can participate in hydrogen bonding with water molecules, significantly increasing aqueous solubility for short-chain alcohols.",
            explanation: "The -OH group enables hydrogen bonding with water, increasing aqueous solubility.",
          },
          {
            id: "mt_q4",
            type: "reasoning",
            conceptId: "concept_isomers_foundations",
            conceptTitle: "Isomerism Reasoning",
            difficulty: "advanced",
            prompt: "Explain why butane (C4H10) and 2-methylpropane (C4H10) have identical molecular formulas but distinct boiling points.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["structural_isomerism", "branching", "london_dispersion_forces", "surface_area"],
            rubric: [
              { criterion: "Recognizes constitutional isomerism with different carbon branching", weight: 0.4 },
              { criterion: "Connects linear structure of butane to higher surface area and stronger dispersion forces", weight: 0.6 },
            ],
            sampleIdealAnswer: "They are constitutional isomers. Butane has an unbranched 4-carbon chain with a larger cylindrical surface area, allowing stronger London dispersion forces. 2-Methylpropane is compact and spherical, reducing intermolecular contact and lowering its boiling point.",
            explanation: "Linear molecules pack more effectively and have larger contact surface areas than spherical branched isomers.",
          },
          {
            id: "mt_q5",
            type: "reasoning",
            conceptId: "concept_organic_reactions",
            conceptTitle: "Catalytic Hydrogenation Mechanism",
            difficulty: "advanced",
            prompt: "During catalytic hydrogenation of ethene to ethane over a platinum catalyst, explain the mechanical role of the platinum metal.",
            options: undefined,
            correctOptionIndex: undefined,
            expectedConcepts: ["heterogeneous_catalysis", "adsorption", "activation_energy", "unchanged_catalyst"],
            rubric: [
              { criterion: "Explains reactant adsorption onto platinum surface", weight: 0.5 },
              { criterion: "Articulates lowering of activation energy without permanent chemical consumption of catalyst", weight: 0.5 },
            ],
            sampleIdealAnswer: "The platinum metal acts as a heterogeneous catalyst. It adsorbs H2 and alkene molecules onto its surface, cleaving the H-H bond and positioning the reactants to lower the activation energy barrier. The platinum is regenerated unchanged at reaction end.",
            explanation: "Heterogeneous metal catalysts provide a surface template that breaks H-H bonds and lowers activation energy.",
          },
        ],
      };
    }

    // -----------------------------------------------------------------------
    // GENERAL / ARBITRARY TOPIC MOCK TEST (ZERO CHEMISTRY)
    // -----------------------------------------------------------------------
    const topicTitle = topicInfo.displayName;
    const cleanId = topicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return {
      id: testId,
      title: `${topicTitle} Mastery Diagnostic Exam`,
      topic: topicTitle,
      stageNumber: topicInfo.stageNumber || 2,
      targetDifficulty: "adaptive",
      questions: [
        {
          id: `mt_${cleanId}_1`,
          type: "multiple_choice",
          conceptId: `concept_${cleanId}_foundations`,
          conceptTitle: `${topicTitle} Axioms`,
          difficulty: "foundational",
          prompt: `What is the primary governing principle that characterizes ${topicTitle}?`,
          options: [
            `It provides a systematic, coherent framework for analyzing and solving domain-specific challenges`,
            `It operates through uncoordinated random changes without structured rules`,
            `It rejects foundational definitions in favor of arbitrary speculation`,
            `It is completely unobservable and lacks consistent internal logic`,
          ],
          correctOptionIndex: 0,
          expectedConcepts: ["foundational_axioms", "core_principles"],
          rubric: [{ criterion: `Identifies core systematic framework of ${topicTitle}`, weight: 1.0 }],
          explanation: `In ${topicTitle}, foundational principles provide the consistent structured framework required for analytical reasoning and problem-solving.`,
        },
        {
          id: `mt_${cleanId}_2`,
          type: "multiple_choice",
          conceptId: `concept_${cleanId}_relationships`,
          conceptTitle: `Structural Relationships in ${topicTitle}`,
          difficulty: "intermediate",
          prompt: `When analyzing structural dynamics in ${topicTitle}, which factor is most essential?`,
          options: [
            `Evaluating how individual components interact to determine system-wide outcomes`,
            `Assuming all elements act independently without shared constraints`,
            `Ignoring boundary constraints in favor of rapid guesswork`,
            `Relying exclusively on non-repeatable intuitive leaps`,
          ],
          correctOptionIndex: 0,
          expectedConcepts: ["structural_dynamics", "system_interactions"],
          rubric: [{ criterion: "Recognizes importance of component interactions and constraints", weight: 1.0 }],
          explanation: `Accurate analysis in ${topicTitle} requires evaluating how constituent parts interact under defined constraints to govern holistic outcomes.`,
        },
        {
          id: `mt_${cleanId}_3`,
          type: "short_answer",
          conceptId: `concept_${cleanId}_mechanisms`,
          conceptTitle: `Operational Mechanics of ${topicTitle}`,
          difficulty: "intermediate",
          prompt: `In your own words, explain how foundational principles in ${topicTitle} guide problem-solving in realistic scenarios.`,
          options: undefined,
          correctOptionIndex: undefined,
          expectedConcepts: ["problem_solving", "foundational_principles"],
          rubric: [
            { criterion: `Articulates the core theoretical framework of ${topicTitle}`, weight: 0.5 },
            { criterion: "Explains step-by-step application to practical domain problems", weight: 0.5 },
          ],
          sampleIdealAnswer:
            `Core principles in ${topicTitle} establish explicit rules and constraints. When solving problems, practitioners apply these axioms step-by-step to decompose complex cases, test boundary conditions, and verify that solutions satisfy domain requirements.`,
          explanation: `Systematic problem-solving in ${topicTitle} translates foundational theory into structured verification.`,
        },
        {
          id: `mt_${cleanId}_4`,
          type: "reasoning",
          conceptId: `concept_${cleanId}_tradeoffs`,
          conceptTitle: `Analytical Trade-offs in ${topicTitle}`,
          difficulty: "advanced",
          prompt: `Compare two contrasting methodologies or models within ${topicTitle}, evaluating the trade-offs between simplicity and analytical precision.`,
          options: undefined,
          correctOptionIndex: undefined,
          expectedConcepts: ["tradeoff_analysis", "methodology_comparison"],
          rubric: [
            { criterion: "Identifies strengths and limitations of both approaches", weight: 0.5 },
            { criterion: "Justifies the conditions under which one approach is preferred over the other", weight: 0.5 },
          ],
          sampleIdealAnswer:
            `Simpler models in ${topicTitle} offer rapid evaluation and intuitive clarity but may overlook subtle edge-case interactions. More complex models provide high precision at the expense of computational overhead and interpretability. Practitioners select between them based on required tolerance and risk thresholds.`,
          explanation: `Balancing analytical precision against complexity is a hallmark of advanced reasoning in ${topicTitle}.`,
        },
        {
          id: `mt_${cleanId}_5`,
          type: "reasoning",
          conceptId: `concept_${cleanId}_synthesis`,
          conceptTitle: `Edge Cases & First-Principles Synthesis`,
          difficulty: "advanced",
          prompt: `Analyze a complex failure mode or edge case in ${topicTitle} and explain how applying first principles resolves the problem.`,
          options: undefined,
          correctOptionIndex: undefined,
          expectedConcepts: ["first_principles", "edge_case_resolution"],
          rubric: [
            { criterion: "Correctly identifies root cause of failure mode", weight: 0.5 },
            { criterion: "Constructs a robust resolution derived from first principles", weight: 0.5 },
          ],
          sampleIdealAnswer:
            `Edge-case failures often occur when practitioners rely on superficial heuristics that break under non-standard conditions. Deconstructing the scenario back to first principles reveals which foundational constraint was violated, enabling a robust, reproducible correction.`,
          explanation: `First-principles synthesis resolves anomalies by stripping away heuristic assumptions and rebuilding from foundational axioms.`,
        },
      ],
    };
  }

  // =========================================================================
  // 3. ASSESSMENT EVALUATION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackEvaluation(prompt: string = ""): AssessmentEvaluation {
    const topicInfo = detectTopicFromPrompt(prompt);

    if (topicInfo.kind === "python") {
      return {
        testId: "eval_test_python",
        topic: "Python Programming",
        totalQuestions: 5,
        overallScore: 86,
        evaluations: [
          {
            questionId: "mt_py_1",
            conceptId: "concept_py_memory",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Identifies Tuple as an immutable sequence"],
            misconceptions: [],
            feedback: "Correct! Tuples are immutable and cannot be modified in place after instantiation.",
            confidence: 0.95,
          },
          {
            questionId: "mt_py_2",
            conceptId: "concept_py_iteration",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Calculates correct elements with start=1, stop=8, step=2"],
            misconceptions: [],
            feedback: "Accurate! The range step parameter generated [1, 3, 5, 7].",
            confidence: 0.95,
          },
          {
            questionId: "mt_py_3",
            conceptId: "concept_py_variables",
            isCorrect: true,
            score: 85,
            understanding: "strong",
            rubricHits: ["Explains object references in heap memory", "Contrasts immutability of numbers with mutable lists"],
            misconceptions: [],
            feedback: "Solid explanation of Python's object reference model.",
            confidence: 0.9,
          },
          {
            questionId: "mt_py_4",
            conceptId: "concept_py_datastructures",
            isCorrect: true,
            score: 80,
            understanding: "strong",
            rubricHits: ["Identifies O(n) list scan vs O(1) hash lookup"],
            misconceptions: [],
            feedback: "Well-reasoned analysis of hash tables versus dynamic array scans.",
            confidence: 0.88,
          },
          {
            questionId: "mt_py_5",
            conceptId: "concept_py_functions",
            isCorrect: true,
            score: 75,
            understanding: "partial",
            rubricHits: ["Explains default arguments evaluate once at definition time"],
            misconceptions: ["Incomplete articulation of the items=None sentinel idiom"],
            feedback: "Good grasp of the mutable default argument trap. Ensure you explicitly showcase the items=None pattern.",
            confidence: 0.85,
          },
        ],
        strengths: [
          "Solid foundational knowledge of Python object references and mutability",
          "Clear understanding of data structure time complexity and hash tables",
          "Understands function evaluation and variable binding",
        ],
        areasForImprovement: [
          "Reinforce the use of sentinel patterns (items=None) for safe function parameterization",
        ],
        recommendedAction: "advance",
      };
    }

    if (topicInfo.kind === "calculus") {
      return {
        testId: "eval_test_calculus",
        topic: "Calculus",
        totalQuestions: 5,
        overallScore: 85,
        evaluations: [
          {
            questionId: "mt_calc_1",
            conceptId: "concept_calc_limits",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Identifies fundamental limit value of 1"],
            misconceptions: [],
            feedback: "Correct! lim(sin x / x) = 1 as x approaches 0.",
            confidence: 0.95,
          },
          {
            questionId: "mt_calc_2",
            conceptId: "concept_calc_rules",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Selects the Chain Rule"],
            misconceptions: [],
            feedback: "Accurate! Differentiating composite functions requires the Chain Rule.",
            confidence: 0.95,
          },
          {
            questionId: "mt_calc_3",
            conceptId: "concept_calc_derivatives",
            isCorrect: true,
            score: 85,
            understanding: "strong",
            rubricHits: ["Articulates geometric meaning as tangent slope", "Articulates physical meaning as instantaneous velocity"],
            misconceptions: [],
            feedback: "Clear dual interpretation of the derivative.",
            confidence: 0.9,
          },
          {
            questionId: "mt_calc_4",
            conceptId: "concept_calc_continuity",
            isCorrect: true,
            score: 80,
            understanding: "strong",
            rubricHits: ["Explains existence of difference quotient limit", "Provides counterexample f(x) = |x|"],
            misconceptions: [],
            feedback: "Well articulated distinction between continuity and smooth differentiability.",
            confidence: 0.88,
          },
          {
            questionId: "mt_calc_5",
            conceptId: "concept_calc_ftc",
            isCorrect: true,
            score: 75,
            understanding: "partial",
            rubricHits: ["Articulates differentiation and integration as inverse operations"],
            misconceptions: ["Incomplete description of accumulation functions in Part 1"],
            feedback: "Solid understanding of the Fundamental Theorem. Review accumulation functions d/dx ∫ f(t)dt.",
            confidence: 0.85,
          },
        ],
        strengths: [
          "Strong conceptual grasp of limits and instantaneous rates of change",
          "Accurate geometric interpretation of tangent slopes",
          "Understands the unification of differentiation and integration",
        ],
        areasForImprovement: [
          "Deepen formal proof mechanics of accumulation functions under FTC Part 1",
        ],
        recommendedAction: "advance",
      };
    }

    if (topicInfo.kind === "photosynthesis") {
      return {
        testId: "eval_test_photosynthesis",
        topic: "Photosynthesis",
        totalQuestions: 5,
        overallScore: 88,
        evaluations: [
          {
            questionId: "mt_photo_1",
            conceptId: "concept_photo_light",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Identifies thylakoid membranes"],
            misconceptions: [],
            feedback: "Correct! Light reactions occur in the thylakoid membranes.",
            confidence: 0.95,
          },
          {
            questionId: "mt_photo_2",
            conceptId: "concept_photo_products",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Identifies ATP and NADPH"],
            misconceptions: [],
            feedback: "Accurate! ATP and NADPH are the direct energetic outputs driving the Calvin cycle.",
            confidence: 0.95,
          },
          {
            questionId: "mt_photo_3",
            conceptId: "concept_photo_rubisco",
            isCorrect: true,
            score: 85,
            understanding: "strong",
            rubricHits: ["Identifies RuBisCO catalyzes carbon fixation", "Explains entry of inorganic carbon into biosphere"],
            misconceptions: [],
            feedback: "Great explanation of RuBisCO's catalytic role in carbon assimilation.",
            confidence: 0.9,
          },
          {
            questionId: "mt_photo_4",
            conceptId: "concept_photo_chemiosmosis",
            isCorrect: true,
            score: 85,
            understanding: "strong",
            rubricHits: ["Articulates proton accumulation in lumen", "Explains proton motive force driving ATP synthase"],
            misconceptions: [],
            feedback: "Excellent understanding of chemiosmosis and photophosphorylation.",
            confidence: 0.9,
          },
          {
            questionId: "mt_photo_5",
            conceptId: "concept_photo_c4",
            isCorrect: true,
            score: 75,
            understanding: "partial",
            rubricHits: ["Describes photorespiration in C3 plants"],
            misconceptions: ["Incomplete detail on Kranz anatomy spatial separation in C4 plants"],
            feedback: "Good grasp of RuBisCO oxygenase competition. Review how C4 bundle sheath cells concentrate CO2.",
            confidence: 0.85,
          },
        ],
        strengths: [
          "Thorough comprehension of light reaction photochemical mechanics",
          "Accurate description of chemiosmotic ATP synthesis in thylakoids",
          "Solid grasp of carbon fixation via RuBisCO",
        ],
        areasForImprovement: [
          "Reinforce morphological adaptations (Kranz anatomy) distinguishing C4 from C3 pathways",
        ],
        recommendedAction: "advance",
      };
    }

    if (topicInfo.kind === "chemistry") {
      return {
        testId: "eval_test_chemistry",
        topic: "Organic Chemistry",
        totalQuestions: 5,
        overallScore: 84,
        evaluations: [
          {
            questionId: "mt_q1",
            conceptId: "concept_carbon_bonding",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Identifies 4 covalent bonds"],
            misconceptions: [],
            feedback: "Correct! Neutral carbon always forms 4 covalent bonds to complete its octet.",
            confidence: 0.95,
          },
          {
            questionId: "mt_q2",
            conceptId: "concept_hydrocarbons",
            isCorrect: true,
            score: 100,
            understanding: "strong",
            rubricHits: ["Selects option noting C=C double bond presence"],
            misconceptions: [],
            feedback: "Accurate! The presence of a C=C double bond designates an alkene.",
            confidence: 0.95,
          },
          {
            questionId: "mt_q3",
            conceptId: "concept_functional_groups",
            isCorrect: true,
            score: 85,
            understanding: "strong",
            rubricHits: ["Names hydroxyl group (-OH)", "Mentions polar interaction"],
            misconceptions: [],
            feedback: "Solid explanation. You correctly identified the hydroxyl group and its role in water solubility.",
            confidence: 0.9,
          },
          {
            questionId: "mt_q4",
            conceptId: "concept_isomers_foundations",
            isCorrect: true,
            score: 75,
            understanding: "partial",
            rubricHits: ["Recognizes constitutional isomerism"],
            misconceptions: ["Incomplete articulation of London dispersion forces"],
            feedback: "Good grasp of branching vs linearity. Ensure you explicitly cite intermolecular dispersion forces.",
            confidence: 0.85,
          },
          {
            questionId: "mt_q5",
            conceptId: "concept_organic_reactions",
            isCorrect: true,
            score: 80,
            understanding: "strong",
            rubricHits: ["Explains reactant adsorption", "Articulates lowering of activation energy"],
            misconceptions: [],
            feedback: "Well reasoned explanation of heterogeneous catalysis on metal surfaces.",
            confidence: 0.88,
          },
        ],
        strengths: [
          "Solid foundational knowledge of carbon bonding and valency",
          "Clear grasp of functional groups and solubility interactions",
          "Understands catalytic mechanisms in alkene hydrogenation",
        ],
        areasForImprovement: [
          "Reinforce quantitative explanation of London dispersion forces in branched isomers",
        ],
        recommendedAction: "advance",
      };
    }

    // General / Arbitrary Topic Evaluation
    const topicTitle = topicInfo.displayName;
    const cleanId = topicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return {
      testId: `eval_test_${cleanId}`,
      topic: topicTitle,
      totalQuestions: 5,
      overallScore: 85,
      evaluations: [
        {
          questionId: `mt_${cleanId}_1`,
          conceptId: `concept_${cleanId}_foundations`,
          isCorrect: true,
          score: 100,
          understanding: "strong",
          rubricHits: [`Identifies core systematic framework of ${topicTitle}`],
          misconceptions: [],
          feedback: `Correct! You properly recognized the foundational axioms of ${topicTitle}.`,
          confidence: 0.95,
        },
        {
          questionId: `mt_${cleanId}_2`,
          conceptId: `concept_${cleanId}_relationships`,
          isCorrect: true,
          score: 100,
          understanding: "strong",
          rubricHits: ["Recognizes importance of component interactions and constraints"],
          misconceptions: [],
          feedback: `Accurate analysis of component interactions in ${topicTitle}.`,
          confidence: 0.95,
        },
        {
          questionId: `mt_${cleanId}_3`,
          conceptId: `concept_${cleanId}_mechanisms`,
          isCorrect: true,
          score: 85,
          understanding: "strong",
          rubricHits: [`Articulates theoretical framework of ${topicTitle}`, "Explains practical problem application"],
          misconceptions: [],
          feedback: `Solid conceptual explanation of practical applications in ${topicTitle}.`,
          confidence: 0.9,
        },
        {
          questionId: `mt_${cleanId}_4`,
          conceptId: `concept_${cleanId}_tradeoffs`,
          isCorrect: true,
          score: 80,
          understanding: "strong",
          rubricHits: ["Identifies strengths and limitations of analytical models"],
          misconceptions: [],
          feedback: "Good analysis of trade-offs between model simplicity and precision.",
          confidence: 0.88,
        },
        {
          questionId: `mt_${cleanId}_5`,
          conceptId: `concept_${cleanId}_synthesis`,
          isCorrect: true,
          score: 75,
          understanding: "partial",
          rubricHits: ["Identifies root cause of failure mode"],
          misconceptions: ["Incomplete formulation of the first-principles correction"],
          feedback: `Clear identification of the edge case. Continue refining first-principles resolution steps in ${topicTitle}.`,
          confidence: 0.85,
        },
      ],
      strengths: [
        `Clear foundational understanding of core axioms in ${topicTitle}`,
        `Effective analytical reasoning and constraint evaluation`,
        `Sound appreciation of methodological trade-offs`,
      ],
      areasForImprovement: [
        `Deepen first-principles synthesis in high-complexity edge scenarios of ${topicTitle}`,
      ],
      recommendedAction: "advance",
    };
  }

  // =========================================================================
  // 4. INTERVIEW TURN EVALUATION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackInterviewTurn(prompt: string): InterviewTurnEvaluation {
    const topicInfo = detectTopicFromPrompt(prompt);
    const p = prompt.toLowerCase();

    // -----------------------------------------------------------------------
    // PYTHON INTERVIEW TURN
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "python") {
      if (p.includes("pointer") || p.includes("reference") || p.includes("heap") || p.includes("id(") || p.includes("mutable")) {
        return {
          understanding: "strong",
          conceptCoverage: ["object_references", "memory_model", "mutability"],
          misconceptions: [],
          reasoningQuality: "Precise articulation of Python's heap memory references and mutability.",
          confidence: 0.94,
          nextAction: "advance",
          nextQuestion: "Excellent articulation! Now, how does Python's garbage collector manage circular references between mutable objects that reference each other?",
          nextConceptId: "concept_py_memory",
          feedbackToStudent: "Outstanding explanation of Python object references and heap allocation!",
        };
      }

      if (p.includes("copy") || p.includes("clone") || p.includes("shallow")) {
        return {
          understanding: "partial",
          conceptCoverage: ["copy_semantics", "mutability"],
          misconceptions: ["Confusing shallow copy with deep copy on nested collections"],
          reasoningQuality: "Good intuition on copying, but omits implications of nested inner references.",
          confidence: 0.88,
          nextAction: "follow_up",
          nextQuestion: "That's on the right track! If you make a shallow copy of a nested list using `list.copy()`, what happens when you modify an inner element of that copied list?",
          nextConceptId: "concept_py_datastructures",
          feedbackToStudent: "You touched on copying objects, but let's clarify how shallow copies handle nested collections.",
        };
      }

      if (p.includes("idk") || p.includes("don't know") || p.length < 20) {
        return {
          understanding: "weak",
          conceptCoverage: [],
          misconceptions: ["procedural_guessing"],
          reasoningQuality: "Insufficient reasoning provided.",
          confidence: 0.85,
          nextAction: "remediate",
          nextQuestion: "That's completely fine. Think of a variable as a sticky note with a name on it placed on a box. If you put two sticky notes on the exact same box, what happens if you add something to the box using the first sticky note?",
          nextConceptId: "concept_py_variables",
          feedbackToStudent: "Let's build intuition with a helpful memory analogy.",
        };
      }

      return {
        understanding: "strong",
        conceptCoverage: ["python_fundamentals", "data_structures"],
        misconceptions: [],
        reasoningQuality: "Clear conceptual articulation with appropriate Python programming intuition.",
        confidence: 0.9,
        nextAction: "follow_up",
        nextQuestion: "Good insight! Can you connect that concept to why defining mutable default arguments like `def func(arr=[])` produces unexpected shared behavior across multiple invocations?",
        nextConceptId: "concept_py_functions",
        feedbackToStudent: "Strong grasp demonstrated. Let's explore how default argument binding works in Python.",
      };
    }

    // -----------------------------------------------------------------------
    // CALCULUS INTERVIEW TURN
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "calculus") {
      if (p.includes("tangent") || p.includes("slope") || p.includes("instantaneous") || p.includes("limit") || p.includes("rate")) {
        return {
          understanding: "strong",
          conceptCoverage: ["derivatives", "tangent_slopes", "instantaneous_rate"],
          misconceptions: [],
          reasoningQuality: "Rigorous mathematical description connecting difference quotients to tangent slopes.",
          confidence: 0.94,
          nextAction: "advance",
          nextQuestion: "Outstanding explanation! How does the sign and magnitude of the second derivative inform us about the concavity and inflection points of that curve?",
          nextConceptId: "concept_calc_derivatives",
          feedbackToStudent: "Excellent articulation of instantaneous rate of change via limits!",
        };
      }

      if (p.includes("average") || p.includes("secant")) {
        return {
          understanding: "partial",
          conceptCoverage: ["secant_slopes", "average_rate"],
          misconceptions: ["Confusing average rate across an interval with instantaneous rate at a point"],
          reasoningQuality: "Correctly identifies average slope, but misses the limiting behavior.",
          confidence: 0.88,
          nextAction: "follow_up",
          nextQuestion: "Good start with secant lines! What exact limiting process converts that average rate between two separate points into the instantaneous rate at a single point?",
          nextConceptId: "concept_calc_limits",
          feedbackToStudent: "You have the average rate down. Let's see how taking the limit as delta-x shrinks to zero produces the derivative.",
        };
      }

      if (p.includes("idk") || p.includes("don't know") || p.length < 20) {
        return {
          understanding: "weak",
          conceptCoverage: [],
          misconceptions: ["procedural_guessing"],
          reasoningQuality: "Insufficient reasoning provided.",
          confidence: 0.85,
          nextAction: "remediate",
          nextQuestion: "No worries! Imagine driving a car: your trip odometer measures total distance traveled over time, while your speedometer shows how fast you're moving right now. How does that speedometer relate to a derivative?",
          nextConceptId: "concept_calc_rates",
          feedbackToStudent: "Let's build intuition using a speedometer analogy.",
        };
      }

      return {
        understanding: "strong",
        conceptCoverage: ["calculus_foundations", "analytical_methods"],
        misconceptions: [],
        reasoningQuality: "Clear conceptual articulation with appropriate mathematical intuition.",
        confidence: 0.9,
        nextAction: "follow_up",
        nextQuestion: "Great explanation! Can you explain how the Fundamental Theorem of Calculus links this derivative rate back to accumulated area under a curve?",
        nextConceptId: "concept_calc_ftc",
        feedbackToStudent: "Strong grasp demonstrated. Let's connect differentiation to integral accumulation.",
      };
    }

    // -----------------------------------------------------------------------
    // PHOTOSYNTHESIS INTERVIEW TURN
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "photosynthesis") {
      if (p.includes("thylakoid") || p.includes("chlorophyll") || p.includes("photon") || p.includes("atp") || p.includes("nadph") || p.includes("proton")) {
        return {
          understanding: "strong",
          conceptCoverage: ["light_reactions", "thylakoid_chemiosmosis", "photolysis"],
          misconceptions: [],
          reasoningQuality: "Thorough biological precision explaining photochemical excitation and chemiosmosis.",
          confidence: 0.94,
          nextAction: "advance",
          nextQuestion: "Superb explanation of the light-dependent reactions! Now explain how the ATP and NADPH produced in the thylakoid are consumed inside the stroma during the Calvin cycle.",
          nextConceptId: "concept_photo_calvin",
          feedbackToStudent: "Outstanding explanation of photochemical excitation and proton gradient generation!",
        };
      }

      if (p.includes("co2") && (p.includes("oxygen") || p.includes("o2"))) {
        return {
          understanding: "partial",
          conceptCoverage: ["gas_exchange"],
          misconceptions: ["Belief that oxygen byproduct originates from carbon dioxide"],
          reasoningQuality: "Identifies gas exchange but confuses molecular source of released oxygen.",
          confidence: 0.88,
          nextAction: "follow_up",
          nextQuestion: "Careful check on molecular sources: does the oxygen gas released during photosynthesis come from the carbon dioxide taken in, or from the splitting of water?",
          nextConceptId: "concept_photo_light",
          feedbackToStudent: "You touched on gas exchange, but let's clarify where the oxygen atoms actually originate.",
        };
      }

      if (p.includes("idk") || p.includes("don't know") || p.length < 20) {
        return {
          understanding: "weak",
          conceptCoverage: [],
          misconceptions: ["procedural_guessing"],
          reasoningQuality: "Insufficient reasoning provided.",
          confidence: 0.85,
          nextAction: "remediate",
          nextQuestion: "That's completely fine. Think of solar panels: light strikes the panel to create electricity that charges a battery. In a plant leaf, what captures the sunlight and what high-energy molecule acts as the charged battery?",
          nextConceptId: "concept_photo_light",
          feedbackToStudent: "Let's build intuition using a solar energy analogy.",
        };
      }

      return {
        understanding: "strong",
        conceptCoverage: ["photosynthetic_mechanisms", "bioenergetics"],
        misconceptions: [],
        reasoningQuality: "Clear biological articulation with appropriate bioenergetic intuition.",
        confidence: 0.9,
        nextAction: "follow_up",
        nextQuestion: "Good insight! Can you connect that concept to why high temperatures cause RuBisCO to bind oxygen instead of CO2, leading to photorespiration?",
        nextConceptId: "concept_photo_c4",
        feedbackToStudent: "Strong grasp demonstrated. Let's examine how environmental factors affect enzymatic efficiency.",
      };
    }

    // -----------------------------------------------------------------------
    // ORGANIC CHEMISTRY INTERVIEW TURN (STRICTLY CHEMISTRY)
    // -----------------------------------------------------------------------
    if (topicInfo.kind === "chemistry") {
      if (p.includes("provides the energy") || (p.includes("energy") && p.includes("catalyst"))) {
        return {
          understanding: "partial",
          conceptCoverage: ["catalysis", "activation_energy"],
          misconceptions: ["Belief that catalyst provides thermal energy"],
          reasoningQuality: "Intuitive but confuses lowering activation energy with supplying energy.",
          confidence: 0.88,
          nextAction: "follow_up",
          nextQuestion: "Let's examine that carefully. If the catalyst provided energy, it would be consumed. Why is the catalyst not consumed in the overall reaction, and what barrier does it actually lower?",
          nextConceptId: "concept_organic_reactions",
          feedbackToStudent: "You touched on the reaction happening faster, but let's clarify how catalysts operate without providing net energy.",
        };
      }

      if (p.includes("surface") || p.includes("adsorption") || p.includes("barrier") || p.includes("activation")) {
        return {
          understanding: "strong",
          conceptCoverage: ["heterogeneous_catalysis", "adsorption", "activation_energy"],
          misconceptions: [],
          reasoningQuality: "Thorough scientific precision with correct mechanistic terminology.",
          confidence: 0.94,
          nextAction: "advance",
          nextQuestion: "Excellent articulation! Now, how does this same catalytic addition affect the stereochemistry of a substituted cycloalkene?",
          nextConceptId: "concept_isomers_foundations",
          feedbackToStudent: "Outstanding explanation of adsorption and activation energy reduction!",
        };
      }

      if (p.includes("idk") || p.includes("don't know") || p.length < 20) {
        return {
          understanding: "weak",
          conceptCoverage: [],
          misconceptions: ["procedural_guessing"],
          reasoningQuality: "Insufficient reasoning provided.",
          confidence: 0.85,
          nextAction: "remediate",
          nextQuestion: "That's completely fine. Let's step back: imagine you want two friends to meet. Instead of having them wander randomly, you invite them both to your table. How does the metal catalyst act like that table for hydrogen and ethene?",
          nextConceptId: "concept_organic_reactions",
          feedbackToStudent: "Let's build intuition with a helpful physical analogy.",
        };
      }

      return {
        understanding: "strong",
        conceptCoverage: ["organic_bonding", "molecular_architecture"],
        misconceptions: [],
        reasoningQuality: "Clear conceptual articulation with appropriate chemical intuition.",
        confidence: 0.9,
        nextAction: "follow_up",
        nextQuestion: "Good insight! Can you connect that concept to why branched hydrocarbons have lower boiling points than their linear isomers?",
        nextConceptId: "concept_isomers_foundations",
        feedbackToStudent: "Strong grasp demonstrated. Let's explore the physical consequences of this molecular shape.",
      };
    }

    // -----------------------------------------------------------------------
    // GENERAL / ARBITRARY TOPIC INTERVIEW TURN (ZERO CHEMISTRY)
    // -----------------------------------------------------------------------
    const topicTitle = topicInfo.displayName;

    if (p.includes("idk") || p.includes("don't know") || p.length < 20) {
      return {
        understanding: "weak",
        conceptCoverage: [],
        misconceptions: ["procedural_guessing"],
        reasoningQuality: "Insufficient reasoning provided.",
        confidence: 0.85,
        nextAction: "remediate",
        nextQuestion: `That's completely fine. Let's step back and imagine an analogy for ${topicTitle}: how would you describe the most basic operational rule of this subject to someone hearing about it for the first time?`,
        nextConceptId: "concept_foundations",
        feedbackToStudent: `Let's break ${topicTitle} down into simple, intuitive building blocks.`,
      };
    }

    return {
      understanding: "strong",
      conceptCoverage: [`${topicTitle}_foundations`, "analytical_reasoning"],
      misconceptions: [],
      reasoningQuality: `Clear conceptual articulation demonstrating domain intuition in ${topicTitle}.`,
      confidence: 0.9,
      nextAction: "follow_up",
      nextQuestion: `Well reasoned! How does that principle in ${topicTitle} apply when non-standard edge constraints are introduced?`,
      nextConceptId: "concept_foundations",
      feedbackToStudent: `Strong conceptual grasp of ${topicTitle}. Let's test how this principle behaves under challenging constraints.`,
    };
  }

  // =========================================================================
  // 5. INTERVIEW SUMMARY (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackInterviewSummary(prompt: string = ""): InterviewSummary {
    const topicInfo = detectTopicFromPrompt(prompt);
    const sessionId = `int_session_${Date.now()}`;

    if (topicInfo.kind === "python") {
      return {
        sessionId,
        topic: "Python Programming Oral Defense",
        overallScore: 88,
        understandingLevel: "proficient",
        conceptsDemonstrated: [
          "Variables & Object References",
          "Data Structure Mutability & Hash Tables",
          "Function Scoping & Execution Frames",
          "Iteration Protocols & Comprehensions",
        ],
        strongConcepts: [
          "Clear explanation of heap object references vs variable names",
          "Accurate analysis of O(1) hash table lookup vs O(n) list scans",
        ],
        weakConcepts: [
          "Nuance of shallow copying on nested mutable structures",
        ],
        misconceptions: [
          "Initial assumption that variable assignment clones mutable objects",
        ],
        reasoningQualitySummary:
          "Student demonstrated solid conceptual fluidity regarding Python's execution model and memory architecture, articulately explaining reference binding and function scope.",
        recommendedNextSteps: [
          "Explore generator pipelines and custom iterator protocols",
          "Study object-oriented dunder methods and metaclasses",
        ],
        sampleEvidenceQuote:
          "Variables in Python store object references in memory, so mutating a shared list through one name updates all references to it.",
      };
    }

    if (topicInfo.kind === "calculus") {
      return {
        sessionId,
        topic: "Calculus Multi-Turn Oral Defense",
        overallScore: 89,
        understandingLevel: "proficient",
        conceptsDemonstrated: [
          "Difference Quotient Limits",
          "Derivatives as Instantaneous Tangent Slopes",
          "Chain Rule Composite Differentiation",
          "Fundamental Theorem of Calculus",
        ],
        strongConcepts: [
          "Clear geometric interpretation of secant-to-tangent limit convergence",
          "Accurate articulation of differentiation and integration as inverse processes",
        ],
        weakConcepts: [
          "Piecewise differentiability criteria at sharp cusps and jump boundaries",
        ],
        misconceptions: [
          "Initial confusion between indeterminate limit forms and arithmetic division",
        ],
        reasoningQualitySummary:
          "Student demonstrated rigorous analytical reasoning, fluently translating geometric intuition of curves into formal limit and derivative calculus.",
        recommendedNextSteps: [
          "Advance to multivariable partial differentiation and gradient vectors",
          "Explore Taylor polynomial series approximations",
        ],
        sampleEvidenceQuote:
          "The derivative is the limit of the difference quotient as interval width approaches zero, yielding the instantaneous tangent slope.",
      };
    }

    if (topicInfo.kind === "photosynthesis") {
      return {
        sessionId,
        topic: "Photosynthesis Multi-Turn Oral Defense",
        overallScore: 90,
        understandingLevel: "expert",
        conceptsDemonstrated: [
          "Photochemical Excitation & Light Reactions",
          "Thylakoid Chemiosmosis & ATP Synthase",
          "Photolysis of Water Molecules",
          "Calvin Cycle & RuBisCO Carbon Fixation",
        ],
        strongConcepts: [
          "Precise explanation of proton motive force generation across the thylakoid membrane",
          "Accurate description of carbon fixation phases in the chloroplast stroma",
        ],
        weakConcepts: [
          "Mechanisms of RuBisCO oxygenase competition under extreme heat stress",
        ],
        misconceptions: [
          "Initial suggestion that byproduct oxygen originates from carbon dioxide rather than water",
        ],
        reasoningQualitySummary:
          "Student exhibited thorough biological comprehension, connecting quantum photochemical absorption to cellular chemiosmosis and enzymatic carbon assimilation.",
        recommendedNextSteps: [
          "Investigate C4 and CAM plant morphological adaptations to arid environments",
          "Compare chloroplast photophosphorylation with mitochondrial oxidative phosphorylation",
        ],
        sampleEvidenceQuote:
          "Water photolysis at Photosystem II supplies replacement electrons and generates the lumen proton gradient that drives ATP synthase.",
      };
    }

    if (topicInfo.kind === "chemistry") {
      return {
        sessionId,
        topic: "Organic Chemistry Multi-Turn Oral Defense",
        overallScore: 88,
        understandingLevel: "proficient",
        conceptsDemonstrated: [
          "Carbon Tetravalency",
          "Alkene Saturation",
          "Heterogeneous Catalysis",
          "Constitutional Isomerism",
        ],
        strongConcepts: [
          "Clear explanation of covalent architecture and sp3 bonding",
          "Accurate description of reactant adsorption on metal catalyst surfaces",
        ],
        weakConcepts: [
          "Distinguishing catalyst activation energy reduction from energy provision",
        ],
        misconceptions: [
          "Initial suggestion that catalyst supplies thermal energy to drive the reaction",
        ],
        reasoningQualitySummary:
          "Student demonstrated strong verbal fluidity, responded adaptively to challenging counter-prompts, and self-corrected when prompted on catalyst thermodynamics.",
        recommendedNextSteps: [
          "Review transition state energy diagrams for catalyzed vs uncatalyzed additions",
          "Advance to Stereoisomerism and Chiral Enantiomer separation",
        ],
        sampleEvidenceQuote:
          "Hydrogen is added across the double bond on the metal surface, which lowers the activation barrier.",
      };
    }

    // General / Arbitrary Topic Summary (Zero Chemistry)
    const topicTitle = topicInfo.displayName;

    return {
      sessionId,
      topic: `${topicTitle} Multi-Turn Oral Defense`,
      overallScore: 86,
      understandingLevel: "proficient",
      conceptsDemonstrated: [
        `Core Axioms of ${topicTitle}`,
        "Systematic Structural Relationships",
        "Analytical Problem-Solving Techniques",
        "First-Principles Synthesis",
      ],
      strongConcepts: [
        `Clear articulation of foundational principles in ${topicTitle}`,
        "Consistent application of structured deductive logic",
      ],
      weakConcepts: [
        `Evaluating non-standard edge conditions in ${topicTitle}`,
      ],
      misconceptions: [
        "Initial tendency to apply heuristic shortcuts before checking baseline constraints",
      ],
      reasoningQualitySummary:
        `Student demonstrated strong conceptual clarity and systematic analytical reasoning throughout the oral defense of ${topicTitle}.`,
      recommendedNextSteps: [
        `Explore advanced applications and complex case studies in ${topicTitle}`,
        "Engage with multi-variable edge case analysis",
      ],
      sampleEvidenceQuote:
        `Foundational principles in ${topicTitle} provide the structured framework needed to resolve complex system interactions.`,
    };
  }

  // =========================================================================
  // 6. REMEDIATION & TOPIC PLAN GENERATION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackRemediation(prompt: string = ""): RemediationPlan {
    const topicInfo = detectTopicFromPrompt(prompt);

    if (topicInfo.kind === "python") {
      return {
        conceptId: "concept_py_remediation",
        conceptTitle: "Python Variable References & Mutability Scaffolding",
        diagnosedMisconception: "Student assumes variable assignment copies the underlying data structure rather than creating a shared reference.",
        prescriptiveGuidance:
          "Remember: in Python, variables are names pointing to objects in memory. When you assign `b = a`, both names point to the SAME object. To create an independent copy of a list, use `b = a.copy()` or `list(a)`.",
        concreteAnalogy:
          "Think of a contact entry in your phone: having two different names (like 'Work' and 'Office') for the same phone number does not create two separate phones.",
        practiceChallenge: {
          id: "rc_py_1",
          prompt: "Given `x = [1, 2]`, what happens to `x` after executing `y = x; y.append(3)`?",
          options: ["x becomes [1, 2, 3]", "x remains [1, 2]", "Raises an error", "x becomes [3]"],
          correctOptionIndex: 0,
          explanation: "Because x and y reference the same list object in memory, mutating y also mutates x.",
          difficulty: "foundational",
        },
        estimatedMinutesToRecover: 4,
      };
    }

    if (topicInfo.kind === "calculus") {
      return {
        conceptId: "concept_calc_remediation",
        conceptTitle: "Secant to Tangent Rate of Change Scaffolding",
        diagnosedMisconception: "Student confuses the average rate of change between two points with the instantaneous rate at a single point.",
        prescriptiveGuidance:
          "Remember: average rate of change measures slope across a span [a, b]. The derivative is instantaneous because the span shrinks to zero using a limit.",
        concreteAnalogy:
          "Average speed is distance divided by total trip time. Instantaneous speed is your speedometer reading right at this split second.",
        practiceChallenge: {
          id: "rc_calc_1",
          prompt: "What mathematical operation transforms an average rate of change into an instantaneous rate of change?",
          options: [
            "Taking the limit as the interval approaches zero",
            "Multiplying by the total distance",
            "Dividing by zero directly",
            "Squaring the average rate",
          ],
          correctOptionIndex: 0,
          explanation: "The limit of the difference quotient as interval width h approaches zero yields the derivative.",
          difficulty: "foundational",
        },
        estimatedMinutesToRecover: 4,
      };
    }

    if (topicInfo.kind === "photosynthesis") {
      return {
        conceptId: "concept_photo_remediation",
        conceptTitle: "Water Photolysis & Electron Replenishment Scaffolding",
        diagnosedMisconception: "Student assumes byproduct oxygen gas comes from carbon dioxide rather than water.",
        prescriptiveGuidance:
          "Remember: oxygen gas (O2) released by plants originates from splitting water molecules (H2O) at Photosystem II, not from CO2.",
        concreteAnalogy:
          "Think of water as a battery pack: the cell strips electrons and protons from H2O to recharge electron transport, leaving oxygen like an empty container to be released.",
        practiceChallenge: {
          id: "rc_photo_1",
          prompt: "What molecule is cleaved to generate the byproduct oxygen gas during photosynthesis?",
          options: ["Water (H2O)", "Carbon dioxide (CO2)", "Glucose (C6H12O6)", "ATP"],
          correctOptionIndex: 0,
          explanation: "Photolysis splits water into protons, electrons, and molecular oxygen.",
          difficulty: "foundational",
        },
        estimatedMinutesToRecover: 4,
      };
    }

    if (topicInfo.kind === "chemistry") {
      return {
        conceptId: "concept_catalysis_remediation",
        conceptTitle: "Catalyst Energy Barrier Scaffolding",
        diagnosedMisconception: "Student assumes catalysts provide heat or thermodynamic energy to reactions.",
        prescriptiveGuidance:
          "Remember: catalysts NEVER add energy to a reaction or change equilibrium constants (ΔG). They merely offer an alternative reaction pathway featuring a lower activation energy (Ea), like taking a tunnel through a mountain rather than climbing over the peak.",
        concreteAnalogy:
          "Think of a mountain tunnel: it does not push your car forward, but it lowers the height you must climb to reach the other side.",
        practiceChallenge: {
          id: "rc_q1",
          prompt: "Which statement accurately describes the thermodynamic effect of adding a catalyst?",
          options: [
            "It lowers activation energy (Ea) without altering the net free energy change (ΔG)",
            "It provides exothermic heat to power the reaction",
            "It is consumed in the reaction to create products",
            "It shifts the equilibrium constant to 100% products",
          ],
          correctOptionIndex: 0,
          explanation: "Catalysts lower the kinetic barrier (Ea) but leave thermodynamic states (ΔG) unchanged.",
          difficulty: "intermediate",
        },
        estimatedMinutesToRecover: 4,
      };
    }

    // General Topic Remediation
    const topicTitle = topicInfo.displayName;
    return {
      conceptId: "concept_general_remediation",
      conceptTitle: `${topicTitle} First-Principles Scaffolding`,
      diagnosedMisconception: `Student applies superficial heuristics instead of verifying first-principles constraints in ${topicTitle}.`,
      prescriptiveGuidance:
        `Return to foundational principles: trace each assumption step-by-step and verify that core domain constraints are satisfied.`,
      concreteAnalogy:
        `Constructing a building: you cannot frame the roof before ensuring the foundation footings are plumb, level, and solid.`,
      practiceChallenge: {
        id: `rc_${topicTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_1`,
        prompt: `When encountering an ambiguous edge scenario in ${topicTitle}, what is the most reliable analytical step?`,
        options: [
          `Deconstruct the scenario back to verified foundational axioms and constraints`,
          `Make an arbitrary guess without checking definitions`,
          `Assume constraints do not apply to edge cases`,
          `Abandon the problem entirely`,
        ],
        correctOptionIndex: 0,
        explanation: `Deconstructing complex edge cases to first principles guarantees consistent, reliable reasoning.`,
        difficulty: "foundational",
      },
      estimatedMinutesToRecover: 4,
    };
  }

  public generateFallbackTopicPlan(prompt: string): unknown {
    const topicInfo = detectTopicFromPrompt(prompt);
    const isPython = topicInfo.kind === "python";
    const isCalculus = topicInfo.kind === "calculus";
    const isPhotosynthesis = topicInfo.kind === "photosynthesis";
    const isChemistry = topicInfo.kind === "chemistry";

    let category = "Academic Study";
    if (isPython) category = "Computer Science";
    else if (isCalculus) category = "Mathematics";
    else if (isPhotosynthesis) category = "Biological Sciences";
    else if (isChemistry) category = "Chemistry & Physical Sciences";

    const title = topicInfo.displayName;

    return {
      topic: title,
      category,
      estimatedHours: 12,
      overview: `A structured curriculum pathway designed for systematic mastery and conceptual progression in ${title}.`,
      prerequisiteSummary: `Foundational concepts and principles of ${title}.`,
      stages: [
        {
          id: "stage-1",
          stageNumber: 1,
          title: "Foundations & Core Principles",
          tagline: "Essential Building Blocks",
          objective: `Master primary concepts and initial mechanics of ${title}.`,
          conceptIds: ["c1", "c2"],
          prerequisites: ["None"],
          learningActivities: ["Interactive lessons", "Guided practice"],
          milestoneAssessment: "Foundations Checkpoint",
          masteryCondition: "Demonstrate >= 80% mastery",
        },
        {
          id: "stage-2",
          stageNumber: 2,
          title: "Intermediate Applications",
          tagline: "Mechanism & Problem Solving",
          objective: `Apply foundational rules of ${title} to realistic multi-step problems.`,
          conceptIds: ["c3", "c4"],
          prerequisites: ["Stage 1"],
          learningActivities: ["Worked examples", "Analytical exercises"],
          milestoneAssessment: "Intermediate Checkpoint",
          masteryCondition: "Demonstrate >= 80% mastery",
        },
      ],
      concepts: [
        {
          id: "c1",
          name: "Foundational Rules & Principles",
          summary: `Core axioms and preliminary principles of ${title}.`,
          difficulty: "foundational",
          prerequisiteIds: [],
        },
        {
          id: "c2",
          name: "Elementary Mechanics",
          summary: `Basic interactions and operational methods in ${title}.`,
          difficulty: "foundational",
          prerequisiteIds: ["c1"],
        },
        {
          id: "c3",
          name: "Complex Dynamics",
          summary: `Synthesizing principles to solve non-trivial cases in ${title}.`,
          difficulty: "intermediate",
          prerequisiteIds: ["c2"],
        },
        {
          id: "c4",
          name: "Synthesis & Mastery",
          summary: `Comprehensive evaluation and high-level reasoning in ${title}.`,
          difficulty: "advanced",
          prerequisiteIds: ["c3"],
        },
      ],
    };
  }

  // =========================================================================
  // 7. OPENING QUESTION (100% TOPIC-AWARE)
  // =========================================================================
  public generateFallbackOpeningQuestion(prompt: string): unknown {
    const topicInfo = detectTopicFromPrompt(prompt);

    if (topicInfo.kind === "python") {
      return {
        openingQuestion:
          "In your own words, explain how Python variables and memory references operate, and what distinguishes mutable collections like lists from immutable types like tuples.",
        targetConceptId: "concept_py_memory",
        reasoning:
          "Tests core understanding of memory model, variables, and type mutability in Python.",
      };
    }

    if (topicInfo.kind === "calculus") {
      return {
        openingQuestion:
          "In your own words, explain what a limit represents in calculus, and how taking the limit of a difference quotient allows us to find the instantaneous rate of change of a curve.",
        targetConceptId: "concept_calc_limits",
        reasoning:
          "Probes fundamental conceptual grasp of limits, secant-to-tangent progression, and derivative definition.",
      };
    }

    if (topicInfo.kind === "photosynthesis") {
      return {
        openingQuestion:
          "In your own words, explain how chlorophyll and accessory pigments capture light energy in chloroplasts, and how this initiates the light-dependent reactions of photosynthesis.",
        targetConceptId: "concept_photo_light",
        reasoning:
          "Tests foundational comprehension of photochemical excitation and light absorption mechanics.",
      };
    }

    if (topicInfo.kind === "chemistry") {
      return {
        openingQuestion:
          "To begin our oral defense on Organic Chemistry: explain what occurs at the molecular level when an alkene undergoes catalytic hydrogenation over a transition metal surface, and how orbital hybridization changes.",
        targetConceptId: "concept_carbon_bonding",
        reasoning:
          "Probes fundamental orbital hybridization and addition reaction mechanisms.",
      };
    }

    const topicTitle = topicInfo.displayName;
    return {
      openingQuestion:
        `To begin our oral defense on ${topicTitle}: in your own words, explain the fundamental principles that govern this domain and how they guide problem-solving.`,
      targetConceptId: "concept_foundations",
      reasoning:
        `Probes foundational comprehension of core axioms and problem-solving methodologies in ${topicTitle}.`,
    };
  }

  public generateFallbackOpening(prompt: string): unknown {
    return this.generateFallbackOpeningQuestion(prompt);
  }
}
