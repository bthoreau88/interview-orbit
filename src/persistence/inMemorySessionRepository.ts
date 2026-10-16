import type { InterviewSession } from "../domain/session";
import { isInterviewSession } from "../domain/sessionFactory";
import { StorageError, type SessionRepository, type StorageErrorKind } from "../domain/sessionRepository";

/** Test double implementing the same contract. `failNext` simulates a storage failure on the next call. */
export class InMemorySessionRepository implements SessionRepository {
  readonly storageLabel = "In-memory test storage.";
  private readonly records = new Map<string, unknown>();
  failNext: StorageErrorKind | null = null;

  private checkFailure() {
    const kind = this.failNext;
    if (kind) {
      this.failNext = null;
      throw new StorageError(kind, "Simulated failure");
    }
  }

  /** Lets tests plant malformed data, as another tab or a manual edit could. */
  plantRaw(id: string, value: unknown) {
    this.records.set(id, value);
  }

  async save(session: InterviewSession): Promise<InterviewSession> {
    this.checkFailure();
    if (!isInterviewSession(session)) throw new StorageError("write-failed", "Refusing to store an invalid session");
    this.records.set(session.id, structuredClone(session));
    return structuredClone(session);
  }

  async list() {
    this.checkFailure();
    const all = [...this.records.values()];
    const sessions = all.filter(isInterviewSession).map((s) => structuredClone(s));
    sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { sessions, skippedInvalid: all.length - sessions.length };
  }

  async get(id: string) {
    this.checkFailure();
    const value = this.records.get(id);
    if (value === undefined) return null;
    if (!isInterviewSession(value)) throw new StorageError("read-failed", "Stored session is malformed");
    return structuredClone(value);
  }

  async remove(id: string) {
    this.checkFailure();
    if (!this.records.delete(id)) throw new StorageError("not-found", `No session ${id}`);
  }
}
