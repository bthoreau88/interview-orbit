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

## G02: Data contract (save -> refresh -> detail -> delete)

```text
GATE / ISSUE: G02 (IO-06 persistence; Dashboard recent sessions; History list/detail/delete)
DATE / TIME: 2026-10-16T01:50Z
STATUS: EVIDENCE PENDING -> awaiting human review
SOURCE AUTHORITY: branch claude/enhance-io02-interview-orbit-persistence, stacked on G01 @ e69dc19
HUMAN REVIEW OF G01: approved by owner for G02 start; owner's real-microphone check of G01 NOT YET DONE
CHANGE: files under projects/intervieworbit/ only. New dev dependency: fake-indexeddb 6.2.5 (Apache-2.0).
STORAGE CLAIM: browser-local IndexedDB. NOT server persistence. Labelled as such on Results and History.
TEST RECEIPT (projects/intervieworbit, Linux, Node v22.22.0):
  npm audit                         -> found 0 vulnerabilities
  npx tsc --noEmit                  -> exit 0
  npx vitest run                    -> exit 0, 5 files, 57 tests passed
                                       (repository contract suite runs against IndexedDB (fake-indexeddb) and in-memory adapters)
  npm run build                     -> exit 0
  PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test
                                    -> exit 0, 30 passed; repeated 3 consecutive runs, 30/30 each
  node scripts/validate-repository.mjs (repo root) -> exit 0
ASSETS: docs/evidence/screenshots/g02/{desktop,mobile-360}-{results-saved,history-list,detail,delete-confirm}.png
        docs/evidence/screenshots/g01/* regenerated by the same run
KNOWN GAPS:
  - Persistence across a full browser restart was not tested directly; refresh/reload and a new repository
    instance on the same database are tested.
  - Real browsers other than Chromium: NOT RUN. Windows: NOT RUN (owner's MSI showed offline in Desktop Commander).
  - Multiple tabs editing at once: not handled beyond schema-upgrade safety (onversionchange closes the connection).
  - Fixed during this gate: the delete dialog initially focused "Yes, delete" (React autoFocus does not apply to a
    dialog opened later); now Cancel is focused explicitly, asserted by e2e. Dialog was top-aligned on the page
    because of the stack margin rule; now centred.
NEXT GATE: IO-07 architecture package (ADR-001/002/003, container + sequence diagrams, data contract)
HUMAN REVIEW: NO DECISION YET
```

Acceptance matrix changes after G02:

| ID | Status | Evidence |
|---|---|---|
| AT-09 Save | PASS | e2e: "Saved" appears only after commit + read-back; record found in IndexedDB by direct lookup |
| AT-10 Reload | PASS (browser-local) | e2e: History and detail survive `page.reload()`; server persistence not claimed |
| AT-11 Review | PASS | e2e: detail matches prompt, source, transcript text, word and filler counts, duration |
| AT-12 Delete | PASS | e2e: confirm dialog, Cancel keeps record, delete removes it, reload and direct IndexedDB lookup both empty |
| AT-13 Service failure | PASS (simulated) | e2e: forced IndexedDB write error -> error + retry, no "Saved", nothing stored; IndexedDB absent -> errors on History and Results |

## IO-07: Architecture package

