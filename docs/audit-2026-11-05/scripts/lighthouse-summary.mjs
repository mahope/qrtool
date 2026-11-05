// Summarise Lighthouse JSON files: median of runs per slug+formfactor
// Usage: node lh-summary.mjs <lhdir>
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const groups = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const m = f.match(/^(.*)_(mobile|desktop)_(\d)\.json$/);
  if (!m) continue;
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const k = m[1] + ' ' + m[2];
  (groups[k] ||= []).push(j);
}
const rows = [];
for (const [k, runs] of Object.entries(groups).sort()) {
  const a = (id) => runs.map((r) => r.audits[id]?.numericValue);
  const cat = (id) => runs.map((r) => (r.categories[id]?.score ?? null) * 100);
  const r0 = runs[0];
  const failed = (cid) => {
    const out = [];
    for (const ref of r0.categories[cid].auditRefs) {
      const au = r0.audits[ref.id];
      if (au.score !== null && au.score < 0.9 && ref.weight > 0 || (cid !== 'performance' && au.score === 0)) out.push(`${ref.id}=${au.score}`);
    }
    return out;
  };
  rows.push({
    k, n: runs.length,
    perf: med(cat('performance')), a11y: med(cat('accessibility')), bp: med(cat('best-practices')), seo: med(cat('seo')),
    fcp: Math.round(med(a('first-contentful-paint'))), lcp: Math.round(med(a('largest-contentful-paint'))),
    tbt: Math.round(med(a('total-blocking-time'))), cls: +med(a('cumulative-layout-shift')).toFixed(3),
    si: Math.round(med(a('speed-index'))), ttfb: Math.round(med(a('server-response-time'))),
    bytes: Math.round(med(a('total-byte-weight')) / 1024), reqs: med(runs.map((r) => r.audits['network-requests']?.details?.items?.length)),
    js: Math.round(med(runs.map((r) => (r.audits['network-requests']?.details?.items || []).filter((i) => i.resourceType === 'Script').reduce((s, i) => s + (i.transferSize || 0), 0))) / 1024),
    unusedJs: Math.round(med(a('unused-javascript')) ) , renderBlocking: Math.round(med(a('render-blocking-resources'))),
    mainthread: Math.round(med(a('mainthread-work-breakdown'))), bootup: Math.round(med(a('bootup-time'))),
    failedPerf: failed('performance').join(','), failedA11y: failed('accessibility').join(','), failedBP: failed('best-practices').join(','), failedSEO: failed('seo').join(','),
  });
}
console.log(JSON.stringify(rows, null, 1));
