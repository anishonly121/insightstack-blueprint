import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const capture = process.env.CAPTURE_SCREENSHOTS === "1";
let browser;
let context;
let page;
const errors = [];

before(async () => {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  if (capture) await mkdir("artifacts/recruiter-preview", { recursive: true });
});
after(async () => {
  await browser?.close();
});
const screenshot = async (name) => {
  if (capture)
    await page.screenshot({
      path: `artifacts/recruiter-preview/${name}.png`,
      fullPage: true,
    });
};
const clickView = (name) =>
  page.getByRole("button", { name, exact: true }).click();

test("landing page exposes a working demo and product story", async () => {
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  await page
    .getByRole("heading", { name: "Your money. A clearer perspective." })
    .waitFor();
  await page.getByRole("link", { name: "Explore the live demo" }).click();
  await page.waitForURL(`${base}/demo`);
  await page.getByRole("heading", { name: "A clearer picture." }).waitFor();
  assert.equal(await page.locator(".metric-card").count(), 4);
  await screenshot("demo-desktop");
});

test("workspace and period changes recalculate the financial summary", async () => {
  const initial = await page.locator(".metric-grid").innerText();
  await page
    .getByRole("combobox", { name: "Sample workspace" })
    .selectOption("personal");
  assert.notEqual(await page.locator(".metric-grid").innerText(), initial);
  await page.getByRole("combobox", { name: "Date range" }).selectOption("3");
  assert.match(
    await page.locator(".data-context").innerText(),
    /37 sample transactions/,
  );
  await page.getByText("View chart data", { exact: true }).click();
  assert.equal(await page.locator(".chart-values tbody tr").count(), 3);
  await page
    .getByRole("combobox", { name: "Sample workspace" })
    .selectOption("studio");
  await page.getByRole("combobox", { name: "Date range" }).selectOption("6");
});

test("category drill-down, search, pagination, and empty-state recovery work", async () => {
  await page
    .getByRole("button", { name: "View Workspace transactions", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("combobox", { name: "Filter by category" })
      .inputValue(),
    "Workspace",
  );
  assert.equal(await page.locator(".transaction-table tbody tr").count(), 6);
  await page
    .getByRole("combobox", { name: "Filter by category" })
    .selectOption("all");
  await clickView("Next");
  assert.match(await page.locator(".table-pagination").innerText(), /Page 2/);
  await page
    .getByRole("textbox", { name: "Search transactions" })
    .fill("not-a-real-merchant");
  await page
    .getByRole("heading", { name: "No matching transactions" })
    .waitFor();
  await clickView("Clear filters");
  assert.equal(await page.locator(".transaction-table tbody tr").count(), 8);
  await page
    .getByRole("textbox", { name: "Search transactions" })
    .fill("Cloud");
  assert.equal(await page.locator(".transaction-table tbody tr").count(), 6);
  await screenshot("transactions");
});

test("CSV download contains only the filtered rows", async () => {
  const downloadPromise = page.waitForEvent("download");
  await clickView("Export CSV");
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  assert.equal(csv.split("\r\n").length, 7);
  assert.ok(csv.includes("Cloud infrastructure"));
  assert.ok(!csv.includes("Client retainer"));
});

test("intelligence answers questions and exposes its calculation method", async () => {
  await page.getByRole("button", { name: /^Intelligence/ }).click();
  await clickView("Where do I spend the most?");
  assert.match(await page.locator(".chat-answer").innerText(), /Workspace/);
  await page.getByText("How this analysis works", { exact: true }).click();
  assert.match(
    await page.locator(".method-details").innerText(),
    /not a large language model/,
  );
  await screenshot("intelligence");
});

test("savings planner recalculates and supports keyboard operation", async () => {
  await clickView("Savings planner");
  const slider = page.getByRole("slider");
  await slider.fill("0");
  assert.match(await page.locator(".planner-result h2").innerText(), /^\$0/);
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await slider.inputValue(), "1");
  await slider.fill("20");
  assert.ok(!/^\$0/.test(await page.locator(".planner-result h2").innerText()));
  await screenshot("savings-planner");
});

test("mobile demo retains usable navigation with no page-level horizontal overflow", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clickView("Overview");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await screenshot("demo-mobile");
  await clickView("Transactions");
  assert.ok(
    await page
      .getByRole("textbox", { name: "Search transactions" })
      .isVisible(),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Your money. A clearer perspective." })
    .waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await screenshot("landing-mobile");
  await page.setViewportSize({ width: 1440, height: 1080 });
  await screenshot("landing-desktop");
});

test("engineering and builder pages render and registration opens the correct form", async () => {
  await page.goto(`${base}/how-it-works`);
  await page.getByRole("heading", { name: /Every insight/ }).waitFor();
  assert.equal(await page.locator(".engineering-steps article").count(), 4);
  await screenshot("engineering");
  await page.goto(`${base}/about`);
  assert.match(
    await page.locator(".editorial-hero").innerText(),
    /Anish Bhole/,
  );
  await page.goto(`${base}/register`);
  await page.waitForURL(`${base}/login?mode=register`);
  await page.getByRole("textbox", { name: "Full name" }).waitFor();
  await page.getByLabel("Password", { exact: true }).fill("A-Test-Password123");
  await clickView("Show password");
  assert.equal(
    await page.getByLabel("Password", { exact: true }).getAttribute("type"),
    "text",
  );
  await clickView("Hide password");
  assert.equal(
    await page.getByLabel("Password", { exact: true }).getAttribute("type"),
    "password",
  );
  await screenshot("register");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await screenshot("register-mobile");
});

test("pricing presents only the supported billing period and directs guests to registration", async () => {
    await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto(`${base}/pricing`);
  assert.equal(
    await page.getByRole("button", { name: "Toggle billing period" }).count(),
    0,
  );
  await page
    .getByText("Monthly billing. Review the final terms in checkout.", {
      exact: true,
    })
    .waitFor();
    await page.getByText("How does the analysis work?", { exact: true }).click();
    await page.getByText(/No external language model is required/).waitFor();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await screenshot("pricing-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await screenshot("pricing-mobile");
    await page.setViewportSize({ width: 1440, height: 1080 });
    await page.getByRole("button", { name: /Start 14-day free trial/ }).click();
  await page.waitForURL(`${base}/login?mode=register`);
  await page.getByRole("textbox", { name: "Full name" }).waitFor();
});

  test("account recovery provides accessible forms and handles incomplete links", async () => {
    await page.goto(`${base}/forgot-password`);
    await page.getByRole("textbox", { name: "Email address" }).waitFor();
    await screenshot("account-recovery");
    await page.goto(`${base}/reset-password`);
    await page.getByRole("heading", { name: "This link is incomplete." }).waitFor();
    await page.getByRole("link", { name: "Request a new link" }).click();
    await page.waitForURL(`${base}/forgot-password`);
  });

  test("public product experience has no uncaught browser errors", () => {
  assert.deepEqual(errors, []);
});
