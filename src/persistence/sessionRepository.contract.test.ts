// @vitest-environment node
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { analyze } from "../domain/analyzer";
import type { InterviewSession } from "../domain/session";
import { createSession } from "../domain/sessionFactory";
import { StorageError, type SessionRepository } from "../domain/sessionRepository";
import { IndexedDbSessionRepository } from "./indexedDbSessionRepository";
import { InMemorySessionRepository } from "./inMemorySessionRepository";

function makeSession(id: string, createdAt: string): InterviewSession {
  const transcript = { source: "manual" as const, text: "I, um, I planned the sprint and, uh, reviewed tests." };
  const analysis = analyze({ text: transcript.text, source: transcript.source, durationSeconds: 20 });
  return createSession({ id, now: new Date(createdAt), promptId: "beh-challenge", durationSeconds: 20, transcript, analysis });
}

const adapters: Array<[string, () => SessionRepository]> = [
  ["InMemorySessionRepository", () => new InMemorySessionRepository()],
  // A fresh fake IndexedDB per test keeps tests independent.
  ["IndexedDbSessionRepository", () => new IndexedDbSessionRepository(new IDBFactory())],
];

describe.each(adapters)("SessionRepository contract: %s", (_name, make) => {
  it("save returns the stored copy with the same id", async () => {
    const repo = make();
    const session = makeSession("a", "2026-10-16T10:00:00.000Z");
    await expect(repo.save(session)).resolves.toEqual(session);
  });

  it("get returns what was saved, and null for unknown ids", async () => {
    const repo = make();
    const session = makeSession("a", "2026-10-16T10:00:00.000Z");
    await repo.save(session);
    await expect(repo.get("a")).resolves.toEqual(session);
    await expect(repo.get("missing")).resolves.toBeNull();
  });

  it("list is newest first", async () => {
    const repo = make();
    await repo.save(makeSession("old", "2026-10-15T10:00:00.000Z"));
    await repo.save(makeSession("new", "2026-10-16T10:00:00.000Z"));
    const { sessions, skippedInvalid } = await repo.list();
    expect(sessions.map((s) => s.id)).toEqual(["new", "old"]);
    expect(skippedInvalid).toBe(0);
  });

  it("remove deletes the record so get and list no longer return it", async () => {
    const repo = make();
    await repo.save(makeSession("a", "2026-10-16T10:00:00.000Z"));
    await repo.remove("a");
    await expect(repo.get("a")).resolves.toBeNull();
    await expect(repo.list()).resolves.toEqual({ sessions: [], skippedInvalid: 0 });
  });

  it("remove of an unknown id rejects with not-found", async () => {
    const repo = make();
    await expect(repo.remove("missing")).rejects.toMatchObject({ kind: "not-found" });
  });

  it("save rejects an invalid record instead of storing it", async () => {
    const repo = make();
    const bad = { ...makeSession("a", "2026-10-16T10:00:00.000Z"), transcriptSource: "ai" } as unknown as InterviewSession;
    await expect(repo.save(bad)).rejects.toBeInstanceOf(StorageError);
    await expect(repo.get("a")).resolves.toBeNull();
  });

  it("never stores audio fields", async () => {
    const repo = make();
    const saved = await repo.save(makeSession("a", "2026-10-16T10:00:00.000Z"));
    expect(Object.keys(saved).sort()).toEqual(
      ["createdAt", "durationSeconds", "feedbackJson", "id", "promptId", "status", "transcriptSource", "transcriptText"].sort(),
    );
  });
});

describe("IndexedDbSessionRepository specifics", () => {
  it("data survives a new repository instance on the same database (refresh)", async () => {
    const factory = new IDBFactory();
    await new IndexedDbSessionRepository(factory).save(makeSession("a", "2026-10-16T10:00:00.000Z"));
    const reopened = new IndexedDbSessionRepository(factory);
    await expect(reopened.get("a")).resolves.toMatchObject({ id: "a" });
  });

  it("reports unavailable when there is no IndexedDB", async () => {
    const repo = new IndexedDbSessionRepository(undefined);
    await expect(repo.list()).rejects.toMatchObject({ kind: "unavailable" });
    await expect(repo.save(makeSession("a", "2026-10-16T10:00:00.000Z"))).rejects.toMatchObject({ kind: "unavailable" });
  });
});

describe("InMemorySessionRepository specifics", () => {
  it("skips and counts malformed records", async () => {
    const repo = new InMemorySessionRepository();
    await repo.save(makeSession("a", "2026-10-16T10:00:00.000Z"));
    repo.plantRaw("junk", { id: "junk" });
    const { sessions, skippedInvalid } = await repo.list();
    expect(sessions.map((s) => s.id)).toEqual(["a"]);
    expect(skippedInvalid).toBe(1);
  });

  it("simulated write failure stores nothing", async () => {
    const repo = new InMemorySessionRepository();
    repo.failNext = "write-failed";
    await expect(repo.save(makeSession("a", "2026-10-16T10:00:00.000Z"))).rejects.toMatchObject({ kind: "write-failed" });
    await expect(repo.get("a")).resolves.toBeNull();
  });
});
