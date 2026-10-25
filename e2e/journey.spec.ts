import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = "docs/evidence/screenshots/g01";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Records every request so tests can prove nothing is uploaded (AT-18). */
function trackRequests(page: Page) {
  const requests: Array<{ method: string; url: string }> = [];
  page.on("request", (r) => requests.push({ method: r.method(), url: r.url() }));
  return requests;
}

async function recordFor(page: Page, seconds: number) {
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("Recording - microphone on")).toBeVisible();
  await expect(page.getByTestId("timer")).toHaveText(`00:${String(seconds).padStart(2, "0")}`, {
    timeout: (seconds + 3) * 1000,
  });
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByText(/Recording captured/)).toBeVisible();
}

test("AT-01 navigation: dashboard CTA to Practice and back, no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your next interview starts here.");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: /Start practice/ }).first().click();
  await expect(page).toHaveURL(/\/practice$/);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("AT-02/03/18 core journey: prompt -> consented recording -> results, no upload", async ({ page }) => {
  const requests = trackRequests(page);
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    (window as unknown as { __gumCalls: number }).__gumCalls = 0;
    navigator.mediaDevices.getUserMedia = (c) => {
      (window as unknown as { __gumCalls: number }).__gumCalls += 1;
      return original(c);
    };
  });

  await page.goto("/practice");
  await expect(page.locator(".prompt-list > li")).toHaveCount(8);
  await page.getByRole("radio", { name: "Teamwork" }).check({ force: true });
  await expect(page.locator(".prompt-list > li")).toHaveCount(2);
  const promptText = await page.locator(".prompt-text").first().innerText();
  await page.getByRole("link", { name: "Answer this" }).first().click();

  await expect(page.getByTestId("recorder-prompt")).toHaveText(promptText);
  await expect(page.getByTestId("consent")).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __gumCalls: number }).__gumCalls)).toBe(0);

  await recordFor(page, 2);
  expect(await page.evaluate(() => (window as unknown as { __gumCalls: number }).__gumCalls)).toBe(1);
  await page.getByRole("button", { name: "Use this answer" }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByTestId("results-prompt")).toContainText(promptText);
  await expect(page.getByTestId("results-duration")).toHaveText(/^00:0[2-4]$/);
  await expect(page.getByTestId("source-badge")).toContainText("No transcript");
  await expect(page.getByTestId("not-scorable")).toBeVisible();

  await page.getByRole("radio", { name: /Type what you said/ }).check();
  await page.getByLabel("Your answer, as you said it").fill("I, um, I planned the sprint and, uh, reviewed tests.");
  await expect(page.getByTestId("source-badge")).toContainText("Manual");
  await expect(page.getByTestId("metric-words")).toHaveText("10");
  await expect(page.getByTestId("metric-fillers")).toContainText("2");
  await expect(page.getByTestId("metric-fillers")).toContainText("um 1, uh 1");
  await expect(page.getByTestId("metric-pace")).toContainText("shorter than 10 seconds");

  const nonLocal = requests.filter((r) => !r.url.startsWith("http://localhost:4173/") && !r.url.startsWith("blob:"));
  const nonGet = requests.filter((r) => r.method !== "GET");
  expect(nonLocal).toEqual([]);
  expect(nonGet).toEqual([]);
});

test("AT-06 demo transcript is conspicuously labeled and never gets a pace", async ({ page }) => {
  await page.goto("/record/beh-challenge");
  await recordFor(page, 1);
  await page.getByRole("button", { name: "Use this answer" }).click();
  await page.getByRole("radio", { name: /Use a demo sample/ }).check();
  await expect(page.getByTestId("demo-warning")).toContainText("DEMO / SAMPLE - NOT TRANSCRIBED FROM THIS RECORDING");
  await expect(page.getByTestId("source-badge")).toContainText("DEMO / SAMPLE");
  await expect(page.getByTestId("metric-pace")).toContainText("Demo text is not synchronized");
  await expect(page.getByRole("radio", { name: /Live transcription - unavailable/ })).toBeDisabled();
});

test("AT-05 retry discards the recording and returns to consent", async ({ page }) => {
  await page.goto("/record/beh-mistake");
  await recordFor(page, 1);
  await page.getByRole("button", { name: /Retry/ }).click();
  await expect(page.getByTestId("consent")).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);
});

test("AT-04 denied permission shows recovery, not false success", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await page.goto("/record/team-conflict");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByTestId("recorder-error")).toContainText("Microphone access was blocked");
  await expect(page.getByText(/Recording captured/)).toHaveCount(0);
  await page.getByRole("button", { name: "Continue without recording" }).click();
  await expect(page.getByTestId("results-no-recording")).toBeVisible();
  await page.getByRole("radio", { name: /Type what you said/ }).check();
  await page.getByLabel("Your answer, as you said it").fill("We talked it through.");
  await expect(page.getByTestId("metric-pace")).toContainText("no recording");
});

