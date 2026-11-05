// Main-thread cost of QR generation + JS coverage on qrtool index. Usage: QR_BASE=... node qrtool-perf.mjs <outFile>
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.QR_BASE || 'https://qrtool.dk';
const OUTF = process.argv[2] || 'perf.json';
const browser = await chromium.launch();
const result = {};

async function mk(cpuSlow = 1) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, locale: 'da-DK', acceptDownloads: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ s: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    localStorage.setItem('onboarding-done', '1');
  });
  if (cpuSlow > 1) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuSlow });
  }
  return { ctx, page };
}

// 1. JS coverage on first load (4x CPU slowdown ~ mid-range phone)
{
  const { ctx, page } = await mk(4);
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const cov = await page.coverage.stopJSCoverage();
  result.coverage = cov
    .filter((c) => c.url.startsWith(BASE))
    .map((c) => {
      let used = 0;
      for (const f of c.functions) for (const r of f.ranges) if (r.count > 0) used += r.endOffset - r.startOffset;
      // rough: use precise ranges union
      const total = (c.source || '').length;
      const ranges = [];
      for (const f of c.functions) for (const r of f.ranges) ranges.push([r.startOffset, r.endOffset, r.count]);
      const mark = new Uint8Array(total);
      for (const [s, e, n] of ranges.sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]) ).reverse()) for (let i = s; i < e && i < total; i++) mark[i] = n > 0 ? 1 : 0;
      let u = 0; for (let i = 0; i < total; i++) u += mark[i];
      return { url: c.url.replace(BASE, '').slice(0, 60), total, used: u, pct: total ? Math.round((u / total) * 100) : 0 };
    });
  result.longTasksColdLoad4x = await page.evaluate(() => window.__lt);
  await ctx.close();
}

// 2. typing latency / long tasks at several sizes (4x CPU slowdown)
result.typing = {};
for (const size of ['256', '512', '1024', '2048']) {
  const { ctx, page } = await mk(4);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.selectOption('#qrSize', size).catch(() => {});
  await page.evaluate(() => { window.__lt.length = 0; });
  const t0 = Date.now();
  await page.click('#qrText').catch(() => {});
  await page.keyboard.type('https://qrtool.dk/audit-typing-test-1234567890', { delay: 40 });
  await page.waitForTimeout(1500);
  const lt = await page.evaluate(() => window.__lt);
  result.typing[size] = { n: lt.length, max: Math.max(0, ...lt.map((x) => x.d)), sum: lt.reduce((a, x) => a + x.d, 0), wallMs: Date.now() - t0 };
  await ctx.close();
}

// 3. batch of N lines -> ZIP download (no CPU throttle, then 4x)
result.batch = {};
for (const [n, slow] of [[50, 1], [200, 1], [50, 4]]) {
  const { ctx, page } = await mk(slow);
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const lines = Array.from({ length: n }, (_, i) => `https://qrtool.dk/batch/${i}`).join('\n');
  await page.evaluate((v) => { const el = document.getElementById('batchInput'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, lines);
  await page.evaluate(() => { window.__lt.length = 0; });
  const t0 = Date.now();
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 120000 }),
      page.evaluate(() => document.getElementById('batchGenerateBtn').click()),
    ]);
    const p = await dl.path();
    const size = p ? fs.statSync(p).size : null;
    const lt = await page.evaluate(() => window.__lt);
    result.batch[`${n}@${slow}x`] = { ms: Date.now() - t0, zipBytes: size, longTasks: lt.length, maxLongTask: Math.max(0, ...lt.map((x) => x.d)), sumLongTask: lt.reduce((a, x) => a + x.d, 0) };
  } catch (e) {
    result.batch[`${n}@${slow}x`] = { error: String(e).slice(0, 120), ms: Date.now() - t0 };
  }
  await ctx.close();
}

fs.writeFileSync(OUTF, JSON.stringify(result, null, 1));
await browser.close();
console.log('perf ok');
