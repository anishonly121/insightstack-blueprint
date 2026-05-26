import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../docs/screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = "https://insightstack-peach.vercel.app";
const EMAIL = `screenshot.bot.${Date.now()}@insightstack.dev`;
const PASS = "Screenshot123!";
const CSV_PATH = join(__dirname, "../docs/demo-transactions.csv");

const VIEWPORT = { width: 1440, height: 900 };

async function shot(page, name, clip) {
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    ...(clip ? { clip } : { fullPage: false }),
  });
  console.log(`✓ ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // ── 1. Landing page ────────────────────────────────────────────────────────
  console.log("→ Landing page");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "landing");

  // ── 2. Register ────────────────────────────────────────────────────────────
  console.log("→ Registering account");
  await page.goto(`${BASE}/login?mode=register`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.fill('input[autocomplete="name"]', "Demo User");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[autocomplete="new-password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  console.log("  ✓ Registered and redirected to dashboard");

  // ── 3. Create dataset ──────────────────────────────────────────────────────
  console.log("→ Creating dataset");
  await page.fill('input[placeholder*="January"]', "Demo — Monthly Expenses");
  await page.click('button[type="submit"]:has-text("Create")');
  await page.waitForTimeout(1500);

  // ── 4. Upload CSV ──────────────────────────────────────────────────────────
  console.log("→ Uploading CSV");
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(CSV_PATH);
  await page.waitForTimeout(500);
  await page.click('button:has-text("Upload CSV")');
  await page.waitForTimeout(3000);

  // ── 5. Dashboard screenshot (with data) ────────────────────────────────────
  console.log("→ Dashboard screenshot");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "dashboard");

  // ── 6. Open dataset detail page ────────────────────────────────────────────
  console.log("→ Opening dataset detail");
  await page.click('a:has-text("Open →")');
  await page.waitForURL("**/dashboard/datasets/**", { timeout: 10000 });
  await page.waitForTimeout(2500);
  await shot(page, "dataset-detail");

  // ── 7. Generate AI insights ────────────────────────────────────────────────
  console.log("→ Generating AI insights (this takes ~15s)");
  const insightBtn = page.locator('button:has-text("Generate Insights")');
  await insightBtn.click();
  // Wait up to 30s for insights to appear
  try {
    await page.waitForSelector('article', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log("  ✓ Insights generated");
  } catch {
    console.log("  ⚠ Insights timed out — screenshotting current state");
  }
  await shot(page, "insights");

  // ── 8. About page ──────────────────────────────────────────────────────────
  console.log("→ About page");
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "about");

  await browser.close();
  console.log("\n✅ All screenshots saved to docs/screenshots/");
})();
