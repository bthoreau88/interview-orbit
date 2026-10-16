# Interview Orbit: V002 Checklist Status

Tracks every checkbox in the V002 planning PDF against repository evidence.
Last updated 2026-10-16. Statuses: **Done**, **Done with limits**, **Partial**, **Not started**, **Blocked**.
A box is Done only with evidence in this repository (rule from `P0_IMPLEMENTATION_CHECKLIST.md`).

Branch chain: `claude/enhance-io01-…` → `io02` → `io07` → `io09` (this). None merged; no PRs open.

## Hard project gates (PDF p. 2)

| Gate | Status | Evidence / next step |
|---|---|---|
| 00 Instructor authorization | **Not started** | Meeting with Jason Hinders; questions in `INSTRUCTOR_BRIEF` |
| 01 Source + environment custody | **Done with limits** | Original source never found (G00 audit); app rebuilt. Runs locally on Linux; Windows run pending |
| 02 End-to-end proof | **Done with limits** | Practice → History proven by automated test with a synthetic microphone; real-mic run pending |
| 03 Submission proof | **Partial** | Diagrams, ADRs, test report, limitations, walkthrough script done; recorded video and tagged release pending |

## P0 required vertical slice (PDF p. 3)

| # | Item | Status | Evidence |
|---|---|---|---|
| 01 | Source audit and clean local run | **Done with limits** | `docs/evidence/EVIDENCE_LEDGER.md` G00; Windows clean install not yet run |
| 02 | App shell + liquid design tokens | **Done** | `src/styles/tokens.css`, `src/components/AppShell.tsx`, ADR-003 |
| 03 | Prompt and practice selection (≥ 6) | **Done** | 8 prompts, 5 categories: `src/domain/prompts.ts` |
| 04 | Audio recording states | **Done with limits** | Start/stop/timer/deny/retry/unsupported: `e2e/journey.spec.ts`. Synthetic mic only |
| 05 | Honest transcript/demo handling | **Done** | ADR-002; e2e `AT-06` |
| 06 | Deterministic response feedback | **Done** | `src/domain/analyzer.ts` + fixtures |
| 07 | Save, list, open, delete sessions | **Done with limits** | Browser IndexedDB, not a server: ADR-001; `e2e/persistence.spec.ts` |
| 08 | Architecture documentation | **Done** | `docs/architecture/` (context, container, 2 sequences, 3 ADRs, data contract) |
| 09 | Accessibility + regression pass | **Partial** | Automated: axe 0 violations, contrast test, 44 px, keyboard, reduced motion, 360 px. Pending: screen reader, Edge/Firefox, Windows |
| 10 | Demo and delivery packet | **Partial** | README, instructor brief, `TEST_REPORT.md`, `WALKTHROUGH_SCRIPT.md` done; release notes, tag, staging URL and recorded video pending |

## Screen acceptance rules (PDF p. 4)

| Screen | Rule | Status |
|---|---|---|
| Dashboard | One obvious Practice CTA; latest session; readable navigation | **Done** |
| Practice | Prompt list loads; choice persists into recorder; empty state | **Done** |
| Recorder | Permission explanation; elapsed time; stop and retry; no hidden upload | **Done** (synthetic mic) |
| Results | Transcript source labelled; formula explained; Save works | **Done** |
| History | Persisted list/detail after refresh; delete needs confirmation | **Done** (browser-local) |

## Software quality scenarios (PDF p. 7)

| Scenario | Status | Evidence |
|---|---|---|
| Reliability: no fake "Saved" | **Done** | Commit + read-back; e2e `AT-13` forced failure |
| Security: no client secrets; bound size; sanitize | **Done** | No env vars or network code (`src/architecture.test.ts`); 20,000-char cap; React escapes all text |
| Privacy: consent, retention, delete | **Done** | Mic only after Start; audio never stored; delete verified in IndexedDB |
| Maintainability: provider behind interface; component library | **Done** | Persistence port, transcript source enum, shared components |
| Portability: Chrome/Edge, mobile width | **Partial** | Chromium + 360 px automated; Edge on Windows pending |

## Definition of done: manual QA receipts (PDF p. 11)

| Item | Status | Note |
|---|---|---|
| PATH: prompt > record > evaluate > save > refresh > history | **Done with limits** | Automated; real-mic manual receipt pending |
| NEGATIVE: denied mic, missing transcript, API failure, empty history | **Done** | "API failure" is a storage failure here (no API exists) |
| DATA: real, with provenance, deletes cleanly | **Done** | Direct IndexedDB lookups in e2e |
| UI: 360 px and desktop; focus and contrast | **Done** (automated) | Manual screen-reader pass pending |
| BUILD: clean install/build; setup and migrations | **Partial** | Linux clean; Windows pending; no migrations yet (DB v1) |
| TRANSPARENCY: mocked/demo/unavailable labelled | **Done** | Demo label, disabled live STT, browser-only storage label |

## Submission package: 7 artifacts (PDF p. 11)

| # | Artifact | Status | Location |
|---|---|---|---|
| 01 | Project link + tagged release + exact SHA | **Not started** | Needs DEPLOY APPROVED and a merge decision |
| 02 | README + reproducible build | **Done** | `README.md` |
| 03 | C4/container diagram + annotated sequence | **Done** | `docs/architecture/ARCHITECTURE.md`, `diagrams/` |
| 04 | Three ADRs + API and data contracts | **Done** | `docs/architecture/adr/`, `DATA_CONTRACT.md` (API section marked not implemented) |
| 05 | Test matrix, defects, a11y, regression receipts | **Done with limits** | `TEST_REPORT.md` + raw logs in `docs/evidence/test-runs/`; manual checks (real mic, screen reader, Windows, Firefox) listed as NOT RUN |
| 06 | Before/after UI frames + licensed asset ledger | **Partial** | "After" frames and asset licenses done; no "before" source exists. Netlify prototype screenshot could serve as "before" |
| 07 | Narrated 2–4 minute walkthrough | **Partial** | `WALKTHROUGH_SCRIPT.md` (3:00 timed script); recording is yours |
