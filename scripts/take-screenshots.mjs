import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../docs/screenshots");
mkdirSync(OUT, { recursive: true });

const BASE = "https://insightstack-peach.vercel.app";
const EMAIL = `screenshot.bot.${Date.now()}@insightstack.dev`;
const PASS  = "Screenshot123!";
const VIEWPORT_DESKTOP = { width: 1440, height: 900 };

async function shot(page, name) {
  const p = join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    deviceScaleFactor: 2,   // retina — crisp on LinkedIn retina displays
  });
  const page    = await ctx.newPage();

  // ── 1. Landing page ──────────────────────────────────────────────────────
  console.log("\n[1/8] Landing page");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await wait(2500);                         // let hero animations finish
  await shot(page, "landing");

  // ── 2. Pricing page ──────────────────────────────────────────────────────
  console.log("[2/8] Pricing page");
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await wait(800);
  // Toggle annual so it shows the Save 20% state
  await page.click('button[aria-label="Toggle billing period"]');
  await wait(400);
  await shot(page, "pricing");

  // ── 3. Register a fresh account ──────────────────────────────────────────
  console.log("[3/8] Registering account…");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await wait(800);
  // Click the "Register" tab to switch the form to register mode
  await page.click('button:has-text("Register")');
  await wait(600);
  // Wait for the name field to appear (only visible in register mode)
  await page.waitForSelector('input[autocomplete="name"]', { timeout: 5000 });
  await page.fill('input[autocomplete="name"]',         "Anish Bhole");
  await page.fill('input[type="email"]',                EMAIL);
  await page.fill('input[autocomplete="new-password"]', PASS);
  await page.click('button[type="submit"]');
  // Wait for redirect — could be /dashboard or could already be there
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  await wait(1500);
  console.log("  ✓ Registered — on dashboard");

  // ── 4. Load demo data via the one-click button ────────────────────────────
  console.log("[4/8] Loading demo data…");
  const demoBtn = page.locator('button:has-text("Try with demo data")');
  await demoBtn.waitFor({ timeout: 8000 });
  await demoBtn.click();
  // Wait for dataset creation + CSV upload to complete (spinner disappears)
  await page.waitForSelector('button:has-text("Try with demo data")', { state: "hidden", timeout: 30000 })
    .catch(() => {}); // might already be gone if it unmounted
  await wait(3000);
  console.log("  ✓ Demo data loaded");

  // ── 5. Dashboard screenshot (data populated, search + sort visible) ───────
  console.log("[5/8] Dashboard screenshot");
  await page.reload({ waitUntil: "networkidle" });
  await wait(1500);
  await shot(page, "dashboard");

  // ── 6. Dataset detail page ────────────────────────────────────────────────
  console.log("[6/8] Dataset detail page");
  const openLink = page.locator('a:has-text("Open →")').first();
  await openLink.waitFor({ timeout: 8000 });
  await openLink.click();
  await page.waitForURL("**/dashboard/**", { timeout: 15000 });
  // Wait for the charts section to appear (means data has loaded)
  await page.waitForSelector('text="Category Breakdown"', { timeout: 20000 });
  await wait(2000);   // let charts fully render
  await shot(page, "dataset-detail");

  // LinkedIn crop taken here — same page, same data, just narrower viewport
  console.log("  Taking LinkedIn crop from dataset detail…");
  await page.setViewportSize({ width: 1200, height: 630 });
  await wait(800);
  await shot(page, "linkedin");

  // ── 7. Generate AI insights ───────────────────────────────────────────────
  console.log("[7/8] Generating AI insights (up to 45s)…");
  const genBtn = page.locator('button:has-text("Generate Insights")');
  await genBtn.waitFor({ timeout: 8000 });
  await genBtn.click();
  try {
    // Wait for FinanceAI to finish — stream emits "Analysis complete" step
    await page.waitForSelector(
      'text=/Analysis complete/i',
      { timeout: 45000 }
    );
    await wait(3000);  // let the insight card fully render
    console.log("  ✓ FinanceAI engine complete — insights rendered");
  } catch {
    console.log("  ⚠ Insight stream timed out — capturing current state");
    await wait(2000);
  }

  // Scroll down to show the generated insight card
  await page.evaluate(() => window.scrollBy(0, 500));
  await wait(800);
  await shot(page, "insights");

  // ── 8. About page ─────────────────────────────────────────────────────────
  console.log("[8/8] About page");
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await wait(1200);
  await shot(page, "about");


  await browser.close();

  console.log("\n✅ Done — screenshots saved to docs/screenshots/");
  console.log("   landing.png  · pricing.png  · dashboard.png");
  console.log("   dataset-detail.png  · insights.png  · about.png");
  console.log("   linkedin.png  ← upload this one to LinkedIn");
})();
