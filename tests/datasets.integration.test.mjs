import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import process from "node:process";
import test, { after, before } from "node:test";

const PORT_MIN = 3100;
const PORT_MAX = 3999;
const START_RETRIES = 5;
const START_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 500;
const require = createRequire(import.meta.url);
const nextBinPath = require.resolve("next/dist/bin/next");
const emailSeed = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const userEmail = `test+dataset-${emailSeed}@example.com`;
const password = "Password123!";
const name = "Dataset Test User";

let serverProcess = null;
let baseUrl = "";
let authCookie = null;
let datasetId = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tryReadJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseCookie = (setCookieHeader) => {
  if (!setCookieHeader) return null;
  const cookiePart = setCookieHeader.split(",")[0].split(";")[0]?.trim();
  return cookiePart || null;
};

const requestJson = async (path, { method = "GET", body, headers = {}, cookie } = {}) => {
  const requestHeaders = new Headers(headers);
  if (cookie) requestHeaders.set("Cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body,
  });
  const text = await response.text();
  return {
    status: response.status,
    bodyText: text,
    bodyJson: tryReadJson(text),
    setCookie: response.headers.get("set-cookie"),
    headers: response.headers,
  };
};

const requestForm = async (path, { method = "POST", formData, headers = {}, cookie } = {}) => {
  const requestHeaders = new Headers(headers);
  if (cookie) requestHeaders.set("Cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: formData,
  });
  const text = await response.text();
  return {
    status: response.status,
    bodyText: text,
    bodyJson: tryReadJson(text),
    headers: response.headers,
  };
};

const pickRandomPort = () => {
  return Math.floor(Math.random() * (PORT_MAX - PORT_MIN + 1)) + PORT_MIN;
};

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });

const findFreePort = async () => {
  for (let i = 0; i < 20; i += 1) {
    const candidate = pickRandomPort();
    if (await isPortFree(candidate)) {
      return candidate;
    }
  }
  throw new Error("Unable to find a free test port");
};

const waitForServer = async (url, proc) => {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    if (proc.exitCode !== null) {
      throw new Error(`Server exited before ready (exitCode=${proc.exitCode})`);
    }
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch {
      // ignore until timeout
    }
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error("Timed out waiting for test server to be ready");
};

const stopServer = async () => {
  if (!serverProcess || serverProcess.exitCode !== null) {
    serverProcess = null;
    return;
  }
  serverProcess.kill();
  try {
    await Promise.race([once(serverProcess, "exit"), delay(2_000)]);
  } finally {
    if (serverProcess.exitCode === null) {
      serverProcess.kill("SIGKILL");
      await Promise.race([once(serverProcess, "exit"), delay(1_000)]);
    }
    serverProcess = null;
  }
};

const startServerWithRetry = async () => {
  let lastError = null;
  for (let attempt = 1; attempt <= START_RETRIES; attempt += 1) {
    const port = await findFreePort();
    const url = `http://127.0.0.1:${port}`;
    const candidate = spawn(process.execPath, [nextBinPath, "start", "-p", `${port}`], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: `${port}`,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    candidate.stdout.on("data", () => {});
    candidate.stderr.on("data", () => {});

    try {
      await waitForServer(url, candidate);
      serverProcess = candidate;
      baseUrl = url;
      return;
    } catch (err) {
      lastError = err;
      if (candidate.exitCode === null) {
        candidate.kill();
        await Promise.race([once(candidate, "exit"), delay(1_000)]);
      }
    }
  }
  throw lastError ?? new Error("Failed to start server");
};

before(async () => {
  await startServerWithRetry();

  const registerRes = await requestJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: userEmail, password }),
  });
  assert.equal(registerRes.status, 201);

  const loginRes = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, password }),
  });
  assert.equal(loginRes.status, 200);
  authCookie = parseCookie(loginRes.setCookie);
  assert.ok(authCookie);
});

after(async () => {
  await stopServer();
});

test("GET /api/datasets requires authentication", async () => {
  const res = await requestJson("/api/datasets");
  assert.equal(res.status, 401);
  assert.equal(res.bodyJson?.error?.code, "UNAUTHORIZED");
});

test("POST /api/datasets creates dataset and echoes custom x-request-id", async () => {
  const res = await requestJson("/api/datasets", {
    method: "POST",
    cookie: authCookie,
    headers: {
      "Content-Type": "application/json",
      "x-request-id": "test-req-123",
    },
    body: JSON.stringify({ name: "Integration Dataset" }),
  });

  assert.equal(res.status, 201);
  assert.equal(res.headers.get("x-request-id"), "test-req-123");
  assert.ok(res.bodyJson?.data?.id);
  datasetId = res.bodyJson.data.id;
});

test("POST /api/datasets/[id]/upload parses CSV and persists rows", async () => {
  assert.ok(datasetId);

  const csv = [
    "date,description,category,amount",
    "2026-03-01,Grocery,Food,120.50",
    "2026-03-02,Taxi,Transport,34.25",
  ].join("\n");

  const formData = new FormData();
  formData.set("file", new File([csv], "sample.csv", { type: "text/csv" }));

  const res = await requestForm(`/api/datasets/${datasetId}/upload`, {
    method: "POST",
    cookie: authCookie,
    formData,
  });

  assert.equal(res.status, 200);
  assert.equal(res.bodyJson?.data?.status, "PARSED");
  assert.equal(res.bodyJson?.data?.rowCount, 2);
});

test("GET /api/datasets and GET /api/datasets/[id] return dataset data", async () => {
  assert.ok(datasetId);

  const listRes = await requestJson("/api/datasets", { cookie: authCookie });
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.bodyJson?.data));
  assert.ok(listRes.bodyJson.data.some((d) => d.id === datasetId));

  const detailRes = await requestJson(`/api/datasets/${datasetId}`, { cookie: authCookie });
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.bodyJson?.data?.id, datasetId);
});

test("GET /api/datasets/[id]/transactions returns parsed transactions", async () => {
  assert.ok(datasetId);

  const res = await requestJson(`/api/datasets/${datasetId}/transactions`, { cookie: authCookie });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.bodyJson?.data));
  assert.ok(res.bodyJson.data.length > 0);
});

test("POST /api/datasets/[id]/insights returns insight payload", async () => {
  assert.ok(datasetId);

  const res = await requestJson(`/api/datasets/${datasetId}/insights`, {
    method: "POST",
    cookie: authCookie,
  });

  assert.equal(res.status, 200);
  assert.ok(res.bodyJson?.data?.id);
  assert.ok(res.bodyJson?.data?.insightJson);
});

test("Error responses include error.requestId and x-request-id header", async () => {
  const res = await requestJson("/api/datasets", {
    method: "POST",
    cookie: authCookie,
    headers: {
      "Content-Type": "text/plain",
      "x-request-id": "test-error-req",
    },
    body: "not-json",
  });

  assert.equal(res.status, 415);
  assert.equal(res.headers.get("x-request-id"), "test-error-req");
  assert.equal(res.bodyJson?.error?.code, "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(res.bodyJson?.error?.requestId, "test-error-req");
});
