// @vitest-environment node
import { describe, expect, it } from "vitest";
import { analyze } from "./analyzer";
import { createSession, isInterviewSession, MAX_TRANSCRIPT_CHARS, readStoredAnalysis } from "./sessionFactory";

const now = new Date("2026-10-16T12:00:00.000Z");

describe("createSession", () => {
  it("keeps duration, provenance and analysis, and has no audio fields", () => {
    const transcript = { source: "manual" as const, text: "  Um, we shipped.  " };
    const analysis = analyze({ text: transcript.text, source: "manual", durationSeconds: 21.4 });
    const s = createSession({ id: "x", now, promptId: "beh-challenge", durationSeconds: 21.4, transcript, analysis });
    expect(s).toEqual({
      id: "x",
      promptId: "beh-challenge",
      createdAt: "2026-10-16T12:00:00.000Z",
      durationSeconds: 21.4,
      transcriptText: "Um, we shipped.",
      transcriptSource: "manual",
      feedbackJson: analysis,
      status: "complete",
    });
    expect(isInterviewSession(s)).toBe(true);
  });

  it("omits transcript text when the source is none", () => {
    const transcript = { source: "none" as const, text: "" };
    const analysis = analyze({ text: "", source: "none", durationSeconds: null });
    const s = createSession({ id: "x", now, promptId: "p", durationSeconds: null, transcript, analysis });
    expect(s).not.toHaveProperty("transcriptText");
    expect(s.status).toBe("not-scorable");
  });

  it("caps very long transcripts", () => {
    const text = "word ".repeat(10_000);
    const analysis = analyze({ text, source: "manual", durationSeconds: null });
    const s = createSession({ id: "x", now, promptId: "p", durationSeconds: null, transcript: { source: "manual", text }, analysis });
    expect(s.transcriptText?.length).toBeLessThanOrEqual(MAX_TRANSCRIPT_CHARS);
  });
});

describe("isInterviewSession", () => {
  it("rejects malformed values", () => {
    expect(isInterviewSession(null)).toBe(false);
    expect(isInterviewSession({ id: "x" })).toBe(false);
    expect(
      isInterviewSession({
        id: "x",
        promptId: "p",
        createdAt: "not a date",
        durationSeconds: null,
        transcriptSource: "manual",
        feedbackJson: {},
        status: "complete",
      }),
    ).toBe(false);
  });
});

describe("readStoredAnalysis", () => {
  it("accepts current-version analyses and rejects unknown versions", () => {
    const analysis = analyze({ text: "hello there", source: "manual", durationSeconds: 12 });
    expect(readStoredAnalysis(analysis)).toEqual(analysis);
    expect(readStoredAnalysis({ ...analysis, version: "io-analyzer/0" })).toBeNull();
    expect(readStoredAnalysis("junk")).toBeNull();
  });
});
