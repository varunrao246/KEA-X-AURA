import type { Level, Question } from "@/lib/types";

/**
 * Question bank.
 *
 * Numeric questions are generated from templates with explicit parameter sets, and the answer is
 * always COMPUTED from the parameters, never typed by hand. That keeps every answer correct and gives
 * each question a structured `variables` map, which is exactly what the AI re-theming guardrail
 * needs to prove a rewrite has not changed the numbers.
 */

type Params = Record<string, number>;

const out: Question[] = [];
const counters = new Map<string, number>();
let mcqCounter = 0;

function nextId(topicId: string, level: number) {
  const key = `${topicId}-${level}`;
  const n = (counters.get(key) ?? 0) + 1;
  counters.set(key, n);
  return `${topicId}-l${level}-${n}`;
}

const clean = (n: number) => Number(n.toFixed(4));

function mcq(
  topicId: string,
  level: Level,
  objective: string,
  stem: string,
  correct: string,
  wrong: [string, string, string],
  hint: string,
  explanation: string,
) {
  // Rotate the correct option through the four positions so the answer is never predictable.
  const pos = mcqCounter++ % 4;
  const options = [...wrong];
  options.splice(pos, 0, correct);
  out.push({ id: nextId(topicId, level), topicId, level, type: "mcq", stem, options, answer: correct, hint, explanation, objective });
}

interface NumericTemplate {
  topicId: string;
  level: Level;
  objective: string;
  formula: string;
  unit: string;
  tolerance?: number;
  sets: Params[];
  stem: (p: Params) => string;
  answer: (p: Params) => number;
  hint: (p: Params) => string;
  explain: (p: Params, a: number) => string;
}

function numeric(t: NumericTemplate) {
  for (const p of t.sets) {
    const a = clean(t.answer(p));
    out.push({
      id: nextId(t.topicId, t.level),
      topicId: t.topicId,
      level: t.level,
      type: "numeric",
      stem: t.stem(p),
      answer: String(a),
      numericAnswer: a,
      unit: t.unit,
      tolerance: t.tolerance ?? Math.max(0.01, Math.abs(a) * 0.005),
      hint: t.hint(p),
      explanation: t.explain(p, a),
      objective: t.objective,
      variables: p,
      formula: t.formula,
    });
  }
}

/* ============================== PHYSICS ============================== */

// ---- Electric Current
const EC = "electric-current";
mcq(EC, 1, "Identify electric current", "Which quantity measures the rate at which electric charge flows?", "Electric current", ["Voltage", "Resistance", "Electric power"], "Think of 'how much charge per second'.", "Current is the amount of charge passing a point each second: I = Q / t.");
mcq(EC, 1, "Identify the unit of current", "What is the SI unit of electric current?", "Ampere (A)", ["Volt (V)", "Ohm (Ω)", "Coulomb (C)"], "It is named after André-Marie Ampère.", "Current is measured in amperes. One ampere is one coulomb of charge per second.");
mcq(EC, 1, "Identify charge carriers in a metal", "In a metal wire, what actually moves to make an electric current?", "Free electrons", ["Protons", "Neutrons", "Whole metal atoms"], "Which particles are free to move in a metal?", "Free electrons drift through the metal. By convention, current is drawn in the opposite direction to their motion.");
numeric({ topicId: EC, level: 2, objective: "Apply I = Q / t", formula: "I = Q / t", unit: "A",
  sets: [{ Q: 12, t: 4 }, { Q: 20, t: 5 }, { Q: 45, t: 9 }, { Q: 8, t: 2 }],
  stem: (p) => `A charge of ${p.Q} C flows past a point in a wire in ${p.t} s. What is the current in amperes?`,
  answer: (p) => p.Q / p.t, hint: () => "Current = charge ÷ time.", explain: (p, a) => `I = Q / t = ${p.Q} ÷ ${p.t} = ${a} A.` });
numeric({ topicId: EC, level: 3, objective: "Find charge from current and time", formula: "Q = I × t", unit: "C",
  sets: [{ I: 3, t: 10 }, { I: 2.5, t: 4 }, { I: 0.5, t: 60 }, { I: 4, t: 7 }],
  stem: (p) => `A current of ${p.I} A flows for ${p.t} s. How much charge flows through the wire, in coulombs?`,
  answer: (p) => p.I * p.t, hint: () => "Rearrange I = Q / t to get Q.", explain: (p, a) => `Q = I × t = ${p.I} × ${p.t} = ${a} C.` });
numeric({ topicId: EC, level: 3, objective: "Find time from charge and current", formula: "t = Q / I", unit: "s",
  sets: [{ Q: 60, I: 3 }, { Q: 45, I: 1.5 }, { Q: 100, I: 4 }],
  stem: (p) => `${p.Q} C of charge passes through a wire carrying ${p.I} A. For how many seconds did the current flow?`,
  answer: (p) => p.Q / p.I, hint: () => "Rearrange I = Q / t to get t.", explain: (p, a) => `t = Q / I = ${p.Q} ÷ ${p.I} = ${a} s.` });