test("AT-05 unsupported browser offers a safe alternative", async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error simulate a browser without MediaRecorder
    delete window.MediaRecorder;
  });
  await page.goto("/record/prob-deadline");
  await expect(page.getByTestId("recorder-unsupported")).toBeVisible();
  await page.getByRole("button", { name: "Type my answer instead" }).click();
  await expect(page).toHaveURL(/\/results$/);
});

test("AT-08 empty and missing states", async ({ page }) => {
  await page.goto("/results");
  await expect(page.getByTestId("results-empty")).toBeVisible();
  await page.goto("/record/does-not-exist");
  await expect(page.getByRole("alert")).toContainText("could not find that question");
  await page.goto("/history");
  await expect(page.getByTestId("history-empty")).toBeVisible();
  await page.goto("/nope");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
});

test("AT-14/15 keyboard entry, 44px targets and axe scan on every screen", async ({ page }, testInfo) => {
  const routes: Array<[string, string]> = [
    ["dashboard", "/"],
    ["practice", "/practice"],
    ["recorder", "/record/beh-challenge"],
    ["results-empty", "/results"],
    ["history", "/history"],
  ];
  for (const [name, path] of routes) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`), `axe on ${path}`).toEqual([]);
    const small = await page.$$eval(".btn, .nav a, .chip span, .source-option, summary", (els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.height < 44 || r.width < 44))
        .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
    );
    expect(small, `targets under 44px on ${path}`).toEqual([]);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-${name}.png`, fullPage: true });
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  // Keyboard-only path to the Practice screen; focus then lands on the new page heading.
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    if (await page.getByRole("link", { name: /Start practice/ }).evaluate((el) => el === document.activeElement)) break;
  }
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("results screen with manual transcript (evidence screenshot)", async ({ page }, testInfo) => {
  await page.goto("/record/beh-challenge");
  await recordFor(page, 1);
  await page.getByRole("button", { name: "Use this answer" }).click();
  await page.getByRole("radio", { name: /Type what you said/ }).check();
  await page.getByLabel("Your answer, as you said it").fill("I, um, I planned the sprint and, uh, reviewed tests.");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-results-manual.png`, fullPage: true });
  await page.getByRole("radio", { name: /Use a demo sample/ }).check();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-results-demo.png`, fullPage: true });
});

test("AT-16 reduced motion disables decorative animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const name = await page.locator(".atmosphere span").first().evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe("none");
});

/**
 * IO-10 regression: a permission prompt answered after the user left the Recorder must not start recording.
 * getUserMedia is held open until the test releases it, as if the user clicked "Allow" late.
 */
async function holdPermission(page: Page) {
  await page.addInitScript(() => {
    const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const w = window as unknown as {
      __streams: MediaStream[];
      __recorderStarts: number;
      __release: () => Promise<void>;
    };
    w.__streams = [];
    w.__recorderStarts = 0;
    navigator.mediaDevices.getUserMedia = (constraints) =>
      new Promise((resolve) => {
        w.__release = async () => {
          const stream = await real(constraints);
          w.__streams.push(stream);
          resolve(stream);
        };
      });
    const RealRecorder = window.MediaRecorder;
    window.MediaRecorder = class extends RealRecorder {
      start(timeslice?: number) {
        w.__recorderStarts += 1;
        super.start(timeslice);
      }
    };
  });
}

async function micActivityAfterRelease(page: Page) {
  await page.evaluate(() => (window as unknown as { __release: () => Promise<void> }).__release());
  await page.waitForTimeout(750);
  return page.evaluate(() => {
    const w = window as unknown as { __streams: MediaStream[]; __recorderStarts: number };
    return {
      recorderStarts: w.__recorderStarts,
      liveTracks: w.__streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === "live").length,
    };
  });
}

test("IO-10 late permission after 'Skip recording' never records", async ({ page }) => {
  await holdPermission(page);
  await page.goto("/record/beh-challenge");
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.getByRole("button", { name: "Skip recording, type my answer" }).click();
  await expect(page).toHaveURL(/\/results$/);
  expect(await micActivityAfterRelease(page)).toEqual({ recorderStarts: 0, liveTracks: 0 });
});

test("IO-10 late permission after leaving via navigation never records", async ({ page }) => {
  await holdPermission(page);
  await page.goto("/record/beh-challenge");
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/\/history$/);
  expect(await micActivityAfterRelease(page)).toEqual({ recorderStarts: 0, liveTracks: 0 });
});

test("IO-10 normal permission still records after the fix", async ({ page }) => {
  await holdPermission(page);
  await page.goto("/record/beh-challenge");
  await page.getByRole("button", { name: "Start recording" }).click();
  await page.evaluate(() => (window as unknown as { __release: () => Promise<void> }).__release());
  await expect(page.getByText("Recording - microphone on")).toBeVisible();
  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(page.getByText(/Recording captured/)).toBeVisible();
  const live = await page.evaluate(() =>
    (window as unknown as { __streams: MediaStream[] }).__streams
      .flatMap((s) => s.getTracks())
      .filter((t) => t.readyState === "live").length,
  );
  expect(live).toBe(0);
});
