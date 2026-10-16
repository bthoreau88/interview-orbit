/**
 * Transcript provenance. Every transcript shown or (later) stored carries one.
 * - live:   produced by a verified speech-to-text provider from THIS recording. Not available in P0.
 * - manual: typed by the user.
 * - demo:   a fixed sample text. Never derived from the user's audio.
 * - none:   no transcript.
 */
export type TranscriptSource = "live" | "manual" | "demo" | "none";

export interface Transcript {
  source: TranscriptSource;
  text: string;
}

/** A recording that exists only in this tab's memory. Never uploaded or persisted. */
export interface LocalRecording {
  durationSeconds: number;
  objectUrl: string;
  mimeType: string;
  sizeBytes: number;
}

/** Planned persisted shape (G02). Audio is intentionally not part of it. */
export interface InterviewSession {
  id: string;
  promptId: string;
  createdAt: string; // ISO 8601 UTC
  durationSeconds: number | null;
  transcriptText?: string;
  transcriptSource: TranscriptSource;
  feedbackJson: unknown;
  status: "complete" | "not-scorable";
}

export const SOURCE_LABELS: Record<TranscriptSource, string> = {
  live: "Live transcription",
  manual: "Manual - typed by you",
  demo: "DEMO / SAMPLE - not transcribed from this recording",
  none: "No transcript",
};
