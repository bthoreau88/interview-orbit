/** Pure recorder state machine. Side effects (getUserMedia, MediaRecorder) live in useRecorder. */
export type RecorderErrorKind = "denied" | "no-device" | "failed";

export type RecorderState =
  | { phase: "unsupported" }
  | { phase: "idle" }
  | { phase: "requesting" }
  | { phase: "recording"; startedAt: number }
  | { phase: "stopped"; durationSeconds: number; objectUrl: string; mimeType: string; sizeBytes: number }
  | { phase: "error"; kind: RecorderErrorKind; message: string };

export type RecorderEvent =
  | { type: "request" }
  | { type: "started"; at: number }
  | { type: "stopped"; durationSeconds: number; objectUrl: string; mimeType: string; sizeBytes: number }
  | { type: "failed"; kind: RecorderErrorKind; message: string }
  | { type: "reset" };

export function initialRecorderState(supported: boolean): RecorderState {
  return supported ? { phase: "idle" } : { phase: "unsupported" };
}

export function recorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  if (state.phase === "unsupported") return state;
  switch (event.type) {
    case "request":
      return state.phase === "idle" || state.phase === "error" ? { phase: "requesting" } : state;
    case "started":
      return state.phase === "requesting" ? { phase: "recording", startedAt: event.at } : state;
    case "stopped":
      return state.phase === "recording"
        ? {
            phase: "stopped",
            durationSeconds: event.durationSeconds,
            objectUrl: event.objectUrl,
            mimeType: event.mimeType,
            sizeBytes: event.sizeBytes,
          }
        : state;
    case "failed":
      return { phase: "error", kind: event.kind, message: event.message };
    case "reset":
      return { phase: "idle" };
  }
}

/** Maps getUserMedia / MediaRecorder errors to user-facing kinds. */
export function classifyMediaError(error: unknown): { kind: RecorderErrorKind; message: string } {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return {
      kind: "denied",
      message: "Microphone access was blocked. Nothing was recorded.",
    };
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") {
    return {
      kind: "no-device",
      message: "No usable microphone was found, or another app is using it.",
    };
  }
  return { kind: "failed", message: "Recording could not start because of an unexpected browser error." };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