numeric({ topicId: EC, level: 4, objective: "Multi-step: convert minutes and find charge", formula: "Q = I × t (t in seconds)", unit: "C",
  sets: [{ I: 2, m: 3 }, { I: 0.5, m: 10 }, { I: 1.5, m: 2 }],
  stem: (p) => `A device draws ${p.I} A for ${p.m} minutes. How much charge passes through it, in coulombs?`,
  answer: (p) => p.I * p.m * 60, hint: () => "Convert minutes to seconds first.", explain: (p, a) => `${p.m} min = ${p.m * 60} s, so Q = ${p.I} × ${p.m * 60} = ${a} C.` });
numeric({ topicId: EC, level: 4, objective: "Multi-step: find current from charge and minutes", formula: "I = Q / t (t in seconds)", unit: "A",
  sets: [{ Q: 600, m: 5 }, { Q: 900, m: 10 }, { Q: 240, m: 4 }],
  stem: (p) => `A charge of ${p.Q} C flows through a wire in ${p.m} minutes. What is the current in amperes?`,
  answer: (p) => p.Q / (p.m * 60), hint: () => "Time must be in seconds for the ampere.", explain: (p, a) => `${p.m} min = ${p.m * 60} s, so I = ${p.Q} ÷ ${p.m * 60} = ${a} A.` });

// ---- Voltage
const VO = "voltage";
mcq(VO, 1, "Identify voltage", "Which quantity is the 'push' that drives current around a circuit?", "Voltage (potential difference)", ["Resistance", "Charge", "Current"], "It is what a battery provides.", "Voltage is the energy given to each coulomb of charge. It pushes current round the circuit.");
mcq(VO, 1, "Identify the unit of voltage", "What is the SI unit of voltage?", "Volt (V)", ["Ampere (A)", "Ohm (Ω)", "Joule (J)"], "Named after Alessandro Volta.", "Voltage is measured in volts. One volt is one joule of energy per coulomb.");
mcq(VO, 1, "Identify the instrument for voltage", "Which instrument measures the voltage across a component?", "Voltmeter", ["Ammeter", "Ohmmeter", "Stopwatch"], "It is connected in parallel with the component.", "A voltmeter is connected across (in parallel with) the component to read the voltage.");
numeric({ topicId: VO, level: 2, objective: "Apply V = W / Q", formula: "V = W / Q", unit: "V",
  sets: [{ W: 12, Q: 4 }, { W: 30, Q: 5 }, { W: 45, Q: 9 }, { W: 24, Q: 2 }],
  stem: (p) => `${p.W} J of work is done moving ${p.Q} C of charge between two points. What is the potential difference in volts?`,
  answer: (p) => p.W / p.Q, hint: () => "Voltage = work done ÷ charge.", explain: (p, a) => `V = W / Q = ${p.W} ÷ ${p.Q} = ${a} V.` });
numeric({ topicId: VO, level: 3, objective: "Find energy from voltage and charge", formula: "W = V × Q", unit: "J",
  sets: [{ V: 6, Q: 5 }, { V: 12, Q: 3 }, { V: 1.5, Q: 8 }, { V: 9, Q: 2 }],
  stem: (p) => `A ${p.V} V battery moves ${p.Q} C of charge around a circuit. How much energy does it supply, in joules?`,
  answer: (p) => p.V * p.Q, hint: () => "Rearrange V = W / Q to get W.", explain: (p, a) => `W = V × Q = ${p.V} × ${p.Q} = ${a} J.` });
numeric({ topicId: VO, level: 3, objective: "Find charge from work and voltage", formula: "Q = W / V", unit: "C",
  sets: [{ W: 48, V: 12 }, { W: 60, V: 10 }, { W: 27, V: 9 }],
  stem: (p) => `A battery does ${p.W} J of work at ${p.V} V. How much charge does it move, in coulombs?`,
  answer: (p) => p.W / p.V, hint: () => "Rearrange V = W / Q to get Q.", explain: (p, a) => `Q = W / V = ${p.W} ÷ ${p.V} = ${a} C.` });
numeric({ topicId: VO, level: 4, objective: "Voltages of cells in series add", formula: "V_total = n × V", unit: "V",
  sets: [{ n: 3, V: 1.5 }, { n: 4, V: 1.5 }, { n: 2, V: 4.5 }],
  stem: (p) => `${p.n} identical ${p.V} V cells are connected in series. What is the total voltage?`,
  answer: (p) => p.n * p.V, hint: () => "In series, the cell voltages add up.", explain: (p, a) => `Series cells add: ${p.n} × ${p.V} = ${a} V.` });
numeric({ topicId: VO, level: 4, objective: "Voltage divides across identical bulbs in series", formula: "V_each = V / n", unit: "V",
  sets: [{ V: 9, n: 2 }, { V: 12, n: 3 }, { V: 6, n: 2 }],
  stem: (p) => `A ${p.V} V battery is connected across ${p.n} identical bulbs in series. What is the voltage across each bulb, in volts?`,
  answer: (p) => p.V / p.n, hint: () => "Identical bulbs share the voltage equally.", explain: (p, a) => `Identical bulbs share the battery voltage: ${p.V} ÷ ${p.n} = ${a} V each.` });

