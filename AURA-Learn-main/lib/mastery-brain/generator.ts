import "server-only";
import type {
  MasterBrainChallenge,
  MasterBrainType,
  MasterBrainOption,
  MasterBrainState,
  MasterBrainEvaluationResponse,
} from "./types";
import { getOrGenerateTopicIntelligencePack } from "../serpapi/intelligence-pack";
import type { Interest } from "@/lib/types";

const HEADLINES: string[] = [
  "🧠 One for your brain...",
  "👀 Okay, here's a weird one...",
  "🤔 Think before you answer...",
  "🔥 Let's see how you reason...",
  "🌎 Here's where this gets interesting...",
  "🧠 No pressure — just make your best guess.",
];

/**
 * In-memory student Master Brain state for local runtime and development.
 */
const brainStates = new Map<string, MasterBrainState>();

export function getOrCreateBrainState(studentId: string): MasterBrainState {
  let s = brainStates.get(studentId);
  if (!s) {
    s = {
      studentId,
      brainStreak: 1, // Start with an encouraging Day 1 streak
      totalBrainXp: 15,
      lastBrainActivityDate: null,
      completedChallengeIds: [],
    };
    brainStates.set(studentId, s);
  }
  return s;
}

/**
 * Curated Master Brain question repository across key curricular topics.
 */
