import { defineConfig } from "@playwright/test";

/**
 * Chromium's fake media flags give a synthetic microphone and auto-accept the
 * permission prompt, so recording can be exercised headlessly. Denial and
 * unsupported-browser cases are simulated per test with init scripts.
 * PW_CHROMIUM_PATH lets a machine use a preinstalled Chromium instead of downloading one.
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    launchOptions: {
      executablePath,
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile-360", use: { viewport: { width: 360, height: 740 }, hasTouch: true } },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
