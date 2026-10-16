# ADR-002: Transcript provenance is explicit; no live speech-to-text in P0

Scope: Interview Orbit only (project-local ADR numbering).

- **Status:** Implemented (G01; persisted in G02). Awaiting owner review.
- **Date:** 2026-10-16
- **Review date:** 2026-10-23, or when a speech-to-text provider is proposed.

## Context

Feedback (filler counts, pace) needs text. The product brief forbids presenting sample or synthetic text as a
transcription of the user's recording, and forbids hidden audio upload. No speech-to-text provider was found
or verified in the audit.

The obvious shortcut, the browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), is not a
neutral local feature. In Chrome it can send audio to a remote recognition service, which would contradict the
on-screen promise that audio is never uploaded. Availability and accuracy also differ across browsers.

## Decision

1. Every transcript carries a source from a closed set: `live | manual | demo | none`
   (`src/domain/session.ts:8`). The source is stored with the session and shown as a badge wherever text or
   feedback appears (`src/components/SourceBadge.tsx`).
2. `live` is reserved for a future verified provider. In this build the option is visible but disabled, with
   the reason stated on screen (`src/routes/Results.tsx`, "Live transcription - unavailable").
3. `manual`: the user types what they said. Pace is calculated only for this source (or `live`), and only with
   a recording of at least 10 seconds, and is labelled "estimated" (`src/domain/analyzer.ts`, `paceFor`).
4. `demo`: a fixed sample (`src/domain/demoTranscript.ts`). It is always shown with
   "DEMO / SAMPLE - NOT TRANSCRIBED FROM THIS RECORDING", and pace is never calculated for it.
5. `none`: the analysis is `not-scorable`; no numbers are shown.
6. A future provider must be added as an adapter that returns `{ source: "live", text }` only for text derived
   from the current recording, and must disclose where audio is sent before recording starts.

## Consequences and trade-offs

Positive:

- The UI cannot imply a transcription that did not happen; tests assert the labels and the absence of pace for
  demo text.
- Saved sessions keep their provenance, so History cannot launder a demo into a "result".

Negative:

- The 90-second demo cannot show automatic transcription. The user types text or uses the labelled demo.
- Manual text may not match what was said exactly, so pace is an estimate (the UI says so).

## Alternatives considered

| Alternative | Why not |
|---|---|
| Web Speech API | Possible remote upload of audio (conflicts with privacy promise); uneven browser support |
| Cloud STT (paid API) | Needs keys and a server to hold them; paid service; out of P0 scope |
| On-device model (e.g. WebAssembly Whisper) | Large download, slow on low-end devices, unverified accuracy; too big for the sprint |
| Silent demo fallback | Explicitly forbidden: it would masquerade as transcription |

## Evidence

- Types: `src/domain/session.ts:8`, labels `:35`
- Analyzer rules and fixtures: `src/domain/analyzer.ts`, `src/domain/analyzer.test.ts` (fixture 3: demo text never gets a pace)
- UI and persistence of provenance: `e2e/journey.spec.ts` (`AT-06`), `e2e/persistence.spec.ts`
  ("demo and not-scorable sessions keep their provenance when saved")
- No network code anywhere in `src/`: `src/architecture.test.ts`