// ---- Resistance
const RE = "resistance";
mcq(RE, 1, "Identify what resistance does", "What does resistance do in an electric circuit?", "It opposes the flow of current", ["It pushes charge around the circuit", "It stores electric charge", "It creates new electrons"], "Think of a narrow section in a water pipe.", "Resistance opposes current. A larger resistance lets less current flow for the same voltage.");
mcq(RE, 1, "Identify the unit of resistance", "What is the SI unit of resistance?", "Ohm (Ω)", ["Volt (V)", "Ampere (A)", "Watt (W)"], "It uses the Greek letter omega.", "Resistance is measured in ohms (Ω).");
mcq(RE, 1, "Identify good conductors", "Which material has the lowest resistance, making it the best conductor?", "Copper", ["Rubber", "Glass", "Dry wood"], "Wires are made of it.", "Copper has very low resistance, which is why it is used for electrical wires.");
mcq(RE, 2, "Relate resistance and current", "The voltage stays the same but the resistance of a circuit increases. What happens to the current?", "It decreases", ["It increases", "It stays the same", "It doubles"], "A narrower pipe lets less water through at the same pressure.", "With the same push (voltage), more resistance means less current: I = V / R.");
mcq(RE, 2, "Relate resistance and length", "A longer wire, of the same material and thickness, has...", "More resistance", ["Less resistance", "The same resistance", "No resistance"], "More wire means more collisions for the electrons.", "Resistance is directly proportional to length, so a longer wire resists more.");
mcq(RE, 2, "Relate resistance and thickness", "Which change would reduce the resistance of a wire?", "Using a thicker wire", ["Making the wire longer", "Using a thinner wire", "Heating the wire strongly"], "A wider pipe is easier to flow through.", "A thicker wire gives electrons more room to move, so its resistance is lower.");
numeric({ topicId: RE, level: 3, objective: "Resistance scales with length", formula: "R ∝ L", unit: "Ω",
  sets: [{ R: 4, k: 2 }, { R: 5, k: 3 }, { R: 6, k: 0.5 }, { R: 10, k: 4 }],
  stem: (p) => `A wire has a resistance of ${p.R} Ω. A second wire of the same material and thickness is ${p.k} times as long. What is its resistance, in ohms?`,
  answer: (p) => p.R * p.k, hint: () => "Resistance is proportional to length.", explain: (p, a) => `R ∝ L, so the new resistance is ${p.R} × ${p.k} = ${a} Ω.` });
numeric({ topicId: RE, level: 3, objective: "Resistance scales inversely with area", formula: "R ∝ 1 / A", unit: "Ω",
  sets: [{ R: 12, k: 2 }, { R: 9, k: 3 }, { R: 20, k: 4 }],
  stem: (p) => `A wire has a resistance of ${p.R} Ω. A wire of the same material and length has ${p.k} times the cross-sectional area. What is its resistance, in ohms?`,
  answer: (p) => p.R / p.k, hint: () => "Thicker wire means lower resistance: divide.", explain: (p, a) => `R ∝ 1/A, so the new resistance is ${p.R} ÷ ${p.k} = ${a} Ω.` });
numeric({ topicId: RE, level: 4, objective: "Combine resistors in series", formula: "R_total = R₁ + R₂ + R₃", unit: "Ω",
  sets: [{ a: 2, b: 3, c: 5 }, { a: 4, b: 4, c: 7 }, { a: 1.5, b: 2.5, c: 6 }],
  stem: (p) => `Resistors of ${p.a} Ω, ${p.b} Ω and ${p.c} Ω are connected in series. What is the total resistance, in ohms?`,
  answer: (p) => p.a + p.b + p.c, hint: () => "In series, resistances simply add.", explain: (p, a) => `Series: ${p.a} + ${p.b} + ${p.c} = ${a} Ω.` });
numeric({ topicId: RE, level: 4, objective: "Combine two resistors in parallel", formula: "R = (R₁ × R₂) / (R₁ + R₂)", unit: "Ω",
  sets: [{ a: 6, b: 3 }, { a: 12, b: 4 }, { a: 20, b: 5 }],
  stem: (p) => `Two resistors of ${p.a} Ω and ${p.b} Ω are connected in parallel. What is the total resistance, in ohms?`,
  answer: (p) => (p.a * p.b) / (p.a + p.b), hint: () => "Product over sum works for two resistors in parallel.", explain: (p, a) => `Parallel: (${p.a} × ${p.b}) ÷ (${p.a} + ${p.b}) = ${a} Ω.` });

// ---- Ohm's Law
const OL = "ohms-law";
mcq(OL, 1, "Identify what Ohm's Law connects", "Ohm's Law links which three quantities?", "Voltage, current and resistance", ["Charge, time and energy", "Mass, force and acceleration", "Power, work and time"], "It is about a circuit's push, flow and opposition.", "Ohm's Law relates voltage (V), current (I) and resistance (R).");
mcq(OL, 1, "Recall Ohm's Law", "Which equation is Ohm's Law?", "V = I × R", ["V = I ÷ R", "I = V × R", "R = I × V"], "Voltage equals current times resistance.", "Ohm's Law is V = I × R. It can be rearranged to I = V / R or R = V / I.");
mcq(OL, 1, "Relate voltage and current", "For a fixed resistance, what happens to the current if the voltage is doubled?", "It doubles", ["It halves", "It stays the same", "It quadruples"], "V and I are proportional when R is fixed.", "I = V / R. With R fixed, doubling V doubles I.");
numeric({ topicId: OL, level: 2, objective: "Apply Ohm's Law to find current", formula: "I = V / R", unit: "A",
  sets: [{ V: 12, R: 6 }, { V: 20, R: 4 }, { V: 9, R: 3 }, { V: 30, R: 10 }],
  stem: (p) => `Calculate the current for V = ${p.V} V and R = ${p.R} Ω.`,
  answer: (p) => p.V / p.R, hint: () => "Current = voltage ÷ resistance.", explain: (p, a) => `I = V / R = ${p.V} ÷ ${p.R} = ${a} A.` });
