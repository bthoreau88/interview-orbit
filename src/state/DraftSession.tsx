import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LocalRecording, Transcript } from "../domain/session";

/**
 * The in-progress practice attempt. Memory only: a refresh discards it.
 * Saving copies it into the session repository; the audio is never part of that copy.
 */
export interface DraftSession {
  promptId: string;
  recording: LocalRecording | null;
  transcript: Transcript;
  /** Set once this attempt has been saved; the attempt is then read-only. */
  savedId?: string;
}

interface DraftContextValue {
  draft: DraftSession | null;
  begin: (promptId: string, recording: LocalRecording | null) => void;
  setTranscript: (transcript: Transcript) => void;
  markSaved: (id: string) => void;
  clear: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftSessionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DraftSession | null>(null);
  const urlRef = useRef<string | null>(null);

  const replaceUrl = useCallback((next: string | null) => {
    if (urlRef.current && urlRef.current !== next) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next;
  }, []);

  const begin = useCallback(
    (promptId: string, recording: LocalRecording | null) => {
      replaceUrl(recording?.objectUrl ?? null);
      setDraft({ promptId, recording, transcript: { source: "none", text: "" } });
    },
    [replaceUrl],
  );

  const setTranscript = useCallback((transcript: Transcript) => {
    setDraft((d) => (d && !d.savedId ? { ...d, transcript } : d));
  }, []);

  const markSaved = useCallback((id: string) => {
    setDraft((d) => (d ? { ...d, savedId: id } : d));
  }, []);

  const clear = useCallback(() => {
    replaceUrl(null);
    setDraft(null);
  }, [replaceUrl]);

  useEffect(() => () => replaceUrl(null), [replaceUrl]);

  const value = useMemo(() => ({ draft, begin, setTranscript, markSaved, clear }), [draft, begin, setTranscript, markSaved, clear]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraftSession(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraftSession must be used inside DraftSessionProvider");
  return ctx;
}
