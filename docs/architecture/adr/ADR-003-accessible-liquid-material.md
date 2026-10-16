# ADR-003: Accessible liquid material as a token contract

Scope: Interview Orbit only (project-local ADR numbering).

- **Status:** Implemented (G01; extended in G02). Awaiting owner review.
- **Date:** 2026-10-16
- **Review date:** 2026-10-24 (visual polish pass).

## Context

The brief asks for a "controlled luminous liquid glass" look (cobalt / iris / ice accents, translucent
surfaces, an energetic ORBIT wordmark) inspired by three reference boards. The glassmorphism reference shows
the usual failure of the style: thin white text on pale translucent fills, which fails WCAG contrast. The
lettering reference is marked "All Rights Reserved" by its creator. The PDF sets hard limits: body text contrast
≥ 4.5:1, glass behind dense text ≥ 85% opaque, blur only on supporting surfaces, visible focus, 44 px targets,
reduced-motion support, and nothing distorting prompts, controls, timers, or results.

## Decision

1. All colour, material, focus, spacing, and motion values live in one token file, `src/styles/tokens.css`.
   Components use roles (`--io-ink`, `--io-accent-ink`, `--io-glass`), not raw colours.
2. Glass surfaces are at least 88% opaque white (`--io-glass`, `tokens.css:29`), 96% where `backdrop-filter`
   is unsupported. Blur (16 px) is applied only inside `@supports (backdrop-filter: …)`.
3. Prismatic colour lives only in a decorative, `aria-hidden` background layer (`.atmosphere`) and in the
   wordmark. It never sits behind text without a glass surface between.
4. Contrast is a test, not a review step: `src/styles/contrast.test.ts` reads `tokens.css` and checks every
   text/background pair, including muted text on glass composited over each accent colour, against 4.5:1.
5. Focus: a two-ring `box-shadow` (`--io-focus-ring`) on `:focus-visible`. Targets: 44 px minimum
   (`--io-target`), checked by e2e on every screen.
6. Motion: decorative drift and the recording pulse stop under `prefers-reduced-motion: reduce`; transition
   duration drops to 0.
7. Type: Space Grotesk (headings), Inter (body), IBM Plex Mono (numbers), all SIL OFL 1.1, self-hosted via
   `@fontsource`, with system fallbacks. No font CDN.
8. The ORBIT wordmark is an original SVG (`src/components/OrbitWordmark.tsx`): Space Grotesk letters set
   inside an orbital ring. No reference lettering was traced or adapted, and no UIverse code is used.

## Consequences and trade-offs

Positive:

- Any token change that breaks contrast fails `npm test`.
- Automated axe-core scans report 0 WCAG 2.1 A/AA violations on every screen at 1280 px and 360 px.
- Fonts and assets are license-clean and need no third-party requests.

Negative:

- The look is calmer than the glassmorphism board. That is deliberate.
- The wordmark is legible but less "high-energy" than the brief. A hand-drawn original mark remains open work.
- Automated checks do not replace a manual screen-reader pass, which has not been done.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Low-opacity glass (20–60%) as in the reference board | Fails contrast behind text; unreadable on bright backdrops |
| Copy UIverse components | Per-snippet licensing and attribution, unreviewed code; interaction ideas reused instead |
| Adapt reference lettering for ORBIT | The creator reserves all rights |
| Google Fonts CDN | Sends visitor IPs to a third party; offline builds break |

## Evidence

- Tokens: `src/styles/tokens.css`; material CSS: `src/styles/app.css` (`.glass`, `@supports`, reduced-motion blocks)
- Contrast test: `src/styles/contrast.test.ts` (10 pairs + 4 glass composites)
- Accessibility e2e: `e2e/journey.spec.ts` (`AT-14/15`, `AT-16`), `e2e/persistence.spec.ts` (axe on detail view)
- Screenshots: `docs/evidence/screenshots/g01/`, `docs/evidence/screenshots/g02/`
- Font licenses: `node_modules/@fontsource/*/LICENSE` (OFL-1.1, checked 2026-10-16)
