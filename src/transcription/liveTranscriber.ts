import type { LocalRecording } from "../domain/session";

export type TranscriptionFailure = "too-large" | "unavailable" | "network";

export class TranscriptionError extends Error {
  constructor(
    readonly kind: TranscriptionFailure,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The only place in the app that talks to the network (see architecture.test.ts).
 * Sends one recording to the Interview Orbit API, which forwards it to the speech-to-text provider with
 * filler words kept and keeps no copy of the audio.
 */
export async function transcribeRecording(recording: LocalRecording, signal?: AbortSignal): Promise<{ text: string }> {
  let audio: Blob;
  try {
    audio = await (await fetch(recording.objectUrl)).blob();
  } catch {
    throw new TranscriptionError("network", "The recording could not be read from this tab.");
  }

  const form = new FormData();
  form.append("audio", audio, "answer.webm");
  form.append("durationSeconds", String(recording.durationSeconds));

  let response: Response;
  try {
    response = await fetch("/api/transcriptions", { method: "POST", body: form, signal });
  } catch {
    throw new TranscriptionError("network", "The transcription service could not be reached.");
  }
  if (response.status === 413) throw new TranscriptionError("too-large", "This recording is over the 3 minute / 10 MB limit.");
  if (!response.ok) throw new TranscriptionError("unavailable", "Transcription is unavailable right now.");

  const body = (await response.json()) as { text?: unknown };
  if (typeof body.text !== "string") throw new TranscriptionError("unavailable", "The transcription service sent an unexpected reply.");
  return { text: body.text };
}
