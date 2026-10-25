import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { LocalRecording } from "../domain/session";
import { classifyMediaError, initialRecorderState, recorderReducer } from "./recorderState";

export const MAX_RECORDING_SECONDS = 180;

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/**
 * Microphone capture with MediaRecorder. The mic opens only inside start(),
 * which must be called from a user action. Audio stays in memory as a Blob URL;
 * nothing is uploaded or written to storage.
 */
export function useRecorder() {
  const [state, dispatch] = useReducer(recorderReducer, isRecordingSupported(), initialRecorderState);
  const [elapsed, setElapsed] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const ownedUrlRef = useRef<string | null>(null);
  const discardRef = useRef(false);
  /**
   * Incremented by every start(), reset() and unmount. A permission request that resolves after its generation
   * has moved on belongs to an abandoned attempt: its stream is stopped and nothing is recorded.
   */
  const generationRef = useRef(0);
  const mountedRef = useRef(false);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const revokeOwnedUrl = useCallback(() => {
    if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
    ownedUrlRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const generation = ++generationRef.current;
    const abandoned = () => generation !== generationRef.current || !mountedRef.current;
    revokeOwnedUrl();
    dispatch({ type: "request" });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (!abandoned()) dispatch({ type: "failed", ...classifyMediaError(error) });
      return;
    }
    if (abandoned()) {
      // The user left or cancelled while the browser's permission prompt was open.
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    try {
      streamRef.current = stream;
      chunksRef.current = [];
      discardRef.current = false;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        releaseStream();
        if (discardRef.current) return;
        const durationSeconds = Math.round(((performance.now() - startedAtRef.current) / 1000) * 10) / 10;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        const objectUrl = URL.createObjectURL(blob);
        ownedUrlRef.current = objectUrl;
        dispatch({ type: "stopped", durationSeconds, objectUrl, mimeType: blob.type, sizeBytes: blob.size });
      };
      startedAtRef.current = performance.now();
      setElapsed(0);
      recorder.start(1000);
      dispatch({ type: "started", at: startedAtRef.current });
    } catch (error) {
      releaseStream();
      dispatch({ type: "failed", ...classifyMediaError(error) });
    }
  }, [releaseStream, revokeOwnedUrl]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** Discards any recording (in progress or finished) and returns to idle. */
  const reset = useCallback(() => {
    generationRef.current += 1;
    discardRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    releaseStream();
    revokeOwnedUrl();
    chunksRef.current = [];
    setElapsed(0);
    dispatch({ type: "reset" });
  }, [releaseStream, revokeOwnedUrl]);

  /** Transfers ownership of the finished recording to the caller (it must revoke the URL later). */
  const handOff = useCallback((): LocalRecording | null => {
    if (state.phase !== "stopped") return null;
    ownedUrlRef.current = null;
    const { durationSeconds, objectUrl, mimeType, sizeBytes } = state;
    return { durationSeconds, objectUrl, mimeType, sizeBytes };
  }, [state]);

  // Elapsed-time display and the hard cap.
  useEffect(() => {
    if (state.phase !== "recording") return;
    const id = window.setInterval(() => {
      const seconds = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORDING_SECONDS) stop();
    }, 250);
    return () => window.clearInterval(id);
  }, [state.phase, stop]);

  // Leaving the screen always turns the microphone off and frees un-handed-off audio.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      discardRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
    };
  }, []);

  return { state, elapsed, start, stop, reset, handOff };
}
