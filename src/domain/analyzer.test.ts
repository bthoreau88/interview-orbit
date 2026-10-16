// @vitest-environment node
import { describe, expect, it } from "vitest";
import { analyze, countFillers, tokenize } from "./analyzer";

describe("tokenize", () => {
  it("ignores punctuation and keeps contractions as one word", () => {
    expect(tokenize("Well, I don't know... it’s fine!")).toEqual(["well", "i", "don't", "know", "it's", "fine"]);
  });
});

describe("countFillers", () => {
  it("normalizes repeated letters to the same filler", () => {
    expect(countFillers(["umm", "um", "uhhh", "hmm", "erm"])).toEqual({ um: 2, uh: 1, hmm: 1, er: 1 });
  });
  it("does not count ordinary words that merely contain filler letters", () => {
    expect(countFillers(["umbrella", "huh", "aha", "her"])).toEqual({});
  });
});

describe("analyze - handoff fixtures", () => {
  it("fixture 1: counts um=1 and uh=1", () => {
    const result = analyze({
      text: "I, um, I planned the sprint and, uh, reviewed tests.",
      source: "manual",
      durationSeconds: 20,
    });
    expect(result.status).toBe("complete");
    if (result.status !== "complete") return;
    expect(result.fillerCounts).toEqual({ um: 1, uh: 1 });
    expect(result.totalWords).toBe(10);
    expect(result.fillersPer100Words).toBe(20);
    // 10 words / (20 s / 60) = 30 words per minute
    expect(result.pace).toEqual({ status: "calculated", wordsPerMinute: 30 });
  });

  it("fixture 2: empty text with a 20 s recording is NOT_SCORABLE, no word rate", () => {
    const result = analyze({ text: "   ", source: "manual", durationSeconds: 20 });
    expect(result.status).toBe("not-scorable");
    expect(result).not.toHaveProperty("pace");
  });

  it("fixture 3: demo text alongside a real recording never yields a pace", () => {
    const result = analyze({ text: "So, um, we shipped it on time.", source: "demo", durationSeconds: 25 });
    expect(result.status).toBe("complete");
    if (result.status !== "complete") return;
    expect(result.pace.status).toBe("not-calculated");
  });
});

describe("analyze - rules", () => {
  it("source none is not scorable even if text exists", () => {
    expect(analyze({ text: "hello", source: "none", durationSeconds: 30 }).status).toBe("not-scorable");
  });

  it("no recording means no pace", () => {
    const result = analyze({ text: "one two three", source: "manual", durationSeconds: null });
    expect(result.status === "complete" && result.pace.status).toBe("not-calculated");
  });

  it("recordings under 10 s do not get a pace", () => {
    const result = analyze({ text: "one two three", source: "manual", durationSeconds: 9 });
    expect(result.status === "complete" && result.pace.status).toBe("not-calculated");
  });

  it("is deterministic", () => {
    const input = { text: "Um, we tested it. Uh, it worked.", source: "manual" as const, durationSeconds: 12 };
    expect(analyze(input)).toEqual(analyze(input));
  });

  it("raises the fast-pace tip above 170 wpm", () => {
    const text = Array.from({ length: 90 }, () => "word").join(" ");
    const result = analyze({ text, source: "manual", durationSeconds: 30 }); // 180 wpm
    expect(result.status === "complete" && result.tips.map((t) => t.rule)).toContain("pace > 170 words/min");
  });
});
