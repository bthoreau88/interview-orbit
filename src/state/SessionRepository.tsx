import { createContext, useContext, useState, type ReactNode } from "react";
import type { SessionRepository } from "../domain/sessionRepository";
import { IndexedDbSessionRepository } from "../persistence/indexedDbSessionRepository";

const RepositoryContext = createContext<SessionRepository | null>(null);

export function SessionRepositoryProvider({
  repository,
  children,
}: {
  repository?: SessionRepository;
  children: ReactNode;
}) {
  const [repo] = useState<SessionRepository>(() => repository ?? new IndexedDbSessionRepository());
  return <RepositoryContext.Provider value={repo}>{children}</RepositoryContext.Provider>;
}

export function useSessionRepository(): SessionRepository {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error("useSessionRepository must be used inside SessionRepositoryProvider");
  return repo;
}

/** RFC 4122 v4 id. crypto.randomUUID needs a secure context; fall back to getRandomValues. */
export function newSessionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