```text
GATE / ISSUE: IO-07 (C4-style context/container/component views, 2 sequence diagrams, ADR-001/002/003, data contract)
DATE / TIME: 2026-10-16
STATUS: EVIDENCE PENDING -> awaiting human review
SOURCE AUTHORITY: branch claude/enhance-io07-interview-orbit-architecture, stacked on G02 @ d5bfebd
HUMAN REVIEW: IO-07 approved by owner to start. G01/G02 real-microphone check by owner: STILL NOT DONE.
CHANGE (projects/intervieworbit only):
  docs/architecture/ARCHITECTURE.md, DATA_CONTRACT.md, adr/ADR-001..003, diagrams/*.svg|png (4 diagrams)
  src/architecture.test.ts (new automated dependency-rule test)
  scripts/render-diagrams.mjs (regenerates diagrams; mermaid installed with --no-save, not a dependency)
  README.md (architecture links)
  No application behaviour changed.
VERIFICATION OF THE DOCS THEMSELVES:
  - Every file:line reference in the docs was checked against the source; two wrong references and one wrong
    count were corrected before commit (save() is lines 86-96; 10 contrast pairs, not 11).
  - Diagrams were rendered with Mermaid 11.17.2 in Chromium (parse + render succeeded for all 4).
  - Rendered diagrams were reviewed visually. The container view was redrawn twice: the first version had
    crossing edges, the second drew an IndexedDB edge through the Domain box (implying the domain touches
    storage, which is false). The record/save sequence was corrected to show handOff(), stop() via the hook,
    and begin(promptId, null) on the denied path, matching src/routes/Recorder.tsx:30-38.
  - architecture.test.ts was mutation-checked: a planted domain -> react and domain -> persistence import made
    it fail with both violations listed; removing the plant made it pass.
TEST RECEIPT: see the IO-07 commit message / final report for exit codes of audit, tsc, vitest, build, playwright,
              repository validator.
KNOWN GAPS:
  - ADRs are "Implemented, awaiting owner review"; none is instructor-reviewed.
  - The HTTP API in DATA_CONTRACT.md section 4 is a specification only. Nothing implements it.
  - No server tier exists; this is stated in ADR-001 as a known weakness for a Software Architecture course.
NEXT GATE: IO-08 accessibility + regression pass (Windows clean install, Edge/Firefox, screen-reader spot check)
```

## IO-09: Delivery packet (instructor meeting moved to 2026-10-18, 1 pm)

```text
GATE / ISSUE: IO-09 partial (instructor brief, checklist status, test report, walkthrough script, backup demo video)
DATE / TIME: 2026-10-16 to 2026-10-18
STATUS: EVIDENCE PENDING -> awaiting human review
SOURCE AUTHORITY: branch claude/enhance-io09-interview-orbit-delivery, stacked on IO-07 @ f34f470
CHANGE: docs/submission/* (brief HTML + PDF, CHECKLIST_STATUS, TEST_REPORT, WALKTHROUGH_SCRIPT, demo/backup-demo-simulated-mic.webm),
        docs/evidence/test-runs/2026-10-16-*.txt, scripts/record-backup-demo.mjs. No application code changed.
BACKUP VIDEO: 50.8 s, 1280x760 VP8 WebM, recorded with Chromium's synthetic microphone; every frame carries the label
              "BACKUP RECORDING · automated run · simulated microphone · not a live demo". It is NOT the submission walkthrough
              and NOT a real-microphone receipt.
PROCESS GAP (recorded at owner's request for transparency): the Codex handoff recommended returning the G00 findings to
  ChatGPT for an independent architecture and scope review before implementation. That review did not happen; the owner
  approved G01 directly. The handoff ZIP was extracted to a session scratch folder only and is not in the repository.
KNOWN GAPS: real-mic receipt, Windows clean install, screen-reader pass, Firefox, staging deploy, tag, recorded walkthrough.
HUMAN REVIEW: NO DECISION YET
```

## IO-10: Microphone lifecycle fix and Windows portability (2026-10-25)

```text
GATE / ISSUE: IO-10 (owner instruction: "Claude do IO-10")
DATE / TIME: 2026-10-24 PDT
STATUS: PASS (automated) -> awaiting owner review
SOURCE AUTHORITY: github.com/bthoreau88/interview-orbit, main (standalone export of the OVS-OS project folder)
BEFORE: leaving the Recorder while the permission prompt was open, then granting permission, started a hidden
        recording. Reproduced: {"recorderStarts":1,"liveTracks":1} after navigating to /results.
CHANGE: src/recorder/useRecorder.ts (generation counter + mounted flag; a late stream is stopped, no MediaRecorder
        is created, no state update); src/architecture.test.ts and scripts/render-diagrams.mjs (fileURLToPath and
        forward-slash relative paths for Windows); package.json engines node >=22.12; README status updated;
        e2e/journey.spec.ts: 3 IO-10 regression tests.
TEST RECEIPT (Linux, Node v22.22.0, Chromium 1194 synthetic mic):
  IO-10 tests against the OLD recorder: both race tests FAIL (recorderStarts 1, liveTracks 1), as expected
  IO-10 tests against the FIXED recorder: 6/6 pass (3 tests x desktop + 360 px)
  npm audit 0 | tsc exit 0 | vitest 62/62 | build exit 0 | playwright 36/36
KNOWN GAPS: Windows execution of the path fix NOT RUN (no Windows machine reachable); real microphone NOT RUN.
```
