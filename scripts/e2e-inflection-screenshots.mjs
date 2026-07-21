/**
 * Playwright E2E script: mieć (L2) + nowy (L3) inflection test with screenshots.
 * Run: node scripts/e2e-inflection-screenshots.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../test-screenshots');
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173/dev/inflection-test';

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function hoverGenerate(page, sectionTestId) {
  const cell = page.locator(`[data-testid="${sectionTestId}"] td`).nth(2);
  await cell.hover();
  await page.waitForTimeout(400);
  const btn = page.locator(`[data-testid="${sectionTestId}"] button:has-text("Generate")`);
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  return btn;
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  await waitForServer(BASE_URL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const results = [];

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: path.join(OUT_DIR, '01-initial-page.png'),
      fullPage: true,
    });

    // --- mieć (L2) ---
    const miećBtn = await hoverGenerate(page, 'section-mieć');
    await miećBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, '02-miec-L2-dialog.png'),
      fullPage: true,
    });

    const dialogTitle = await page.locator('[role="dialog"] h2').textContent();
    const miećOptions = await page.locator('[role="dialog"] button').allTextContents();
    results.push({
      word: 'mieć',
      level: 'L2',
      dialogTitle,
      options: miećOptions.filter(Boolean),
    });

    await page.locator('[role="dialog"] button').filter({ hasText: 'mieć' }).filter({ hasText: '不定式' }).first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, '03-miec-filled.png'),
      fullPage: true,
    });

    const miećTranslation = await page
      .locator('[data-testid="section-mieć"] td')
      .first()
      .innerText();
    const miećPresent1sg = await page
      .locator('[data-testid="section-mieć"] td')
      .nth(3)
      .innerText();

    results.push({
      word: 'mieć',
      afterFill: { translation: miećTranslation.trim(), present1sg: miećPresent1sg.trim() },
    });

    // --- nowy (L3) ---
    await page.getByRole('tab', { name: /adj · nowy/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, '04-nowy-tab.png'),
      fullPage: true,
    });

    const nowyBtn = await hoverGenerate(page, 'section-nowy');
    await nowyBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, '05-nowy-L3-dialog.png'),
      fullPage: true,
    });

    const nowyDialogTitle = await page.locator('[role="dialog"] h2').textContent();
    const nowyOptions = await page.locator('[role="dialog"] button').allTextContents();
    results.push({
      word: 'nowy',
      level: 'L3',
      dialogTitle: nowyDialogTitle,
      options: nowyOptions.filter(Boolean),
    });

    await page
      .locator('[role="dialog"] button')
      .filter({ hasText: '形容词' })
      .filter({ hasText: 'nowy' })
      .first()
      .click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, '06-nowy-filled.png'),
      fullPage: true,
    });

    const nowyTranslation = await page
      .locator('[data-testid="section-nowy"] td')
      .first()
      .innerText();
    const nowyNomM = await page
      .locator('[data-testid="section-nowy"] td')
      .nth(3)
      .innerText();

    results.push({
      word: 'nowy',
      afterFill: { translation: nowyTranslation.trim(), instrumental: nowyNomM.trim() },
    });

    await page.screenshot({
      path: path.join(OUT_DIR, '07-final-summary.png'),
      fullPage: true,
    });

    console.log(JSON.stringify({ ok: true, results, screenshots: OUT_DIR }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2));
  process.exit(1);
});
