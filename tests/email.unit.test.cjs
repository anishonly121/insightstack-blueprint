/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads TypeScript with ts-node. */
const test = require("node:test");
const assert = require("node:assert/strict");
require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS", moduleResolution: "Node" } });
const { passwordResetEmail } = require("../src/lib/email-content.ts");
const { sendBrevoEmail } = require("../src/lib/brevo.ts");

test("reset email preserves the reset URL and escapes untrusted HTML", () => {
  const link = "https://example.com/reset-password?token=abc&email=a%40example.com";
  const message = passwordResetEmail('<img src=x onerror="alert(1)">', link);
  assert.ok(!message.html.includes('<img'));
  assert.ok(message.html.includes('&lt;img'));
  assert.ok(message.html.includes('token=abc&amp;email='));
  assert.ok(message.text.includes(link));
  assert.ok(message.text.includes("30 minutes"));
  assert.throws(() => passwordResetEmail("Name", "javascript:alert(1)"), /INVALID_RESET_URL/);
});

test("Brevo sends the reset email without a hosted template", async () => {
  const message = { to: "recipient@example.com", ...passwordResetEmail("User", "https://example.com/reset-password?token=abc") };
  let calls = 0;
  await sendBrevoEmail({ apiKey: "test-secret", fromEmail: "sender@example.com" }, message, async (url, options) => {
    calls++;
    assert.equal(url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(options.headers["api-key"], "test-secret");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.sender, { email: "sender@example.com", name: "InsightStack" });
    assert.deepEqual(body.to, [{ email: "recipient@example.com" }]);
    assert.equal(body.htmlContent, message.html);
    assert.equal(body.textContent, message.text);
    assert.equal(body.templateId, undefined);
    assert.ok(options.signal);
    return new Response(JSON.stringify({ messageId: "test-message" }), { status: 201 });
  });
  assert.equal(calls, 1);
});

test("Brevo rejection surfaces failure without leaking provider content or retrying", async () => {
  let calls = 0;
  await assert.rejects(sendBrevoEmail({ apiKey: "secret", fromEmail: "sender@example.com" },
    { to: "recipient@example.com", subject: "Reset", html: "private-token", text: "private-token" }, async () => {
      calls++;
      return new Response("private-token recipient@example.com secret", { status: 429 });
    }), { message: "EMAIL_SEND_FAILED_429" });
  assert.equal(calls, 1);
});
