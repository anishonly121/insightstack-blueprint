/**
 * Integration tests for:
 *   GET /api/datasets/:id/metrics   — MetricSnapshot computation + caching
 *   GET /api/datasets/:id/transactions?search=&category=&page=  — filtered transactions
 *   POST /api/datasets/:id/insights  — AI insights (stubbed via OPENAI_API_KEY=test)
 *   PATCH /api/datasets/:id          — rename dataset
 *   DELETE /api/datasets/:id         — delete dataset (user-owned)
 *
 * Requires a running PostgreSQL instance pointed to by DATABASE_URL.
 * Run: npm test
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import process from "node:process";
import test, { after, before } from "node:test";

const PORT_MIN = 3200;
const PORT_MAX = 3899;
const START_RETRIES = 5;
const START_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 500;

const require = createRequire(import.meta.url);
const nextBinPath = require.resolve("next/dist/bin/next");

const seed = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const userEmail = `test+metrics-${seed}@example.com`;
const password = "Password123!";
const name = "Metrics Test User";

let serverProcess = null;
let baseUrl = "";
let authToken = "";
let datasetId = "";

// ─── helpers ────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const tryJson = (t) => { try { return JSON.parse(t); } catch { return null; } };

const req = async (path, { method = "GET", body, token, contentType } = {}) => {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (contentType) headers.set("Content-Type", contentType);
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
  const text = await res.text();
  return { status: res.status, body: tryJson(text) };
};

const reqForm = async (path, { method = "POST", formData, token } = {}) => {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: formData });
  const text = await res.text();
  return { status: res.status, body: tryJson(text) };
};

// ─── CSV fixture ─────────────────────────────────────────────────────────────

const CSV = [
  "date,description,category,amount",
  "2026-01-05,McDonalds,Food,-9.50",
  "2026-01-10,Salary,Income,1200.00",
  "2026-01-15,Electricity bill,Utilities,-80.00",
  "2026-01-20,Netflix,Entertainment,-15.99",
  "2026-01-22,Groceries,Food,-55.20",
  "2026-02-01,Freelance payment,Income,450.00",
  "2026-02-10,Phone bill,Utilities,-25.00",
  "2026-02-15,Coffee shop,Food,-4.80",
].join("\n");

// ─── server lifecycle ────────────────────────────────────────────────────────

const isPortFree = (port) =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.listen(port, "127.0.0.1", () => s.close(() => resolve(true)));
  });

const findFreePort = async () => {
  for (let i = 0; i < 20; i++) {
    const p = PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN + 1));
    if (await isPortFree(p)) return p;
  }
  throw new Error("No free port found");
};

const waitForServer = async (url, proc) => {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) throw new Error(`Server exited early (code=${proc.exitCode})`);
    try {
      const r = await fetch(`${url}/api/health`);
      if (r.ok) return;
    } catch { /* ignore */ }
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error("Server did not become ready in time");
};