numeric({ topicId: OL, level: 2, objective: "Apply Ohm's Law to find voltage", formula: "V = I × R", unit: "V",
  sets: [{ I: 3, R: 4 }, { I: 2, R: 5 }, { I: 0.5, R: 8 }],
  stem: (p) => `A current of ${p.I} A flows through a ${p.R} Ω resistor. What is the voltage across it, in volts?`,
  answer: (p) => p.I * p.R, hint: () => "Voltage = current × resistance.", explain: (p, a) => `V = I × R = ${p.I} × ${p.R} = ${a} V.` });
numeric({ topicId: OL, level: 3, objective: "Find a missing resistance", formula: "R = V / I", unit: "Ω",
  sets: [{ V: 10, I: 0.5 }, { V: 18, I: 3 }, { V: 6, I: 0.2 }],
  stem: (p) => `A resistor draws ${p.I} A when connected to ${p.V} V. What is its resistance, in ohms?`,
  answer: (p) => p.V / p.I, hint: () => "Rearrange V = I × R to get R.", explain: (p, a) => `R = V / I = ${p.V} ÷ ${p.I} = ${a} Ω.` });
numeric({ topicId: OL, level: 3, objective: "Convert milliamps and apply Ohm's Law", formula: "V = I × R (I in amperes)", unit: "V",
  sets: [{ mA: 250, R: 20 }, { mA: 500, R: 12 }, { mA: 40, R: 50 }],
  stem: (p) => `A current of ${p.mA} mA flows through a ${p.R} Ω resistor. What is the voltage across it, in volts?`,
  answer: (p) => (p.mA / 1000) * p.R, hint: () => "Convert milliamps to amps first (÷ 1000).", explain: (p, a) => `${p.mA} mA = ${p.mA / 1000} A, so V = ${p.mA / 1000} × ${p.R} = ${a} V.` });
numeric({ topicId: OL, level: 4, objective: "Multi-step: current in a series circuit", formula: "I = V / (R₁ + R₂)", unit: "A",
  sets: [{ V: 12, a: 4, b: 8 }, { V: 18, a: 2, b: 4 }, { V: 10, a: 1, b: 4 }],
  stem: (p) => `A ${p.V} V battery is connected to a ${p.a} Ω and a ${p.b} Ω resistor in series. What current flows, in amperes?`,
  answer: (p) => p.V / (p.a + p.b), hint: () => "Add the resistors first, then use I = V / R.", explain: (p, a) => `R_total = ${p.a} + ${p.b} = ${p.a + p.b} Ω, so I = ${p.V} ÷ ${p.a + p.b} = ${a} A.` });
numeric({ topicId: OL, level: 4, objective: "Multi-step: voltage across one resistor", formula: "V₂ = I × R₂", unit: "V",
  sets: [{ V: 9, a: 3, b: 6 }, { V: 12, a: 4, b: 2 }, { V: 20, a: 6, b: 4 }],
  stem: (p) => `A ${p.V} V battery drives current through ${p.a} Ω and ${p.b} Ω resistors in series. What is the voltage across the ${p.b} Ω resistor, in volts?`,
  answer: (p) => (p.V / (p.a + p.b)) * p.b, hint: () => "Find the current first, then V = I × R for that resistor.", explain: (p, a) => `I = ${p.V} ÷ ${p.a + p.b} = ${p.V / (p.a + p.b)} A, so V = ${p.V / (p.a + p.b)} × ${p.b} = ${a} V.` });

/* ============================== CHEMISTRY ============================== */

