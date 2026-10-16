# Interview Orbit: Append-Only Implementation Receipts

Rules: no claim of completed work without observable evidence. Append new entries; never rewrite old outcomes.
Statuses: `NOT STARTED`, `EVIDENCE PENDING`, `PASS`, `FAIL`, `BLOCKED`, `APPROVED`, `HOLD`.

## G00: Baseline audit (read-only)

```text
GATE / ISSUE: G00 source-authority audit
DATE / TIME: 2026-10-16T00:38Z (Claude Code cloud session, Linux container)
STATUS: PASS (audit complete); source recovery BLOCKED
SOURCE AUTHORITY: bthoreau88/OVS-OS, main @ 3af8701d5a85654757cfe04cc88631c39c102acf, clean working tree
BEFORE: projects/intervieworbit/ contained only .gitkeep (registry: "registered-placeholder").
        No Interview Orbit source in any of the 17 repositories visible to the account.
        bthoreau88/academic-journey checked: no Software Architecture course, no "interview" matches.
        Netlify prototype unreachable from the container (proxy 403 / ENOTFOUND); its source is unknown.
        dotnet not installed; Node v22.22.0, pnpm 10.14.0.
CHANGE: NO MUTATION
TEST RECEIPT: node scripts/validate-repository.mjs -> exit 0 (baseline)
KNOWN GAPS: original source not recovered; Netlify deploy could be downloaded from the Netlify dashboard by the owner.
            Course substitution approval (Jason Hinders): NOT ESTABLISHED.
NEXT GATE: G01 core journey
HUMAN REVIEW: APPROVED by owner ("Approve and continue with the best move, use your judgment")
```

Decisions taken under that approval (reversible; owner may override):

- Greenfield client: React 19 + TypeScript + Vite 8, react-router 7. ASP.NET Core / EF Core not adopted (not
  installed, no existing code to preserve, adds a second toolchain to an 11-day window).
- Location: `projects/intervieworbit/` in OVS-OS as a standalone npm project (outside the pnpm workspace). A new
  repository could not be created from this session.
- Persistence deferred to G02 behind an interface; G01 stores nothing.
- No live speech-to-text: browser speech services may send audio to a third party, which conflicts with "no hidden upload".

## G01: Core journey (prompt -> recorder -> results)

```text
GATE / ISSUE: G01 (IO-01 shell/tokens, IO-02 prompts, IO-03 recorder, IO-04 transcript provenance, IO-05 analyzer)
DATE / TIME: 2026-10-16T00:55Z
STATUS: EVIDENCE PENDING -> awaiting human review
SOURCE AUTHORITY: branch claude/enhance-io01-interview-orbit-core-journey (base main @ 3af8701)
CHANGE: new files under projects/intervieworbit/ only (no other path touched)
TEST RECEIPT (all in projects/intervieworbit, Linux, Node v22.22.0):
  npm audit                         -> found 0 vulnerabilities
  npx tsc --noEmit                  -> exit 0
  npx vitest run                    -> exit 0, 3 files, 33 tests passed
  npm run build                     -> exit 0 (JS 288 kB / 91 kB gzip)
  PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test
                                    -> exit 0, 20 passed (10 tests x desktop 1280px + mobile 360px)
  node scripts/validate-repository.mjs (repo root) -> exit 0
ASSETS: docs/evidence/screenshots/g01/{desktop,mobile-360}-{dashboard,practice,recorder,results-empty,
        results-manual,results-demo,history}.png
KNOWN GAPS:
  - Recording was verified with Chromium's synthetic microphone (--use-fake-device-for-media-stream), not a real mic.
    Real-device check on Chrome/Edge (Windows) and a phone: NOT RUN.
  - Permission denial and unsupported browser are simulated by test init scripts, not a real browser prompt.
  - Firefox / Safari: NOT RUN.
  - Saving, History list/detail/delete: NOT STARTED (G02). Save button is disabled and labelled as such.
  - Fixed during this gate: page-heading focus on initial load skipped the skip link (caught by e2e, fixed in
    src/components/Page.tsx); recorder back link was below 44px (now a button-sized link).
  - One intermittent failure of the skip-link focus assertion (mobile-360) seen once, before the test waited for the
    heading to render; not reproduced in 4 later full runs. Root cause not proven.
  - Narrated walkthrough, ADRs, diagrams: NOT STARTED (IO-07, IO-09).
NEXT GATE: G02 data contract (save -> refresh -> detail -> delete)
HUMAN REVIEW: NO DECISION YET
```

Acceptance matrix after G01 (IDs from ACCEPTANCE_TESTS.md):

| ID | Status | Evidence |
|---|---|---|
| AT-01 Navigation | PASS | e2e `AT-01`, both viewports |
| AT-02 Prompts | PASS | e2e `AT-02/03/18` (8 prompts, filter, prompt carried to Recorder and Results) |
| AT-03 Recording | PASS (synthetic mic) | e2e `AT-02/03/18`; real mic NOT RUN |
| AT-04 Denied permission | PASS (simulated) | e2e `AT-04` |
| AT-05 Retry / unsupported | PASS | e2e `AT-05` x2 |
| AT-06 Transcript provenance | PASS | e2e `AT-06`; live option disabled with reason |
| AT-07 Metrics | PASS | `src/domain/analyzer.test.ts` fixtures 1-3 + e2e manual fixture |
| AT-08 Empty feedback | PASS | e2e `AT-02/03/18` (none -> not scorable), unit fixture 2 |
| AT-09 to AT-13 Save / reload / review / delete / service failure | NOT STARTED | G02 |
| AT-14 Keyboard / a11y | PASS (automated) | axe-core wcag2a/aa/21a/21aa: 0 violations on 5 routes + results; skip link; keyboard path. Screen-reader manual pass NOT RUN |
| AT-15 Contrast / responsive | PASS | `src/styles/contrast.test.ts`; 44px target check; no 360px overflow |
| AT-16 Reduced motion | PASS | e2e `AT-16` |
| AT-17 Clean install / build | PASS on Linux | `npm ci` path not yet run on Windows |
| AT-18 Privacy / consent | PASS | e2e: getUserMedia called 0 times before Start, 1 after; all requests same-origin GET |
| AT-19 No secret exposure | PASS | no env vars used; repo validator secret scan exit 0 |
| AT-20 Deploy gate | PASS (nothing deployed) | Netlify production untouched |
