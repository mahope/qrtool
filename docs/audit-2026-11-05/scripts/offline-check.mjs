// Service worker / offline behaviour of qrtool. Usage: QR_BASE=... node qrtool-offline.mjs <outFile>
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.QR_BASE || 'https://qrtool.dk';
const OUTF = process.argv[2] || 'offline.json';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'da-DK', acceptDownloads: true });
const page = await ctx.newPage();
const res = { reqsInstall: [], offline: {} };
const reqs = [];
page.on('request', (r) => reqs.push({ u: r.url().replace(BASE, ''), sw: !!r.serviceWorker() }));
page.on('response', async (r) => { try { reqs.at(-1) && 0; } catch (e) {} });

await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForTimeout(500);
const t0 = Date.now();
// wait for SW activation
const swState = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.ready;
  return reg.active ? reg.active.state : 'none';
});
res.swState = swState;
await page.waitForTimeout(4000);
const cacheInfo = await page.evaluate(async () => {
  const keys = await caches.keys();
  const out = {};
  for (const k of keys) { const c = await caches.open(k); const reqs = await c.keys(); out[k] = reqs.map((r) => r.url.replace(location.origin, '')); }
  return out;
});
res.caches = Object.fromEntries(Object.entries(cacheInfo).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 40) }]));
res.sw_fetches_during_install = reqs.filter((r) => r.sw).length;
res.total_requests_first_load_incl_sw = reqs.length;

// go offline
await ctx.setOffline(true);
const check = async (path, label) => {
  const out = { path };
  try {
    const r = await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 });
    out.status = r ? r.status() : null;
    out.title = (await page.title()).slice(0, 60);
    out.h1 = await page.evaluate(() => (document.querySelector('h1') || {}).textContent?.trim().slice(0, 60));
    out.fromSW = r ? r.fromServiceWorker() : null;
    // does generation still work?
    const hasInput = await page.$('#qrText, #wifiSSID, #vcardName');
    if (hasInput) {
      const sel = (await page.$('#qrText')) ? '#qrText' : (await page.$('#wifiSSID')) ? '#wifiSSID' : '#vcardName';
      await page.fill(sel, 'offline-test').catch(() => {});
      await page.waitForTimeout(1200);
      out.canvasOrSvg = await page.evaluate(() => !!document.querySelector('#qrPreview canvas, #qrPreview svg, #qrPreview img, canvas, #qrCode svg'));
    }
  } catch (e) {
    out.error = String(e).slice(0, 120);
  }
  res.offline[label] = out;
};
await check('/', 'index');
await check('/wifi-qr-kode', 'wifi');
await check('/scan-qr-kode', 'scan');
await check('/guides/', 'guides_index');
await check('/guides/qr-koder-til-restauranter', 'guide_article');
await check('/en/', 'en_index');
await check('/om-qr-tool', 'om');
await check('/cookiepolitik', 'cookiepolitik');
await check('/guides/visitkort-med-qr-kode', 'guide_visitkort');
await ctx.setOffline(false);

fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
await browser.close();
console.log('offline ok');
