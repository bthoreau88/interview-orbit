# ADR-001: Layered client with a persistence port; browser-local storage for P0

Scope: Interview Orbit only. These ADR numbers are local to `projects/intervieworbit` and are not part of the
OVS-OS root decision register (`decisions/`).

- **Status:** Implemented (G01–G02). Awaiting owner review. Not instructor-reviewed.
- **Date:** 2026-10-16
- **Review date:** 2026-10-23, or earlier if the instructor requires a server tier.

## Context

The V002 plan proposed a React/TypeScript client, an ASP.NET Core Web API, and SQLite via EF Core, on the
assumption that earlier source code existed. The G00 audit found no recoverable source for the client, API,
or database. The only hosting already in use is a static Netlify site. The sprint ends 2026-10-27, with
one developer. The course is Software Architecture, so the separation of concerns must be real and checkable,
not only drawn.

Forces:

- The demo must run from a URL, so the persistence choice has to work on static hosting.
- "Saved" must be true (PDF reliability scenario), so storage has to be durable, not React state.
- A server tier may still be required by the instructor, so it must stay cheap to add later.
- .NET is not installed in the build environment, and no .NET code exists to preserve.

## Decision

1. Build a single-page client in React 19 + TypeScript (Vite) with four layers:
   UI (`routes/`, `components/`), application state (`state/`), domain (`domain/`), and adapters
   (`persistence/`, `recorder/`).
2. Define persistence as a port, `SessionRepository` (`src/domain/sessionRepository.ts:8`), with typed errors.
   The UI receives an implementation through `SessionRepositoryProvider` (`src/state/SessionRepository.tsx:7`)
   and never imports an adapter.
3. Ship one production adapter, `IndexedDbSessionRepository`, that reports success only after the transaction
   commits and the record reads back (`src/persistence/indexedDbSessionRepository.ts:86-96`).
4. Label the storage in the UI as browser-local ("Saved in this browser only … Not on a server").
5. Keep the proposed HTTP API as a written contract ([DATA_CONTRACT.md §4](../DATA_CONTRACT.md#4-proposed-http-api-not-implemented))
   so that a server adapter can be added without touching the UI or domain.
6. Enforce the dependency direction with an automated test (`src/architecture.test.ts`).

## Consequences and trade-offs

Positive:

- Deployable as static files; the demo URL can exercise save → refresh → reopen → delete.
- The domain (analyzer, session factory, validation) has no framework or storage imports and is unit-tested in
  Node. It could be reused on a server unchanged.
- The same contract tests run against the IndexedDB and in-memory adapters, so a future HTTP adapter has a
  ready-made test suite (`src/persistence/sessionRepository.contract.test.ts`).

Negative:

- No server persistence: data is per browser profile and device. It does not sync, and clearing site data
  deletes it. This weakens the "client + API" story the PDF proposed.
- There is no server-side validation boundary. Validation happens in the client on write and on read.
- A course reviewer looking for a Web API project will not find one. This must be stated in the submission.

## Alternatives considered

| Alternative | Why not now |
|---|---|
| ASP.NET Core + EF Core + SQLite (PDF proposal) | Second language and toolchain; not installed; cannot run on static Netlify hosting; no existing code to preserve |
| Node API (e.g. Fastify) + SQLite | Same deployment problem: needs a server with a persistent disk. Netlify Functions have no durable filesystem |
| Hosted database (Supabase, Firebase) | Adds accounts or keys, a paid or quota-bound service, and third-party data custody, all out of P0 scope |
| `localStorage` | Synchronous, string-only, no transactions, ~5 MB limit; no commit signal to back a "Saved" claim |
| React state only | Lost on refresh; would make "Saved" false |

## Evidence

- Port and errors: `src/domain/sessionRepository.ts`
- Adapters: `src/persistence/indexedDbSessionRepository.ts`, `src/persistence/inMemorySessionRepository.ts`
- Contract tests (both adapters): `src/persistence/sessionRepository.contract.test.ts`
- Dependency-rule test: `src/architecture.test.ts` (fails on a planted `domain → react` and
  `domain → persistence` import; checked 2026-10-16)
- End-to-end save/reload/delete with direct IndexedDB lookups: `e2e/persistence.spec.ts`
- Diagrams: [ARCHITECTURE.md §2–5](../ARCHITECTURE.md)
