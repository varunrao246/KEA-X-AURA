import type { Interest } from "@/lib/types";

export interface Lesson {
  topicId: string;
  bigIdea: string;
  points: { title: string; text: string }[];
  formula?: { expr: string; legend: string };
  example?: { title: string; steps: string[]; result: string };
  /** Which analogy family to use for the "In your world" card. */
  world?: "circuit" | "titration" | "senses";
}

export const LESSONS: Record<string, Lesson> = {
  "electric-current": {
    topicId: "electric-current",
    bigIdea: "Electric current is how much charge flows past a point every second.",
    points: [
      { title: "Charge on the move", text: "Free electrons drift through a wire when a circuit is complete." },
      { title: "Measured in amperes", text: "One ampere means one coulomb of charge passing each second." },
      { title: "Same everywhere in a series loop", text: "Current does not get 'used up'. The same amount flows through every part of a single loop." },
    ],
    formula: { expr: "I = Q ÷ t", legend: "I is current (A), Q is charge (C), t is time (s)" },
    example: { title: "12 C in 4 seconds", steps: ["Charge Q = 12 C", "Time t = 4 s", "I = Q ÷ t = 12 ÷ 4"], result: "I = 3 A" },
    world: "circuit",
  },
  voltage: {
    topicId: "voltage",
    bigIdea: "Voltage is the push that makes charge move round a circuit.",
    points: [
      { title: "Energy per charge", text: "One volt means one joule of energy for every coulomb of charge." },
      { title: "Supplied by a source", text: "A battery or cell creates the voltage. Bigger voltage, bigger push." },
      { title: "Measured across", text: "A voltmeter connects across a component, in parallel, to read its voltage." },
    ],
    formula: { expr: "V = W ÷ Q", legend: "V is voltage (V), W is work done (J), Q is charge (C)" },
    example: { title: "A 9 V battery moving 2 C", steps: ["V = 9 V, Q = 2 C", "W = V × Q = 9 × 2"], result: "W = 18 J of energy supplied" },
    world: "circuit",
  },
  resistance: {
    topicId: "resistance",
    bigIdea: "Resistance is how strongly a material opposes the flow of current.",
    points: [
      { title: "More resistance, less current", text: "With the same voltage, a bigger resistance lets less current through." },
      { title: "Longer means harder", text: "Doubling a wire's length doubles its resistance." },
      { title: "Thicker means easier", text: "Doubling a wire's cross-sectional area halves its resistance." },
    ],
    formula: { expr: "R ∝ L ÷ A", legend: "R is resistance (Ω), L is length, A is cross-sectional area" },
    example: { title: "A wire twice as long", steps: ["Original wire: R = 4 Ω", "New wire has 2 × the length", "R doubles: 4 × 2"], result: "R = 8 Ω" },
    world: "circuit",
  },
  "ohms-law": {
    topicId: "ohms-law",
    bigIdea: "Current through a resistor is proportional to the voltage across it, and inversely proportional to its resistance.",
    points: [
      { title: "Three quantities, one rule", text: "Voltage, current and resistance are tied together by V = I × R." },
      { title: "Rearrange as needed", text: "I = V ÷ R gives current. R = V ÷ I gives resistance." },
      { title: "Multi-step circuits", text: "In series, add the resistors first, find the current, then work out each voltage." },
    ],
    formula: { expr: "V = I × R", legend: "V is voltage (V), I is current (A), R is resistance (Ω)" },
    example: { title: "12 V across 6 Ω", steps: ["V = 12 V, R = 6 Ω", "I = V ÷ R = 12 ÷ 6"], result: "I = 2 A" },
    world: "circuit",
  },
  "acids-bases": {
    topicId: "acids-bases",
    bigIdea: "Acids release hydrogen ions in water. Bases release hydroxide ions.",
    points: [
      { title: "Acids taste sour", text: "Lemon juice and vinegar are acids. They turn blue litmus red." },
      { title: "Bases feel slippery", text: "Soap and baking soda are bases. They turn red litmus blue." },
      { title: "They cancel out", text: "An acid and a base react to form a salt and water." },
    ],
    formula: { expr: "Acid + Base → Salt + Water", legend: "This is called neutralisation" },
    example: { title: "Hydrochloric acid and sodium hydroxide", steps: ["HCl is the acid", "NaOH is the base", "They neutralise each other"], result: "HCl + NaOH → NaCl + H₂O" },
    world: "titration",
  },
  ph: {
    topicId: "ph",
    bigIdea: "pH is a number that tells you how acidic or basic a solution is.",
    points: [
      { title: "A scale from 0 to 14", text: "Below 7 is acidic, 7 is neutral and above 7 is basic." },
      { title: "Each step is ten times", text: "pH 3 has ten times more H⁺ than pH 4." },
      { title: "Lower means stronger acid", text: "pH 1 is far more acidic than pH 5." },
    ],
    formula: { expr: "pH = −log₁₀[H⁺]", legend: "[H⁺] is the hydrogen ion concentration in mol/L" },
    example: { title: "[H⁺] = 1 × 10⁻⁴ mol/L", steps: ["pH = −log₁₀(10⁻⁴)"], result: "pH = 4 (acidic)" },
    world: "titration",
  },
  indicators: {
    topicId: "indicators",
    bigIdea: "Indicators are substances that change colour depending on the pH of a solution.",
    points: [
      { title: "Litmus", text: "Red in acid, blue in base. Simple but not precise." },
      { title: "Phenolphthalein", text: "Colourless in acid, pink in base. It flips around pH 8.2 to 10." },
      { title: "Methyl orange", text: "Red in acid, yellow in base. It flips around pH 3.1 to 4.4." },
    ],
    example: { title: "Choosing for a strong acid and strong base", steps: ["The endpoint is at pH 7", "The pH jumps sharply near the endpoint", "Phenolphthalein turns pink just after it"], result: "Phenolphthalein works well" },
    world: "titration",
  },
  titration: {
    topicId: "titration",
    bigIdea: "Titration finds an unknown concentration by adding a solution of known concentration until the reaction is exactly complete.",
    points: [
      { title: "Add slowly", text: "The burette delivers titrant drop by drop as you swirl the flask." },
      { title: "Watch the indicator", text: "The first lasting colour change marks the endpoint." },
      { title: "Use the volumes", text: "At the endpoint, moles of acid match moles of base for a 1:1 reaction." },
    ],
    formula: { expr: "M₁V₁ = M₂V₂", legend: "M is concentration (mol/L), V is volume. Valid for a 1:1 reaction like HCl and NaOH" },
    example: { title: "20 mL of NaOH neutralises 25 mL of 0.08 M HCl", steps: ["M₁V₁ = 0.08 × 25 = 2.0 mmol", "M₂ = 2.0 ÷ 20"], result: "NaOH is 0.10 M" },
    world: "titration",
  },
  "sense-organs": {
    topicId: "sense-organs",
    bigIdea: "Sense organs are the body's information gatherers. Each one is specialised for a type of stimulus.",
    points: [
      { title: "Five classic senses", text: "Eyes, ears, nose, tongue and skin cover sight, hearing, smell, taste and touch." },
      { title: "Specialised", text: "Each organ contains receptors tuned to one kind of information." },
      { title: "They work together", text: "Flavour uses smell and taste together. That is why food seems bland with a blocked nose." },
    ],
    example: { title: "Why food tastes bland with a cold", steps: ["A blocked nose stops smell reaching receptors", "Taste alone gives a weaker flavour"], result: "Smell and taste combine to make flavour" },
    world: "senses",
  },
  stimulus: {
    topicId: "stimulus",
    bigIdea: "A stimulus is a change in the surroundings that an organism can detect. The body's reaction is the response.",
    points: [
      { title: "Stimulus in, response out", text: "Bright light is the stimulus. Your pupils shrinking is the response." },
      { title: "Many kinds", text: "Light, sound, chemicals, pressure and temperature are all stimuli." },
      { title: "Detected first", text: "Receptors must detect the stimulus before anything else can happen." },
    ],
    example: { title: "Touching a hot pan", steps: ["Stimulus: heat", "Detected by temperature receptors", "Response: you pull your hand away"], result: "Stimulus → receptor → nerve → brain → response" },
    world: "senses",
  },
  "sensory-receptors": {
    topicId: "sensory-receptors",
    bigIdea: "Sensory receptors are specialised cells that turn a stimulus into a nerve signal.",
    points: [
      { title: "Matched to a stimulus", text: "Photoreceptors sense light, chemoreceptors sense chemicals, thermoreceptors sense temperature." },
      { title: "In the right place", text: "Rods and cones are in the retina. Hair cells are in the cochlea." },
      { title: "Density matters", text: "Fingertips have many touch receptors packed close together, so they feel fine detail." },
    ],
    example: { title: "Seeing a red light", steps: ["Light enters the eye", "Cones in the retina absorb it", "They send a signal along the optic nerve"], result: "Photoreceptors turn light into a nerve signal" },
    world: "senses",
  },
  "brain-response": {
    topicId: "brain-response",
    bigIdea: "The brain receives signals from receptors, decides what to do, and sends instructions to muscles.",
    points: [
      { title: "Neurons carry signals", text: "Sensory neurons bring signals in. Motor neurons send instructions out." },
      { title: "Reflexes skip the brain", text: "A reflex arc goes through the spinal cord, so it is faster." },
      { title: "Different regions, different jobs", text: "For example the occipital lobe processes vision." },
    ],
    example: { title: "The reflex arc", steps: ["Receptor detects heat", "Sensory neuron → spinal cord", "Motor neuron → muscle contracts"], result: "Your hand pulls away before you feel the pain" },
    world: "senses",
  },
};

