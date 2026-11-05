// qrtool.dk responsive audit. Usage: node qrtool-audit.mjs sweep|states [outDir]
// sweep: metrics for all sitemap URLs x viewports (no screenshots)
// states: screenshots + metrics for representative pages and UI states
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2] || 'sweep';
const OUT = process.argv[3] || '/home/mads/dev/data/audit-2026-11-05/qrtool';
const BASE = process.env.QR_BASE || 'https://qrtool.dk';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 320, h: 640, m: true, n: '320' },
  { w: 360, h: 740, m: true, n: '360' },
  { w: 390, h: 844, m: true, n: '390' },
  { w: 430, h: 932, m: true, n: '430' },
  { w: 768, h: 1024, m: true, n: '768' },
  { w: 1024, h: 768, m: false, n: '1024' },
  { w: 1440, h: 900, m: false, n: '1440' },
  { w: 844, h: 390, m: true, n: '844land' },
  { w: 667, h: 375, m: true, n: '667land' },
];

const urls = fs.readFileSync(path.join(OUT, 'urls.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean).map((u) => u.replace('https://qrtool.dk', BASE));
urls.push(BASE + '/404-findes-ikke');

const INIT = () => {
  window.__cls = 0; window.__lcp = 0; window.__shifts = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.hadRecentInput) {
          window.__cls += e.value;
          window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 2).map((s) => (s.node && (s.node.id || s.node.className || s.node.nodeName)) + '') });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = Math.round(e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
};

const METRICS = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const de = document.documentElement;
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const hiddenByAncestor = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    }
    return false;
  };
  const clippedX = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' && p !== document.body) return true;
    }
    return false;
  };
  const all = [...document.body.querySelectorAll('*')];
  const offenders = [];
  for (const el of all) {
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE', 'HEAD'].includes(el.tagName)) continue;
    if (!visible(el) || hiddenByAncestor(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && !clippedX(el)) offenders.push({ s: sel(el), right: Math.round(r.right), w: Math.round(r.width) });
  }
  offenders.sort((a, b) => b.right - a.right);

  const tapSel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=switch]';
  const small = [], tiny = [];
  let tapTotal = 0;
  for (const el of document.querySelectorAll(tapSel)) {
    if (!visible(el) || hiddenByAncestor(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 2 && r.height <= 2) continue; // visually hidden
    if (r.bottom < 0 || r.top > 1e6) continue;
    tapTotal++;
    const cs = getComputedStyle(el);
    const inline = el.tagName === 'A' && cs.display === 'inline';
    if (inline) continue;
    if (r.width < 44 || r.height < 44) small.push({ s: sel(el), w: Math.round(r.width), h: Math.round(r.height), t: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().slice(0, 24) });
    if (r.width < 24 || r.height < 24) tiny.push({ s: sel(el), w: Math.round(r.width), h: Math.round(r.height) });
  }

  const smallInputs = [];
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]),select,textarea')) {
    if (!visible(el) || hiddenByAncestor(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 2) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) smallInputs.push({ s: sel(el), fs });
  }

  const fixed = [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if ((cs.position === 'fixed' || cs.position === 'sticky') && visible(el) && !hiddenByAncestor(el)) {
      const r = el.getBoundingClientRect();
      if (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) continue;
      fixed.push({ s: sel(el), pos: cs.position, top: Math.round(r.top), bottom: Math.round(vh - r.bottom), w: Math.round(r.width), h: Math.round(r.height), vhShare: +(r.height / vh).toFixed(2), wShare: +(r.width / vw).toFixed(2) });
    }
  }

  const clipped = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if ((cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && (el.textContent || '').trim().length > 0 && el.children.length < 3)
      clipped.push({ s: sel(el), sw: el.scrollWidth, cw: el.clientWidth, t: el.textContent.trim().slice(0, 30) });
  }

  const tiny_text = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (!own.length) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) tiny_text.push({ s: sel(el), fs, t: own[0].textContent.trim().slice(0, 24) });
  }

  const res = performance.getEntriesByType('resource');
  const sum = (f) => res.filter(f).reduce((a, e) => a + (e.transferSize || 0), 0);
  const nav = performance.getEntriesByType('navigation')[0];
  const meta = document.querySelector('meta[name=viewport]');
  return {
    vw, vh, docW: de.scrollWidth, bodyW: document.body.scrollWidth, docH: de.scrollHeight,
    hScroll: de.scrollWidth > vw + 0, overflowPx: de.scrollWidth - vw,
    offenders: offenders.slice(0, 8), offenderCount: offenders.length,
    tapTotal, smallCount: small.length, small: small.slice(0, 14), tinyCount: tiny.length, tiny: tiny.slice(0, 6),
    smallInputCount: smallInputs.length, smallInputs: smallInputs.slice(0, 10),
    fixed, clipped: clipped.slice(0, 8), tinyText: tiny_text.slice(0, 8), tinyTextCount: tiny_text.length,
    cls: +(window.__cls || 0).toFixed(4), shifts: (window.__shifts || []).slice(0, 5), lcp: window.__lcp || 0,
    viewportMeta: meta ? meta.content : null,
    res: { count: res.length, js: sum((e) => e.initiatorType === 'script'), css: sum((e) => e.initiatorType === 'link' || e.initiatorType === 'css'), img: sum((e) => e.initiatorType === 'img'), total: sum(() => true) },
    nav: nav ? { ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) } : null,
  };
};

