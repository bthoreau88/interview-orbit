import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = "docs/evidence/screenshots/g02";
const FIXTURE = "I, um, I planned the sprint and, uh, reviewed tests.";

/** Reads the backing store directly, independent of the app's own code (AT-12 backing-store lookup). */
async function storedRecords(page: Page): Promise<Array<{ id: string; [k: string]: unknown }>> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("interview-orbit", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("sessions", { keyPath: "id" });
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const all = db.transaction("sessions", "readonly").objectStore("sessions").getAll();
          all.onsuccess = () => {
            db.close();
            resolve(all.result);
          };
          all.onerror = () => reject(all.error);
        };
      }),
  );
}

async function answerWithManualText(page: Page, promptId: string) {
  await page.goto(`/record/${promptId}`);
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByTestId("timer")).toHaveText("00:01", { timeout: 4000 });
  await page.getByRole("button", { name: "Stop recording" }).click();
  await page.getByRole("button", { name: "Use this answer" }).click();
  await page.getByRole("radio", { name: /Type what you said/ }).check();
  await page.getByLabel("Your answer, as you said it").fill(FIXTURE);
}

test("AT-09/10/11/12 save -> reload -> open -> delete -> reload, with backing-store checks", async ({ page }, testInfo) => {
  await answerWithManualText(page, "team-conflict");
  await expect(page.getByTestId("storage-label")).toContainText("Not on a server");
  await expect(page.getByTestId("save-success")).toHaveCount(0);

  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByTestId("save-success")).toContainText("Saved");
  // Read-only after save: no duplicate saves, no silent edits.
  await expect(page.getByLabel("Your answer, as you said it")).toHaveAttribute("readonly", "");

  const records = await storedRecords(page);
  expect(records).toHaveLength(1);
  const saved = records[0]!;
  expect(saved).toMatchObject({ promptId: "team-conflict", transcriptSource: "manual", transcriptText: FIXTURE });
  expect(Object.keys(saved).some((k) => /audio|blob|url/i.test(k))).toBe(false);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-results-saved.png`, fullPage: true });

  // AT-10: survives a full reload.
  await page.goto("/history");
  await page.reload();
  const list = page.getByTestId("history-list");
  await expect(list.locator("li")).toHaveCount(1);
  await expect(list).toContainText("Tell me about a disagreement with a teammate");
  await expect(list).toContainText("10 words · 2 fillers");
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-history-list.png`, fullPage: true });

  // Dashboard shows it as recent.
  await page.goto("/");
  await expect(page.getByTestId("recent")).toContainText("Tell me about a disagreement with a teammate");

  // AT-11: detail opens the exact session.
  await page.goto("/history");
  await page.getByRole("link", { name: /Open session from/ }).click();
  await expect(page).toHaveURL(new RegExp(`/history/${saved.id}$`));
  await page.reload();
  await expect(page.getByTestId("detail-prompt")).toContainText("disagreement with a teammate");
  await expect(page.getByTestId("detail-text")).toHaveText(FIXTURE);
  await expect(page.getByTestId("source-badge")).toContainText("Manual");
  await expect(page.getByTestId("metric-words")).toHaveText("10");
  await expect(page.getByTestId("metric-fillers")).toContainText("um 1, uh 1");
  await expect(page.getByTestId("detail-duration")).toHaveText(/^00:0[1-3]$/);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-detail.png`, fullPage: true });

  // AT-12: delete requires confirmation; cancel keeps it.
  await page.getByRole("button", { name: "Delete session" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this session?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${testInfo.project.name}-delete-confirm.png` });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect(await storedRecords(page)).toHaveLength(1);

  await page.getByRole("button", { name: "Delete session" }).click();
  await dialog.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByTestId("deleted-notice")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("history-empty")).toBeVisible();
  expect(await storedRecords(page)).toEqual([]);

  // The old link now reports not found instead of showing stale data.
  await page.goto(`/history/${saved.id}`);
  await expect(page.getByTestId("detail-error")).toContainText("not found");
});

test("demo and not-scorable sessions keep their provenance when saved", async ({ page }) => {
  await page.goto("/record/beh-challenge");
  await page.getByRole("button", { name: "Skip recording, type my answer" }).click();
  await page.getByRole("radio", { name: /Use a demo sample/ }).check();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByTestId("save-success")).toBeVisible();

  await page.goto("/record/lead-initiative");
  await page.getByRole("button", { name: "Skip recording, type my answer" }).click();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByTestId("save-success")).toBeVisible();

  await page.goto("/history");
  const items = page.getByTestId("history-list").locator("li");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("No transcript");
  await expect(items.nth(0)).toContainText("Not scorable");
  await expect(items.nth(1)).toContainText("DEMO / SAMPLE");

  await items.nth(1).getByRole("link", { name: /Open session/ }).click();
  await expect(page.getByRole("note")).toContainText("DEMO / SAMPLE - NOT TRANSCRIBED FROM THIS RECORDING");
  await expect(page.getByTestId("metric-pace")).toContainText("Demo text is not synchronized");
});

test("AT-13 storage write failure shows a recoverable error and no false Saved", async ({ page }) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("simulated", "QuotaExceededError");
    };
  });
  await answerWithManualText(page, "prob-ambiguous");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByTestId("save-error")).toContainText("Nothing was saved");
  await expect(page.getByTestId("save-success")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try saving again" })).toBeEnabled();
  // The answer is still editable after a failure.
  await expect(page.getByLabel("Your answer, as you said it")).not.toHaveAttribute("readonly", "");
  expect(await storedRecords(page)).toEqual([]);
});

test("storage unavailable is reported on History and Results", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
  });
  await page.goto("/history");
  await expect(page.getByTestId("history-error")).toContainText("Browser storage is unavailable");
  await page.goto("/record/beh-mistake");
  await page.getByRole("button", { name: "Skip recording, type my answer" }).click();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByTestId("save-error")).toContainText("Browser storage is unavailable");
});

test("unknown session id shows not found", async ({ page }) => {
  await page.goto("/history/00000000-0000-4000-8000-000000000000");
  await expect(page.getByTestId("detail-error")).toContainText("not found");
});
