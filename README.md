# Interview Orbit

## Introduction

Interview Orbit is a web app for practising job-interview answers out loud. You pick a question, record your answer,
and get feedback you can check yourself: word count, filler words, and an estimated speaking pace, each with its
formula shown on screen. There is no hidden AI score.

It is useful because most people rehearse interview answers silently or not at all. Speaking the answer, hearing it
back, and seeing concrete numbers ("8 filler words in 120 words") makes the next attempt measurably better.

Built as an individual Software Architecture project (SDV4327-O, Full Sail University, term C202610).

## Features

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/` | Start practising; shows your three most recent saved sessions |
| Practice | `/practice` | 8 curated interview questions in 5 categories, with a category filter |
| Recorder | `/record/:promptId` | Consent notice, microphone permission (allow / block / no device), timer, stop, retry, cancel, 3-minute cap, safe path for browsers that cannot record |
| Results | `/results` | Choose where the transcript comes from (typed by you, a labelled demo sample, or none), see feedback with formulas, and save |
| History | `/history` | Saved sessions, newest first |
| Session detail | `/history/:id` | The exact saved session; delete with confirmation |

Privacy by design:

- The microphone turns on only after you press **Start recording**.
- Audio stays in the open browser tab for playback. It is never uploaded and never saved.
- Saved sessions keep the question, measured length, transcript source and text, and the feedback numbers.

## Technologies

- **React 19** and **TypeScript 5.9**, built with **Vite 8**; routing with **React Router 7**
- Browser APIs: **MediaRecorder** and **getUserMedia** (recording), **IndexedDB** (saved sessions)
- Fonts: Space Grotesk, Inter, IBM Plex Mono via `@fontsource` (SIL Open Font License 1.1, self-hosted)
- Testing: **Vitest** (unit, contract and architecture tests), **Playwright** with **axe-core** (end-to-end and
  accessibility tests)
- No external APIs, no server, and no paid services

## Installation (using the app)

Interview Orbit is not deployed yet. To use it on your own computer:

1. Install **Node.js 22.12 or newer** from <https://nodejs.org> (the LTS version is fine).
2. Download or clone this repository.
3. In a terminal:

   ```bash
   cd projects/intervieworbit
   npm ci
   npm run dev
   ```

4. Open <http://localhost:5173> in Chrome or Edge, and allow the microphone when the browser asks.

Your saved sessions are stored in that browser on that computer only.

## Development setup

Requirements: Node.js **22.12+** (required by Vitest 5; Vite 8 needs 20.19+ or 22.12+) and npm. This folder is a
standalone npm project; it is not part of the OVS-OS pnpm workspace.

```bash
cd projects/intervieworbit
npm ci                # install exact dependency versions from package-lock.json
npm run dev           # development server at http://localhost:5173
npm run typecheck     # TypeScript check, no output files
npm test              # 62 unit, contract and architecture tests
npm run build         # typecheck + production build into dist/
npm run test:e2e      # Playwright end-to-end tests at 1280 px and 360 px
npm run preview       # serve the production build at http://localhost:4173
```

`npm run test:e2e` needs Chromium: run `npx playwright install chromium` once, or point at an existing browser with
`PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

Code layout:

```text
src/
  domain/       prompts, session types, analyzer, persistence interface (no React or browser code)
  recorder/     recorder state machine + useRecorder hook (the only code that opens the microphone)
  persistence/  IndexedDB adapter + in-memory test adapter, with shared contract tests
  state/        in-progress attempt and storage provider (React context)
  routes/       the screens
  components/   app shell, wordmark, page wrapper, source badge, feedback view
  styles/       design tokens, glass material, contrast test
e2e/            Playwright acceptance tests
docs/           architecture, ADRs, data contract, evidence, submission documents
```

Architecture documents: [overview and diagrams](docs/architecture/ARCHITECTURE.md),
[data contract](docs/architecture/DATA_CONTRACT.md), and three decision records:
[ADR-001](docs/architecture/adr/ADR-001-client-modules-and-persistence-port.md) (layered client and storage interface),
[ADR-002](docs/architecture/adr/ADR-002-transcript-provenance.md) (honest transcript sources),
[ADR-003](docs/architecture/adr/ADR-003-accessible-liquid-material.md) (accessible glass design).
The layering rules are enforced by `src/architecture.test.ts`, which runs with `npm test`.

### How the feedback is calculated

Defined in `src/domain/analyzer.ts` (version `io-analyzer/1`):

- **Words:** runs of letters or digits; punctuation ignored; "don't" counts as one word.
- **Filler words:** um, uh, er, ah, hmm; repeated letters count the same ("ummm" = um).
- **Fillers per 100 words** = filler words / words × 100.
- **Estimated pace** = words / (recording seconds / 60), only for typed text with a recording of 10 seconds or more.
  Never calculated for demo text.
- No overall score.

## License

**To be decided by the project owner before publication.** MIT is the suggested default for a portfolio project.
Until a `LICENSE` file is added, all rights are reserved by the author.

Third-party assets: fonts under SIL OFL 1.1; the ORBIT wordmark is an original SVG
(`src/components/OrbitWordmark.tsx`); no third-party UI code snippets are included.

## Contributors

- **Brandon Thoreau Kelly**: project owner and maintainer (product direction, architecture decisions, review and
  approval of each milestone)
- **AI assistance:** development used AI coding assistants under the owner's direction. Commit history records the
  authoring tool for each change.
- **Instructor:** Jason Hinders (Software Architecture, Full Sail University)

## Project status

**Alpha, not deployed.** The core journey works in automated tests: choose a question → record → review feedback →
save → reopen from History → delete.

Known issues and gaps (October 2026):

- **Known bug:** if you leave the Recorder while the browser's microphone prompt is still open and then click
  Allow, recording starts in the background. A fix with a regression test is scheduled. Until then, answer the
  microphone prompt before leaving the screen.
- Recording has been tested with a simulated microphone only; real-microphone testing is pending.
- No live speech-to-text: you type what you said, or use a clearly labelled demo sample.
- No server: sessions are stored in the browser only. A server API is specified in the data contract but not built.

## Roadmap

1. Fix the microphone permission bug above, with a regression test.
2. Real-microphone and Windows testing.
3. Server API for saved sessions, if required by the course.
4. Staging deployment and a recorded walkthrough.