// ---- Acids & Bases
const AB = "acids-bases";
mcq(AB, 1, "Identify an acid", "Which of these household items is an acid?", "Lemon juice", ["Soap", "Baking soda solution", "Milk of magnesia"], "It tastes sour.", "Lemon juice contains citric acid, which is why it tastes sour.");
mcq(AB, 1, "Litmus in acid", "What colour does blue litmus paper turn in an acid?", "Red", ["Stays blue", "Green", "Yellow"], "Acids turn blue litmus red.", "Blue litmus turns red in acids, and red litmus turns blue in bases.");
mcq(AB, 2, "Ions released by acids", "Which ions do acids release when dissolved in water?", "H⁺ (hydrogen ions)", ["OH⁻ (hydroxide ions)", "Na⁺ (sodium ions)", "Cl⁻ only"], "Acids are hydrogen-ion donors.", "Acids release H⁺ ions in water. Bases release OH⁻ ions.");
mcq(AB, 2, "Identify a base", "Which of these is a base?", "Sodium hydroxide", ["Hydrochloric acid", "Sulfuric acid", "Citric acid"], "It contains hydroxide ions.", "Sodium hydroxide (NaOH) is a strong base that releases OH⁻ in water.");
mcq(AB, 3, "Neutralisation products", "What are the products when an acid reacts with a base?", "Salt and water", ["Salt and hydrogen gas", "Carbon dioxide and water", "Another acid and another base"], "This reaction is called neutralisation.", "Acid + base → salt + water. This is a neutralisation reaction.");
mcq(AB, 3, "Acid and metal reaction", "Which gas is released when zinc reacts with dilute hydrochloric acid?", "Hydrogen", ["Oxygen", "Carbon dioxide", "Chlorine"], "A lit splint makes a 'pop' with this gas.", "Acid + metal → salt + hydrogen gas. The 'pop' test confirms hydrogen.");
mcq(AB, 4, "Deduce a base from properties", "A solution turns red litmus blue, feels slippery, and gives off heat and a salt when mixed with an acid. What is it most likely to be?", "A base (alkali)", ["An acid", "A neutral salt solution", "Pure water"], "Combine all three clues.", "Turning red litmus blue and neutralising acids are both properties of bases.");
mcq(AB, 4, "Apply neutralisation to daily life", "Toothpaste helps reduce the effect of acid made by bacteria in the mouth. What does this tell you about toothpaste?", "It is mildly basic", ["It is strongly acidic", "It is neutral", "It is only water"], "What neutralises an acid?", "To neutralise mouth acid, toothpaste must be mildly basic.");

// ---- pH
const PH = "ph";
mcq(PH, 1, "Recall neutral pH", "What is the pH of a neutral solution at room temperature?", "7", ["0", "1", "14"], "It is the middle of the scale.", "Pure water is neutral, with a pH of 7.");
mcq(PH, 1, "What pH measures", "What does the pH scale measure?", "How acidic or basic a solution is", ["How heavy a solution is", "How hot a solution is", "How fast a reaction is"], "It runs from 0 to 14.", "pH tells you how acidic or basic a solution is.");
mcq(PH, 2, "Read a pH value", "A solution has a pH of 3. What is it?", "Acidic", ["Basic", "Neutral", "It cannot be said"], "Below 7 means acidic.", "A pH below 7 is acidic.");
mcq(PH, 2, "Compare acidity", "Which solution is MORE acidic?", "pH 2", ["pH 5", "pH 7", "pH 9"], "Lower pH means more acidic.", "The lower the pH, the more acidic the solution. pH 2 is the most acidic here.");
numeric({ topicId: PH, level: 3, objective: "Calculate pH from hydrogen ion concentration", formula: "pH = −log₁₀[H⁺]", unit: "",
  tolerance: 0.05, sets: [{ n: 3 }, { n: 5 }, { n: 9 }],
  stem: (p) => `A solution has a hydrogen ion concentration of 1 × 10⁻${p.n} mol/L. What is its pH?`,
  answer: (p) => p.n, hint: () => "pH = −log₁₀ of the concentration.", explain: (p, a) => `pH = −log₁₀(10⁻${p.n}) = ${a}.` });
numeric({ topicId: PH, level: 4, objective: "Compare hydrogen ion concentration across pH values", formula: "ratio = 10^(pH₂ − pH₁)", unit: "times",
  tolerance: 0.5, sets: [{ a: 2, b: 5 }, { a: 3, b: 4 }, { a: 1, b: 4 }],
  stem: (p) => `How many times higher is the H⁺ concentration of a pH ${p.a} solution than a pH ${p.b} solution?`,
  answer: (p) => 10 ** (p.b - p.a), hint: () => "Each pH step is a factor of 10.", explain: (p, a) => `The difference is ${p.b - p.a} pH units, so the ratio is 10^${p.b - p.a} = ${a}.` });
numeric({ topicId: PH, level: 4, objective: "Effect of dilution on pH", formula: "pH increases by 1 per 10× dilution", unit: "",
  tolerance: 0.05, sets: [{ p: 2 }, { p: 4 }, { p: 5 }],
  stem: (p) => `A solution of pH ${p.p} is diluted so that its H⁺ concentration becomes 10 times smaller. What is the new pH?`,
  answer: (p) => p.p + 1, hint: () => "Lower H⁺ concentration means a higher pH.", explain: (p, a) => `A tenfold drop in [H⁺] raises pH by 1: ${p.p} + 1 = ${a}.` });

