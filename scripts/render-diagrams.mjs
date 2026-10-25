// Renders the Mermaid diagrams in docs/architecture/ARCHITECTURE.md to SVG + PNG in docs/architecture/diagrams/.
// Mermaid is not a project dependency (it is only needed for docs). Usage, from the repository root:
//   npm install --no-save mermaid@11
//   PW_CHROMIUM_PATH=/path/to/chrome node scripts/render-diagrams.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const mdPath = join(root, "docs", "architecture", "ARCHITECTURE.md");
const outDir = join(root, "docs", "architecture", "diagrams");
const require = createRequire(join(root, "package.json"));
const mermaidJs = require.resolve("mermaid/dist/mermaid.min.js");
const { chromium } = require("@playwright/test");
const md = readFileSync(mdPath, "utf8");
const blocks = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
const names = ["01-system-context", "02-containers-components", "03-sequence-record-save", "04-sequence-history-delete"];
if (blocks.length !== names.length) throw new Error(`expected ${names.length} blocks, found ${blocks.length}`);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
await page.setContent("<!doctype html><html><body style='margin:0;background:#fff'><div id=out></div></body></html>");
await page.addScriptTag({ content: readFileSync(mermaidJs, "utf8") });
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" }));
for (const [i, code] of blocks.entries()) {
  const svg = await page.evaluate(async ([id, src]) => (await window.mermaid.render(id, src)).svg, [`d${i}`, code]);
  writeFileSync(`${outDir}/${names[i]}.svg`, svg);
  await page.evaluate((s) => { document.getElementById("out").innerHTML = s; }, svg);
  await page.locator("#out svg").screenshot({ path: `${outDir}/${names[i]}.png` });
  console.log("rendered", names[i], svg.length, "bytes");
}
await browser.close();
