// Records docs/submission/demo/backup-demo-simulated-mic.webm: an automated run of the full journey with a
// synthetic microphone, visibly labelled as such. A fallback for live demos, never a substitute for a real-mic receipt.
// Usage (from projects/intervieworbit): npm run build && node scripts/record-backup-demo.mjs "$PWD" "$PWD/docs/submission/demo/backup-demo-simulated-mic.webm"
import { spawn } from "node:child_process";
import { renameSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const [,, root, outFile] = process.argv;
const { chromium } = createRequire(root + "/package.json")("@playwright/test");
const server = spawn("npx", ["vite", "preview", "--port", "4174", "--strictPort"], { cwd: root, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));
const base = "http://localhost:4174";
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, slowMo: 120,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
const vdir = outFile + ".tmp"; mkdirSync(vdir, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 }, recordVideo: { dir: vdir, size: { width: 1280, height: 760 } } });
await ctx.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.textContent = "BACKUP RECORDING · automated run · simulated microphone · not a live demo";
    b.setAttribute("aria-hidden", "true");
    Object.assign(b.style, { position: "fixed", left: "12px", bottom: "12px", zIndex: 99999, pointerEvents: "none",
      font: "600 13px/1.4 ui-monospace, monospace", padding: "6px 10px", borderRadius: "8px",
      background: "#11192C", color: "#fff", letterSpacing: ".04em" });
    document.body.appendChild(b);
  });
});
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);
await page.goto(base + "/"); await pause(2500);
await page.getByRole("link", { name: /Start practice/ }).first().click(); await pause(1500);
await page.getByRole("radio", { name: "Teamwork" }).check({ force: true }); await pause(1500);
await page.getByRole("link", { name: "Answer this" }).first().click(); await pause(2500);
await page.getByRole("button", { name: "Start recording" }).click();
await page.getByTestId("timer").filter({ hasText: "00:06" }).waitFor({ timeout: 10000 });
await page.getByRole("button", { name: "Stop recording" }).click(); await pause(2000);
await page.getByRole("button", { name: "Use this answer" }).click(); await pause(1500);
await page.getByRole("radio", { name: /Type what you said/ }).check(); await pause(800);
await page.getByLabel("Your answer, as you said it").pressSequentially(
  "Um, my teammate and I disagreed about the release date. I, uh, listed the risks and we agreed to ship a smaller scope on time.", { delay: 25 });
await page.getByTestId("feedback").scrollIntoViewIfNeeded(); await pause(2000);
await page.getByText("How these numbers are calculated").click(); await pause(2500);
await page.getByRole("button", { name: "Save session" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Save session" }).click(); await pause(2000);
await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "History" }).click(); await pause(1500);
await page.reload(); await pause(2000);
await page.getByRole("link", { name: /Open session from/ }).first().click(); await pause(2500);
await page.mouse.wheel(0, 600); await pause(1500);
await page.getByRole("button", { name: "Delete session" }).click(); await pause(2000);
await page.getByRole("button", { name: "Yes, delete" }).click(); await pause(2500);
await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("blocked", "NotAllowedError")); });
await page.goto(base + "/record/beh-challenge"); await pause(1500);
await page.getByRole("button", { name: "Start recording" }).click(); await pause(3500);
const video = page.video();
await ctx.close(); await browser.close(); server.kill();
renameSync(await video.path(), outFile);
console.log("wrote", outFile);
