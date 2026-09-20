/**
 * KEA Platform — Curated Educational Fallback Resource Generator
 * 
 * Provides rich, authoritative educational resources when no SERPAPI_API_KEY
 * is configured or when network requests fail. Guarantees that the learning
 * roadmap and multi-modal discovery NEVER break.
 */

import { EducationalResource, ResourcePool } from "./types";
import { normalizeTopic, createSearchKey } from "./normalizer";

interface TopicCuratedEntry {
  patterns: string[];
  resources: Array<Omit<EducationalResource, "id">>;
}

const CURATED_TOPIC_REGISTRY: TopicCuratedEntry[] = [
  {
    patterns: ["python", "python programming", "python basics"],
    resources: [
      {
        title: "Official Python Documentation (Tutorial & Library Reference)",
        url: "https://docs.python.org/3/tutorial/index.html",
        source: "docs.python.org",
        type: "documentation",
        snippet: "The official Python tutorial introduces the reader informally to the basic concepts and features of the Python language and system.",
        thumbnail: "https://www.python.org/static/opengraph-icon-200x200.png",
      },
      {
        title: "Python for Beginners — Full University Course",
        url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        source: "freeCodeCamp / YouTube",
        type: "youtube",
        snippet: "A comprehensive introductory video course covering Python variables, control flow, functions, object-oriented concepts, and project development.",
      },
      {
        title: "Real Python: Comprehensive Python Tutorials & Real-World Guides",
        url: "https://realpython.com/",
        source: "realpython.com",
        type: "tutorial",
        snippet: "In-depth, practical Python tutorials covering everything from basic syntax to advanced concurrency, data structures, and idioms.",
      },
      {
        title: "Python Cheat Sheet & Quick Reference",
        url: "https://www.pythoncheatsheet.org/",
        source: "pythoncheatsheet.org",
        type: "reference",
        snippet: "Essential quick reference guide for Python syntax, built-in functions, collections, list comprehensions, and common patterns.",
      },
      {
        title: "W3Schools Python Step-by-Step Interactive Guide",
        url: "https://www.w3schools.com/python/",
        source: "w3schools.com",
        type: "guide",
        snippet: "Hands-on, browser-executable examples for learning Python from ground up with exercises and quizzes.",
      },
      {
        title: "MIT 6.0001: Introduction to Computer Science and Programming in Python",
        url: "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
        source: "MIT OpenCourseWare",
        type: "course",
        snippet: "Rigorous introductory computer science course designed to help students with little or no programming experience understand computational thinking.",
      },
    ],
  },
  {
    patterns: ["organic chemistry", "organic chem", "chemistry"],
    resources: [
      {
        title: "Khan Academy: Organic Chemistry Multi-Unit Course",
        url: "https://www.khanacademy.org/science/organic-chemistry",
        source: "khanacademy.org",
        type: "course",
        snippet: "Sal Khan explains carbon bonding, hydrocarbons, stereochemistry, functional groups, and reaction mechanisms with step-by-step visualizations.",
      },
      {
        title: "Organic Chemistry Tutor: Carbon Hybridization & Reaction Mechanisms",
        url: "https://www.youtube.com/watch?v=g1flA_u_UqU",
        source: "YouTube",
        type: "youtube",
        snippet: "In-depth video tutorials covering valence bond theory, sp3/sp2/sp hybridization, IUPAC nomenclature, and substitution vs elimination.",
      },
      {
        title: "Master Organic Chemistry: Synthesis, Reagents & Mechanism Guides",
        url: "https://www.masterorganicchemistry.com/",
        source: "masterorganicchemistry.com",
        type: "guide",
        snippet: "The premier reference guide for reaction summaries, arrow-pushing mechanisms, functional groups, and spectroscopy.",
      },
      {
        title: "LibreTexts Chemistry: Organic Chemistry Open Textbook",
        url: "https://chem.libretexts.org/Bookshelves/Organic_Chemistry",
        source: "chem.libretexts.org",
        type: "documentation",
        snippet: "Peer-reviewed, comprehensive open textbook detailing structure, properties, composition, reactions, and synthesis of carbon compounds.",
      },
      {
        title: "IUPAC Gold Book: Compendium of Chemical Terminology",
        url: "https://goldbook.iupac.org/",
        source: "iupac.org",
        type: "reference",
        snippet: "Authoritative international standards and definitive definitions for chemical structures, functional groups, and nomenclature rules.",
      },
    ],
  },
  {
    patterns: ["react", "reactjs", "react.js"],
    resources: [
      {
        title: "React Official Documentation: The Library for Web and Native UIs",
        url: "https://react.dev/",
        source: "react.dev",
        type: "documentation",
        snippet: "Interactive official documentation with visual diagrams, code sandboxes, and modern component lifecycle best practices.",
      },
      {
        title: "React Full Course — Master Modern React from Scratch",
        url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
        source: "freeCodeCamp / YouTube",
        type: "youtube",
        snippet: "End-to-end video tutorial covering components, props, state, hooks, effects, and building interactive web applications.",
      },
      {
        title: "MDN Web Docs: Getting Started with React",
        url: "https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started",
        source: "developer.mozilla.org",
        type: "tutorial",
        snippet: "Clear walkthrough of React fundamentals, JSX compilation, Virtual DOM, and state management fundamentals.",
      },
      {
        title: "Overreacted: Dan Abramov's In-Depth React Mental Models",
        url: "https://overreacted.io/",
        source: "overreacted.io",
        type: "article",
        snippet: "Deep conceptual essays deconstructing React re-rendering, closures, hooks, and architectural invariants.",
      },
    ],
  },
  {
    patterns: ["machine learning", "ml", "ai", "deep learning"],
    resources: [
      {
        title: "Google Machine Learning Crash Course",
        url: "https://developers.google.com/machine-learning/crash-course",
        source: "developers.google.com",
        type: "course",
        snippet: "Fast-paced, practical introduction to machine learning featuring video lectures, real-world case studies, and hands-on TensorFlow practice exercises.",
      },
      {
        title: "StatQuest with Josh Starmer: Machine Learning Fundamental Concepts",
        url: "https://www.youtube.com/c/joshstarmer",
        source: "YouTube",
        type: "youtube",
        snippet: "Intuitive, step-by-step visual breakdowns of gradient descent, neural networks, decision trees, and loss optimization.",
      },
      {
        title: "Scikit-Learn User Guide & Machine Learning Documentation",
        url: "https://scikit-learn.org/stable/user_guide.html",
        source: "scikit-learn.org",
        type: "documentation",
        snippet: "Definitive guide and API reference for supervised learning, unsupervised clustering, cross-validation, and pipeline transformation.",
      },
      {
        title: "DeepLearning.AI: Machine Learning Specialization",
        url: "https://www.deeplearning.ai/courses/machine-learning-specialization/",
        source: "deeplearning.ai",
        type: "guide",
        snippet: "Andrew Ng's world-renowned foundational curriculum covering ML algorithms, neural nets, and practical AI system design.",
      },
    ],
  },
];