/** Analogy pieces for circuits, one set per interest. */
const CIRCUIT_WORLDS: Record<Interest, { flow: string; push: string; block: string; scene: string }> = {
  space: { flow: "fuel streaming through a rocket's fuel line", push: "the pump pressure behind that fuel", block: "a narrow valve in the line", scene: "a rocket" },
  sports: { flow: "players streaming through a stadium tunnel", push: "the crowd surge behind them", block: "a narrow gate", scene: "a stadium" },
  gaming: { flow: "data streaming to your console", push: "your internet speed", block: "lag on the connection", scene: "an online game" },
  animals: { flow: "a herd moving along a trail", push: "the herd pressing from behind", block: "a narrow gap between rocks", scene: "a wildlife trail" },
  technology: { flow: "data flowing along a cable", push: "the signal strength", block: "a slow router", scene: "a network" },
  environment: { flow: "water running down a stream", push: "the slope of the hill", block: "a bed of stones", scene: "a river" },
  art: { flow: "paint flowing from a tube", push: "the pressure of your squeeze", block: "a clogged nozzle", scene: "a painting" },
};

const TITRATION_HOOKS: Record<Interest, string> = {
  space: "Docking a spacecraft: you inch in slowly and stop at exactly the right moment. Titration is that precision, drop by drop.",
  sports: "Like a penalty shot, timing is everything. Stop adding titrant the instant the colour changes.",
  gaming: "Think of it as a precision mini-game: hit the endpoint on the button press, not a drop late.",
  animals: "Like a vet measuring a dose: too little does nothing, too much overshoots. Titration finds the exact amount.",
  technology: "It is a measurement with a 0.1 mL resolution: careful calibration, then read the result.",
  environment: "Scientists use titration to test whether river water is too acidic. Every drop counts.",
  art: "Like mixing a colour: add pigment slowly and stop when the shade turns. The indicator is your colour check.",
};