const CURATED_CHALLENGES: Record<string, MasterBrainChallenge[]> = {
  photosynthesis: [
    {
      id: "mb_photo_milk",
      topicId: "photosynthesis",
      topicName: "Photosynthesis",
      conceptName: "Plant Nutrition & Water Absorption",
      type: "WHY",
      promptHeadline: "👀 Okay, here's a weird one...",
      questionText: "Milk contains over 87% water. So why can't we simply water house plants with milk instead of water?",
      options: [
        {
          id: "opt_1",
          text: "Milk's fats and proteins rot and block soil pores, suffocating the roots from absorbing oxygen and water.",
          isCorrect: true,
          explanationSnippet: "Milk fat and sugar decompose rapidly, breeding harmful bacteria and choking root respiration."
        },
        {
          id: "opt_2",
          text: "Plants are lactose intolerant and will burst open.",
          isCorrect: false,
          explanationSnippet: "Plants don't have animal digestive systems to be lactose intolerant."
        },
        {
          id: "opt_3",
          text: "The white color of milk reflects sunlight so chlorophyll cannot absorb light.",
          isCorrect: false,
          explanationSnippet: "Milk goes into the roots in soil, not onto the leaf surfaces."
        }
      ],
      explanation: "Plants need pure water for osmosis in their roots! While milk contains water, its fats, proteins, and sugars cause intense bacterial growth in the soil, which consumes all the soil's oxygen and rots the plant's delicate root hairs.",
      surprisingFact: "Farmers occasionally spray heavily diluted milk on tomato leaves not as food, but because milk proteins act as a natural anti-fungal shield against powdery mildew!",
      realWorldConnection: {
        title: "Hydroponic Nutrient Solutions",
        domain: "Modern Agritech",
        description: "Commercial vertical hydroponic farms strictly filter water to parts-per-million purity so root membranes never suffocate.",
        sourceUrl: "https://www.usda.gov"
      },
      brainXpReward: 5,
      bonusXp: 5
    },
    {
      id: "mb_photo_soil_food",
      topicId: "photosynthesis",
      topicName: "Photosynthesis",
      conceptName: "Source of Plant Biomass",
      type: "CHALLENGE_ASSUMPTION",
      promptHeadline: "🤔 Think before you answer...",
      questionText: "If plants make 100% of their own food from sunlight and air, why do farmers still buy bags of soil fertilizer?",
      options: [
        {
          id: "opt_1",
          text: "Fertilizer is like vitamins: plants make carbohydrates from air, but need nitrogen and phosphorus to build DNA and proteins.",
          isCorrect: true,
          explanationSnippet: "Glucose only has Carbon, Hydrogen, and Oxygen. Nitrogen and minerals must come from soil."
        },
        {
          id: "opt_2",
          text: "Fertilizer feeds the sunlight directly into the roots at night.",
          isCorrect: false,
          explanationSnippet: "Sunlight is absorbed strictly by chlorophyll in leaves, never roots."
        },
        {
          id: "opt_3",
          text: "Plants only make food on sunny days; on cloudy days they eat soil.",
          isCorrect: false,
          explanationSnippet: "Plants store excess glucose as starch for cloudy days."
        }
      ],
      explanation: "Photosynthesis produces glucose (C₆H₁₂O₆), which only has carbon, hydrogen, and oxygen. To build living plant tissues, enzymes, and DNA, plants must have nitrogen, phosphorus, and potassium from the soil—just like humans need minerals and vitamins alongside calories!",
      surprisingFact: "A 5-ton oak tree was once grown from a tiny acorn in a weighed pot of soil. After 5 years, the tree gained thousands of pounds, but the soil lost less than 2 ounces! Most of a giant tree's physical weight is captured from thin air!",
      realWorldConnection: {
        title: "The Haber-Bosch Synthetic Fertilizer Revolution",
        domain: "Chemical Engineering",
        description: "Chemical synthesis of nitrogen fertilizer is estimated to sustain nearly half the modern human population's food supply.",
        sourceUrl: "https://www.nobelprize.org"
      },
      brainXpReward: 5,
      bonusXp: 5
    }
  ],

  "electric-current": [
    {
      id: "mb_curr_birds",
      topicId: "electric-current",
      topicName: "Electric Current",
      conceptName: "Potential Difference & Closed Circuits",
      type: "REAL_WORLD",
      promptHeadline: "🧠 One for your brain...",
      questionText: "Why can small birds safely rest their feet on 10,000-volt power lines without getting an electric shock?",
      options: [
        {
          id: "opt_1",
          text: "Both of the bird's feet are at the same high voltage, so there is almost zero potential difference across its body to push current.",
          isCorrect: true,
          explanationSnippet: "Current requires a voltage difference (V_A - V_B) to flow."
        },
        {
          id: "opt_2",
          text: "Bird feathers and claws are 100% perfect electrical insulators.",
          isCorrect: false,
          explanationSnippet: "Birds are flesh and water like us and will conduct if a voltage difference exists."
        },
        {
          id: "opt_3",
          text: "Power line companies coat the outside of high-voltage cables in thick rubber.",
          isCorrect: false,
          explanationSnippet: "High-voltage long-distance cables are completely bare metal to dissipate heat into the air."
        }
      ],
      explanation: "Current flows only when there is a difference in voltage between two contact points! Because both bird feet touch the same wire just centimeters apart, the electrical potential is virtually identical. But if a large bird touches a second wire or a grounded pole at the same time—zap!",
      surprisingFact: "High-voltage utility maintenance crews in helicopters wear stainless-steel suits and attach themselves directly to 500,000-volt lines. As long as their whole body is at the same voltage, no current flows through them!",
      realWorldConnection: {
        title: "Live-Line Bare-Hand Helicopter Linemen",
        domain: "Power Grid Engineering",
        description: "Linemen use Faraday cage principle and equipotential bonding to repair live regional grids without blackouts.",
        sourceUrl: "https://www.energy.gov"
      },
      brainXpReward: 5,
      bonusXp: 5
    },
    {
      id: "mb_curr_switch",
      topicId: "electric-current",
      topicName: "Electric Current",
      conceptName: "Electron Drift vs Signal Speed",
      type: "TRICK_YOUR_BRAIN",
      promptHeadline: "🔥 Let's see how you reason...",
      questionText: "Electrons in a home wire crawl slower than a snail (less than 1 mm per second). Why does a ceiling light turn on instantly when you press the wall switch?",
      options: [
        {
          id: "opt_1",
          text: "The wire is already completely filled with electrons; the switch sends an electromagnetic field wave that starts all of them moving at once.",
          isCorrect: true,
          explanationSnippet: "Like a pipe already filled with marbles: pushing one in pushes the last one out immediately."
        },
        {
          id: "opt_2",
          text: "A special boost capacitor fires the first batch of electrons at the speed of light.",
          isCorrect: false,
          explanationSnippet: "Physical electrons never accelerate to the speed of light in a wire."
        },
        {
          id: "opt_3",
          text: "The light bulb uses light rays stored in the switch from earlier in the day.",
          isCorrect: false,
          explanationSnippet: "Energy is transferred purely by the incoming electromagnetic field."
        }
      ],
      explanation: "Think of a long pipe already completely packed with marbles end-to-end. As soon as you push one marble at your end, the marble at the far end pops out immediately! The electrons themselves move very slowly, but the electric field push travels through the circuit near the speed of light.",
      surprisingFact: "In AC household electricity (50/60 Hz), electrons just jiggle back and forth over a distance smaller than the width of a bacterium—they never even leave the room!",
      realWorldConnection: {
        title: "Undersea Transatlantic Internet Cables",
        domain: "Global Telecommunications",
        description: "Fiber-optic and subsea electrical repeaters leverage electromagnetic wave propagation to connect continents in milliseconds.",
        sourceUrl: "https://www.submarinecablemap.com"
      },
      brainXpReward: 5,
      bonusXp: 5
    }
  ],

  "ohms-law": [
    {
      id: "mb_ohm_racing_tires",
      topicId: "ohms-law",
      topicName: "Ohm's Law",
      conceptName: "Analogies of Flow & Friction",
      type: "TRANSFER",
      promptHeadline: "🌎 Here's where this gets interesting...",
      questionText: "You learned how resistance opposes electric current. In car racing, why do Formula 1 cars use super-wide tires with huge surface area?",
      options: [
        {
          id: "opt_1",
          text: "Wider tires distribute thermal heat and increase polymer adhesion, giving maximum grip without melting during extreme braking.",
          isCorrect: true,
          explanationSnippet: "Just as thicker wires distribute current with less overheating, wide rubber distributes frictional heat."
        },
        {
          id: "opt_2",
          text: "Wider tires weigh more, and heavier cars automatically go faster.",
          isCorrect: false,
          explanationSnippet: "Extra weight actually penalizes acceleration according to F=ma."
        },
        {
          id: "opt_3",
          text: "To make the car loud so rivals get intimidated.",
          isCorrect: false,
          explanationSnippet: "Acoustic intimidation is not a tire engineering objective."
        }
      ],
      explanation: "Just like increasing the cross-sectional area of a wire lowers its electrical resistance and stops it from overheating (R ∝ 1/A), spreading braking forces across wide tire contact patches prevents rubber from blistering under massive friction!",
      surprisingFact: "F1 brake discs glow bright cherry-red at over 1,000°C because kinetic energy of the car is converted to heat in under 2 seconds!",
      realWorldConnection: {
        title: "High-Current Busbars in Supercomputers",
        domain: "Hardware Engineering",
        description: "AI data centers use thick copper busbars with massive surface area to deliver 1,000 amperes to GPU chips with minimal resistive heat loss.",
        sourceUrl: "https://www.nvidia.com"
      },
      brainXpReward: 5,
      bonusXp: 5
    }
  ]
};

