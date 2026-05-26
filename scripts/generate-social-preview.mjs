/**
 * Generates the GitHub social preview image for InsightStack.
 * Output: docs/social-preview.png (1280x640 — GitHub's recommended OG size)
 *
 * Usage: node scripts/generate-social-preview.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../docs/social-preview.png");
mkdirSync(join(__dirname, "../docs"), { recursive: true });

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  body {
    width: 1280px; height: 640px; overflow: hidden;
    background: #050B18;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #fff;
    display: flex; align-items: center;
    position: relative;
  }
  .bg-glow-1 {
    position: absolute; top: -120px; left: -80px;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .bg-glow-2 {
    position: absolute; bottom: -150px; right: -100px;
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .content {
    position: relative; z-index: 1;
    padding: 64px 80px;
    width: 100%;
    display: flex; gap: 64px; align-items: center;
  }
  .left { flex: 1; }
  .right {
    width: 340px; flex-shrink: 0;
    display: flex; flex-direction: column; gap: 14px;
  }
  .logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 28px;
  }
  .logo-mark {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 16px; color: white;
  }
  .logo-text { font-size: 20px; font-weight: 700; color: #fff; }
  .logo-text span { color: #60A5FA; }
  .headline {
    font-size: 46px; font-weight: 900; line-height: 1.1;
    color: #fff; margin-bottom: 16px;
    letter-spacing: -1px;
  }
  .headline em { color: #60A5FA; font-style: normal; }
  .sub {
    font-size: 17px; color: #71717A; line-height: 1.5;
    max-width: 520px; margin-bottom: 32px;
  }
  .pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    border-radius: 999px;
    padding: 5px 13px;
    font-size: 13px; font-weight: 600; color: #A1A1AA;
  }
  .pill.blue { border-color: rgba(59,130,246,0.3); color: #93C5FD; background: rgba(59,130,246,0.08); }
  .pill.violet { border-color: rgba(139,92,246,0.3); color: #C4B5FD; background: rgba(139,92,246,0.08); }
  .pill.emerald { border-color: rgba(16,185,129,0.3); color: #6EE7B7; background: rgba(16,185,129,0.08); }
  .stat-card {
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    border-radius: 16px;
    padding: 18px 22px;
  }
  .stat-number { font-size: 32px; font-weight: 900; color: #fff; line-height: 1; }
  .stat-number.blue { color: #60A5FA; }
  .stat-number.violet { color: #A78BFA; }
  .stat-number.emerald { color: #34D399; }
  .stat-label { font-size: 12px; color: #52525B; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .url { font-size: 13px; color: #3F3F46; margin-top: 4px; }
</style>
</head>
<body>
  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>
  <div class="content">
    <div class="left">
      <div class="logo">
        <div class="logo-mark">IS</div>
        <div class="logo-text">Insight<span>Stack</span></div>
      </div>
      <h1 class="headline">
        AI-Powered<br><em>Finance Analytics</em>
      </h1>
      <p class="sub">
        Upload CSV transactions → visualise spending → GPT-4o recommendations.<br>
        Built production-grade: auth, rate limiting, caching, audit log, no mocks.
      </p>
      <div class="pills">
        <span class="pill blue">Next.js 16</span>
        <span class="pill">TypeScript</span>
        <span class="pill violet">GPT-4o</span>
        <span class="pill">PostgreSQL</span>
        <span class="pill emerald">Playwright E2E</span>
        <span class="pill">Prisma ORM</span>
      </div>
      <div class="url" style="margin-top: 24px;">insightstack-peach.vercel.app</div>
    </div>
    <div class="right">
      <div class="stat-card">
        <div class="stat-number blue">29</div>
        <div class="stat-label">Integration tests — no mocks</div>
      </div>
      <div class="stat-card">
        <div class="stat-number violet">100%</div>
        <div class="stat-label">TypeScript · strict mode</div>
      </div>
      <div class="stat-card">
        <div class="stat-number emerald">&lt; 60s</div>
        <div class="stat-label">CSV upload to AI insight</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="font-size:22px; color:#A1A1AA;">MIT · Open source</div>
        <div class="stat-label">Built by Anish Bhole</div>
      </div>
    </div>
  </div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 640 } });
  const page = await ctx.newPage();

  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 640 } });
  writeFileSync(OUT, buf);

  await browser.close();
  console.log(`✓ Social preview saved to docs/social-preview.png`);
  console.log(`\nNext step:`);
  console.log(`  Go to https://github.com/anishonly121/insightstack-blueprint/settings`);
  console.log(`  Scroll to "Social preview" → Upload the file at docs/social-preview.png`);
})();