async function newCtx(browser, vp, extra = {}) {
  return browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.m ? 2 : 1,
    isMobile: !!extra.mobileEmu, hasTouch: vp.m,
    locale: 'da-DK', timezoneId: 'Europe/Copenhagen',
    userAgent: vp.m ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' : undefined,
    ...extra,
  });
}

async function openPage(ctx, url) {
  const page = await ctx.newPage();
  const logs = { console: [], failed: [] };
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.console.push(m.type() + ': ' + m.text().slice(0, 160)); });
  page.on('pageerror', (e) => logs.console.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('requestfailed', (r) => logs.failed.push(r.url().slice(0, 100) + ' ' + (r.failure() && r.failure().errorText)));
  await page.addInitScript(INIT);
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(1500);
  return { page, logs };
}

const slug = (u) => (u.replace(BASE, '').replace(/^\//, '').replace(/\/$/, '') || 'index').replace(/[^a-z0-9]+/gi, '_');

async function mobilefit(browser) {
  const out = fs.createWriteStream(path.join(OUT, "mobilefit.jsonl"));
  for (const vp of VIEWPORTS.filter((v) => v.m)) {
    const ctx = await newCtx(browser, vp, { mobileEmu: true });
    for (const u of urls) {
      try {
        const { page } = await openPage(ctx, u);
        const m = await page.evaluate(() => ({ iw: window.innerWidth, dw: document.documentElement.scrollWidth }));
        out.write(JSON.stringify({ url: u, vp: vp.n, nominal: vp.w, ...m }) + '\n');
        await page.close();
      } catch (e) { out.write(JSON.stringify({ url: u, vp: vp.n, error: String(e).slice(0, 100) }) + '\n'); }
    }
    await ctx.close();
  }
  out.end();
}

async function sweep(browser) {
  const out = fs.createWriteStream(path.join(OUT, 'sweep.jsonl'));
  for (const vp of VIEWPORTS) {
    const ctx = await newCtx(browser, vp);
    for (const u of urls) {
      try {
        const { page, logs } = await openPage(ctx, u);
        const m = await page.evaluate(METRICS);
        out.write(JSON.stringify({ url: u, vp: vp.n, ...m, console: logs.console.slice(0, 4), failed: logs.failed.slice(0, 4) }) + '\n');
        await page.close();
      } catch (e) {
        out.write(JSON.stringify({ url: u, vp: vp.n, error: String(e).slice(0, 200) }) + '\n');
      }
    }
    await ctx.close();
    console.log('sweep done', vp.n);
  }
  out.end();
}

async function shot(page, name, full = true) {
  const f = path.join(OUT, 'shots', name + '.jpg');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  await page.screenshot({ path: f, type: 'jpeg', quality: 72, fullPage: full });
}

async function states(browser) {
  const out = fs.createWriteStream(path.join(OUT, 'states.jsonl'));
  const rec = async (page, key, vp, extra = {}) => {
    const m = await page.evaluate(METRICS);
    out.write(JSON.stringify({ key, vp: vp.n, ...m, ...extra }) + '\n');
    return m;
  };
  const stateVps = VIEWPORTS;
  for (const vp of stateVps) {
    // 1. index: first visit (fresh context), filled, result
    let ctx = await newCtx(browser, vp);
    let { page, logs } = await openPage(ctx, BASE + '/');
    await shot(page, `index_${vp.n}_01-first-visit-viewport`, false);
    await rec(page, 'index:first-visit', vp, { console: logs.console.slice(0, 5), failed: logs.failed.slice(0, 5) });
    await shot(page, `index_${vp.n}_02-first-visit-full`, true);
    // dismiss any tour/modal
    const dismissed = await page.evaluate(() => {
      const c = [...document.querySelectorAll('button')].filter((b) => /spring over|skip|luk|close|forstået|ok|færdig|start/i.test(b.textContent || '') && b.offsetParent !== null);
      return c.map((b) => b.textContent.trim().slice(0, 20));
    });
    out.write(JSON.stringify({ key: 'index:dismiss-candidates', vp: vp.n, dismissed }) + '\n');
    await page.evaluate(() => { try { localStorage.setItem('qrtool-onboarded', '1'); localStorage.setItem('onboardingDone', 'true'); } catch (e) {} });
    // fill text
    await page.fill('#qrText', 'https://qrtool.dk/test-audit').catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, `index_${vp.n}_03-filled-viewport`, false);
    await rec(page, 'index:filled', vp);
    await shot(page, `index_${vp.n}_04-filled-full`, true);
    // result area into view
    await page.evaluate(() => { const c = document.querySelector('#qrCode canvas, #qrPreview canvas, canvas'); if (c) c.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(300);
    await shot(page, `index_${vp.n}_05-result-in-view`, false);
    await rec(page, 'index:result-in-view', vp);
    // tabs: wifi, payment
    for (const tab of ['wifi', 'vcard', 'payment']) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const btn = await page.$(`.tab-button[data-tab="${tab}"]`);
      if (btn) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(600);
        if (['390', '1440', '320'].includes(vp.n)) await shot(page, `index_${vp.n}_06-tab-${tab}`, false);
        await rec(page, 'index:tab-' + tab, vp);
      }
    }
    // menu (mobile)
    await page.evaluate(() => window.scrollTo(0, 0));
    const mt = await page.$('#menuToggle');
    if (mt && (await mt.isVisible())) {
      await mt.click().catch(() => {});
      await page.waitForTimeout(500);
      await shot(page, `index_${vp.n}_07-menu-open`, false);
      await rec(page, 'index:menu-open', vp);
      const mc = await page.$('#menuClose');
      if (mc) await mc.click().catch(() => {});
      await page.waitForTimeout(300);
    }
    // dark theme
    const tt = await page.$('#themeToggle');
    if (tt && (await tt.isVisible())) {
      await tt.click().catch(() => {});
      await page.waitForTimeout(500);
      if (['390', '1440'].includes(vp.n)) { await shot(page, `index_${vp.n}_08-theme-toggled-viewport`, false); await shot(page, `index_${vp.n}_09-theme-toggled-full`, true); }
      await rec(page, 'index:theme-toggled', vp);
    }
    // print
    if (['390', '1440', '768'].includes(vp.n)) {
      await page.fill('#qrText', 'https://qrtool.dk/test-audit').catch(() => {});
      await page.waitForTimeout(800);
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(300);
      const m = await rec(page, 'index:print-media', vp);
      const pdf = await page.pdf({ format: 'A4', printBackground: true }).catch(() => null);
      if (pdf) fs.writeFileSync(path.join(OUT, `index_${vp.n}_print.pdf`), pdf);
      await page.emulateMedia({ media: 'screen' });
    }
    await ctx.close();

    // 2. other pages: first view + filled
    const pages = ['/wifi-qr-kode', '/scan-qr-kode', '/guides/', '/guides/qr-koder-til-restauranter', '/om-qr-tool', '/404-findes-ikke', '/en/', '/privatlivspolitik'];
    for (const p of pages) {
      ctx = await newCtx(browser, vp);
      try {
        const r = await openPage(ctx, BASE + p);
        const sl = slug(BASE + p);
        if (['320', '390', '768', '1440', '844land'].includes(vp.n)) {
          await shot(r.page, `${sl}_${vp.n}_01-viewport`, false);
          if (['390', '1440'].includes(vp.n)) await shot(r.page, `${sl}_${vp.n}_02-full`, true);
        }
        await rec(r.page, sl + ':first', vp, { console: r.logs.console.slice(0, 4), failed: r.logs.failed.slice(0, 4) });
        if (p === '/wifi-qr-kode') {
          await r.page.fill('#wifiSSID', 'Gaestenet').catch(() => {});
          await r.page.fill('#wifiPassword', 'hemmeligt-kodeord').catch(() => {});
          await r.page.waitForTimeout(1200);
          if (['320', '390', '1440'].includes(vp.n)) await shot(r.page, `${sl}_${vp.n}_03-filled`, true);
          await rec(r.page, sl + ':filled', vp);
        }
      } catch (e) {
        out.write(JSON.stringify({ key: p, vp: vp.n, error: String(e).slice(0, 200) }) + '\n');
      }
      await ctx.close();
    }
    console.log('states done', vp.n);
  }
  out.end();
}

const browser = await chromium.launch();
if (MODE === 'mobilefit') await mobilefit(browser);
else if (MODE === 'sweep') await sweep(browser);
else await states(browser);
await browser.close();
console.log('ok', MODE);
