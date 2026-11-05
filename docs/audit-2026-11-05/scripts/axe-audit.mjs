import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const BASE = process.env.QR_BASE || 'https://qrtool.dk';
const OUT = process.argv[2];
const pages = ['/', '/wifi-qr-kode', '/vcard-qr-kode', '/scan-qr-kode', '/guides/', '/guides/qr-koder-til-restauranter', '/om-qr-tool', '/404-findes-ikke', '/en/'];
const browser = await chromium.launch();
const results = [];
for (const [vw, vh] of [[390, 844], [1440, 900]]) {
  for (const theme of ['default', 'toggled']) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, locale: 'da-DK' });
    for (const p of pages) {
      const page = await ctx.newPage();
      await page.addInitScript(() => { try { localStorage.setItem('onboarding-done', '1'); } catch (e) {} });
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(800);
      if (theme === 'toggled') {
        const t = await page.$('#themeToggle');
        if (t && (await t.isVisible())) { await t.click(); await page.waitForTimeout(400); } else { await page.close(); continue; }
      }
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      results.push({ p, vw, theme, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ').slice(0, 140) })) });
      await page.close();
    }
    await ctx.close();
  }
}
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
// compact summary: per rule, total nodes & pages
const agg = {};
for (const r of results) for (const v of r.violations) { const k = v.id + ' [' + v.impact + ']'; (agg[k] ||= { nodes: 0, pages: new Set() }); agg[k].nodes += v.nodes; agg[k].pages.add(r.p); }
for (const [k, v] of Object.entries(agg).sort((a, b) => b[1].nodes - a[1].nodes)) console.log(k.padEnd(48), 'nodes', String(v.nodes).padEnd(5), 'pages', v.pages.size);
await browser.close();
