# Interview Orbit

Interview-practice web app: choose a question, record an answer, review transparent rule-based feedback.

**Status: G02 slice (core journey + browser-local persistence), client-only prototype.** Built new in October 2026 because no earlier
source code could be found (see `docs/evidence/EVIDENCE_LEDGER.md`, G00). It is not the code behind
`interview-orbit-prototype.netlify.app`, and nothing here has been deployed.

## What works now

| Screen | Route | State |
|---|---|---|
| Dashboard | `/` | Start CTA, prompt count, three most recent saved sessions or empty state |
| Practice | `/practice` | 8 curated prompts, category filter |
| Recorder | `/record/:promptId` | Consent notice, mic permission (grant / deny / no device), timer, stop, retry, cancel, 3-minute cap, unsupported-browser path |
| Results | `/results` | Transcript source (manual / demo / none; live is disabled), deterministic metrics with formulas, Save (confirmed by read-back) |
| History | `/history` | Saved sessions, newest first; loading, empty, error and unreadable-record states |
| Session detail | `/history/:id` | Exact saved session with provenance and metrics; delete with confirmation |

## Not built yet

- **Server persistence.** Sessions are stored in this browser's IndexedDB only. They survive a page refresh
  (tested). IndexedDB is also designed to persist across browser restarts on the same device and profile, but that
  was not tested separately. Data does not sync, and clearing site data deletes it.
- **Live speech-to-text.** Deliberately absent. Browser speech services can send audio to a third party.
- No accounts, AI grading, video, or backend of any kind.

## Privacy

The microphone opens only after **Start recording**. Audio exists only as an in-memory Blob URL for playback and
is revoked on retry, cancel, leaving the attempt, or refresh. No network request carries audio or text (checked by
the end-to-end test `AT-02/03/18`).

## Storage

`src/domain/sessionRepository.ts` defines the persistence port (`save`, `list`, `get`, `remove`).
`src/persistence/indexedDbSessionRepository.ts` is the shipped adapter (database `interview-orbit`, store
`sessions`, key `id`). `save` resolves only after the transaction commits **and** the record reads back.
Stored fields: id, promptId, createdAt, durationSeconds, transcriptSource, transcriptText (manual/demo only),
feedbackJson (the analyzer output, versioned), status. **Audio is never stored.**

## Run it

Requires Node 20+ and npm. This folder is a standalone npm project; it is not part of the OVS-OS pnpm workspace.

```bash
cd projects/intervieworbit
npm ci
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build into dist/
npm test             # unit tests (analyzer, recorder state machine, token contrast)
npm run test:e2e     # Playwright, desktop 1280px and mobile 360px
```

`npm run test:e2e` needs a Chromium. Either run `npx playwright install chromium` once, or point at an existing
binary with `PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

## Feedback formulas

Defined in `src/domain/analyzer.ts` (version `io-analyzer/1`) and shown on the Results screen:

- Words: runs of letters or digits; punctuation ignored; contractions count as one word.
- Fillers: um, uh, er, ah, hmm (repeated letters normalized, e.g. "ummm").
- Fillers per 100 words = fillers / words × 100.
- Estimated pace = words / (recording seconds / 60), only for manual (or live) text with a recording of 10 seconds
  or more. Never for demo text.
- No overall score.

## Layout

```text
src/
  domain/     prompts, session types, analyzer (pure, unit-tested)
  recorder/   recorder state machine (pure) + useRecorder hook (MediaRecorder side effects)
  persistence/ IndexedDB adapter + in-memory test adapter, shared contract tests
  state/      in-memory draft session, repository provider (React context)
  routes/     the five screens
  components/ app shell, wordmark, page wrapper, source badge
  styles/     design tokens + material CSS, contrast test
e2e/          Playwright acceptance tests
docs/evidence evidence ledger and screenshots
```

## Assets and licenses

- Fonts: Space Grotesk, Inter, IBM Plex Mono via `@fontsource`, all SIL OFL 1.1, self-hosted (no font CDN).
- ORBIT wordmark: original SVG (`src/components/OrbitWordmark.tsx`). No reference lettering traced or adapted.
- No third-party UI snippets (UIverse or otherwise) are included.