/**
 * Generates an adaptive, personalized Master Brain challenge.
 */
export async function generateMasterBrainChallenge(params: {
  topicId: string;
  topicName: string;
  conceptName?: string;
  masteryScore: number;
  detectedMisconception?: string | null;
  studentInterests?: Interest[];
  previousChallengeIds?: string[];
}): Promise<MasterBrainChallenge> {
  const norm = params.topicId.trim().toLowerCase();

  // Retrieve SerpApi Topic Intelligence Pack
  const intelligencePack = await getOrGenerateTopicIntelligencePack(params.topicName);

  // Check curated challenges
  const pool = CURATED_CHALLENGES[norm] || [];
  const unseen = pool.filter(
    (c) => !(params.previousChallengeIds || []).includes(c.id)
  );

  // If detectedMisconception is given, prioritize challenges matching the misconception
  if (params.detectedMisconception && unseen.length > 0) {
    const misLower = params.detectedMisconception.toLowerCase();
    const targeted = unseen.find((c) => {
      if (c.type === "CHALLENGE_ASSUMPTION") return true;
      if (misLower.includes("soil") || misLower.includes("food")) {
        return c.id === "mb_photo_soil_food" || c.questionText.toLowerCase().includes("fertilizer");
      }
      return false;
    });
    if (targeted) {
      if (intelligencePack.realWorldConnections.length > 0) {
        const liveConnection = intelligencePack.realWorldConnections[0];
        return {
          ...targeted,
          realWorldConnection: {
            title: liveConnection.title,
            domain: liveConnection.domain,
            description: liveConnection.description,
            sourceUrl: liveConnection.sourceUrl || targeted.realWorldConnection.sourceUrl,
          },
        };
      }
      return targeted;
    }
  }

  if (unseen.length > 0) {
    const pick = unseen[0];
    // Enrich with SerpApi discovered real-world connection if available
    if (intelligencePack.realWorldConnections.length > 0) {
      const liveConnection = intelligencePack.realWorldConnections[0];
      return {
        ...pick,
        realWorldConnection: {
          title: liveConnection.title,
          domain: liveConnection.domain,
          description: liveConnection.description,
          sourceUrl: liveConnection.sourceUrl || pick.realWorldConnection.sourceUrl,
        },
      };
    }
    return pick;
  }

  // Generate dynamic challenge from Intelligence Pack
  const headline = HEADLINES[Math.floor(Math.random() * HEADLINES.length)];
  const qType: MasterBrainType = params.detectedMisconception
    ? "CHALLENGE_ASSUMPTION"
    : params.masteryScore >= 80
    ? "WHAT_IF"
    : "WHY";

  const questionPrompt =
    intelligencePack.whyQuestions[0] ||
    intelligencePack.whatIfQuestions[0] ||
    `Why is the core principle of ${params.topicName} so critical in modern real-world technology?`;

  const realWorld = intelligencePack.realWorldConnections[0] || {
    title: `Industrial Applications of ${params.topicName}`,
    domain: "Applied Science & Engineering",
    description: `Leading research laboratories and engineering teams apply ${params.topicName} to build resilient, next-generation systems.`,
  };

  const dynamicChallenge: MasterBrainChallenge = {
    id: `mb_dyn_${norm}_${Date.now().toString(36)}`,
    topicId: params.topicId,
    topicName: params.topicName,
    conceptName: params.conceptName || `Foundations of ${params.topicName}`,
    type: qType,
    promptHeadline: headline,
    questionText: questionPrompt,
    options: [
      {
        id: "opt_dyn_1",
        text: `It allows systems to balance conservation of energy while adapting dynamically to changing environmental forces.`,
        isCorrect: true,
        explanationSnippet: `Correct mechanism based on fundamental scientific conservation laws.`
      },
      {
        id: "opt_dyn_2",
        text: `It is simply an arbitrary historical convention with no physical underlying reason.`,
        isCorrect: false,
        explanationSnippet: `Scientific principles reflect measurable physical constraints, not arbitrary choices.`
      },
      {
        id: "opt_dyn_3",
        text: `It only works in laboratory conditions and stops functioning in real life.`,
        isCorrect: false,
        explanationSnippet: `The underlying law holds consistently across both lab and nature.`
      }
    ],
    explanation: `Understanding ${params.topicName} reveals how nature balances energy, forces, and materials under real-world constraints.`,
    surprisingFact: intelligencePack.interestingFacts[0] || `Principles of ${params.topicName} are utilized across aerospace, computing, and biotechnology.`,
    realWorldConnection: realWorld,
    recommendedResourceUrl: intelligencePack.educationalResources[0]?.url,
    brainXpReward: 5,
    bonusXp: 5,
    interest: params.studentInterests?.[0]
  };

  return dynamicChallenge;
}

