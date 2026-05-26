/**
 * Playwright E2E tests — full user journey against a running Next.js instance.
 *
 * Usage:
 *   npm run build && npm start &   # or set BASE_URL to any running instance
 *   npm run test:e2e
 *
 * Set BASE_URL env var to run against the live deployment:
 *   BASE_URL=https://insightstack-peach.vercel.app npm run test:e2e
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DEMO_CSV = join(__dirname, "../../docs/demo-transactions.csv");
const EMAIL = `e2e.${Date.now()}@test.insightstack.dev`;
const PASS = "E2eTest123!";

let browser, ctx, page;

before(async () => {
  browser = await chromium.launch({ headless: true });
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
});

after(async () => {
  await browser?.close();
});

// ── 1. Public pages ────────────────────────────────────────────────────────────

test("landing — hero heading renders", async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  const heading = await page.locator("h1").first().textContent();
  assert.ok(heading && heading.length > 10, `Expected hero h1, got: "${heading}"`);
});

test("demo page — step list renders", async () => {
  await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
  const steps = page.locator("text=01");
  await steps.waitFor({ timeout: 5000 });
  assert.ok(await steps.isVisible(), "Step 01 should be visible on demo page");
});

test("about page — builder identity section renders", async () => {
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  const body = await page.locator("body").textContent();
  assert.ok(body?.includes("Anish"), "About page should display builder name");
  assert.ok(body?.includes("InsightStack"), "About page should reference the app");
});

// ── 2. Auth flow ───────────────────────────────────────────────────────────────

test("register — new account redirects to /dashboard", async () => {
  await page.goto(`${BASE}/login?mode=register`, { waitUntil: "networkidle" });
  await page.fill('input[autocomplete="name"]', "E2E Test User");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[autocomplete="new-password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  assert.ok(page.url().includes("/dashboard"), "Should redirect to dashboard after registration");
});

// ── 3. Core product flow ───────────────────────────────────────────────────────

test("dashboard — dataset creation form is present", async () => {
  const input = page.locator('input[placeholder*="January"]');
  await input.waitFor({ timeout: 5000 });
  assert.ok(await input.isVisible(), "Dataset name input should be visible");
});

test("upload — CSV parses and dataset status advances to PARSED", async () => {
  await page.fill('input[placeholder*="January"]', "E2E Test Dataset");
  await page.click('button:has-text("Create")');
  await page.waitForTimeout(2000);

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(DEMO_CSV);
  await page.waitForTimeout(500);
  await page.click('button:has-text("Upload CSV")');

  await page.waitForSelector("text=PARSED", { timeout: 20000 });
  const statusEl = page.locator("text=PARSED").first();
  assert.ok(await statusEl.isVisible(), "Dataset should show PARSED status after upload");
});

test("dataset detail — navigates and renders financial data", async () => {
  await page.click('a:has-text("Open")');
  await page.waitForURL("**/dashboard/datasets/**", { timeout: 10000 });
  await page.waitForTimeout(2000);
  assert.ok(
    page.url().includes("/dashboard/datasets/"),
    "Should navigate to dataset detail page"
  );
  // Metrics section should render (contains $ amounts)
  const body = await page.locator("body").textContent();
  assert.ok(body?.includes("$") || body?.includes("Income") || body?.includes("Expenses"),
    "Dataset detail should show financial metrics");
});
