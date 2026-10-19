# Interview Orbit: Independent Architecture and Scope Review Packet

Prepared 2026-10-19 by Claude Code for ChatGPT (architecture owner under OVS-OS `CLAUDE.md`).
Self-contained: the reviewer does not need repository access. Evidence paths are given for anyone who has it.

## Paste this prompt with the packet

> You are the architecture and acceptance reviewer for Interview Orbit, a two-week Full Sail University Software
> Architecture project (deadline 27 October 2026). Your handoff asked Claude Code to finish G00 and return for review
> **before** implementation. That review was skipped: the owner approved implementation directly, and G01, G02 and the
> architecture package are already built. Review the packet below **retrospectively**. For each decision D1–D7, answer
> KEEP, CHANGE (say what), or NEEDS INSTRUCTOR INPUT. Then answer R1–R6. Flag anything that would cost course credit.
> Do not assume facts beyond the packet; mark assumptions.

## 1. G00 findings (read-only audit, 2026-10-16)

| Finding | Evidence status |
|---|---|
| No Interview Orbit source code exists in any repository the account can reach (17 repos checked by name; `OVS-OS` and `academic-journey` searched). `projects/intervieworbit/` held only `.gitkeep`. | Verified |
| The Netlify prototype (`interview-orbit-prototype.netlify.app`) could not be fetched from the audit environment (proxy 403 / DNS failure). Its source and backend remain unknown. | Unverified |
| Two recovery paths were **not tried**: the owner's laptop folders, and Netlify's "Download deploy" for the 5 May upload. | Open |
| The audit ran in a Linux cloud container, not the owner's Windows VS Code workspace the handoff assumed. `dotnet` was not installed. | Verified |
| PDF stop condition (p. 9): "If the original source or API is not runnable by D02 … revise the deliverable to a documented front-end prototype with an explicit missing-backend ledger." This condition was met. | Verified |

## 2. Decisions already made (owner approved; not reviewed by you)

| # | Decision | Rationale given | Recorded in |
|---|---|---|---|
| D1 | Rebuild from scratch instead of waiting for source recovery | Nothing recoverable found; 11 days left | Evidence ledger G00 |
| D2 | React 19 + TypeScript + Vite; **no** ASP.NET Core / EF Core | No .NET code to preserve; not installed; second toolchain; static hosting only | ADR-001 |
| D3 | **Client-only.** Persistence behind a `SessionRepository` port; IndexedDB adapter; HTTP API specified (5 endpoints) but **not built** | Deployable as static files; "Saved" can be true; server adapter can be added without UI change | ADR-001, DATA_CONTRACT §4 |
| D4 | No speech-to-text. Transcript source is `manual`, `demo` (labelled "DEMO / SAMPLE – NOT TRANSCRIBED FROM THIS RECORDING") or `none`; `live` reserved, disabled in UI | Browser Web Speech API may upload audio to a third party; no verified provider | ADR-002 |
| D5 | Deterministic analyzer only: word count, filler words (um, uh, er, ah, hmm), fillers per 100 words, estimated pace only for typed text with ≥ 10 s recording. No overall score | Transparency rule in the brief | `src/domain/analyzer.ts` |
| D6 | Code lives in `OVS-OS/projects/intervieworbit` as a standalone npm project, on stacked `claude/enhance-*` branches, not a separate repo | A new repo could not be created from the session | Evidence ledger |
| D7 | Claude Code implemented instead of Codex | Owner's direct approval; deviates from `AGENTS.md` role split | Evidence ledger IO-09 |

## 3. What exists now

Branches (none merged, no PRs): `claude/enhance-io01-interview-orbit-core-journey` (`e69dc19`) → `io02-…-persistence`
(`d5bfebd`) → `io07-…-architecture` (`f34f470`) → `io09-…-delivery` (`f0430b6`).

- **Screens:** Dashboard, Practice (8 prompts, 5 categories), Recorder (consent, grant/deny/no-device/unsupported,
  timer, stop, retry, cancel, 180 s cap), Results (provenance, metrics with formulas, Save), History, Session detail
  (delete with confirmation).
- **Layers:** UI (`routes/`, `components/`) → state (`state/`) → domain (`domain/`: prompts, analyzer, session factory,
  repository port) ← adapters (`persistence/` IndexedDB + in-memory; `recorder/` MediaRecorder). An automated test fails
  the build if the domain imports React, storage or browser media, if routes import an adapter, if anything outside
  `recorder/` opens the mic, or if any file makes a network call.
- **Saved record:** `{ id, promptId, createdAt, durationSeconds|null, transcriptText?, transcriptSource, feedbackJson
  (versioned analyzer output), status }`. Audio is never stored or uploaded.
- **Tests:** 62 unit (analyzer fixtures, recorder state machine, repository contract run against both adapters,
  token contrast, architecture rules); 30 Playwright runs (15 tests × desktop 1280 px + mobile 360 px) covering the
  full journey, denied mic, unsupported browser, storage write failure, storage unavailable, delete verified by direct
  IndexedDB reads, axe-core WCAG 2.1 A/AA with 0 violations, 44 px targets, reduced motion. `npm audit`: 0.
- **Docs:** context, container, two sequence diagrams; ADR-001/002/003; data contract; test report; checklist status;
  walkthrough script; instructor brief.
- **Defects found by tests and fixed:** skip link bypassed by heading focus; delete dialog focused "Yes, delete";
  duplicate save possible after navigation; 360 px header too tall.

## 4. Not done / unproven

| Item | Status |
|---|---|
| Real microphone (all recording tests use Chromium's synthetic device) | Not run |
| Windows clean install, Edge, Firefox, Safari | Not run |
| Manual screen-reader pass | Not run |
| Server tier / running API | Not built (by decision D3) |
| Staging deploy, tag, release | Not done; deployment needs owner's DEPLOY APPROVED |
| Recorded 2–4 min walkthrough | Script only |
| Before/after visuals | "After" only; no original source for "before" |
| Instructor approval of the alternative project (Gate 00) | Meeting scheduled 18 Oct; **outcome not yet reported to Claude** |

## 5. Questions for the reviewer

- **R1. Course fit.** For a Software Architecture course, is D3 (client-only, port + specified API) defensible, or does
  the missing server tier cost credit? If a server is needed, what is the smallest one worth building in ~2 days
  (e.g. Node + SQLite implementing the same 5-endpoint contract, run locally) and should it replace or sit beside
  IndexedDB?
- **R2. Scope.** Given 8 days left (19–27 Oct), rank the remaining work: real-mic and Windows verification, server tier,
  visual polish / wordmark, staging deploy, walkthrough recording, before/after frames, screen-reader pass.
- **R3. ADR quality.** Are ADR-001/002/003 the right three decisions for this course, and does each state alternatives
  and consequences convincingly? (Summaries in §2; full text on request.)
- **R4. Process deviations.** D6 (location) and D7 (Claude implemented instead of Codex): accept, or require a
  migration (e.g. move to a dedicated repo, Codex re-review) before submission?
- **R5. Risk.** What could an instructor reject outright? Candidates: rebuilt instead of recovered code; no server;
  no speech-to-text; work done by AI agents.
- **R6. Acceptance.** Is the 20-item acceptance matrix sufficient evidence, or are tests missing for a stated requirement?

## 6. What the owner should bring back to Claude

Your KEEP / CHANGE verdicts on D1–D7, the ranked list from R2, and any required changes, written as a scoped handoff
(allowed paths, forbidden paths, acceptance criteria, validation commands), as `CLAUDE.md` requires.
