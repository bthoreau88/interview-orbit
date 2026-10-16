// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** WCAG 2.x contrast check over the real token file, so the test cannot drift from the CSS. */
const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`token --${name} is not a 6-digit hex`);
  return match[1];
}

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;

function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Alpha-composite white glass at the given opacity over a backdrop colour. */
const glassOver = (backdrop: RGB, alpha: number): RGB =>
  backdrop.map((c) => Math.round(255 * alpha + c * (1 - alpha))) as RGB;

const WHITE: RGB = [255, 255, 255];
const GLASS_ALPHA = 0.88;

describe("token contrast (normal text >= 4.5:1)", () => {
  const pairs: Array<[string, RGB, RGB]> = [
    ["ink on canvas", rgb(token("io-midnight")), rgb(token("io-cloud"))],
    ["muted ink on canvas", rgb(token("io-ink-muted")), rgb(token("io-cloud"))],
    ["muted ink on white", rgb(token("io-ink-muted")), WHITE],
    ["link ink on white", rgb(token("io-cobalt-deep")), WHITE],
    ["link ink on canvas", rgb(token("io-cobalt-deep")), rgb(token("io-cloud"))],
    ["white on primary button", WHITE, rgb(token("io-cobalt"))],
    ["danger on danger bg", rgb(token("io-danger")), rgb(token("io-danger-bg"))],
    ["warning on warning bg", rgb(token("io-warning-ink")), rgb(token("io-warning-bg"))],
    ["success on success bg", rgb(token("io-success-ink")), rgb(token("io-success-bg"))],
  ];

  for (const [name, fg, bg] of pairs) {
    it(name, () => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const accent of ["io-cobalt", "io-iris", "io-ice", "io-midnight"]) {
    it(`muted ink on glass over the ${accent} backdrop`, () => {
      const surface = glassOver(rgb(token(accent)), GLASS_ALPHA);
      expect(ratio(rgb(token("io-ink-muted")), surface)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
