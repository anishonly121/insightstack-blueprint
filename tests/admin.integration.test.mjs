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
const userEmail = `test+admin-${emailSeed}@example.com`;
const password = "Password123!";
const wrongPassword = "WrongPassword123!";
const name = "Admin Auth Test User";

let serverProcess = null;
let baseUrl = "";
let authCookie = null;

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

test("Non-admin user cannot access /api/admin/users and receives requestId", async () => {
  const res = await requestJson("/api/admin/users", {
    method: "GET",
    cookie: authCookie,
    headers: {
      "x-request-id": "admin-protect-req",
    },
  });

  assert.equal(res.status, 403);
  assert.equal(res.bodyJson?.error?.code, "FORBIDDEN");
  assert.ok(res.bodyJson?.error?.requestId);
  assert.ok(res.headers.get("x-request-id"));
});

test("Rate limiting triggers on repeated invalid login attempts", async () => {
  const headers = {
    "Content-Type": "application/json",
    "x-forwarded-for": "198.51.100.25",
  };

  let rateLimitedResponse = null;
  for (let i = 0; i < 12; i += 1) {
    const res = await requestJson("/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: userEmail, password: wrongPassword }),
    });
    if (res.status === 429) {
      rateLimitedResponse = res;
      break;
    }
  }

  assert.ok(rateLimitedResponse);
  assert.equal(rateLimitedResponse.status, 429);
  assert.equal(rateLimitedResponse.bodyJson?.error?.code, "RATE_LIMITED");
  assert.ok(rateLimitedResponse.headers.get("x-request-id"));
});

test("RequestId is echoed on successful /api/health response", async () => {
  const res = await requestJson("/api/health", {
    method: "GET",
    headers: {
      "x-request-id": "req-admin-test",
    },
  });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-request-id"), "req-admin-test");
});