// ---- Indicators
const IN = "indicators";
mcq(IN, 1, "Phenolphthalein in base", "What colour is phenolphthalein in a basic solution?", "Pink", ["Colourless", "Yellow", "Red"], "It goes from colourless to this in base.", "Phenolphthalein is colourless in acid and pink in base.");
mcq(IN, 1, "Define an indicator", "What is an indicator?", "A substance that changes colour depending on pH", ["A substance that speeds up reactions", "A device that measures mass", "A gas released in neutralisation"], "Think litmus.", "Indicators change colour at particular pH values, showing whether a solution is acidic or basic.");
mcq(IN, 2, "Methyl orange in acid", "What colour is methyl orange in an acidic solution?", "Red", ["Yellow", "Colourless", "Blue"], "It is orange-ish; acid pushes it one way.", "Methyl orange is red in acid and yellow in base.");
mcq(IN, 2, "Natural indicators", "Which of these is a natural indicator?", "Red cabbage juice", ["Table salt", "Distilled water", "Sugar solution"], "It changes colour across the pH range.", "Red cabbage juice contains anthocyanins, pigments that change colour with pH.");
mcq(IN, 3, "Interpret an indicator result", "A colourless solution turns pink when phenolphthalein is added. The solution is...", "Basic", ["Acidic", "Neutral", "Impossible to tell"], "Phenolphthalein is pink in base.", "Pink phenolphthalein shows the solution is basic (pH above about 8.2).");
mcq(IN, 3, "Universal indicator", "Universal indicator turns green in a solution. What is its approximate pH?", "About 7", ["About 2", "About 12", "About 0"], "Green sits in the middle of the range.", "Universal indicator is green near pH 7, the neutral point.");
mcq(IN, 4, "Endpoint colour change", "NaOH is added to HCl containing phenolphthalein. What colour change marks the endpoint?", "Colourless to faint pink", ["Pink to colourless", "Red to blue", "Yellow to green"], "The flask starts acidic.", "The flask starts acidic (colourless). At the endpoint the first excess base makes it faintly pink.");
mcq(IN, 4, "Why use few drops", "Why is only a few drops of indicator used in a titration?", "Indicators are weak acids or bases and too much would affect the result", ["More indicator makes the colour easier to see and more accurate", "Indicators react with the burette", "Indicators speed up the neutralisation"], "Think about what the indicator itself is.", "Indicators are weak acids or bases themselves, so a large amount would use up some titrant and add error.");

// ---- Titration
const TI = "titration";
mcq(TI, 1, "Apparatus for titration", "Which piece of apparatus delivers the titrant drop by drop?", "Burette", ["Beaker", "Test tube", "Measuring cylinder"], "It has a tap and a scale.", "A burette lets you add titrant slowly and read the volume added precisely.");
mcq(TI, 1, "Define the endpoint", "What is the endpoint of a titration?", "The point where the indicator changes colour", ["The point where the flask overflows", "The point where titrant is first added", "The point where the temperature is highest"], "It's what you watch for.", "The endpoint is where the indicator changes colour, signalling the reaction is complete.");
mcq(TI, 2, "Neutralisation equation", "What are the products of the reaction between HCl and NaOH?", "NaCl and H₂O", ["NaCl and H₂", "Na₂O and HCl", "NaClO and H₂"], "Acid + base gives salt and water.", "HCl + NaOH → NaCl + H₂O.");
mcq(TI, 2, "Good technique", "Why is the flask swirled during a titration?", "To mix the solutions so the reaction is even", ["To cool the solution", "To remove the indicator", "To make the burette drip faster"], "The titrant needs to reach all of the solution.", "Swirling mixes the titrant into the flask so the colour change reflects the whole solution.");
numeric({ topicId: TI, level: 3, objective: "Use M₁V₁ = M₂V₂ to find concentration", formula: "M₂ = M₁V₁ / V₂", unit: "M",
  tolerance: 0.005, sets: [{ V1: 25, M1: 0.1, V2: 20 }, { V1: 20, M1: 0.2, V2: 40 }, { V1: 10, M1: 0.5, V2: 25 }],
  stem: (p) => `${p.V1} mL of ${p.M1} M HCl is exactly neutralised by ${p.V2} mL of NaOH solution. What is the concentration of the NaOH, in mol/L?`,
  answer: (p) => (p.M1 * p.V1) / p.V2, hint: () => "For HCl + NaOH the mole ratio is 1:1, so M₁V₁ = M₂V₂.", explain: (p, a) => `M₂ = (${p.M1} × ${p.V1}) ÷ ${p.V2} = ${a} M.` });
numeric({ topicId: TI, level: 4, objective: "Multi-step: diprotic acid titration", formula: "V(NaOH) = 2 × M(acid) × V(acid) / M(NaOH)", unit: "mL",
  tolerance: 0.2, sets: [{ V1: 20, M1: 0.1, M2: 0.2 }, { V1: 10, M1: 0.5, M2: 0.25 }, { V1: 15, M1: 0.2, M2: 0.1 }],
  stem: (p) => `${p.V1} mL of ${p.M1} M H₂SO₄ is neutralised by NaOH of concentration ${p.M2} M. What volume of NaOH is needed, in mL?`,
  answer: (p) => (2 * p.M1 * p.V1) / p.M2, hint: () => "H₂SO₄ has two H⁺ per molecule, so it needs twice the moles of NaOH.", explain: (p, a) => `H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O. V = 2 × ${p.M1} × ${p.V1} ÷ ${p.M2} = ${a} mL.` });
