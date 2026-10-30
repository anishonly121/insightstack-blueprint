import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const port = process.env.DEMO_TEST_PORT ?? "3100";
const url = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start", "--port", port],
  { stdio: "inherit" },
);
try {
  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      if ((await fetch(`${url}/demo`)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server is still starting. */
    }
    await delay(300);
  }
  if (!ready) throw new Error("Demo test server did not become ready");
  const child = spawn(process.execPath, ["--test", "tests/e2e/demo.test.mjs"], {
    stdio: "inherit",
    env: { ...process.env, BASE_URL: url },
  });
  process.exitCode = await new Promise((resolve, reject) => {
    child.once("exit", (code) => resolve(code ?? 1));
    child.once("error", reject);
  });
} finally {
  server.kill();
}