const startServer = async () => {
  let lastErr;
  for (let attempt = 1; attempt <= START_RETRIES; attempt++) {
    const port = await findFreePort();
    const url = `http://127.0.0.1:${port}`;
    const proc = spawn(process.execPath, [nextBinPath, "start", "-p", `${port}`], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: `${port}`, OPENAI_API_KEY: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.stdout.on("data", () => {});
    proc.stderr.on("data", () => {});
    try {
      await waitForServer(url, proc);
      serverProcess = proc;
      baseUrl = url;
      return;
    } catch (err) {
      lastErr = err;
      if (proc.exitCode === null) {
        proc.kill();
        await Promise.race([once(proc, "exit"), delay(1_000)]);
      }
    }
  }
  throw lastErr ?? new Error("Failed to start server");
};

const stopServer = async () => {
  if (!serverProcess || serverProcess.exitCode !== null) { serverProcess = null; return; }
  serverProcess.kill();
  await Promise.race([once(serverProcess, "exit"), delay(2_000)]);
  serverProcess = null;
};

// ─── setup ───────────────────────────────────────────────────────────────────

before(async () => {
  await startServer();

  // Register + login to get a Bearer token
  const regRes = await req("/api/auth/register", {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ name, email: userEmail, password }),
  });
  assert.equal(regRes.status, 201, "Registration should succeed");
  authToken = regRes.body?.token;
  assert.ok(authToken, "Token should be returned after registration");

  // Create a dataset
  const dsRes = await req("/api/datasets", {
    method: "POST",
    contentType: "application/json",
    token: authToken,
    body: JSON.stringify({ name: "Metrics Test Dataset" }),
  });
  assert.equal(dsRes.status, 201, "Dataset creation should succeed");
  datasetId = dsRes.body?.data?.id;
  assert.ok(datasetId, "Dataset ID should be returned");

  // Upload CSV
  const form = new FormData();
  form.append("file", new File([CSV], "test.csv", { type: "text/csv" }));
  const uploadRes = await reqForm(`/api/datasets/${datasetId}/upload`, {
    token: authToken,
    formData: form,
  });
  assert.equal(uploadRes.status, 200, "CSV upload should succeed");
  assert.equal(uploadRes.body?.data?.status, "PARSED", "Dataset should be PARSED after upload");
});

after(async () => {
  await stopServer();
});

// ─── metrics tests ───────────────────────────────────────────────────────────

test("GET /api/datasets/:id/metrics returns computed MetricSnapshot", async () => {
  const res = await req(`/api/datasets/${datasetId}/metrics`, { token: authToken });
  assert.equal(res.status, 200);

  const m = res.body?.data?.metricsJson;
  assert.ok(m, "metricsJson should be present");
  assert.ok(typeof m.totalIncome === "number", "totalIncome should be a number");
  assert.ok(typeof m.totalExpenses === "number", "totalExpenses should be a number");
  assert.ok(typeof m.netSavings === "number", "netSavings should be a number");
  assert.ok(typeof m.savingsRate === "number", "savingsRate should be a number");
  assert.ok(Array.isArray(m.topCategories), "topCategories should be an array");
  assert.ok(Array.isArray(m.monthlyBreakdown), "monthlyBreakdown should be an array");

  // Sanity check values against our CSV fixture
  assert.ok(m.totalIncome > 0, "totalIncome should be positive");
  assert.ok(m.totalExpenses > 0, "totalExpenses should be positive");
  assert.ok(m.monthlyBreakdown.length >= 2, "Should have at least 2 months of data");
});

test("GET /api/datasets/:id/metrics uses cache on second call", async () => {
  const r1 = await req(`/api/datasets/${datasetId}/metrics`, { token: authToken });
  const r2 = await req(`/api/datasets/${datasetId}/metrics`, { token: authToken });
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  // Second call should return cached=true
  assert.equal(r2.body?.data?.cached, true, "Second call should be served from cache");
});

test("GET /api/datasets/:id/metrics returns 401 without auth", async () => {
  const res = await req(`/api/datasets/${datasetId}/metrics`);
  assert.equal(res.status, 401);
});

// ─── transaction filter tests ─────────────────────────────────────────────────

test("GET /api/datasets/:id/transactions returns paginated results", async () => {
  const res = await req(`/api/datasets/${datasetId}/transactions?page=1&pageSize=3`, {
    token: authToken,
  });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body?.data), "data should be an array");
  assert.equal(res.body?.data?.length, 3, "Should return exactly pageSize items");
  assert.ok(res.body?.meta?.total > 0, "Total should be > 0");
  assert.ok(Array.isArray(res.body?.categories), "categories should be an array");
});

test("GET /api/datasets/:id/transactions filters by category", async () => {
  const res = await req(`/api/datasets/${datasetId}/transactions?category=Food`, {
    token: authToken,
  });
  assert.equal(res.status, 200);
  const rows = res.body?.data ?? [];
  assert.ok(rows.length > 0, "Should find Food transactions");
  for (const tx of rows) {
    assert.match(tx.category.toLowerCase(), /food/i, "All returned rows should be Food category");
  }
});

