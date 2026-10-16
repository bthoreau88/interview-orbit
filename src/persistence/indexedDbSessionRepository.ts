import type { InterviewSession } from "../domain/session";
import { isInterviewSession } from "../domain/sessionFactory";
import { StorageError, type SessionRepository, type StorageErrorKind } from "../domain/sessionRepository";

export const DB_NAME = "interview-orbit";
export const DB_VERSION = 1;
export const STORE = "sessions";

/**
 * Browser-local persistence. Data survives refresh and browser restart on this device and profile only.
 * It is not server persistence: another browser, device, or "clear site data" will not have it.
 */
export class IndexedDbSessionRepository implements SessionRepository {
  readonly storageLabel = "Saved in this browser only (IndexedDB on this device). Not on a server. Audio is never saved.";
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly factory: IDBFactory | undefined = typeof indexedDB === "undefined" ? undefined : indexedDB,
    private readonly dbName: string = DB_NAME,
  ) {}

  private open(): Promise<IDBDatabase> {
    const factory = this.factory;
    if (!factory) return Promise.reject(new StorageError("unavailable", "IndexedDB is not available"));
    if (!this.dbPromise) {
      const opening = new Promise<IDBDatabase>((resolve, reject) => {
        let request: IDBOpenDBRequest;
        try {
          request = factory.open(this.dbName, DB_VERSION);
        } catch {
          reject(new StorageError("unavailable", "IndexedDB open threw"));
          return;
        }
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
        };
        request.onsuccess = () => {
          const db = request.result;
          // Another tab upgrading the schema: close so it is not blocked; the next call reopens.
          db.onversionchange = () => {
            db.close();
            this.dbPromise = null;
          };
          resolve(db);
        };
        request.onerror = () => reject(new StorageError("unavailable", "IndexedDB open failed"));
      });
      // A failed open must not be cached, so the user can retry.
      opening.catch(() => {
        if (this.dbPromise === opening) this.dbPromise = null;
      });
      this.dbPromise = opening;
    }
    return this.dbPromise;
  }

  /** Runs one transaction and resolves with `result()` only when the transaction has committed. */
  private async run<T>(
    mode: IDBTransactionMode,
    errorKind: StorageErrorKind,
    work: (store: IDBObjectStore) => () => T,
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      let result: () => T;
      let tx: IDBTransaction;
      try {
        tx = db.transaction(STORE, mode);
        result = work(tx.objectStore(STORE));
      } catch {
        reject(new StorageError(errorKind, "IndexedDB transaction could not start"));
        return;
      }
      tx.oncomplete = () => {
        try {
          resolve(result());
        } catch (error) {
          reject(error);
        }
      };
      tx.onerror = () => reject(new StorageError(errorKind, "IndexedDB transaction failed"));
      tx.onabort = () => reject(new StorageError(errorKind, "IndexedDB transaction aborted"));
    });
  }

  async save(session: InterviewSession): Promise<InterviewSession> {
    if (!isInterviewSession(session)) throw new StorageError("write-failed", "Refusing to store an invalid session");
    await this.run("readwrite", "write-failed", (store) => {
      store.put(session);
      return () => undefined;
    });
    // Read back after commit: "Saved" is only reported for a record that is actually retrievable.
    const stored = await this.get(session.id);
    if (!stored) throw new StorageError("write-failed", "Session was not found after commit");
    return stored;
  }

  async list(): Promise<{ sessions: InterviewSession[]; skippedInvalid: number }> {
    const all = await this.run("readonly", "read-failed", (store) => {
      const request = store.getAll();
      return () => request.result as unknown[];
    });
    const sessions = all.filter(isInterviewSession);
    sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { sessions, skippedInvalid: all.length - sessions.length };
  }

  async get(id: string): Promise<InterviewSession | null> {
    const value = await this.run("readonly", "read-failed", (store) => {
      const request = store.get(id);
      return () => request.result as unknown;
    });
    if (value === undefined) return null;
    if (!isInterviewSession(value)) throw new StorageError("read-failed", "Stored session is malformed");
    return value;
  }

  async remove(id: string): Promise<void> {
    const existed = await this.run("readwrite", "write-failed", (store) => {
      let found = false;
      const lookup = store.get(id);
      lookup.onsuccess = () => {
        if (lookup.result !== undefined) {
          found = true;
          store.delete(id);
        }
      };
      return () => found;
    });
    if (!existed) throw new StorageError("not-found", `No session ${id}`);
  }
}
