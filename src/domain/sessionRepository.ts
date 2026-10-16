import type { InterviewSession } from "./session";

/**
 * Persistence port. The UI depends only on this interface; storage adapters live in src/persistence.
 * P0 ships a browser-local IndexedDB adapter. A future HTTP adapter (POST/GET/DELETE /api/sessions)
 * would implement the same contract.
 */
export interface SessionRepository {
  /** Plain-language statement of where data lives, shown to the user. */
  readonly storageLabel: string;
  /** Resolves only after the store has committed the record; returns the stored copy. */
  save(session: InterviewSession): Promise<InterviewSession>;
  /** Newest first. Records that fail validation are skipped and counted, never shown as real. */
  list(): Promise<{ sessions: InterviewSession[]; skippedInvalid: number }>;
  get(id: string): Promise<InterviewSession | null>;
  /** Resolves only after the record is gone. Rejects with not-found if it never existed. */
  remove(id: string): Promise<void>;
}

export type StorageErrorKind = "unavailable" | "write-failed" | "read-failed" | "not-found";

export class StorageError extends Error {
  constructor(
    readonly kind: StorageErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export function storageErrorMessage(error: unknown): string {
  if (error instanceof StorageError) {
    switch (error.kind) {
      case "unavailable":
        return "Browser storage is unavailable here (for example in some private windows), so sessions cannot be saved or loaded.";
      case "write-failed":
        return "The browser refused to store this session (storage may be full or blocked). Nothing was saved.";
      case "read-failed":
        return "Saved sessions could not be read from browser storage.";
      case "not-found":
        return "That session does not exist. It may have been deleted.";
    }
  }
  return "An unexpected storage error occurred.";
}
