import { TopicCurriculumPlan } from '@/types/topic-path';
import { ORGANIC_CHEMISTRY_TOPIC_PLAN } from '@/lib/chemistry/organic-chemistry-demo';

/**
 * Pre-curated verified topic curriculum plans for demonstration
 * Demonstrates how KEA decomposes diverse topics into prerequisite-gated stages.
 */
export const SAMPLE_TOPIC_PLANS: Record<string, TopicCurriculumPlan> = {
  'organic chemistry': ORGANIC_CHEMISTRY_TOPIC_PLAN,
  chemistry: ORGANIC_CHEMISTRY_TOPIC_PLAN,
  python: {
    topic: 'Python Programming',
    category: 'Computer Science',
    estimatedHours: 12,
    overview:
      'Master core programming concepts, data manipulation, modular functions, and problem-solving through hands-on Python scripts.',
    prerequisiteSummary:
      'Requires fundamental logic, basic algebra (variables), and reading comprehension. No prior coding experience required.',
    diagnosticQuestions: [
      {
        id: 'py-diag-1',
        question: 'What is the primary role of a variable in a programming language?',
        context: 'Foundation Check: Programming Basics',
        conceptTested: 'Variables & Memory Storage',
        options: [
          { id: 'opt-a', label: 'To permanently freeze computer memory', isCorrect: false },
          { id: 'opt-b', label: 'To store and label data values in memory for later use', isCorrect: true },
          { id: 'opt-c', label: 'To automatically format text on a screen', isCorrect: false },
          { id: 'opt-d', label: 'To connect a computer to the internet', isCorrect: false },
        ],
        explanation: 'Variables act as labeled storage containers in memory holding data values that can be referenced and manipulated.',
      },
      {
        id: 'py-diag-2',
        question: 'Which of the following describes a conditional statement (like "if/else")?',
        context: 'Foundation Check: Logic & Control Flow',
        conceptTested: 'Conditional Logic',
        options: [
          { id: 'opt-a', label: 'A command that repeats code infinitely', isCorrect: false },
          { id: 'opt-b', label: 'A rule that executes specific code only when a condition is true', isCorrect: true },
          { id: 'opt-c', label: 'A tool for drawing graphics in Python', isCorrect: false },
          { id: 'opt-d', label: 'A mathematical formula for division', isCorrect: false },
        ],
        explanation: 'Conditionals evaluate boolean conditions and branch execution based on whether the condition is true or false.',
      },
    ],
    stages: [
      {
        id: 'stage-py-1',
        stageNumber: 1,
        title: 'Foundations of Code',
        tagline: 'Syntax, Variables & Data Types',
        objective: 'Learn Python syntax, primitive types (integers, strings, floats), and standard I/O.',
        concepts: [
          { id: 'c1', name: 'Variables & Types', summary: 'Declaring integer, float, string variables', difficulty: 'foundational', status: 'unlocked' },
          { id: 'c2', name: 'Standard I/O', summary: 'Using print() and input() for user interaction', difficulty: 'foundational', status: 'unlocked' },
          { id: 'c3', name: 'Basic Operators', summary: 'Arithmetic and string concatenation operations', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['Basic reading & arithmetic'],
        learningActivities: ['Interactive console playground', 'Visual memory diagram simulation', 'Guided variable tracker'],
        milestoneAssessment: 'CLI Interactive Bio Generator: Build a 3-variable dynamic greeting program',
        masteryCondition: 'Demonstrate ≥ 80% on syntax and variable assignment challenges without syntax errors',
        status: 'unlocked',
      },
      {
        id: 'stage-py-2',
        stageNumber: 2,
        title: 'Structured Collections',
        tagline: 'Lists, Dictionaries & Tuples',
        objective: 'Store and manipulate multi-item collections, index elements, and manage key-value pairs.',
        concepts: [
          { id: 'c4', name: 'Lists & Slicing', summary: 'Ordered sequences, append, and slice notation', difficulty: 'intermediate', status: 'locked' },
          { id: 'c5', name: 'Dictionaries', summary: 'Key-value lookups, hash mapping semantics', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Foundations of Code'],
        learningActivities: ['Shopping cart inventory lab', 'Visual list mutation sandbox'],
        milestoneAssessment: 'Inventory Management Task: Filter, update, and sort a dictionary of products',
        masteryCondition: 'Achieve ≥ 80% accuracy in list indexing and dictionary lookups across 5 challenge items',
        status: 'locked',
      },
      {
        id: 'stage-py-3',
        stageNumber: 3,
        title: 'Control Flow & Functions',
        tagline: 'Conditionals, Loops & Modular Logic',
        objective: 'Write modular, reusable functions and control execution flow using loops and conditionals.',
        concepts: [
          { id: 'c6', name: 'If/Else Branching', summary: 'Boolean logic and nested conditions', difficulty: 'intermediate', status: 'locked' },
          { id: 'c7', name: 'Loops (For & While)', summary: 'Iterating sequences with accumulators', difficulty: 'intermediate', status: 'locked' },
          { id: 'c8', name: 'Functions & Scope', summary: 'Defining def statements, arguments, and return values', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Structured Collections'],
        learningActivities: ['Algorithm tracing sandbox', 'Refactoring redundant code into pure functions'],
        milestoneAssessment: 'Grade Analyzer Challenge: Compute student scores and grade distributions with functions',
        masteryCondition: 'Successfully write 3 bug-free pure functions handling edge cases',
        status: 'locked',
      },
      {
        id: 'stage-py-4',
        stageNumber: 4,
        title: 'Mastery Capstone',
        tagline: 'Real-World Python Application',
        objective: 'Synthesize data structures, functions, and error handling into a fully working CLI application.',
        concepts: [
          { id: 'c9', name: 'File Handling & Exceptions', summary: 'Reading/writing files and try/except blocks', difficulty: 'advanced', status: 'locked' },
          { id: 'c10', name: 'Capstone Architecture', summary: 'Building a modular, multi-file Python utility', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: Control Flow & Functions'],
        learningActivities: ['End-to-end data processing mini-project', 'Code review with AI tutor feedback'],
        milestoneAssessment: 'Automated Weather Report Parser & Log Generator',
        masteryCondition: 'Complete end-to-end capstone specification with 100% test pass rate',
        status: 'locked',
      },
    ],
  },

  fractions: {
    topic: 'Understanding Fractions',
    category: 'Class 4 Mathematics',
    estimatedHours: 6,
    overview:
      'Build intuitive conceptual mastery of parts of a whole, visual equivalence, like and unlike comparison, and addition.',
    prerequisiteSummary:
      'Requires whole-number counting, basic division as equal sharing, and number line orientation.',
    diagnosticQuestions: [
      {
        id: 'frac-diag-1',
        question: 'If a whole circle is cut into 4 equal pieces and 1 piece is shaded, what fraction is shaded?',
        context: 'Foundation Check: Parts of a Whole',
        conceptTested: 'Unit Fractions & Part-Whole Relation',
        options: [
          { id: 'opt-a', label: '1/4', isCorrect: true },
          { id: 'opt-b', label: '4/1', isCorrect: false },
          { id: 'opt-c', label: '1/3', isCorrect: false },
          { id: 'opt-d', label: '3/4', isCorrect: false },
        ],
        explanation: 'The denominator (4) shows the total number of equal parts, and the numerator (1) shows the parts taken.',
      },
      {
        id: 'frac-diag-2',
        question: 'Which is larger: 1/2 of a chocolate bar or 1/8 of the same bar?',
        context: 'Foundation Check: Fraction Magnitude Intuition',
        conceptTested: 'Denominator Magnitude & Whole-Number Bias',
        options: [
          { id: 'opt-a', label: '1/8 because 8 is bigger than 2', isCorrect: false },
          { id: 'opt-b', label: '1/2 because splitting into fewer pieces makes each piece bigger', isCorrect: true },
          { id: 'opt-c', label: 'Both are equal', isCorrect: false },
          { id: 'opt-d', label: 'Cannot be determined', isCorrect: false },
        ],
        explanation: 'Dividing into 2 pieces yields much larger portions than dividing the same whole into 8 pieces.',
      },
    ],
    stages: [
      {
        id: 'stage-frac-1',
        stageNumber: 1,
        title: 'Foundations of Fractions',
        tagline: 'Equal Parts & Numerator/Denominator',
        objective: 'Internalize that fractions represent equal partitions of a single whole, and read fraction notation.',
        concepts: [
          { id: 'f1', name: 'Equal Sharing & Parts', summary: 'Partitioning shapes and collections into fair portions', difficulty: 'foundational', status: 'unlocked' },
          { id: 'f2', name: 'Numerator & Denominator', summary: 'Understanding top number (count) vs bottom number (unit size)', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['Equal sharing of integers', 'Basic spatial partition'],
        learningActivities: ['Virtual pizza slicer manipulative', 'Space fuel gauge visualization', 'Interactive bar partitioner'],
        milestoneAssessment: 'Visual Partition Check: Identify and draw fractional values on partitioned bars',
        masteryCondition: 'Score ≥ 80% on multi-modal representation without whole-number bias confusion',
        status: 'unlocked',
      },
      {
        id: 'stage-frac-2',
        stageNumber: 2,
        title: 'Equivalence & Like Comparison',
        tagline: 'Equivalent Models & Common Denominators',
        objective: 'Recognize equivalent fractions visually (e.g. 1/2 = 2/4) and compare fractions with common denominators.',
        concepts: [
          { id: 'f3', name: 'Comparing Like Fractions', summary: 'Comparing 2/6 vs 5/6 using identical unit size', difficulty: 'intermediate', status: 'locked' },
          { id: 'f4', name: 'Visual Equivalent Fractions', summary: 'Seeing 1/2 = 2/4 = 4/8 on fraction strips', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Foundations of Fractions'],
        learningActivities: ['Fraction strip alignment lab', 'Dynamic scale balancer with interactive weights'],
        milestoneAssessment: 'Equivalence Matcher: Pair 6 different visual fraction tiles with their numerical forms',
        masteryCondition: 'Demonstrate 100% precision on like-denominator orderings and equivalence pairs',
        status: 'locked',
      },
      {
        id: 'stage-frac-3',
        stageNumber: 3,
        title: 'Advanced Comparison & Operations',
        tagline: 'Unlike Denominators & Common Addition',
        objective: 'Master comparing fractions with different denominators and adding like fractions.',
        concepts: [
          { id: 'f5', name: 'Comparing Unlike Fractions', summary: 'Finding common denominators or benchmark fractions', difficulty: 'advanced', status: 'locked' },
          { id: 'f6', name: 'Adding Like Fractions', summary: 'Combining numerators while preserving unit denominator', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Equivalence & Like Comparison'],
        learningActivities: ['Step-by-step benchmark fraction tool', 'Space probe fuel combining simulation'],
        milestoneAssessment: 'Multi-Modal Problem Set: Solve 4 unlike comparisons and 4 addition items',
        masteryCondition: 'Achieve ≥ 80% combined mastery across written calculation and verbal justification',
        status: 'locked',
      },
      {
        id: 'stage-frac-4',
        stageNumber: 4,
        title: 'Mastery & Real-World Application',
        tagline: 'Word Problems & Practical Synthesis',
        objective: 'Apply fraction understanding to multi-step real-world word problems across contextual interest themes.',
        concepts: [
          { id: 'f7', name: 'Fraction Word Problems', summary: 'Deconstructing real-world stories into arithmetic expressions', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: Advanced Comparison & Operations'],
        learningActivities: ['Themed mission: Space Station ration allocation', 'Facilitator verbal reasoning interview'],
        milestoneAssessment: '3-Part Real-World Expedition Challenge with written scratchpad verification',
        masteryCondition: 'Score ≥ 85% with zero whole-number misconceptions on transfer problems',
        status: 'locked',
      },
    ],
  },

  'machine learning': {
    topic: 'Machine Learning Fundamentals',
    category: 'Artificial Intelligence',
    estimatedHours: 15,
    overview:
      'Learn how algorithms learn from data: supervised vs unsupervised models, training/test splits, regression, and classification.',
    prerequisiteSummary:
      'Requires high-school algebra (lines, slopes), basic probability intuition, and elementary Python understanding.',
    diagnosticQuestions: [
      {
        id: 'ml-diag-1',
        question: 'What is the core difference between Supervised and Unsupervised Learning?',
        context: 'Foundation Check: ML Paradigms',
        conceptTested: 'Supervised vs Unsupervised Data',
        options: [
          { id: 'opt-a', label: 'Supervised uses labeled target data; Unsupervised finds patterns in unlabeled data', isCorrect: true },
          { id: 'opt-b', label: 'Supervised requires a human standing by the computer while it runs', isCorrect: false },
          { id: 'opt-c', label: 'Supervised learning only runs on supercomputers', isCorrect: false },
          { id: 'opt-d', label: 'There is no difference; they are synonymous terms', isCorrect: false },
        ],
        explanation: 'Supervised learning trains models on input-output pairs with known ground truth labels.',
      },
      {
        id: 'ml-diag-2',
        question: 'Why do machine learning practitioners split data into Training and Test sets?',
        context: 'Foundation Check: Generalization',
        conceptTested: 'Overfitting & Model Evaluation',
        options: [
          { id: 'opt-a', label: 'To reduce the electricity consumed by the CPU', isCorrect: false },
          { id: 'opt-b', label: 'To verify whether the model generalizes to unseen data rather than just memorizing', isCorrect: true },
          { id: 'opt-c', label: 'Because Python lists cannot hold more than 1,000 rows', isCorrect: false },
          { id: 'opt-d', label: 'To speed up file download times', isCorrect: false },
        ],
        explanation: 'Testing on unseen data detects overfitting and ensures the algorithm learned genuine generalizable signals.',
      },
    ],
    stages: [
      {
        id: 'stage-ml-1',
        stageNumber: 1,
        title: 'Data & Feature Foundations',
        tagline: 'Vectors, Features & Preprocessing',
        objective: 'Represent raw data as numerical features, handle missing values, and scale attributes.',
        concepts: [
          { id: 'm1', name: 'Feature Vectors', summary: 'Tabular matrices, categorical encoding', difficulty: 'foundational', status: 'unlocked' },
          { id: 'm2', name: 'Data Normalization', summary: 'Min-max scaling and standard normalization', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['Basic linear algebra & Python matrices'],
        learningActivities: ['Interactive feature heatmap explorer', 'Scatter plot visualizer'],
        milestoneAssessment: 'Data Pipeline Lab: Clean and encode a raw 500-row customer dataset',
        masteryCondition: 'Produce clean normalized tensor ready for model ingestion with 0 missing-data leaks',
        status: 'unlocked',
      },
      {
        id: 'stage-ml-2',
        stageNumber: 2,
        title: 'Supervised Core Models',
        tagline: 'Linear Regression & Classification',
        objective: 'Implement ordinary least squares regression and logistic classification with cost functions.',
        concepts: [
          { id: 'm3', name: 'Linear Regression', summary: 'Fitting best-fit lines with Mean Squared Error loss', difficulty: 'intermediate', status: 'locked' },
          { id: 'm4', name: 'Logistic Classification', summary: 'Sigmoid activation, decision boundaries, cross-entropy', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Data & Feature Foundations'],
        learningActivities: ['Gradient descent slope slider', 'Decision boundary playground'],
        milestoneAssessment: 'House Price & Churn Prediction: Fit two baseline models and calculate MSE/Accuracy',
        masteryCondition: 'Demonstrate understanding of loss minimization and calculate cost for 3 model configurations',
        status: 'locked',
      },
      {
        id: 'stage-ml-3',
        stageNumber: 3,
        title: 'Evaluation & Generalization',
        tagline: 'Bias-Variance, Overfitting & Cross-Validation',
        objective: 'Diagnose high bias vs high variance, perform k-fold cross validation, and regularize models.',
        concepts: [
          { id: 'm5', name: 'Bias-Variance Tradeoff', summary: 'Underfitting vs memorization', difficulty: 'intermediate', status: 'locked' },
          { id: 'm6', name: 'Cross Validation & Regularization', summary: 'K-fold splits, L1/L2 penalties', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Supervised Core Models'],
        learningActivities: ['Interactive learning curve simulator', 'Regularization penalty tuner'],
        milestoneAssessment: 'Diagnostic Audit: Identify and fix severe overfitting in a high-degree polynomial model',
        masteryCondition: 'Achieve balanced train/test error within 5% variance margin',
        status: 'locked',
      },
      {
        id: 'stage-ml-4',
        stageNumber: 4,
        title: 'Modern Architecture & Capstone',
        tagline: 'Neural Intro & End-to-End Pipeline',
        objective: 'Train a multi-layer perceptron and evaluate model fairness, latency, and real-world deployment.',
        concepts: [
          { id: 'm7', name: 'Neural Networks 101', summary: 'Hidden layers, backpropagation intuition, activations', difficulty: 'advanced', status: 'locked' },
          { id: 'm8', name: 'End-to-End ML Pipeline', summary: 'Inference script with metrics reporting', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: Evaluation & Generalization'],
        learningActivities: ['Neural network layer visualization', 'Model interpretability dashboard'],
        milestoneAssessment: 'Full Pipeline Capstone: Train, tune, and evaluate a multi-class image classifier',
        masteryCondition: 'Submit verified notebook achieving ≥ 88% test F1-score with clear error analysis',
        status: 'locked',
      },
    ],
  },

  photosynthesis: {
    topic: 'Photosynthesis & Cellular Energy',
    category: 'Biological Sciences',
    estimatedHours: 8,
    overview:
      'Explore how radiant solar energy is captured and converted into chemical carbohydrates inside plant cells.',
    prerequisiteSummary:
      'Requires understanding of plant cell anatomy (organelles), basic atomic molecules (H2O, CO2, O2), and light energy.',
    diagnosticQuestions: [
      {
        id: 'photo-diag-1',
        question: 'What primary green pigment molecule inside plant cells absorbs solar photons?',
        context: 'Foundation Check: Cellular Components',
        conceptTested: 'Pigments & Chloroplasts',
        options: [
          { id: 'opt-a', label: 'Chlorophyll', isCorrect: true },
          { id: 'opt-b', label: 'Hemoglobin', isCorrect: false },
          { id: 'opt-c', label: 'Melanin', isCorrect: false },
          { id: 'opt-d', label: 'Glucose', isCorrect: false },
        ],
        explanation: 'Chlorophyll is the light-absorbing pigment embedded in the thylakoid membranes of chloroplasts.',
      },
      {
        id: 'photo-diag-2',
        question: 'Which chemical input does a plant absorb from ambient air to build glucose molecules?',
        context: 'Foundation Check: Chemical Inputs & Outputs',
        conceptTested: 'Carbon Fixation Raw Materials',
        options: [
          { id: 'opt-a', label: 'Pure Nitrogen gas (N2)', isCorrect: false },
          { id: 'opt-b', label: 'Carbon Dioxide (CO2)', isCorrect: true },
          { id: 'opt-c', label: 'Argon (Ar)', isCorrect: false },
          { id: 'opt-d', label: 'Methane (CH4)', isCorrect: false },
        ],
        explanation: 'Carbon dioxide enters through leaf stomata and provides the carbon atoms for sugar synthesis in the Calvin cycle.',
      },
    ],
    stages: [
      {
        id: 'stage-ph-1',
        stageNumber: 1,
        title: 'Cellular Stage & Photon Capture',
        tagline: 'Chloroplast Anatomy & Light Absorption',
        objective: 'Identify the structural components of chloroplasts (thylakoids, stroma, grana) and photon excitation.',
        concepts: [
          { id: 'p1', name: 'Chloroplast Anatomy', summary: 'Thylakoids, lumen, stroma, and double membrane', difficulty: 'foundational', status: 'unlocked' },
          { id: 'p2', name: 'Electromagnetic Spectrum', summary: 'Why leaves absorb blue/red and reflect green light', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['Basic plant cell structure', 'Molecule awareness'],
        learningActivities: ['3D Chloroplast cross-section tour', 'Light wavelength absorption simulation'],
        milestoneAssessment: 'Anatomy Labeling Lab: Correctly map electron pathways onto the thylakoid structure',
        masteryCondition: 'Accurately explain why green leaves reflect 500-550nm photons with zero conceptual errors',
        status: 'unlocked',
      },
      {
        id: 'stage-ph-2',
        stageNumber: 2,
        title: 'Light-Dependent Reactions',
        tagline: 'Photosystems, Water Splitting & ATP Synthesis',
        objective: 'Trace how sunlight splits water, releases oxygen gas, and generates ATP and NADPH chemical energy carriers.',
        concepts: [
          { id: 'p3', name: 'Photosystems II & I', summary: 'Photolysis of H2O and electron transport chains', difficulty: 'intermediate', status: 'locked' },
          { id: 'p4', name: 'Chemiosmosis & ATP Synthase', summary: 'Proton gradient across thylakoid lumen generating ATP', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Cellular Stage & Photon Capture'],
        learningActivities: ['Electron relay interactive game', 'Proton turbine simulation sandbox'],
        milestoneAssessment: 'Reaction Flow Tracing: Trace 2 electrons from H2O photolysis to NADPH formation',
        masteryCondition: 'Demonstrate ≥ 80% mastery on reaction inputs, enzyme roles, and byproducts',
        status: 'locked',
      },
      {
        id: 'stage-ph-3',
        stageNumber: 3,
        title: 'The Calvin Cycle',
        tagline: 'Carbon Fixation & Sugar Synthesis',
        objective: 'Explain light-independent reactions occurring in the stroma using RuBisCO enzyme to produce G3P sugars.',
        concepts: [
          { id: 'p5', name: 'Carbon Fixation (RuBisCO)', summary: 'Attaching atmospheric CO2 to RuBP molecules', difficulty: 'intermediate', status: 'locked' },
          { id: 'p6', name: 'Reduction & RuBP Regeneration', summary: 'Using ATP/NADPH energy to produce glucose precursors', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Light-Dependent Reactions'],
        learningActivities: ['Enzyme molecular assembly lab', 'Chemical balance tracker for 3 turns of the cycle'],
        milestoneAssessment: 'Energy Accounting Worksheet: Calculate exact ATP and NADPH required for 1 glucose molecule',
        masteryCondition: 'Explain the 3 phases of the Calvin cycle without confusing stroma with thylakoid space',
        status: 'locked',
      },
      {
        id: 'stage-ph-4',
        stageNumber: 4,
        title: 'Ecological Energy Synthesis',
        tagline: 'Cellular Respiration Link & Earth Biosphere',
        objective: 'Synthesize photosynthesis with mitochondrial respiration and analyze global carbon-oxygen equilibrium.',
        concepts: [
          { id: 'p7', name: 'Photosynthesis vs Respiration', summary: 'Complementary metabolic pathways of plants and animals', difficulty: 'advanced', status: 'locked' },
          { id: 'p8', name: 'Environmental Factors & Limiting Rates', summary: 'Effects of temperature, CO2 concentration, and light intensity', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: The Calvin Cycle'],
        learningActivities: ['Biosphere climate bottle simulation', 'Oral reasoning probe with AI tutor'],
        milestoneAssessment: 'Global Biome Energy Model: Analyze how deforestation shifts atmospheric gas balances',
        masteryCondition: 'Score ≥ 85% on cross-disciplinary synthesis assessment',
        status: 'locked',
      },
    ],
  },

  calculus: {
    topic: 'Calculus',
    category: 'Mathematics & Analysis',
    estimatedHours: 16,
    overview:
      'Master the mathematical framework of continuous change: functions, limits, differential rates of change, and integral accumulation.',
    prerequisiteSummary:
      'Requires algebra, trigonometry (unit circle, identities), and polynomial functions.',
    diagnosticQuestions: [
      {
        id: 'calc-diag-1',
        question: 'What does the limit of f(x) as x approaches a value c represent?',
        context: 'Foundation Check: Limits & Continuity',
        conceptTested: 'Limits Behavior',
        options: [
          { id: 'opt-a', label: 'The value that f(x) approaches as x gets arbitrarily close to c', isCorrect: true },
          { id: 'opt-b', label: 'The maximum possible value of f(x)', isCorrect: false },
          { id: 'opt-c', label: 'The slope of f(x) at x = 0', isCorrect: false },
          { id: 'opt-d', label: 'The area under f(x) from 0 to c', isCorrect: false },
        ],
        explanation: 'A limit describes the value a function approaches as the input approaches a given target value.',
      },
    ],
    stages: [
      {
        id: 'stage-calc-1',
        stageNumber: 1,
        title: 'Limits & Continuity',
        tagline: 'Foundations of Continuous Behavior',
        objective: 'Evaluate one-sided and two-sided limits graphically, numerically, and algebraically.',
        concepts: [
          { id: 'c-calc-1', name: 'Intuitive Limits & Continuity', summary: 'Approaching values, jump vs removable discontinuities', difficulty: 'foundational', status: 'unlocked' },
          { id: 'c-calc-2', name: 'Limit Laws & Squeeze Theorem', summary: 'Algebraic limit evaluation and asymptotic behavior', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['High school algebra & functions'],
        learningActivities: ['Dynamic limit approximation slider', 'Epsilon-delta zoom explorer'],
        milestoneAssessment: 'Limits Mastery Check: Evaluate 6 algebraic and piece-wise limits',
        masteryCondition: 'Demonstrate ≥ 80% accuracy on limit evaluations including indeterminate forms',
        status: 'unlocked',
      },
      {
        id: 'stage-calc-2',
        stageNumber: 2,
        title: 'Derivatives & Rates of Change',
        tagline: 'Instantaneous Change & Tangent Slopes',
        objective: 'Define the derivative as a limit of difference quotients and master derivative rules.',
        concepts: [
          { id: 'c-calc-3', name: 'Definition of Derivative', summary: 'Difference quotient limit and tangent lines', difficulty: 'intermediate', status: 'locked' },
          { id: 'c-calc-4', name: 'Power, Product & Chain Rules', summary: 'Systematic differentiation techniques for composite functions', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Limits & Continuity'],
        learningActivities: ['Secant-to-tangent line visualizer', 'Chain rule composition diagram'],
        milestoneAssessment: 'Differentiation Drill: Compute first and second derivatives of trigonometric and composite functions',
        masteryCondition: 'Achieve 100% precision on chain rule and implicit differentiation problems',
        status: 'locked',
      },
      {
        id: 'stage-calc-3',
        stageNumber: 3,
        title: 'Applications of Differentiation',
        tagline: 'Optimization, Related Rates & Curve Sketching',
        objective: 'Apply derivatives to analyze function extrema, concavity, and real-world optimization problems.',
        concepts: [
          { id: 'c-calc-5', name: 'Extrema & Mean Value Theorem', summary: 'Critical points, first/second derivative tests', difficulty: 'intermediate', status: 'locked' },
          { id: 'c-calc-6', name: 'Optimization & Related Rates', summary: 'Formulating geometric and physical rate equations', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Derivatives & Rates of Change'],
        learningActivities: ['Box volume optimization sandbox', 'Moving ladder related rates simulation'],
        milestoneAssessment: 'Optimization Case Study: Maximize efficiency function under quadratic constraints',
        masteryCondition: 'Correctly formulate and solve 3 multi-step optimization and related rates word problems',
        status: 'locked',
      },
      {
        id: 'stage-calc-4',
        stageNumber: 4,
        title: 'Integrals & Accumulation',
        tagline: 'Riemann Sums, Definite Integrals & FTC',
        objective: 'Connect instantaneous rates of change back to accumulated quantity via the Fundamental Theorem of Calculus.',
        concepts: [
          { id: 'c-calc-7', name: 'Riemann Sums & Definite Integrals', summary: 'Area under curves via limit of rectangle sums', difficulty: 'advanced', status: 'locked' },
          { id: 'c-calc-8', name: 'Fundamental Theorem of Calculus', summary: 'Duality between differentiation and anti-differentiation', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: Applications of Differentiation'],
        learningActivities: ['Interactive Riemann rectangle subdivision simulator', 'Area accumulator tracer'],
        milestoneAssessment: 'Integral Synthesis Defense: Evaluate definite integrals using substitution and area theorems',
        masteryCondition: 'Score ≥ 85% on cross-disciplinary calculus synthesis assessment',
        status: 'locked',
      },
    ],
  },
};

/**
 * Normalizes input string to look up pre-curated plans
 */
function normalizeTopicKey(input: string): string | null {
  const cleaned = input.toLowerCase().trim();
  if (
    cleaned.includes('organic') ||
    cleaned.includes('chemistry') ||
    cleaned.includes('carbon') ||
    cleaned.includes('molecule')
  ) {
    return 'organic chemistry';
  }
  if (cleaned.includes('python')) return 'python';
  if (cleaned.includes('calculus') || cleaned.includes('calc')) return 'calculus';
  if (cleaned.includes('fraction')) return 'fractions';
  if (cleaned.includes('machine learning') || cleaned.includes('ml') || cleaned.includes('ai')) return 'machine learning';
  if (cleaned.includes('photosynthesis') || cleaned.includes('plant')) return 'photosynthesis';
  return null;
}

/**
 * Dynamically synthesizes a structured topic curriculum plan for any user-entered topic.
 * Guarantees that KEA can handle any open-ended query (e.g., "Calculus", "Rust", "Quantum Physics")
 * without ever failing or requiring an external API.
 */
export function generateTopicCurriculum(rawTopic: string): TopicCurriculumPlan {
  const normalizedKey = normalizeTopicKey(rawTopic);
  if (normalizedKey && SAMPLE_TOPIC_PLANS[normalizedKey]) {
    return SAMPLE_TOPIC_PLANS[normalizedKey];
  }

  // Gracefully generate a structured 4-stage topic-to-mastery plan
  const cleanTitle = rawTopic.trim().replace(/^i want to learn\s+/i, '').replace(/^learn\s+/i, '');
  const capitalizedTopic = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    topic: capitalizedTopic,
    category: 'Custom Learning Goal',
    estimatedHours: 10,
    overview: `A structured, prerequisite-gated learning path to master ${capitalizedTopic}, starting from foundational principles and advancing to applied mastery.`,
    prerequisiteSummary: `Requires general logic, core literacy, and foundational context related to ${capitalizedTopic}.`,
    diagnosticQuestions: [
      {
        id: 'dyn-diag-1',
        question: `Which statement best describes the fundamental goal of studying ${capitalizedTopic}?`,
        context: `Diagnostic Calibration: ${capitalizedTopic} Baseline`,
        conceptTested: `${capitalizedTopic} Core Principles`,
        options: [
          { id: 'opt-a', label: `To understand the core mechanisms and build practical proficiency in ${capitalizedTopic}`, isCorrect: true },
          { id: 'opt-b', label: `To memorize raw terminology without practical understanding`, isCorrect: false },
          { id: 'opt-c', label: `It is purely theoretical with no practical application`, isCorrect: false },
          { id: 'opt-d', label: `To replace basic reasoning with automated guessing`, isCorrect: false },
        ],
        explanation: `Mastery in ${capitalizedTopic} requires internalizing fundamental rules, vocabulary, and hands-on synthesis.`,
      },
      {
        id: 'dyn-diag-2',
        question: `When approaching a complex problem in ${capitalizedTopic}, what is the recommended method?`,
        context: `Diagnostic Calibration: Problem Solving`,
        conceptTested: 'Decomposition & Prerequisite Reliance',
        options: [
          { id: 'opt-a', label: 'Guessing immediate answers without checking foundational assumptions', isCorrect: false },
          { id: 'opt-b', label: 'Breaking the problem down into verified prerequisite sub-components', isCorrect: true },
          { id: 'opt-c', label: 'Ignoring error messages and failed validations', isCorrect: false },
          { id: 'opt-d', label: 'Skipping intermediate steps entirely', isCorrect: false },
        ],
        explanation: 'Decomposition into prerequisite sub-components ensures structural correctness and rapid debugging.',
      },
    ],
    stages: [
      {
        id: 'dyn-stage-1',
        stageNumber: 1,
        title: 'Foundations & Terminology',
        tagline: `Essential Building Blocks of ${capitalizedTopic}`,
        objective: `Establish foundational vocabulary, fundamental axioms, and core mechanics of ${capitalizedTopic}.`,
        concepts: [
          { id: 'dyn-c1', name: 'Core Vocabulary & Principles', summary: 'Foundational definitions and primary components', difficulty: 'foundational', status: 'unlocked' },
          { id: 'dyn-c2', name: 'Elementary Operations', summary: 'Basic mechanics and immediate feedback exercises', difficulty: 'foundational', status: 'unlocked' },
        ],
        prerequisites: ['Foundational logic and curiosity'],
        learningActivities: ['Conceptual overview with plain analogies', 'Interactive visual sandbox', 'Guided practice with instant feedback'],
        milestoneAssessment: `Foundational Checkpoint: 5-question multi-modal verification on ${capitalizedTopic} fundamentals`,
        masteryCondition: 'Score ≥ 80% with zero critical misconceptions',
        status: 'unlocked',
      },
      {
        id: 'dyn-stage-2',
        stageNumber: 2,
        title: 'Core Mechanisms & Structures',
        tagline: 'Interconnecting Concepts & Frameworks',
        objective: `Explore how foundational components combine into functional structures in ${capitalizedTopic}.`,
        concepts: [
          { id: 'dyn-c3', name: 'Structural Dependencies', summary: 'Connecting rules and standard paradigms', difficulty: 'intermediate', status: 'locked' },
          { id: 'dyn-c4', name: 'Technique Application', summary: 'Applying standard patterns to clean scenarios', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 1: Foundations & Terminology'],
        learningActivities: ['Step-by-step problem dissection', 'Pattern recognition drills'],
        milestoneAssessment: `Intermediate Challenge: Solve 3 multi-step scenarios in ${capitalizedTopic}`,
        masteryCondition: 'Demonstrate consistent application across varied scenario framings',
        status: 'locked',
      },
      {
        id: 'dyn-stage-3',
        stageNumber: 3,
        title: 'Applied Problem Solving',
        tagline: 'Real Scenarios & Synthesis',
        objective: `Solve challenging real-world problems and edge cases requiring cross-concept synthesis in ${capitalizedTopic}.`,
        concepts: [
          { id: 'dyn-c5', name: 'Complex Problem Synthesis', summary: 'Navigating edge cases and conflicting constraints', difficulty: 'intermediate', status: 'locked' },
          { id: 'dyn-c6', name: 'Optimization & Analysis', summary: 'Refining solutions for efficiency and clarity', difficulty: 'intermediate', status: 'locked' },
        ],
        prerequisites: ['Stage 2: Core Mechanisms & Structures'],
        learningActivities: ['Troubleshooting flawed solutions', 'Themed scenario adaptations'],
        milestoneAssessment: `Case Study Challenge: Complete an end-to-end task in ${capitalizedTopic}`,
        masteryCondition: 'Achieve ≥ 80% on rubrics assessing reasoning rigor and correctness',
        status: 'locked',
      },
      {
        id: 'dyn-stage-4',
        stageNumber: 4,
        title: 'Mastery & Synthesis',
        tagline: 'Independent Mastery & Transfer',
        objective: `Demonstrate complete conceptual autonomy and transfer capability in ${capitalizedTopic}.`,
        concepts: [
          { id: 'dyn-c7', name: 'Capstone Synthesis', summary: 'Original project or comprehensive evaluation', difficulty: 'advanced', status: 'locked' },
        ],
        prerequisites: ['Stage 3: Applied Problem Solving'],
        learningActivities: ['Independent project build', 'AI tutor oral defense check'],
        milestoneAssessment: `Capstone Defense: Comprehensive multi-modal evaluation in ${capitalizedTopic}`,
        masteryCondition: 'Achieve verified mastery rating (≥ 85%) across all evaluation criteria',
        status: 'locked',
      },
    ],
  };
}
