// Quality job: serves dist/, then runs axe, the horizontal overflow check and
// Lighthouse (mobile) against it, and checks the results against
// budgets.json. Usage: node scripts/quality/run.mjs [--only=axe,overflow,lighthouse] [--out=results.json]
// Build first (npm run build). Exit code 1 when a budget fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';
import { createLimiter, launchBrowser, sitemapPaths } from './browser.mjs';
import { runAxe } from './axe.mjs';
import { runOverflow } from './overflow.mjs';
import { runLighthouse } from './lighthouse.mjs';
import { checkAxe, checkLighthouse, checkOverflow } from './budgets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const config = JSON.parse(fs.readFileSync(path.join(here, 'budgets.json'), 'utf8'));
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = (arg('only') || 'axe,overflow,lighthouse').split(',');

const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/ is missing: run npm run build first');
  process.exit(2);
}

const server = await startServer(dist);
const failures = [];
const report = {};
const timed = async (name, fn) => {
  const t = Date.now();
  const value = await fn();
  console.log(`${name}: ${((Date.now() - t) / 1000).toFixed(1)}s`);
  return value;
};

try {
  const wantAxe = only.includes('axe');
  const wantOverflow = only.includes('overflow');
  if (wantAxe || wantOverflow) {
    const browser = await launchBrowser();
    const limit = createLimiter(Number(process.env.QUALITY_CONCURRENCY) || 4);
    const paths = [...new Set([...sitemapPaths(path.join(dist, 'sitemap.xml')), '/404-findes-ikke'])];
    // axe and the overflow check share the browser and the limiter.
    await timed('axe + overflow', () => Promise.all([
      wantAxe && runAxe(browser, server.origin, limit).then((r) => { report.axe = r; }),
      wantOverflow && runOverflow(browser, server.origin, limit, paths, config.overflow.widths).then((r) => { report.overflow = r; }),
    ]));
    await browser.close();
    if (report.axe) failures.push(...checkAxe(report.axe, config.axe, config.known.axe));
    if (report.overflow) failures.push(...checkOverflow(report.overflow, config.known.overflow));
  }
  if (only.includes('lighthouse')) {
    report.lighthouse = await timed('lighthouse', async () => runLighthouse(server.origin, config.lighthouse.pages));
    failures.push(...checkLighthouse(report.lighthouse, config.lighthouse, config.known.lighthouse));
  }
} finally {
  await server.close();
}

if (report.lighthouse) {
  for (const r of report.lighthouse) {
    console.log(`lighthouse ${r.path}: CLS ${r.cls.toFixed(3)}, accessibility ${r.accessibility}, performance ${r.performance}, JS ${(r.jsBytes / 1024).toFixed(1)} KB`);
  }
}
if (report.overflow) {
  const wide = report.overflow.filter((r) => r.overflowPx > 0);
  console.log(`overflow: ${report.overflow.length} measurements, ${wide.length} with horizontal overflow`);
  for (const r of wide) console.log(`  ${r.path}@${r.width}: ${r.overflowPx}px`);
}
if (report.axe) {
  const totals = {};
  for (const r of report.axe) for (const v of r.violations) {
    if (config.axe.failImpacts.includes(v.impact)) totals[v.id] = (totals[v.id] || 0) + v.nodes;
  }
  console.log(`axe: ${report.axe.length} scans, critical/serious nodes per rule: ${JSON.stringify(totals)}`);
}
if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(report, null, 1));

if (failures.length) {
  console.error(`\n${failures.length} budget failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\nAll quality budgets met.');