/**
 * Dynamically synthesizes high quality curated educational resources for any arbitrary topic.
 */
function buildGenericFallbackResources(topic: string): EducationalResource[] {
  const encTopic = encodeURIComponent(topic);
  const displayTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

  return [
    {
      id: `fallback_${Math.random().toString(36).substring(2, 8)}`,
      title: `${displayTopic}: Comprehensive Overview & Documentation`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, "_"))}`,
      source: "Wikipedia / Open Educational Knowledge",
      type: "documentation",
      snippet: `Authoritative conceptual foundation and structured overview of ${topic}, covering historical context, core principles, and taxonomy.`,
      relevance: 0.98,
    },
    {
      id: `fallback_${Math.random().toString(36).substring(2, 8)}`,
      title: `${displayTopic} — Complete Video Masterclass & Visual Guide`,
      url: `https://www.youtube.com/results?search_query=${encTopic}+tutorial+complete+guide`,
      source: "YouTube Educational",
      type: "youtube",
      snippet: `Top-rated video lessons, visual animations, and comprehensive lectures exploring ${topic} from fundamentals to applied mastery.`,
      relevance: 0.95,
    },
    {
      id: `fallback_${Math.random().toString(36).substring(2, 8)}`,
      title: `Step-by-Step ${displayTopic} Practical Learning Guide`,
      url: `https://www.freecodecamp.org/news/search/?query=${encTopic}`,
      source: "freeCodeCamp",
      type: "tutorial",
      snippet: `Hands-on, accessible tutorial breaking down essential concepts, practical examples, and common pitfalls in ${topic}.`,
      relevance: 0.92,
    },
    {
      id: `fallback_${Math.random().toString(36).substring(2, 8)}`,
      title: `${displayTopic} University Curriculum & Lecture Notes`,
      url: `https://ocw.mit.edu/search/?q=${encTopic}`,
      source: "MIT OpenCourseWare",
      type: "course",
      snippet: `Rigorous academic coursework, syllabus benchmarks, and problem sets for in-depth mastery of ${topic}.`,
      relevance: 0.9,
    },
    {
      id: `fallback_${Math.random().toString(36).substring(2, 8)}`,
      title: `Quick Reference & Cheat Sheet: ${displayTopic}`,
      url: `https://devhints.io/?q=${encTopic}`,
      source: "Devhints / QuickRef",
      type: "reference",
      snippet: `Fast lookup tables, key definitions, formulas, and critical syntax/heuristics for ${topic}.`,
      relevance: 0.88,
    },
  ];
}

/**
 * Returns a complete ResourcePool with curated educational resources.
 * Always returns with requestCount = 0 and isFallback = true.
 */
export function getCuratedFallbackPool(topic: string): ResourcePool {
  const normalized = normalizeTopic(topic);
  const searchKey = createSearchKey(normalized);

  // Check known registry
  const match = CURATED_TOPIC_REGISTRY.find((entry) =>
    entry.patterns.some(
      (pat) => normalized === pat || normalized.includes(pat) || pat.includes(normalized)
    )
  );

  let rawResources: Array<Omit<EducationalResource, "id"> | EducationalResource>;

  if (match) {
    rawResources = match.resources;
  } else {
    rawResources = buildGenericFallbackResources(topic);
  }

  const resources: EducationalResource[] = rawResources.map((res, index) => ({
    ...res,
    id: "id" in res ? res.id : `fallback_${res.type}_${index}_${Math.random().toString(36).substring(2, 7)}`,
  }));

  return {
    topic,
    normalizedTopic: normalized,
    searchKey,
    query: `${normalized} learning resources tutorial documentation`,
    searchedAt: Date.now(),
    requestCount: 0,
    resources,
    isFallback: true,
  };
}