test("GET /api/datasets/:id/transactions searches by description", async () => {
  const res = await req(`/api/datasets/${datasetId}/transactions?search=salary`, {
    token: authToken,
  });
  assert.equal(res.status, 200);
  const rows = res.body?.data ?? [];
  assert.ok(rows.length > 0, "Should find Salary transaction");
  assert.match(rows[0].description.toLowerCase(), /salary/i);
});

test("GET /api/datasets/:id/transactions returns 401 without auth", async () => {
  const res = await req(`/api/datasets/${datasetId}/transactions`);
  assert.equal(res.status, 401);
});

// ─── insights tests (OpenAI stubbed) ─────────────────────────────────────────

test("POST /api/datasets/:id/insights generates fallback insight when OpenAI stubbed", async () => {
  const res = await req(`/api/datasets/${datasetId}/insights`, {
    method: "POST",
    token: authToken,
  });
  assert.equal(res.status, 200, "Insight generation should succeed");

  const insight = res.body?.data;
  assert.ok(insight?.id, "Insight should have an id");
  assert.ok(typeof insight?.insightText === "string" && insight.insightText.length > 0,
    "insightText should be a non-empty string");
  assert.ok(insight?.insightJson, "insightJson should be present");
  assert.ok(typeof insight?.insightJson?.summary === "string", "summary should be a string");
  assert.ok(Array.isArray(insight?.insightJson?.topSpendingCategories),
    "topSpendingCategories should be an array");
  assert.ok(Array.isArray(insight?.insightJson?.recommendations),
    "recommendations should be an array");
  assert.equal(insight?.insightJson?.recommendations?.length, 3,
    "Should return exactly 3 recommendations");
});

test("GET /api/datasets/:id/insights lists saved insights", async () => {
  const res = await req(`/api/datasets/${datasetId}/insights`, { token: authToken });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body?.data), "data should be an array");
  assert.ok(res.body?.data?.length >= 1, "At least one insight should exist");
  assert.ok(res.body?.meta?.total >= 1, "Total should reflect saved insights");
});

// ─── rename tests ─────────────────────────────────────────────────────────────

test("PATCH /api/datasets/:id renames the dataset", async () => {
  const newName = "Renamed Dataset";
  const res = await req(`/api/datasets/${datasetId}`, {
    method: "PATCH",
    contentType: "application/json",
    token: authToken,
    body: JSON.stringify({ name: newName }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.body?.data?.name, newName, "Name should be updated");
});

test("PATCH /api/datasets/:id returns 400 for empty name", async () => {
  const res = await req(`/api/datasets/${datasetId}`, {
    method: "PATCH",
    contentType: "application/json",
    token: authToken,
    body: JSON.stringify({ name: "" }),
  });
  assert.equal(res.status, 400);
  assert.equal(res.body?.error?.code, "VALIDATION_ERROR");
});

// ─── delete tests ─────────────────────────────────────────────────────────────

test("DELETE /api/datasets/:id removes the dataset", async () => {
  // Create a fresh dataset to delete so we don't break other tests
  const dsRes = await req("/api/datasets", {
    method: "POST",
    contentType: "application/json",
    token: authToken,
    body: JSON.stringify({ name: "To be deleted" }),
  });
  assert.equal(dsRes.status, 201);
  const idToDelete = dsRes.body?.data?.id;
  assert.ok(idToDelete);

  const delRes = await req(`/api/datasets/${idToDelete}`, {
    method: "DELETE",
    token: authToken,
  });
  assert.equal(delRes.status, 200);
  assert.equal(delRes.body?.data?.id, idToDelete);

  // Verify it's gone
  const getRes = await req(`/api/datasets/${idToDelete}`, { token: authToken });
  assert.equal(getRes.status, 404);
});
