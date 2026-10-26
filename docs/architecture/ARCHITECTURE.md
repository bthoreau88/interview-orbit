# Interview Orbit: Architecture (as built)

Version: IO-07 V001, 2026-10-16. Describes the code in `github.com/bthoreau88/interview-orbit`. The IO-10 recorder fix
(commit `bcc98f6`, 2026-10-25) added a cancellation guard to `useRecorder.ts`; line references are current. Every box and arrow below maps to a file listed in the tables. Where the
V002 planning PDF proposed something different, the difference is stated in [Plan vs. built](#plan-vs-built).

Related: [ADR-001](adr/ADR-001-client-modules-and-persistence-port.md) ·
[ADR-002](adr/ADR-002-transcript-provenance.md) · [ADR-003](adr/ADR-003-accessible-liquid-material.md) ·
[Data contract](DATA_CONTRACT.md) · [Quality traceability](QUALITY_TRACEABILITY.md) · rendered diagrams in [`diagrams/`](diagrams/).

## 1. System context

One person practises interview answers in a browser. There is no server, no account, and no third-party
service at runtime. The only external system is the browser itself (microphone, MediaRecorder, IndexedDB).

```mermaid
flowchart LR
  user([Candidate<br/>practises answers])
  subgraph browser[Web browser on the candidate's device]
    app[Interview Orbit<br/>single-page app<br/>React 19 + TypeScript]
    mic[(Microphone +<br/>MediaRecorder API)]
    idb[(IndexedDB<br/>database: interview-orbit)]
  end
  host[Static host<br/>serves HTML/JS/CSS only]
  user -- "uses" --> app
  app -- "audio capture after consent<br/>(memory only)" --> mic
  app -- "save / list / get / remove<br/>session records (no audio)" --> idb
  host -- "delivers build output once<br/>(no API, no data)" --> app
```

## 2. Containers

| Container | Technology | Responsibility | Built? |
|---|---|---|---|
| Single-page app | React 19, TypeScript 5.9, Vite 8, react-router 7 | All UI, domain logic, recording | Yes |
| Browser storage | IndexedDB (`interview-orbit` v1, store `sessions`) | Durable session records on one device | Yes |
| Static host | Any static file host (Netlify-compatible `public/_redirects`) | Serves the build | Not deployed |
| Session API + database | Proposed: HTTP API + SQLite | Server persistence | **No** (see ADR-001) |

```mermaid
flowchart LR
  subgraph spa[Single-page app container]
    direction LR
    ui[UI layer<br/>routes/, components/]
    st[Application state<br/>state/DraftSession<br/>state/SessionRepository]
    rec[Recorder adapter<br/>recorder/useRecorder + recorderState<br/>uses browser getUserMedia + MediaRecorder]
    per[Persistence adapters<br/>IndexedDbSessionRepository uses browser IndexedDB<br/>InMemorySessionRepository for tests]
    api[[Future HTTP adapter<br/>NOT BUILT]]
    dom[Domain core<br/>domain/: prompts, analyzer,<br/>sessionFactory,<br/>SessionRepository port<br/>no browser or framework imports]
  end
  ui --> st
  ui --> rec
  ui --> dom
  st --> dom
  st -. injects .-> per
  rec --> dom
  per -- implements port --> dom
  api -. would implement port .-> dom
```

Dependency rule (ADR-001): arrows point **into** `domain/`. The domain has no imports from React, the router,
storage, or browser media APIs. This is enforced by `src/architecture.test.ts`, which fails the build if:

- `domain/` imports React, the router, or any other layer;
- `persistence/` imports anything other than `domain/`;
- a route or component imports a storage adapter directly;
- any file outside `recorder/` calls `getUserMedia` or `new MediaRecorder`;
- any source file performs network I/O (`fetch`, XHR, WebSocket, `sendBeacon`).

## 3. Components (single-page app)

| Component | File | Notes |
|---|---|---|
| Routes | `src/main.tsx:33-39` | `/`, `/practice`, `/record/:promptId`, `/results`, `/history`, `/history/:sessionId`, `*` |
| Prompt catalog | `src/domain/prompts.ts:25` | 8 curated prompts, 5 categories; static (no API) |
| Analyzer | `src/domain/analyzer.ts:98` | Pure function, version `io-analyzer/1` (`:11`) |
| Session factory + validation | `src/domain/sessionFactory.ts:11,38,55` | Builds records without audio; validates records read back |
| Persistence port | `src/domain/sessionRepository.ts:8` | `save`, `list`, `get`, `remove`; typed `StorageError` (`:22`) |
| IndexedDB adapter | `src/persistence/indexedDbSessionRepository.ts:13` | Commit-then-read-back save (`:87-97`) |
| In-memory adapter | `src/persistence/inMemorySessionRepository.ts:6` | Tests; simulated failures |
| Recorder state machine | `src/recorder/recorderState.ts:23` | Pure reducer: unsupported / idle / requesting / recording / stopped / error |
| Recorder adapter | `src/recorder/useRecorder.ts:20` | Only place that opens the microphone (`:53`) |
| Draft session | `src/state/DraftSession.tsx:26` | In-memory attempt; owns the audio Blob URL lifecycle |
| Repository provider | `src/state/SessionRepository.tsx:7` | Injects the adapter (IndexedDB by default) |

## 4. Runtime: record, review, save

```mermaid
sequenceDiagram
  autonumber
  actor U as Candidate
  participant R as Recorder screen<br/>routes/Recorder.tsx
  participant H as useRecorder<br/>recorder/useRecorder.ts
  participant B as Browser media<br/>getUserMedia + MediaRecorder
  participant D as DraftSession<br/>state/DraftSession.tsx
  participant S as Results screen<br/>routes/Results.tsx
  participant A as analyze()<br/>domain/analyzer.ts
  participant F as createSession()<br/>domain/sessionFactory.ts
  participant P as IndexedDbSessionRepository
  participant I as IndexedDB

  U->>R: open /record/:promptId (consent notice shown, mic off)
  U->>R: press "Start recording"
  R->>H: start()
  H->>B: getUserMedia({audio:true})
  alt permission denied / no device
    B-->>H: NotAllowedError / NotFoundError
    H-->>R: state = error (denied | no-device)
    R-->>U: recovery steps, "Try again", "Continue without recording"
    U->>R: "Continue without recording"
    R->>D: begin(promptId, null)  [no recording, no duration]
  else granted
    B-->>H: MediaStream
    H->>B: new MediaRecorder(stream).start(1000)
    U->>R: press "Stop recording" (or 180 s cap inside the hook)
    R->>H: stop()
    H->>B: recorder.stop(), then stop all tracks (mic off)
    B-->>H: Blob chunks (memory only)
    H-->>R: state = stopped {durationSeconds, objectUrl}
    U->>R: "Use this answer"
    R->>H: handOff()  [hook stops owning the Blob URL]
    R->>D: begin(promptId, recording)  [draft now owns and later revokes it]
  end
  R->>S: navigate /results
  U->>S: choose transcript source (manual / demo / none) [live disabled]
  S->>A: analyze({text, source, durationSeconds})
  A-->>S: Analysis (complete | not-scorable)
  U->>S: press "Save session"
  S->>F: createSession(draft, analysis, uuid, now)  [no audio fields]
  S->>P: save(session)
  P->>I: put(session) in readwrite transaction
  I-->>P: transaction complete
  P->>I: get(id)  [read back]
  alt record readable
    I-->>P: record
    P-->>S: stored session
    S->>D: markSaved(id)  [attempt becomes read-only]
    S-->>U: "Saved" + "Open in History"
  else error / quota / unavailable
    P-->>S: StorageError(kind)
    S-->>U: "Not saved" + reason + "Try saving again"
  end
```

## 5. Runtime: History, open, delete

```mermaid
sequenceDiagram
  autonumber
  actor U as Candidate
  participant L as History screen<br/>routes/History.tsx
  participant V as Detail screen<br/>routes/SessionDetail.tsx
  participant P as IndexedDbSessionRepository
  participant I as IndexedDB

  U->>L: open /history (also after refresh)
  L->>P: list()
  P->>I: getAll()
  I-->>P: raw records
  P-->>L: valid sessions newest first + skippedInvalid count
  L-->>U: list, or empty / error / "N unreadable records" state
  U->>V: "Open" -> /history/:id
  V->>P: get(id)
  P-->>V: session | null | StorageError
  V-->>U: detail (prompt, source badge, transcript, metrics) or not-found
  U->>V: "Delete session"
  V-->>U: confirm dialog (focus on Cancel)
  alt Cancel
    U->>V: Cancel (record untouched)
  else Yes, delete
    V->>P: remove(id)
    P->>I: get(id) then delete(id) in one readwrite transaction
    I-->>P: transaction complete
    P-->>V: resolved (or not-found / write-failed)
    V-->>U: navigate /history with "Session deleted"
  end
```

## 6. Deployment view

Build output (`npm run build` → `dist/`) is static files. `public/_redirects` lets a Netlify-style host
serve `index.html` for deep links such as `/history/<id>`. Nothing has been deployed from this codebase; the
existing `interview-orbit-prototype.netlify.app` site is a different, earlier upload and is untouched.

## 7. Quality scenarios (PDF p. 7) mapped to code and tests

| Scenario | Mechanism | Evidence |
|---|---|---|
| Reliability: no fake "Saved" | Save resolves after commit + read-back; errors surface | `indexedDbSessionRepository.ts:87-97`; e2e `AT-13` |
| Security: no client secrets; bounded input | No env vars or network code; transcript capped at 20,000 chars | `architecture.test.ts` (no network); `sessionFactory.ts:5` |
| Privacy: consent, retention, delete | Mic opens only in `start()`; audio memory-only; delete removes record | `useRecorder.ts:53`; e2e `AT-02/03/18`, `AT-09..12` |
| Maintainability: provider isolation | Persistence port + adapters; transcript source enum | ADR-001, ADR-002; contract tests |
| Portability: Chrome/Edge, mobile width | Feature detection + unsupported path; 360px tests | `useRecorder.ts:7`; e2e mobile-360 project |

## Plan vs. built

| V002 PDF proposal | Built | Why | Record |
|---|---|---|---|
| React/TypeScript client | React 19 + TypeScript | As proposed | — |
| ASP.NET Core Web API | None | No existing source to preserve; static deploy target; second toolchain in an 11-day sprint | ADR-001 |
| SQLite / EF Core | IndexedDB in the browser | Deployable as static files; survives refresh; honestly labelled as local | ADR-001 |
| `GET /api/prompts` etc. | Same operations as an in-process port | HTTP contract kept as a specification for a future adapter | [Data contract §4](DATA_CONTRACT.md#4-proposed-http-api-not-implemented) |
| Speech-to-text adapter | Provenance enum; live source disabled | No verified provider; browser STT can upload audio | ADR-002 |
| Liquid glass UI | Token-driven material with opacity floor | Accessibility first | ADR-003 |
