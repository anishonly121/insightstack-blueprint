/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads TypeScript with ts-node. */
const test = require("node:test");
const assert = require("node:assert/strict");
require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS", moduleResolution: "Node" } });
const { passwordResetEmail } = require("../src/lib/email-content.ts");
const { sendBrevoEmail } = require("../src/lib/brevo.ts");

test("budget alerts and weekly digests use shared delivery and escape uploaded names", async () => {
  const Module = require("node:module");
  const originalLoad = Module._load;
  const messages = [];
  let sendBudgetAlertEmail, sendWeeklyDigest;
  try {
    Module._load = function (id, ...args) {
      if (id === "server-only") return {};
      if (id === "@/lib/mail") return { sendEmail: async (message) => messages.push(message) };
      if (id === "@/lib/email-content") return require("../src/lib/email-content.ts");
      return originalLoad.call(this, id, ...args);
    };
    ({ sendBudgetAlertEmail } = require("../src/lib/alerts.ts"));
    ({ sendWeeklyDigest } = require("../src/lib/digest.ts"));
  } finally { Module._load = originalLoad; }
  const shared = {to:"recipient@example.com",name:'<img src=x>',datasetName:'<script>dataset</script>',dashboardUrl:'https://example.com'};
  await sendBudgetAlertEmail({...shared, alerts:[{category:'<b>Food</b>',spent:90,limit:100,pct:90}]});
  await sendWeeklyDigest({...shared,month:'November 2026',totalIncome:100,totalExpenses:90,netSavings:10,savingsRate:10,transactionCount:2,topCategories:[{category:'<b>Food</b>',total:90,count:1}],overBudget:[],topRecommendation:null});
  assert.equal(messages.length,2);
  for(const message of messages) {
    assert.equal(message.to,shared.to);
    assert.ok(!message.html.includes('<img src=x>'));
    assert.ok(!message.html.includes('<script>'));
    assert.ok(!message.html.includes('<b>Food</b>'));
    assert.ok(message.html.includes('&lt;b&gt;Food&lt;/b&gt;'));
    assert.ok(message.text.includes('<b>Food</b>'));
  }
});

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
