'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

// Use the browser's real curve rasterizer, including antialiasing. No canvas
// approximation or thresholding may hide failures in the downloaded pixels.
test('real canvas: all sizes, styles and payloads decode from raw pixels', { timeout: 120000 }, () => {
    const root = path.join(__dirname, '..');
    const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    const drawing = app.slice(app.indexOf('function moduleBounds('), app.indexOf('function toSvgString('));
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qrtool-raster-'));
    const html = path.join(temp, 'test.html');
    const script = file => `<script src="${pathToFileURL(path.join(root, file))}"></script>`;
    fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><pre id="result"></pre>
${script('lib/qrcode.js')}${script('lib/jsQR.min.js')}${script('lib/qr-page.js')}
<script>
const QUIET_ZONE_MODULES = 4;
const transparentBg = { checked: false }, bgColor = { value: '#ffffff' }, qrColor = { value: '#000000' };
${drawing}
const results = [];
try {
    const payloads = ['https://example.com', 'https://example.com/path?query=' + 'abcdef'.repeat(22),
        'Blåbærgrød med æøå og ÆØÅ', 'WIFI:T:WPA;S:Gæstenet;P:hemmelig123;H:false;;'];
    for (const size of [256, 512, 1024, 2048]) {
        for (const style of ['square', 'rounded', 'dots', 'page']) {
            // Type pages offer 512px and up, with H correction by default.
            const corrections = style === 'page' && size >= 512 ? ['M', 'H'] : ['M'];
            for (const correction of corrections) {
                for (const payload of payloads) {
                    const qr = qrcode(0, correction); qr.addData(payload); qr.make();
                    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
                    if (style === 'page') QRPage.drawCanvas(qr, size, canvas, '#000000');
                    else drawCanvas(qr, size, canvas, style);
                    const pixels = canvas.getContext('2d').getImageData(0, 0, size, size).data;
                    if (canvas.width !== size || canvas.height !== size) throw Error('wrong canvas dimensions');
                    const decoded = jsQR(pixels, size, size, { inversionAttempts: 'attemptBoth' });
                    if (!decoded || decoded.data !== payload) throw Error(JSON.stringify({size, style, correction, payload, decoded: decoded && decoded.data}));
                    let gray = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i] > 0 && pixels[i] < 255) gray++;
                    }
                    if (style === 'rounded' || style === 'dots') {
                        if (!gray) throw Error('curves must be rasterized with antialiasing');
                    }
                    if (style === 'square' || style === 'page') {
                        for (let i = 0; i < pixels.length; i += 4) {
                            if (pixels[i] !== 0 && pixels[i] !== 255) throw Error('gray seam at ' + i);
                        }
                    }
                    results.push({size, style, correction, payload});
                }
            }
        }
    }
    document.querySelector('#result').textContent = JSON.stringify({passed: results.length});
} catch (error) { document.querySelector('#result').textContent = JSON.stringify({error: error.message, passed: results.length}); }
</script>`);
    try {
        const browser = spawnSync(process.env.CHROME_BIN || 'google-chrome', [
            '--headless', '--no-sandbox', '--disable-dev-shm-usage',
            `--user-data-dir=${path.join(temp, 'profile')}`, '--dump-dom', pathToFileURL(html).href
        ], { encoding: 'utf8', timeout: 110000, maxBuffer: 4 * 1024 * 1024 });
        assert.ifError(browser.error);
        assert.equal(browser.status, 0, browser.stderr);
        const output = browser.stdout.match(/<pre id="result">([^<]*)<\/pre>/);
        assert.ok(output, 'Chrome must report its rasterization results');
        assert.deepEqual(JSON.parse(output[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')), { passed: 76 });
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
});
