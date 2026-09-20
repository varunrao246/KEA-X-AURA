import { describe, expect, it } from "vitest";
import { decideLevel, describeWindow, gradeAnswer, LEVEL_WINDOW, pickQuestion } from "./adaptive";
import { att, seq } from "./test-helpers";
import type { Question } from "./types";

describe("difficulty adaptation (PRD 11)", () => {
  it("5 of 5 correct raises the level", () => {
    const d = decideLevel(2, seq("+++++"));
    expect(d).toMatchObject({ change: "up", level: 3, checkPrerequisites: false });
  });

  it("4 of 5 and 3 of 5 correct hold the level", () => {
    expect(decideLevel(2, seq("+++-+")).change).toBe("hold");
    expect(decideLevel(2, seq("+-+-+")).change).toBe("hold");
    expect(decideLevel(2, seq("--+-+")).change).toBe("hold");
  });

  it("1 of 5 correct lowers the level AND triggers a prerequisite check", () => {
    const d = decideLevel(3, seq("-+---"));
    expect(d).toMatchObject({ change: "down", level: 2, checkPrerequisites: true });
    expect(d.reason).toMatch(/1 of your last 5/);
  });

  it("0 of 5 also lowers it", () => expect(decideLevel(3, seq("-----")).change).toBe("down"));

  it("notices a run of misses early: 0 of 3 lowers, 1 of 3 does not", () => {
    expect(decideLevel(2, seq("---")).change).toBe("down");
    expect(decideLevel(2, seq("-+-")).change).toBe("hold");
    expect(decideLevel(2, seq("--")).change).toBe("hold");
  });

  it("does not raise the level on fewer than 5 answers", () => {
    expect(decideLevel(2, seq("++++")).change).toBe("hold");
  });

  it("stays within Level 1 to 4", () => {
    expect(decideLevel(4, seq("+++++")).change).toBe("hold");
    const low = decideLevel(1, seq("----"));
    expect(low).toMatchObject({ change: "hold", level: 1, checkPrerequisites: true });
  });

  it("only looks at the latest five answers", () => {
    expect(decideLevel(2, seq("-----+++++")).change).toBe("up");
  });

  it("treats skipped questions as wrong", () => {
    const skipped = [att(false, { skipped: true }), att(false, { skipped: true }), att(false, { skipped: true })];
    expect(decideLevel(2, skipped).change).toBe("down");
  });

  it("describes the window for the UI", () => {
    expect(describeWindow(2, seq("++")).next).toMatch(/3 more correct in a row to reach Level 3/);
    expect(describeWindow(2, seq("+-")).summary).toBe("1 of 2 correct at Level 2");
    expect(LEVEL_WINDOW).toBe(5);
  });
});

const mk = (id: string, level: 1 | 2 | 3 | 4): Question => ({ id, topicId: "t", level, type: "mcq", stem: id, options: ["a", "b", "c", "d"], answer: "a", hint: "", explanation: "", objective: "" });
const bank = [mk("a1", 1), mk("a2", 1), mk("b1", 2), mk("b2", 2), mk("b3", 2), mk("c1", 3), mk("d1", 4)];

describe("question selection", () => {
  it("serves an unseen question at the student's level", () => {
    expect(pickQuestion({ questions: bank, level: 2, history: [] })?.level).toBe(2);
  });

  it("prefers questions never attempted, then the least recently attempted", () => {
    const history = [{ ...att(true), questionId: "b1", createdAt: "2026-09-01T00:00:00Z" }, { ...att(true), questionId: "b2", createdAt: "2026-09-10T00:00:00Z" }];
    expect(pickQuestion({ questions: bank, level: 2, history })?.id).toBe("b3");
    const all = [...history, { ...att(true), questionId: "b3", createdAt: "2026-09-20T00:00:00Z" }];
    expect(pickQuestion({ questions: bank, level: 2, history: all })?.id).toBe("b1");
  });

  it("repeats at the SAME level when the level is exhausted, but never the question just shown", () => {
    const q = pickQuestion({ questions: bank, level: 1, history: [], exclude: ["a1", "a2"] });
    expect(q?.level).toBe(1);
    expect(q?.id).not.toBe("a2");
  });

  it("falls back to a neighbouring level only when the level has no other question", () => {
    expect(pickQuestion({ questions: bank, level: 4, history: [], exclude: ["d1"] })?.level).toBe(3);
  });
});

describe("grading", () => {
  const num = { type: "numeric", numericAnswer: 2, tolerance: 0.01, answer: "2" } as Question;
  it("accepts numeric answers with units and whitespace, rejects wrong ones", () => {
    for (const a of ["2", "2.0", "2 A", " 2A ", "2.00 amperes"]) expect(gradeAnswer(num, a), a).toBe(true);
    for (const a of ["3", "", "abc", "2.5"]) expect(gradeAnswer(num, a), a).toBe(false);
  });
  it("matches MCQ text exactly", () => {
    const q = { type: "mcq", answer: "Copper" } as Question;
    expect(gradeAnswer(q, "Copper")).toBe(true);
    expect(gradeAnswer(q, "Rubber")).toBe(false);
  });
});