numeric({ topicId: TI, level: 4, objective: "Multi-step: analyse a titration result", formula: "M(NaOH) = 0.100 × V(HCl) / 25.0", unit: "M",
  tolerance: 0.002, sets: [{ V: 20 }, { V: 30 }, { V: 15 }],
  stem: (p) => `A 25.0 mL sample of NaOH solution needs ${p.V} mL of 0.100 M HCl to reach the endpoint. What is the concentration of the NaOH, in mol/L?`,
  answer: (p) => (0.1 * p.V) / 25, hint: () => "Moles of HCl = M × V. The mole ratio is 1:1.", explain: (p, a) => `M = (0.100 × ${p.V}) ÷ 25.0 = ${a} M.` });

/* ============================== BIOLOGY ============================== */

// ---- Sense Organs
const SO = "sense-organs";
mcq(SO, 1, "Sense of smell", "Which organ is mainly responsible for the sense of smell?", "Nose", ["Tongue", "Ear", "Skin"], "It sits in the middle of your face.", "The nose detects smell molecules with receptors in the nasal cavity.");
mcq(SO, 1, "Sense of sight", "Which sense organ detects light?", "Eye", ["Ear", "Skin", "Nose"], "It has a retina.", "The eye detects light and forms images on the retina.");
mcq(SO, 2, "Sense of hearing", "Which sense organ contains the cochlea?", "Ear", ["Eye", "Nose", "Tongue"], "The cochlea is spiral-shaped.", "The cochlea in the inner ear turns sound vibrations into nerve signals.");
mcq(SO, 2, "Sense of taste", "Taste buds are found mainly on the...", "Tongue", ["Teeth", "Gums", "Nose lining"], "You taste food here first.", "Taste buds sit in small bumps (papillae) on the tongue.");
mcq(SO, 3, "Sense of touch", "Which organ detects touch, pressure, pain and temperature?", "Skin", ["Eye", "Ear", "Tongue"], "It is the largest organ of the body.", "The skin contains receptors for touch, pressure, pain and temperature.");
mcq(SO, 3, "The five senses", "Which of these is NOT one of the five traditional senses?", "Memory", ["Touch", "Hearing", "Taste"], "Senses detect the outside world.", "The five traditional senses are sight, hearing, smell, taste and touch. Memory is a brain function.");
mcq(SO, 4, "Apply to a real situation", "After a cold, Meera cannot smell her food and it tastes bland. Why?", "A blocked nose stops smell signals reaching the smell receptors", ["Her tongue has lost all its taste buds", "Her eyes cannot see the food", "Her ears cannot hear it cooking"], "Much of 'taste' is actually smell.", "Flavour depends heavily on smell. A blocked nose stops odour molecules reaching the receptors.");
mcq(SO, 4, "Deduce the affected organ", "A person can see and hear normally but cannot tell hot from cold. Which sense organ is most likely affected?", "Skin", ["Eyes", "Ears", "Nose"], "Which organ has temperature receptors?", "Temperature is sensed by receptors in the skin.");

// ---- Stimulus
const ST = "stimulus";
mcq(ST, 1, "Define a stimulus", "What is a stimulus?", "A change in the environment that an organism can detect", ["A muscle that moves the body", "A type of nerve cell", "The brain's answer to a signal"], "It is what triggers a reaction.", "A stimulus is any change in the surroundings that an organism can detect and respond to.");
mcq(ST, 1, "Example of a stimulus", "Which of these is an example of a stimulus?", "A loud sound", ["Pulling your hand away", "Blinking your eyes", "Running away"], "A stimulus comes from outside.", "A loud sound is a stimulus. Pulling away, blinking and running are responses.");
mcq(ST, 2, "Stimulus for the ear", "Which stimulus does the ear detect?", "Sound waves", ["Light", "Chemicals in food", "Pressure on the skin"], "Ears are for hearing.", "The ear detects sound waves.");
mcq(ST, 2, "Identify the stimulus", "You touch a hot pan. What is the stimulus?", "Heat", ["Pain in your brain", "Pulling your hand away", "The muscle in your arm"], "What did the environment change?", "The heat from the pan is the stimulus. Pulling your hand away is the response.");
mcq(ST, 3, "Stimulus versus response", "Bright light shines in your eyes and your pupils shrink. Which pair is correct?", "Stimulus: bright light. Response: pupils shrink", ["Stimulus: pupils shrink. Response: bright light", "Stimulus: eyes. Response: light", "Both are stimuli"], "Which happens first?", "The light is the change in the environment (stimulus). Shrinking pupils is the body's response.");
mcq(ST, 3, "Response, not stimulus", "Which of these is a RESPONSE rather than a stimulus?", "Pupils getting smaller", ["A bright light", "A loud sound", "A sudden smell of smoke"], "Responses are actions of the body.", "Pupils getting smaller is something the body does, so it is a response.");
mcq(ST, 4, "Apply to an animal", "A cat's ears turn toward a rustling sound. What are the stimulus and the response?", "Stimulus: rustling sound. Response: ears turn", ["Stimulus: ears turn. Response: rustling sound", "Stimulus: the cat. Response: the sound", "They are the same thing"], "Separate what happened outside from what the cat did.", "The sound is the stimulus, and the ears turning is the response.");
mcq(ST, 4, "Order of events", "Which is the correct order of events when you respond to a stimulus?", "Stimulus → receptor → nerve signal → brain → response", ["Response → brain → nerve signal → receptor → stimulus", "Stimulus → brain → receptor → response", "Receptor → stimulus → response → brain"], "Detection comes before processing.", "A stimulus is detected by a receptor, signalled by nerves to the brain, and the brain triggers a response.");

