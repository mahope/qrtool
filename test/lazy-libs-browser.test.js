'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');

// Behavioural check of the lazy loading in a real browser: no request to the
// heavy libs on load, JSZip only on the first batch download, and a retry after
// a failed fetch. Skipped when no browser can be launched.
const DIST = path.join(__dirname, '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };

function serve() {
    const server = http.createServer((req, res) => {
        let rel = decodeURIComponent(req.url.split('?')[0]);
        if (rel.endsWith('/')) rel += 'index.html';
        let file = path.join(DIST, rel);
        if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
        if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404); res.end(); return;
        }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function launch() {
    try {
        const { chromium } = require('playwright');
        const executablePath = process.env.QUALITY_CHROME;
        return await chromium.launch(executablePath ? { executablePath } : {});
    } catch {
        return null;
    }
}

const LIB = /\/lib\/(jsQR|jszip)\.min\.js/;

test('lazy libs in a browser: not requested on load, JSZip fetched on first ZIP, failure retried', async (t) => {
    const browser = await launch();
    if (!browser) return t.skip('no browser available');
    const server = await serve();
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        const page = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
        const requested = [];
        let failZip = true;
        await page.route(LIB, route => {
            requested.push(route.request().url());
            if (/jszip/.test(route.request().url()) && failZip) return route.abort();
            return route.continue();
        });

        await page.goto(`${base}/`, { waitUntil: 'load' });
        assert.deepEqual(requested.filter(u => /jszip/.test(u)), [], 'JSZip must not load with the page');
        assert.equal(await page.evaluate(() => typeof JSZip), 'undefined');

        await page.click('.batch-section summary');
        await page.fill('#batchInput', 'https://a.example\nhttps://b.example');
        await page.click('#batchGenerateBtn');
        await page.waitForSelector('.toast-error');
        assert.match(await page.textContent('.toast-error'), /ZIP/);
        assert.equal(await page.isDisabled('#batchGenerateBtn'), false, 'button must be usable again');

        failZip = false;
        const download = page.waitForEvent('download');
        await page.click('#batchGenerateBtn');
        assert.match((await download).suggestedFilename(), /\.zip$/);
        assert.equal(await page.evaluate(() => typeof JSZip), 'function');
        assert.equal(requested.filter(u => /jszip/.test(u)).length, 2, 'one failed and one successful fetch');
    } finally {
        await browser.close();
        server.close();
    }
});

test('lazy libs in a browser: generator page does not request jsQR before use', async (t) => {
    const browser = await launch();
    if (!browser) return t.skip('no browser available');
    const server = await serve();
    try {
        const page = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
        const requested = [];
        page.on('request', r => { if (LIB.test(r.url())) requested.push(r.url()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/wifi-qr-kode`, { waitUntil: 'load' });
        assert.deepEqual(requested, []);
    } finally {
        await browser.close();
        server.close();
    }
});
