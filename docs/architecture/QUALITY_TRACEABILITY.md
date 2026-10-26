# Interview Orbit: Quality Attribute Traceability

Each requirement → the mechanism that implements it → the test that verifies it → what is still not proven.
Requirements come from the V002 project standard (quality scenarios p. 7, screen rules p. 4) and the three ADRs.
Test names are exact; results are in [`docs/evidence/test-runs/2026-10-25-*`](../evidence/test-runs/).

| # | Quality attribute and requirement | Mechanism (where in the code) | Verified by | Not yet proven |
|---|---|---|---|---|
| Q1 | **Maintainability:** business rules do not depend on the UI, storage, or browser APIs | Layered client; domain has no framework imports (ADR-001). `src/domain/` | `architecture.test.ts`: "domain imports nothing from React, the router, or other layers" | n/a |
| Q2 | **Modifiability:** storage can be swapped (e.g. for a server API) without changing screens | `SessionRepository` port, `src/domain/sessionRepository.ts:8`; adapters in `src/persistence/` | Same contract suite runs against IndexedDB and in-memory adapters (`sessionRepository.contract.test.ts`, 7 tests × 2); "routes and components never import a storage adapter directly" | No HTTP adapter exists; the API is specified only (`DATA_CONTRACT.md` §4) |
| Q3 | **Reliability:** "Saved" is never shown unless the record is really stored | `save()` resolves only after commit **and** read-back, `indexedDbSessionRepository.ts:87-97` | e2e "AT-09/10/11/12 save -> reload -> open -> delete -> reload, with backing-store checks"; "AT-13 storage write failure shows a recoverable error and no false Saved" | Browser restart (only page reload tested) |
| Q4 | **Reliability:** damaged or foreign stored data never crashes or masquerades | `isInterviewSession()` and `readStoredAnalysis()` validate on read, `sessionFactory.ts:38` | "skips and counts malformed records"; "rejects malformed values"; "accepts current-version analyses and rejects unknown versions" | n/a |
| Q5 | **Privacy:** the microphone opens only after the user presses Start | Only `src/recorder/` may call `getUserMedia` / `MediaRecorder` | "only the recorder layer touches MediaRecorder / getUserMedia"; e2e "AT-02/03/18 core journey" (getUserMedia called 0 times before Start) | Real microphone hardware |
| Q6 | **Privacy:** no hidden recording, including when permission is granted late | Generation guard: abandoned attempts stop their stream, `useRecorder.ts:33`, `:58` | e2e "IO-10 late permission after 'Skip recording' never records"; "IO-10 late permission after leaving via navigation never records" (both fail on the pre-fix code) | Real browser permission prompt (simulated delay) |
| Q7 | **Privacy / security:** nothing is uploaded; audio is never stored | No network code anywhere; session record has no audio fields | "no source file performs network I/O"; "never stores audio fields" (×2 adapters); e2e AT-02/03/18 (same-origin GET requests only) | n/a |
| Q8 | **Security:** bounded input; no client-side secrets | Transcript capped at 20,000 chars (`sessionFactory.ts:5`); React escapes all text; no environment variables | "caps very long transcripts"; repository secret scan | No server-side validation (no server) |
| Q9 | **Integrity (honest output):** demo text never passes as a transcription | Closed transcript-source set and labels (ADR-002); demo banner `Results.tsx:154`; live option disabled `Results.tsx:118` | e2e "AT-06 demo transcript is conspicuously labeled and never gets a pace"; "demo and not-scorable sessions keep their provenance when saved"; analyzer "fixture 3" | n/a |
| Q10 | **Correctness:** feedback is deterministic and explainable | Pure `analyze()` with published formulas, `src/domain/analyzer.ts` | 11 analyzer tests incl. "is deterministic", "fixture 1: counts um=1 and uh=1", "fixture 2: … NOT_SCORABLE, no word rate" | n/a |
| Q11 | **Usability / error handling:** every failure has a recovery path | Recorder state machine with explicit error states, `recorderState.ts` | "allows retry after a denial"; e2e "AT-04 denied permission shows recovery, not false success"; "AT-05 unsupported browser offers a safe alternative"; "AT-08 empty and missing states"; "storage unavailable is reported on History and Results" | Real "Block" click in a browser prompt |
| Q12 | **Accessibility:** text contrast ≥ 4.5:1, including on glass | Token file + ≥ 88 % opaque glass (ADR-003), `tokens.css:29` | `contrast.test.ts` (10 pairs + 4 glass composites) | n/a |
| Q13 | **Accessibility:** keyboard, focus, 44 px targets, WCAG 2.1 A/AA | Skip link, focus ring token, `--io-target` | e2e "AT-14/15 keyboard entry, 44px targets and axe scan on every screen" (axe: 0 violations) | Manual screen-reader pass |
| Q14 | **Accessibility:** reduced motion respected | `prefers-reduced-motion` blocks, `tokens.css:62`, `app.css` | e2e "AT-16 reduced motion disables decorative animation" | n/a |
| Q15 | **Portability:** works at phone width and desktop | Responsive layout; Playwright projects at 1280 px and 360 px | Every e2e test runs at both widths (18 × 2 = 36) | Edge, Firefox, Safari; Windows (path fix in place, not run) |

## How to read the gaps

The "Not yet proven" column lists what automated tests in a Linux container cannot show: real hardware, real
browser prompts, other browsers, and Windows. Those need a manual check on a real machine. Each one is recorded in
[`TEST_REPORT.md`](../submission/TEST_REPORT.md) under "Not covered by automation."