/**
 * Evaluates the student's Master Brain answer with encouraging, non-punitive feedback.
 */
export function evaluateMasterBrainAnswer(params: {
  challenge: MasterBrainChallenge;
  studentId: string;
  selectedOptionId: string;
  freeformThinking?: string;
}): MasterBrainEvaluationResponse {
  const chosen = params.challenge.options.find(
    (o) => o.id === params.selectedOptionId
  );
  const isCorrect = Boolean(chosen?.isCorrect);

  const state = getOrCreateBrainState(params.studentId);
  const todayStr = new Date().toISOString().slice(0, 10);

  let streakExtended = false;
  if (state.lastBrainActivityDate !== todayStr) {
    state.brainStreak += 1;
    state.lastBrainActivityDate = todayStr;
    streakExtended = true;
  }

  const earnedXp = isCorrect
    ? params.challenge.brainXpReward + (params.freeformThinking ? params.challenge.bonusXp : 0)
    : params.challenge.brainXpReward; // Even an attempt awards base Brain XP!

  state.totalBrainXp += earnedXp;
  if (!state.completedChallengeIds.includes(params.challenge.id)) {
    state.completedChallengeIds.push(params.challenge.id);
  }

  const headlineFeedback = isCorrect
    ? "💡 Brilliant reasoning!"
    : "Interesting thought! 👀";

  const encouragingFeedback = isCorrect
    ? "You connected the dots beyond the textbook!"
    : "That's a very natural first guess! Here's the surprising part...";

  return {
    correct: isCorrect,
    headlineFeedback,
    encouragingFeedback,
    fullExplanation: params.challenge.explanation,
    surprisingFact: params.challenge.surprisingFact,
    realWorldConnection: params.challenge.realWorldConnection,
    earnedBrainXp: earnedXp,
    newBrainStreak: state.brainStreak,
    streakExtendedToday: streakExtended,
  };
}
