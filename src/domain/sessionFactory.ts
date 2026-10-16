import { ANALYZER_VERSION, type Analysis } from "./analyzer";
import type { InterviewSession, Transcript, TranscriptSource } from "./session";

const SOURCES: readonly TranscriptSource[] = ["live", "manual", "demo", "none"];
export const MAX_TRANSCRIPT_CHARS = 20_000;

/**
 * Builds the persisted record. Deliberately excludes audio: only the measured duration is kept.
 * Transcript text is kept for manual/demo sources so the session can be reviewed later.
 */
export function createSession(input: {
  id: string;
  now: Date;
  promptId: string;
  durationSeconds: number | null;
  transcript: Transcript;
  analysis: Analysis;
}): InterviewSession {
  const text = input.transcript.text.trim().slice(0, MAX_TRANSCRIPT_CHARS);
  const keepText = input.transcript.source !== "none" && text.length > 0;
  return {
    id: input.id,
    promptId: input.promptId,
    createdAt: input.now.toISOString(),
    durationSeconds: input.durationSeconds,
    ...(keepText ? { transcriptText: text } : {}),
    transcriptSource: input.transcript.source,
    feedbackJson: input.analysis,
    status: input.analysis.status === "complete" ? "complete" : "not-scorable",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Shape check for records read back from storage (which the user or another tab could have altered). */
export function isInterviewSession(value: unknown): value is InterviewSession {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.promptId === "string" &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    (value.durationSeconds === null ||
      (typeof value.durationSeconds === "number" && Number.isFinite(value.durationSeconds))) &&
    (value.transcriptText === undefined || typeof value.transcriptText === "string") &&
    SOURCES.includes(value.transcriptSource as TranscriptSource) &&
    (value.status === "complete" || value.status === "not-scorable")
  );
}

/** Returns the stored analysis only if it matches the analyzer version this build can display. */
export function readStoredAnalysis(feedbackJson: unknown): Analysis | null {
  if (!isRecord(feedbackJson) || feedbackJson.version !== ANALYZER_VERSION) return null;
  if (feedbackJson.status === "not-scorable" && typeof feedbackJson.reason === "string") {
    return feedbackJson as Analysis;
  }
  if (
    feedbackJson.status === "complete" &&
    typeof feedbackJson.totalWords === "number" &&
    typeof feedbackJson.fillerTotal === "number" &&
    isRecord(feedbackJson.fillerCounts) &&
    typeof feedbackJson.fillersPer100Words === "number" &&
    isRecord(feedbackJson.pace) &&
    Array.isArray(feedbackJson.tips)
  ) {
    return feedbackJson as Analysis;
  }
  return null;
}
