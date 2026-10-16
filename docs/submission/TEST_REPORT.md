# Interview Orbit: Test Report

Run: 2026-10-16, commit `39d3bfb` (branch `claude/enhance-io09-interview-orbit-delivery`).
Environment: Linux container, Node v22.22.0, Chromium build 1194 via Playwright 1.55.1 with a **synthetic
microphone** (`--use-fake-device-for-media-stream`).
Raw logs: [`unit`](../evidence/test-runs/2026-10-16-unit.txt) · [`e2e`](../evidence/test-runs/2026-10-16-e2e.txt).

## Summary

| Suite | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Unit + contract + architecture | `npx vitest run` | **62 / 62 passed**, 6 files |
| End-to-end, desktop 1280 px | `npx playwright test` | **15 / 15 passed** |
| End-to-end, mobile 360 px | `npx playwright test` | **15 / 15 passed** |
| Dependency audit | `npm audit` | 0 vulnerabilities |
| Production build | `npm run build` | exit 0 |

The full e2e suite has passed in 5 consecutive runs since the last code fix (G02 delete-dialog focus). The run before that fix failed on exactly that defect, which is how it was found. One intermittent failure of the
skip-link focus assertion was seen once during G01 (before the test waited for the heading); it has not recurred
and its cause was not proven. See the evidence ledger.

## Acceptance matrix (ACCEPTANCE_TESTS.md)

Status words: **PASS** (automated test passed), **PASS (simulated)** (passed with a simulated browser condition),
**NOT RUN** (needs a person or another machine).

| ID | Area | Status | Test |
|---|---|---|---|
| AT-01 | Navigation, desktop + 360 px | PASS | `journey.spec.ts` AT-01 |
| AT-02 | ≥ 6 prompts; prompt carried to Recorder and Results | PASS | `journey.spec.ts` AT-02/03/18 |
| AT-03 | Grant → capture → timer → stop → usable Blob | PASS (simulated mic) | `journey.spec.ts` AT-02/03/18 |
| AT-04 | Denied permission recovery | PASS (simulated denial) | `journey.spec.ts` AT-04 |
| AT-05 | Retry discards; unsupported browser alternative | PASS | `journey.spec.ts` AT-05 ×2 |
| AT-06 | Transcript provenance; demo labelled | PASS | `journey.spec.ts` AT-06; `persistence.spec.ts` provenance test |
| AT-07 | Filler fixtures; pace rules | PASS | `analyzer.test.ts` fixtures 1–3 + rules |
| AT-08 | Empty transcript not scorable | PASS | `analyzer.test.ts` fixture 2; `journey.spec.ts` |
| AT-09 | "Saved" only after confirmed storage | PASS | `persistence.spec.ts` AT-09..12 |
| AT-10 | Survives refresh | PASS (browser-local) | `persistence.spec.ts` (reload) |
| AT-11 | History opens exact session | PASS | `persistence.spec.ts` |
| AT-12 | Delete with confirmation; gone after reload and in store | PASS | `persistence.spec.ts` (direct IndexedDB reads) |
| AT-13 | Storage failure recoverable, no false save | PASS (simulated failure) | `persistence.spec.ts` AT-13, storage-unavailable test |
| AT-14 | Keyboard, focus, labels | PASS (automated) | axe-core on every screen; skip link; keyboard path; dialog focus |
| AT-15 | Contrast ≥ 4.5:1, 44 px targets, no 360 px overflow | PASS | `contrast.test.ts`; `journey.spec.ts` AT-14/15 |
| AT-16 | Reduced motion | PASS | `journey.spec.ts` AT-16 |
| AT-17 | Clean install and build | PASS on Linux; **NOT RUN on Windows** | `npm ci && npm run build` |
| AT-18 | Mic only after action; nothing uploaded | PASS | `journey.spec.ts` (getUserMedia call count; same-origin GET only) |
| AT-19 | No secrets | PASS | no env vars in app; repository secret scan |
| AT-20 | Deploy gate | PASS (nothing deployed) | Netlify production untouched |

## Not covered by automation (manual receipts still needed)

| Check | Why it matters | Owner |
|---|---|---|
| Record with a real microphone in Chrome or Edge on Windows | The synthetic device proves the code path, not your hardware | Brandon |
| Real permission prompt: click "Block", then recover via site settings | Simulated denial does not exercise the browser UI | Brandon |
| Screen reader pass (NVDA on Windows or VoiceOver) on Practice → Results → History | axe-core finds rule violations, not usability problems | Brandon |
| Firefox and Safari | Only Chromium is installed in the build environment | Brandon |
| Browser restart persistence | Reload is tested; full restart is not | Brandon |

## Defects found and fixed during development

| Gate | Defect | Found by | Fix |
|---|---|---|---|
| G01 | Heading focus on page load skipped the skip link | e2e AT-14 | Focus moves only after in-app navigation (`Page.tsx`) |
| G01 | Recorder back link under 44 px | Screenshot review | Button-sized link |
| G01 | Two-row sticky header ate ~100 px on phones | Screenshot review | Header scrolls away under 560 px |
| G02 | Saving the same attempt twice was possible after navigating back | Code review | Saved id stored on the draft; attempt becomes read-only |
| G02 | Delete dialog focused "Yes, delete" by default | e2e AT-12 | Focus moved to Cancel explicitly |
| G02 | Delete dialog top-aligned | Screenshot review | Dialog margin fixed |
| IO-07 | Architecture docs: 2 wrong line references, 1 wrong count, a misleading diagram edge | Doc review | Corrected before commit |

No open defects are known. That reflects automated coverage only; the manual checks above may find more.