// ---- Sensory Receptors
const SR = "sensory-receptors";
mcq(SR, 1, "Define receptors", "What are sensory receptors?", "Specialised cells that detect stimuli", ["Muscles that respond to signals", "Chemicals that carry signals", "Parts of the brain"], "They turn a stimulus into a signal.", "Sensory receptors are specialised cells or endings that detect a particular stimulus.");
mcq(SR, 1, "Photoreceptors", "Photoreceptors detect which stimulus?", "Light", ["Sound", "Smell", "Pressure"], "'Photo' means light.", "Photoreceptors (rods and cones) detect light.");
mcq(SR, 2, "Receptors in the eye", "Rods and cones are found in which part of the eye?", "Retina", ["Cornea", "Lens", "Iris"], "It is the light-sensitive layer at the back.", "Rods and cones are the photoreceptors of the retina.");
mcq(SR, 2, "Receptors in the ear", "Hair cells in the cochlea respond to...", "Sound vibrations", ["Light", "Heat", "Smell molecules"], "The ear detects this.", "Hair cells in the cochlea move with sound vibrations and generate nerve signals.");
mcq(SR, 3, "Chemoreceptors", "Taste and smell are detected by which kind of receptor?", "Chemoreceptors", ["Photoreceptors", "Thermoreceptors", "Mechanoreceptors"], "They react to chemicals.", "Chemoreceptors detect chemicals, so they handle taste and smell.");
mcq(SR, 3, "Thermoreceptors", "Which receptors detect changes in temperature?", "Thermoreceptors", ["Photoreceptors", "Chemoreceptors", "Mechanoreceptors"], "'Thermo' means heat.", "Thermoreceptors respond to hot and cold.");
mcq(SR, 4, "Different receptors, different feelings", "Why can a pinch and a warm cup feel so different?", "Different receptor types in the skin detect pressure and temperature", ["The brain invents the difference without any receptors", "Only one kind of receptor exists in skin", "Warmth is detected by the eyes"], "Skin has more than one kind of receptor.", "Skin contains separate receptors for pressure, pain and temperature, so each feels different.");
mcq(SR, 4, "Sensitivity of fingertips", "Fingertips are more sensitive than the back of your arm. What best explains this?", "Fingertips have far more touch receptors per area", ["Fingertips have thicker bones", "The back of the arm has no nerves", "Fingertips are warmer"], "Think about how many receptors are packed in.", "Fingertips have a high density of touch receptors, giving fine sensitivity.");

// ---- Brain Response
const BR = "brain-response";
mcq(BR, 1, "The brain's role", "Which part of the body processes sensory information and decides on a response?", "Brain", ["Skin", "Bones", "Stomach"], "It is the control centre.", "The brain processes sensory signals and decides on a response.");
mcq(BR, 1, "Nerve cells", "What are nerve cells called?", "Neurons", ["Nephrons", "Alveoli", "Platelets"], "They carry electrical signals.", "Nerve cells are called neurons.");
mcq(BR, 2, "Sensory neurons", "Sensory neurons carry signals...", "From receptors to the brain or spinal cord", ["From the brain to muscles", "Only between the two eyes", "Only inside the brain"], "Sensory means 'coming in'.", "Sensory neurons bring signals from receptors towards the central nervous system.");
mcq(BR, 2, "Motor neurons", "Motor neurons carry signals to...", "Muscles and glands", ["Sense organs", "Bones only", "The skin's surface only"], "Motor means 'movement'.", "Motor neurons carry instructions from the central nervous system to muscles and glands.");
mcq(BR, 3, "Reflex processing", "In a reflex arc, which structure usually processes the signal?", "Spinal cord", ["Kidney", "Heart", "Liver"], "It runs down your back.", "In a reflex arc the spinal cord processes the signal, without waiting for the brain.");
mcq(BR, 3, "Reflex arc path", "Which is the correct path of a signal in a reflex arc?", "Receptor → sensory neuron → spinal cord → motor neuron → muscle", ["Muscle → motor neuron → spinal cord → sensory neuron → receptor", "Receptor → motor neuron → brain → muscle", "Spinal cord → receptor → muscle → neuron"], "Detect, carry in, process, carry out, act.", "The signal is detected, carried in by a sensory neuron, processed in the spinal cord, and carried out by a motor neuron to a muscle.");
mcq(BR, 4, "Why reflexes are fast", "You touch something hot and pull your hand away before you feel the pain. Why is the response so quick?", "The reflex arc goes through the spinal cord without waiting for the brain", ["The brain reacts faster than nerves can carry signals", "The hand decides on its own without nerves", "Pain travels faster than signals to muscles"], "The shortest route wins.", "In a reflex, the signal takes a short route through the spinal cord, so the muscle acts before the brain registers pain.");
mcq(BR, 4, "Brain regions", "Which part of the brain is mainly responsible for interpreting visual information?", "Occipital lobe", ["Cerebellum", "Frontal lobe", "Temporal lobe"], "It is at the back of the head.", "The occipital lobe at the back of the brain processes visual information.");

export const QUESTIONS: Question[] = out;
