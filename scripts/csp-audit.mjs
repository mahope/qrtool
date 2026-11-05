// CSP audit: serves dist/ with the report-only policy from nginx.conf, drives the
// site in Chromium (every page in the sitemap, QR generation, downloads, batch ZIP,
// logo upload, scan from an image and from the camera, geolocation, service worker
// incl. offline) and returns every CSP violation, every request by resource type and
// origin, and the reports the browser POSTed to /csp-report.
// CLI: node scripts/csp-audit.mjs   (build first; exit 1 on violations)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './quality/server.mjs';
import { chromeFlags, chromeExecutable, sitemapPaths } from './quality/browser.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANALYTICS = ['https://analytics.holstjensen.eu', 'https://stats.mahoje.dk'];

export function readPolicy(nginxFile = path.join(root, 'nginx.conf')) {
  const conf = fs.readFileSync(nginxFile, 'utf8');
  const header = (name) => (conf.match(new RegExp(`add_header\\s+${name}\\s+(["'])([^]*?)\\1`)) || [])[2];
  return { policy: header('Content-Security-Policy-Report-Only'), endpoints: header('Reporting-Endpoints') };
}

export async function runAudit({ distDir = path.join(root, 'dist'), log = () => {}, policyOverride } = {}) {
  const { policy: configured, endpoints } = readPolicy();
  const policy = policyOverride || configured;
  if (!policy) throw new Error('nginx.conf has no Content-Security-Policy-Report-Only header');

  const posted = [];
  const server = await startServer(distDir, 0, {
    headers: { 'Content-Security-Policy-Report-Only': policy, 'Reporting-Endpoints': endpoints },
    handler(req, res) {
      if (!req.url.startsWith('/csp-report')) return false;
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => { posted.push(body); res.writeHead(204).end(); });
      return true;
    },
  });

  const violations = [];
  const requests = [];
  const errors = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qrtool-csp-'));
  const executablePath = chromeExecutable();
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: [...chromeFlags(), '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      permissions: ['geolocation', 'camera'],
      geolocation: { latitude: 55.6761, longitude: 12.5683 },
    });
    // The analytics hosts are stubbed so the run needs no network; anything else that
    // leaves the local server is recorded and refused.
    for (const origin of ANALYTICS) {
      await context.route(`${origin}/**`, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    }
    await context.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          directive: e.effectiveDirective, blocked: e.blockedURI, source: e.sourceFile || '',
          line: e.lineNumber, sample: e.sample, disposition: e.disposition, page: location.pathname,
        });
      });
    });

    // On the context (not the page) so the service worker's own fetches are recorded too.
    context.on('request', (r) => requests.push({ type: r.resourceType(), origin: new URL(r.url()).origin, url: r.url() }));

    const origin = server.origin;
    const newPage = async () => {
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
      return page;
    };
    const collect = async (page) => {
      violations.push(...await page.evaluate(() => window.__cspViolations.splice(0)).catch(() => []));
    };

    // 1. Every page in the sitemap.
    const page = await newPage();
    for (const p of sitemapPaths(path.join(distDir, 'sitemap.xml'))) {
      await page.goto(origin + p, { waitUntil: 'load' });
      await page.waitForTimeout(150);
      await collect(page);
    }
    log('pages done');

    // 2. Generator: QR code, every file format, logo, tabs, geolocation, batch ZIP.
    for (const base of ['/', '/en/']) {
      await page.goto(origin + base, { waitUntil: 'load' });
      await page.fill('#qrText', 'https://example.com/csp');
      await page.waitForSelector('#downloadBtn:not([disabled])');
      for (const format of ['png', 'jpg', 'svg', 'webp', 'pdf']) {
        await page.selectOption('#fileFormat', format);
        const download = page.waitForEvent('download');
        await page.click('#downloadBtn');
        const file = await download;
        if (format === 'png' && base === '/') await file.saveAs(path.join(tmp, 'qr.png'));
      }
      for (const tab of await page.$$eval('.tab-button', (b) => b.map((x) => x.dataset.tab))) {
        await page.click(`.tab-button[data-tab="${tab}"]`);
        await page.waitForTimeout(50);
      }
      await page.click('.tab-button[data-tab="geo"]');
      await page.click('#geoLocateBtn');
      await page.waitForFunction(() => document.getElementById('geoLat').value !== '');
      await page.click('.tab-button[data-tab="text"]');
      await page.setInputFiles('#logoFileInput', path.join(root, 'og-image.png'));
      await page.waitForSelector('#logoPreviewWrap:not([hidden])', { state: 'attached' }).catch(() => {});
      await page.waitForTimeout(300);
      await page.locator('.batch-section summary').click();
      await page.fill('#batchInput', 'https://a.example\nhttps://b.example');
      const zip = page.waitForEvent('download');
      await page.click('#batchGenerateBtn');
      await zip;
      await page.click('#batchSheetBtn').catch(() => {});
      await page.waitForTimeout(300);
      await collect(page);
    }
    log('generator done');

    // 3. Scanner: read the PNG we just downloaded, then the (fake) camera.
    for (const scanPath of ['/scan-qr-kode', '/en/scan-qr-code']) {
      await page.goto(origin + scanPath, { waitUntil: 'load' });
      await page.setInputFiles('#scanFileInput', path.join(tmp, 'qr.png'));
      await page.waitForSelector('#scanResult', { state: 'visible', timeout: 10000 });
      await page.click('#startScanBtn');
      await page.waitForSelector('#scannerViewport', { state: 'visible' });
      await page.waitForTimeout(800);
      await collect(page);
    }
    log('scanner done');

    // 4. Service worker: install, take control, then load pages offline from its cache.
    const sw = await newPage();
    await sw.goto(origin + '/', { waitUntil: 'load' });
    await sw.evaluate(() => navigator.serviceWorker.ready);
    await sw.reload({ waitUntil: 'load' });
    await sw.waitForTimeout(500);
    await context.setOffline(true);
    await sw.goto(origin + '/wifi-qr-kode', { waitUntil: 'load' }).catch(() => {});
    await sw.goto(origin + '/does-not-exist-offline', { waitUntil: 'load' }).catch(() => {});
    await collect(sw);
    await context.setOffline(false);
    log('service worker done');
  } finally {
    await browser.close();
    await server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const origins = {};
  for (const r of requests) {
    (origins[r.type] ||= new Set()).add(r.origin === server.origin ? "'self'" : r.origin);
  }
  return {
    policy, violations, errors, posted,
    resources: Object.fromEntries(Object.entries(origins).map(([type, set]) => [type, [...set].sort()])),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await runAudit({ log: (m) => console.error(m) });
  console.log(JSON.stringify({ resources: result.resources, violations: result.violations, reportsPosted: result.posted.length, pageErrors: result.errors }, null, 2));
  process.exit(result.violations.length || result.errors.length ? 1 : 0);
}
