import type { Level } from "@/lib/types";

export interface LabDef {
  id: string;
  title: string;
  subjectId: "physics" | "chemistry" | "biology";
  /** Topics this lab counts towards. Completing it feeds the lab component of their mastery. */
  topicIds: string[];
  blurb: string;
  minutes: number;
  /** Static page served from /public. Swap in your own HTML labs by keeping the id and file path. */
  file: string;
  tasks: string[];
  level: Level | null;
}

export const LABS: LabDef[] = [
  {
    id: "ohms-law-lab",
    title: "Ohm's Law Circuit Lab",
    subjectId: "physics",
    topicIds: ["resistance", "ohms-law"],
    blurb: "Change the battery voltage and the resistor and watch the current respond in real time.",
    minutes: 6,
    file: "/labs/ohms-law.html",
    tasks: ["Set the current to exactly 2 A", "Keep 12 V and reach 4 A by changing only R", "Predict what happens when R doubles"],
    level: 2,
  },
  {
    id: "titration-lab",
    title: "Acid–Base Titration Lab",
    subjectId: "chemistry",
    topicIds: ["indicators", "titration"],
    blurb: "Add NaOH to an unknown HCl sample drop by drop, catch the endpoint and work out the concentration.",
    minutes: 8,
    file: "/labs/titration.html",
    tasks: ["Add NaOH until the indicator turns faintly pink", "Read the endpoint volume", "Calculate the HCl concentration"],
    level: 3,
  },
  {
    id: "senses-lab",
    title: "Signal Path Lab: Human Senses",
    subjectId: "biology",
    topicIds: ["sensory-receptors", "brain-response"],
    blurb: "Follow a signal from stimulus to response and choose the right receptor for each sense.",
    minutes: 5,
    file: "/labs/senses.html",
    tasks: ["Pick the receptor that detects the stimulus", "Put the signal path in the right order", "Trace three different senses"],
    level: 2,
  },
];

export function getLab(id: string) {
  return LABS.find((l) => l.id === id);
}

export function labsForTopic(topicId: string) {
  return LABS.filter((l) => l.topicIds.includes(topicId));
}
