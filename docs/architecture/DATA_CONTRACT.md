# Interview Orbit: Data Contract

Version: IO-07 V001, 2026-10-16. Sections 1–3 describe **implemented** behaviour. Section 4 is a
**proposed** HTTP contract that is **not implemented**.

## 1. Session record (`InterviewSession`)

Source of truth: `src/domain/session.ts:24`. Created only by `createSession()` (`src/domain/sessionFactory.ts:11`).
Validated on every read by `isInterviewSession()` (`src/domain/sessionFactory.ts:38`).

| Field | Type | Rule |
|---|---|---|
| `id` | string | RFC 4122 v4 UUID from `crypto.randomUUID()` (fallback: `getRandomValues`), non-empty |
| `promptId` | string | Catalog id, e.g. `team-conflict`. Unknown ids are displayed as "Unknown question (id)" |
| `createdAt` | string | ISO 8601 UTC, must parse as a date |
| `durationSeconds` | number \| null | Measured recording length (wall clock between start and stop), 0.1 s resolution; `null` = no recording |
| `transcriptText` | string? | Present only when source is `manual` or `demo` and text is non-blank; trimmed; max 20,000 chars |
| `transcriptSource` | `"live" \| "manual" \| "demo" \| "none"` | Provenance (ADR-002). `live` is reserved; no code path produces it today |
| `feedbackJson` | `Analysis` (§2) | Analyzer output stored verbatim, including its version |
| `status` | `"complete" \| "not-scorable"` | Mirrors `feedbackJson.status` |

**Never stored:** audio, Blob or object URLs, MIME type, byte size, device or browser identifiers.
The contract test `never stores audio fields` asserts the exact key set.

Example (from the G02 end-to-end fixture):

```json
{
  "id": "6f0d2c8e-5b1a-4c55-9a0e-3b8f1d2e7c41",
  "promptId": "team-conflict",
  "createdAt": "2026-10-16T01:47:12.391Z",
  "durationSeconds": 1.6,
  "transcriptText": "I, um, I planned the sprint and, uh, reviewed tests.",
  "transcriptSource": "manual",
  "feedbackJson": {
    "status": "complete",
    "version": "io-analyzer/1",
    "source": "manual",
    "totalWords": 10,
    "fillerTotal": 2,
    "fillerCounts": { "um": 1, "uh": 1 },
    "fillersPer100Words": 20,
    "pace": {
      "status": "not-calculated",
      "reason": "The recording is shorter than 10 seconds, which is too short for a stable rate."
    },
    "tips": [
      { "rule": "fillers per 100 words > 5", "message": "Try replacing filler words with a short silent pause while you think." },
      { "rule": "total words < 75", "message": "This answer is short. Behavioral answers usually cover the situation, your action, and the result." }
    ]
  },
  "status": "complete"
}
```

`id`, `createdAt` and `durationSeconds` above are illustrative (they differ per run); the transcript and `feedbackJson` values are exactly what the fixture produces.

## 2. Feedback (`Analysis`, version `io-analyzer/1`)

Source: `src/domain/analyzer.ts:44`. Either:

- `{ status: "not-scorable", version, reason }` when the source is `none` or the text has no words; or
- `{ status: "complete", version, source, totalWords, fillerTotal, fillerCounts, fillersPer100Words, pace, tips[] }`.

`pace` is `{ status: "calculated", wordsPerMinute }` only when the source is `manual` (or `live`) **and** a
recording of at least 10 s exists; otherwise `{ status: "not-calculated", reason }`. Formulas are documented
in the README and on the Results screen. Stored analyses with a different `version` are not rendered; the
detail screen says so instead of guessing (`readStoredAnalysis`, `src/domain/sessionFactory.ts:55`).

## 3. Persistence port (implemented)

Source: `src/domain/sessionRepository.ts:8`. Adapter: `src/persistence/indexedDbSessionRepository.ts`.

| Operation | Success | Failure (`StorageError.kind`) |
|---|---|---|
| `save(session)` | Resolves with the stored copy **after the transaction commits and the record reads back** | `unavailable` (no IndexedDB / open failed), `write-failed` (invalid record, quota, abort, not readable after commit) |
| `list()` | `{ sessions, skippedInvalid }`, newest `createdAt` first; malformed records are skipped and counted | `unavailable`, `read-failed` |
| `get(id)` | Session, or `null` if absent | `unavailable`, `read-failed` (record present but malformed) |
| `remove(id)` | Resolves after the delete commits | `not-found` (no such id), `unavailable`, `write-failed` |

IndexedDB layout: database `interview-orbit`, version 1, object store `sessions`, `keyPath: "id"`, no indexes
(sorting happens in memory; expected volume is tens of records). Schema changes must bump `DB_VERSION` and
migrate in `onupgradeneeded` (`indexedDbSessionRepository.ts:34-37`). No migration has been needed yet.

Retention: records stay until the user deletes them in the app or clears site data. There is no automatic expiry.

## 4. Proposed HTTP API (NOT IMPLEMENTED)

This is the contract a future server adapter would satisfy. It maps one-to-one onto the port above, so the
UI would not change. Nothing in this repository serves or calls these endpoints.

| Method + path | Port operation | Success | Errors |
|---|---|---|---|
| `GET /api/prompts` | (catalog, currently static) | `200` `InterviewPrompt[]` | `500` |
| `POST /api/sessions` | `save` | `201` stored `InterviewSession`, `Location: /api/sessions/{id}` | `400` invalid record, `413` transcript too long, `500` |
| `GET /api/sessions` | `list` | `200` `{ sessions, skippedInvalid }` | `500` |
| `GET /api/sessions/{id}` | `get` | `200` session | `404` not found |
| `DELETE /api/sessions/{id}` | `remove` | `204` | `404` not found |

Server-side requirements carried over from the client contract: validate with the same rules as
`isInterviewSession`; reject any audio payload; generate or verify the UUID; return the committed record, not
the request body; never return `201` before the database commit.
