import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import process from "node:process";
import test, { after, before } from "node:test";
import { createHash, createHmac, randomBytes } from "node:crypto";
import pg from "pg";

const PORT_MIN = 3100;
const PORT_MAX = 3999;
const START_RETRIES = 5;
const START_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 500;
const require = createRequire(import.meta.url);
const nextBinPath = require.resolve("next/dist/bin/next");
const emailSeed = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const userEmail = `test+ci-${emailSeed}@example.com`;
const fakeEmail = `missing+ci-${emailSeed}@example.com`;
const password = "Password123!";
const name = "CI Test User";

let serverProcess = null;
let baseUrl = "";

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
        STRIPE_SECRET_KEY: "sk_test_local_webhook_verification_only",
        STRIPE_WEBHOOK_SECRET: "whsec_local_integration_only",
        STRIPE_PRO_PRICE_ID: "",
        CRON_SECRET: "",
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
});

after(async () => {
  await stopServer();
});

test("POST /api/auth/register with valid JSON returns 201 and token/user", async () => {
  const res = await requestJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: userEmail, password }),
  });

  assert.equal(res.status, 201);
  assert.ok(res.bodyJson?.token);
  assert.ok(res.bodyJson?.user);
  assert.equal(res.bodyJson?.user?.email, userEmail);
});

test("POST /api/auth/login with valid JSON returns 200 and token/user", async () => {
  const res = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, password }),
  });

  assert.equal(res.status, 200);
  assert.ok(res.bodyJson?.token);
  assert.ok(res.bodyJson?.user);
  assert.equal(res.bodyJson?.user?.email, userEmail);
});

test("GET /api/auth/me supports cookie-only auth", async () => {
  const loginRes = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, password }),
  });
  const cookie = parseCookie(loginRes.setCookie);

  assert.equal(loginRes.status, 200);
  assert.ok(cookie);

  const meRes = await requestJson("/api/auth/me", { cookie });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.bodyJson?.user?.email, userEmail);
});

test("POST /api/auth/logout clears cookie and /api/auth/me returns unauthorized afterwards", async () => {
  const loginRes = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, password }),
  });
  const cookie = parseCookie(loginRes.setCookie);

  assert.equal(loginRes.status, 200);
  assert.ok(cookie);

  const logoutRes = await requestJson("/api/auth/logout", {
    method: "POST",
    cookie,
  });
  assert.equal(logoutRes.status, 200);
  assert.deepEqual(logoutRes.bodyJson, { success: true });

  const clearedCookie = parseCookie(logoutRes.setCookie) ?? cookie;
  const meAfterLogout = await requestJson("/api/auth/me", { cookie: clearedCookie });
  assert.equal(meAfterLogout.status, 401);
  assert.equal(meAfterLogout.bodyJson?.error?.code, "UNAUTHORIZED");
});

test("POST /api/auth/login with malformed JSON returns 400 BAD_REQUEST", async () => {
  const res = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email":"test@example.com" \\}',
  });

  assert.equal(res.status, 400);
  assert.equal(res.bodyJson?.error?.code, "BAD_REQUEST");
  assert.equal(res.bodyJson?.error?.message, "Invalid JSON body");
});

test("POST /api/auth/login with wrong Content-Type returns 415 UNSUPPORTED_MEDIA_TYPE", async () => {
  const res = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ email: userEmail, password }),
  });

  assert.equal(res.status, 415);
  assert.equal(res.bodyJson?.error?.code, "UNSUPPORTED_MEDIA_TYPE");
  assert.equal(
    res.bodyJson?.error?.message,
    "Content-Type must be application/json",
  );
});

test("POST /api/auth/forgot-password does not enumerate users", async () => {
  const testIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const existingRes = await requestJson("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({ email: userEmail }),
  });
  const missingRes = await requestJson("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({ email: fakeEmail }),
  });

  assert.equal(existingRes.status, missingRes.status);
  assert.deepEqual(existingRes.bodyJson, missingRes.bodyJson);
});

test("billing rejects cross-origin cookie requests and fails clearly without providers", async () => {
  const login = await requestJson("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail, password }) });
  const cookie = parseCookie(login.setCookie);
  assert.ok(cookie);
  for (const path of ["/api/stripe/checkout", "/api/stripe/portal"]) {
    const blocked = await requestJson(path, { method: "POST", cookie, headers: { Origin: "https://untrusted.example" } });
    assert.equal(blocked.status, 403);
    const unavailable = await requestJson(path, { method: "POST", cookie, headers: { Origin: baseUrl } });
    assert.equal(unavailable.status, 503);
  }
});

test("scheduled mail fails closed without a configured secret", async () => {
  const res = await requestJson("/api/cron/weekly-digest");
  assert.equal(res.status, 503);
});

test("password reset can be consumed only once under concurrent requests", async () => {
  const connectionString = process.env.DATABASE_URL;
  assert.ok(connectionString);
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname), "Reset fixture requires an isolated local database");
  const db = new pg.Client({ connectionString });
  await db.connect();
  const rawToken = randomBytes(48).toString("hex");
  const hash = createHash("sha256").update(rawToken).digest("hex");
  try {
    await db.query('INSERT INTO "PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "createdAt") SELECT $1, id, $2, NOW() + INTERVAL \'30 minutes\', NOW() FROM "User" WHERE email = $3', [randomBytes(16).toString("hex"), hash, userEmail]);
    const results = await Promise.all([1, 2].map((index) => requestJson("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `203.0.113.${240 + index}` },
      body: JSON.stringify({ email: userEmail, token: rawToken, newPassword: `${password}Reset` }),
    })));
    assert.deepEqual(results.map((res) => res.status).sort(), [200, 400]);
    const login = await requestJson("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail, password: `${password}Reset` }) });
    assert.equal(login.status, 200);
  } finally { await db.end(); }
});

test("signed Stripe events update entitlement; forged events cannot", async () => {
  const connectionString = process.env.DATABASE_URL;
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(connectionString).hostname));
  const db = new pg.Client({ connectionString });
  await db.connect();
  const customer = `cus_test_${emailSeed}`;
  try {
    await db.query('UPDATE "User" SET "stripeCustomerId" = $1 WHERE email = $2', [customer, userEmail]);
    const event = { id: `evt_${emailSeed}`, type: "customer.subscription.updated", data: { object: { id: "sub_test_local", customer, status: "active", items: { data: [{ price: { id: "price_test_local" }, current_period_end: Math.floor(Date.now() / 1000) + 86400 }] } } } };
    const send = async (payload, valid) => {
      const body = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHmac("sha256", valid ? "whsec_local_integration_only" : "wrong").update(`${timestamp}.${body}`).digest("hex");
      return requestJson("/api/stripe/webhooks", { method: "POST", headers: { "stripe-signature": `t=${timestamp},v1=${signature}` }, body });
    };
    assert.equal((await send(event, false)).status, 400);
    assert.equal((await send(event, true)).status, 200);
    let row = (await db.query('SELECT "stripeSubscriptionStatus" FROM "User" WHERE email = $1', [userEmail])).rows[0];
    assert.equal(row.stripeSubscriptionStatus, "active");
    assert.equal((await send({ ...event, type: "customer.subscription.deleted" }, true)).status, 200);
    row = (await db.query('SELECT "stripeSubscriptionStatus" FROM "User" WHERE email = $1', [userEmail])).rows[0];
    assert.equal(row.stripeSubscriptionStatus, "canceled");
  } finally { await db.end(); }
});
