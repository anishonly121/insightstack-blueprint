/**
 * Playwright E2E tests — full user journey against a running Next.js instance.
 *
 * Usage:
 *   npm run build && npm start &   # or set BASE_URL to any running instance
 *   npm run test:e2e
 *
 * Uses disposable accounts. Only run against an isolated local/CI database.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(BASE).hostname)) {
  throw new Error("Run the account journey only against an isolated local/CI database.");
}
const DEMO_CSV = join(__dirname, "../../docs/demo-transactions.csv");
const EMAIL = `e2e.${Date.now()}@test.insightstack.dev`;
const PASS = "E2eTest123!";

let browser, ctx, page;
const pageErrors = [];

before(async () => {
  browser = await chromium.launch({ headless: true });
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await mkdir("artifacts/account-preview", { recursive: true });
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

test("engineering page — step list renders", async () => {
  await page.goto(`${BASE}/how-it-works`, { waitUntil: "networkidle" });
  const steps = page.getByText("01", { exact: true }).first();
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
  await page.locator('input[type="file"]').first().waitFor();

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(DEMO_CSV);
  await page.click('button:has-text("Upload CSV")');

  await page.waitForSelector("text=PARSED", { timeout: 20000 });
  const statusEl = page.locator("text=PARSED").first();
  assert.ok(await statusEl.isVisible(), "Dataset should show PARSED status after upload");
});

test("dataset detail — navigates and renders financial data", async () => {
  await page.click('a:has-text("Open")');
  await page.waitForURL("**/dashboard/datasets/**", { timeout: 10000 });
  await page.getByRole("heading", { name: "Budget Tracker" }).waitFor();
  assert.ok(
    page.url().includes("/dashboard/datasets/"),
    "Should navigate to dataset detail page"
  );
  // Metrics section should render (contains $ amounts)
  const body = await page.locator("body").textContent();
  assert.ok(body?.includes("$") || body?.includes("Income") || body?.includes("Expenses"),
    "Dataset detail should show financial metrics");
});

test("analysis streams, persists, and chat answers an actual dataset question", async () => {
  const streamResponse = page.waitForResponse((res) => res.url().includes("/insights/stream"));
  await page.getByRole("button", { name: /Generate Insights/ }).click();
  assert.equal((await streamResponse).status(), 200);
  await page.getByRole("button", { name: "Share", exact: true }).first().waitFor({ timeout: 30000 });
  await page.reload();
  await page.getByRole("button", { name: "Share", exact: true }).first().waitFor();
  const chatResponse = page.waitForResponse((res) => res.url().endsWith("/chat"));
  await page.getByPlaceholder("Ask about your spending…").fill("What is my savings rate?");
  await page.getByPlaceholder("Ask about your spending…").press("Enter");
  const response = await chatResponse;
  assert.equal(response.status(), 200);
  assert.ok((await response.text()).length > 40);
  await page.locator(".recharts-pie-sector").first().waitFor();
  await page.mouse.move(0, 0);
  await page.screenshot({ path: "artifacts/account-preview/dataset-analysis.png", fullPage: true });
});

test("sharing publishes an insight and revoking makes it private again", async () => {
  const published = page.waitForResponse((res) => res.url().endsWith("/share") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Share", exact: true }).first().click();
  const response = await published;
  assert.equal(response.status(), 200);
  const { data } = await response.json();
  const insightId = new URL(data.url).pathname.split("/").at(-1);
  const publicUrl = `${BASE}/api/share/${insightId}`;
  assert.equal((await fetch(publicUrl)).status, 200);
  const revoked = page.waitForResponse((res) => res.url().endsWith("/share") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Shared", exact: true }).first().click();
  assert.equal((await revoked).status(), 200);
  assert.equal((await fetch(publicUrl)).status, 404);
});

test("monthly budget limits save and persist", async () => {
  await page.getByRole("button", { name: "+ Set limit", exact: true }).first().click();
  await page.getByPlaceholder("Monthly limit").fill("500");
  const saved = page.waitForResponse((res) => res.url().endsWith("/budgets") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  assert.equal((await saved).status(), 200);
  await page.reload();
  await page.getByText("of $500.00/mo", { exact: true }).waitFor();
});

test("settings persist notification preferences and expose unavailable billing", async () => {
  await page.goto(`${BASE}/dashboard/settings`);
  const toggle = page.getByRole("switch", { name: "Weekly email digest" });
  await toggle.waitFor();
  const previous = await toggle.getAttribute("aria-checked");
  const saved = page.waitForResponse((res) => res.url().endsWith("/notifications") && res.request().method() === "PATCH");
  await toggle.click();
  assert.equal((await saved).status(), 200);
  await page.reload({ waitUntil: "networkidle" });
  assert.notEqual(await toggle.getAttribute("aria-checked"), previous);
  await page.getByRole("button", { name: /Upgrade to Pro/ }).click();
  await page.getByRole("alert").filter({ hasText: "Payments are not yet enabled" }).waitFor();
  await page.screenshot({ path: "artifacts/account-preview/account-settings.png", fullPage: true });
});

test("password change, logout, and new-password login work", async () => {
  await page.getByPlaceholder("Enter current password").fill(PASS);
  await page.getByPlaceholder("Min. 8 characters").fill(`${PASS}New`);
  await page.getByPlaceholder("Repeat new password").fill(`${PASS}New`);
  await page.getByRole("button", { name: "Update password" }).click();
  await page.getByText("Password changed successfully.").waitFor();
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("**/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[autocomplete="current-password"]').fill(`${PASS}New`);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/dashboard");
  await page.getByText("E2E Test Dataset", { exact: true }).waitFor();
});

test("disposable account can be deleted and no longer authenticates", async () => {
  await page.goto(`${BASE}/dashboard/settings`);
  await page.getByRole("button", { name: "Delete account", exact: true }).click();
  await page.getByPlaceholder("Your current password").fill(`${PASS}New`);
  await page.getByPlaceholder("delete my account").fill("delete my account");
  await page.getByRole("button", { name: "Permanently delete account" }).click();
  await page.waitForURL(BASE + "/");
  const res = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: `${PASS}New` }) });
  assert.equal(res.status, 401);
});

test("signed-in journey has no uncaught browser errors", () => {
  assert.deepEqual(pageErrors, []);
});