const SENSES_HOOKS: Record<Interest, string> = {
  space: "An astronaut's helmet sensors work like your receptors: they detect changes and send signals to mission control, your brain.",
  sports: "A goalkeeper sees the ball, and a signal races to the brain and muscles in a fraction of a second.",
  gaming: "Your eyes are the controller input, your brain is the console, and your muscles are the on-screen action.",
  animals: "A dog's nose has far more smell receptors than yours, so it detects signals you never notice.",
  technology: "Receptors are sensors, neurons are wires, and the brain is the processor.",
  environment: "Animals sense weather changes long before we do, thanks to specialised receptors.",
  art: "Your eyes detect colour with cones. Your brain then builds the picture you see.",
};

export function analogyFor(topicId: string, interest: Interest | undefined) {
  const lesson = LESSONS[topicId];
  if (!lesson?.world || !interest) return null;
  if (lesson.world === "titration") return TITRATION_HOOKS[interest];
  if (lesson.world === "senses") return SENSES_HOOKS[interest];
  const w = CIRCUIT_WORLDS[interest];
  switch (topicId) {
    case "electric-current": return `In ${w.scene}, current is like ${w.flow}: how much passes by each second.`;
    case "voltage": return `In ${w.scene}, voltage is like ${w.push}. A bigger push moves more.`;
    case "resistance": return `In ${w.scene}, resistance is like ${w.block}. The narrower it gets, the less flows through.`;
    case "ohms-law": return `In ${w.scene}, give ${w.push} a boost and there is more of ${w.flow}. Add ${w.block} and there is less. That is Ohm's Law: I = V ÷ R.`;
    default: return null;
  }
}
