// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Architecture fitness test for ADR-001: dependencies point inward.
 *   routes/components -> state -> domain <- persistence
 * The domain layer must stay framework-free and storage-free so it can be reused
 * behind a future HTTP API without change.
 */
const SRC = new URL(".", import.meta.url).pathname;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/^\s*import[^'"]*["']([^"']+)["']/gm)].map((m) => m[1]!);
}

function layerFiles(layer: string) {
  return sourceFiles(join(SRC, layer)).map((file) => ({ file: relative(SRC, file), imports: importsOf(file) }));
}

describe("ADR-001 dependency rules", () => {
  it("domain imports nothing from React, the router, or other layers", () => {
    const violations = layerFiles("domain").flatMap(({ file, imports }) =>
      imports
        .filter((i) => /^react|^react-router|\/(routes|components|state|persistence|recorder)\//.test(i) || i.startsWith("../"))
        .map((i) => `${file} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it("persistence depends only on domain (never on UI or state)", () => {
    const violations = layerFiles("persistence").flatMap(({ file, imports }) =>
      imports.filter((i) => i.startsWith("../") && !i.startsWith("../domain/")).map((i) => `${file} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it("routes and components never import a storage adapter directly", () => {
    const violations = [...layerFiles("routes"), ...layerFiles("components")].flatMap(({ file, imports }) =>
      imports.filter((i) => i.includes("/persistence/")).map((i) => `${file} -> ${i}`),
    );
    expect(violations).toEqual([]);
  });

  it("only the recorder layer touches MediaRecorder / getUserMedia", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => !relative(SRC, f).startsWith("recorder/"))
      .filter((f) => /getUserMedia|new MediaRecorder/.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it("no source file performs network I/O (no fetch, XHR, WebSocket, sendBeacon)", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => /\bfetch\(|XMLHttpRequest|new WebSocket|sendBeacon/.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
