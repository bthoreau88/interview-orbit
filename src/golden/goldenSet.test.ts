import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROMPTS } from "../domain/prompts";

/** BTHOR-7: the golden answer set is hand-labeled ground truth for evaluating answer-quality feedback. */
// Vitest runs from the repository root (jsdom has no file: URL for import.meta).
const file = join(process.cwd(), "data", "golden", "v0.json");
const golden = JSON.parse(readFileSync(file, "utf8")) as {
  version: string;
  rubrics: Record<string, string[]>;
  statuses: string[];
  plannedPromptIds: string[];
  answers: {
    id: string;
    promptId: string;
    category: string;
    rubric: string;
    qualityType: string;
    text: string;
    expected: { criteria: Record<string, string>; deliveryNote: string };
  }[];
};

const knownPromptIds = new Set([...PROMPTS.map((p) => p.id), ...golden.plannedPromptIds]);

describe("golden answer set v0", () => {
  it("has 20 answers with unique ids", () => {
    expect(golden.version).toBe("golden/v0");
    expect(golden.answers).toHaveLength(20);
    expect(new Set(golden.answers.map((a) => a.id)).size).toBe(20);
  });

  it.each(golden.answers.map((a) => [a.id, a] as const))("%s is well formed", (_id, a) => {
    expect(knownPromptIds.has(a.promptId)).toBe(true);
    expect(a.text.trim().split(/\s+/).length).toBeGreaterThan(10);
    const criteria = golden.rubrics[a.rubric];
    expect(criteria, `unknown rubric ${a.rubric}`).toBeDefined();
    // Every criterion of the rubric is labeled, and only with a known status.
    expect(Object.keys(a.expected.criteria).sort()).toEqual([...(criteria ?? [])].sort());
    for (const status of Object.values(a.expected.criteria)) expect(golden.statuses).toContain(status);
    expect(a.expected.deliveryNote.length).toBeGreaterThan(0);
  });

  it("covers Behavioral and Technical answers of every quality type", () => {
    const pairs = new Set(golden.answers.map((a) => `${a.rubric}:${a.qualityType}`));
    for (const rubric of ["star", "technical"])
      for (const q of ["strong", "weak", "incomplete", "irrelevant"]) expect(pairs.has(`${rubric}:${q}`)).toBe(true);
  });

  it("marks every irrelevant answer as missing Relevance", () => {
    for (const a of golden.answers.filter((x) => x.qualityType.includes("irrelevant") || x.qualityType.includes("off-topic")))
      expect(a.expected.criteria.relevance).toBe("missing");
  });

  it("includes the instructor's contrast pair: polished but off-topic vs. relevant but filler-heavy", () => {
    const offTopic = golden.answers.find((a) => a.qualityType === "polished-off-topic");
    const fillerHeavy = golden.answers.find((a) => a.qualityType === "relevant-filler-heavy");
    expect(offTopic?.expected.criteria.relevance).toBe("missing");
    expect(Object.values(fillerHeavy?.expected.criteria ?? {}).every((s) => s === "present")).toBe(true);
    // The filler-heavy answer really is filler-heavy (well above the 5 per 100 words guideline).
    const words = fillerHeavy!.text.toLowerCase().split(/[^a-z']+/).filter(Boolean);
    const fillers = words.filter((w) => /^(u+m+|u+h+)$/.test(w)).length;
    expect((fillers / words.length) * 100).toBeGreaterThan(15);
  });
});
