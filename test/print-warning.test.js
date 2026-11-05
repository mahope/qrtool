'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode } = require('./helpers/load-app');

// Printadvarsel: for små moduler ved den valgte printstørrelse. Funktionen er
// ren, så grænserne kan testes uden DOM; resten tester feltet og tekstens
// live-region.

function modulesFor(text, ec = 'M') {
    const qr = qrcode(0, ec);
    qr.addData(text);
    qr.make();
    return qr.getModuleCount();
}

const LONG = 'https://example.com/' + 'a'.repeat(100); // 120 tegn

test('20 mm and a short URL (version 2) gives no warning', () => {
    const api = loadApp();
    const count = modulesFor('https://qrtool.dk');
    assert.equal(count, 25, 'version 2');
    const w = api.printWarning(count, 20);
    assert.equal(w.level, 'none');
    assert.ok(w.dotsPerModule > 4);
});

test('5 mm and 120 characters gives a strong warning and a minimum size', () => {
    const api = loadApp();
    assert.equal(LONG.length, 120);
    const count = modulesFor(LONG);
    const w = api.printWarning(count, 5);
    assert.equal(w.level, 'strong');
    assert.ok(w.dotsPerModule < 2);
    // mindste anbefalede størrelse: 4 punkter pr. modul inkl. stille zone ved 300 dpi
    const expected = 4 / 300 * 25.4 * (count + 8);
    assert.ok(Math.abs(w.minMm - expected) < 1e-9);
    assert.ok(w.minMm > 5);
    assert.equal(w.version, (count - 17) / 4);
});

test('the limit is exactly 4 dots per module: at it no warning, just below a warning', () => {
    const api = loadApp();
    const count = 29; // version 3
    const { minMm } = api.printWarning(count, 100);
    assert.equal(api.printWarning(count, minMm).level, 'none', 'exactly 4 dots is fine');
    assert.equal(api.printWarning(count, minMm * 0.999).level, 'warn', 'just under 4 dots warns');
    assert.equal(api.printWarning(count, minMm / 2).level, 'warn', 'exactly 2 dots is still a plain warning');
    assert.equal(api.printWarning(count, minMm / 2 * 0.999).level, 'strong', 'under 2 dots is strong');
});

test('dpi and quiet zone are parameters', () => {
    const api = loadApp();
    const at300 = api.printWarning(25, 20, 300, 4);
    const at600 = api.printWarning(25, 20, 600, 4);
    assert.ok(Math.abs(at600.dotsPerModule - 2 * at300.dotsPerModule) < 1e-9);
    const noQuiet = api.printWarning(25, 20, 300, 0);
    assert.ok(noQuiet.dotsPerModule > at300.dotsPerModule);
});

test('the warning region is a polite live region in every page that has the field', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..');
    const pages = [...fs.readdirSync(root), ...fs.readdirSync(path.join(root, 'en')).map(f => 'en/' + f)]
        .filter(f => f.endsWith('.html'));
    let withField = 0;
    for (const page of pages) {
        const html = fs.readFileSync(path.join(root, page), 'utf8');
        if (!html.includes('id="printSizeHint"')) continue;
        withField++;
        assert.match(html, /<p class="print-warning" id="printSizeWarning" aria-live="polite"><\/p>/, page);
    }
    assert.equal(withField, 14);
});

function fillText(api, text) {
    api.setTab('text');
    api.field('qrText').value = text;
    api.field('errorCorrection').value = 'M';
    api.field('fileFormat').value = 'png';
}

test('field: 120 characters at 5 mm shows the warning with version, dots and minimum size', () => {
    const api = loadApp();
    fillText(api, LONG);
    api.field('printSizeMm').value = '5';
    api.updatePrintWarning();
    const text = api.field('printSizeWarning').textContent;
    const count = modulesFor(LONG);
    assert.match(text, /ikke læsbar/, text);
    assert.ok(text.includes(`version ${(count - 17) / 4}`), text);
    assert.ok(text.includes(`${count} × ${count} moduler`), text);
    assert.ok(text.includes('printerpunkter'), text);
    assert.ok(text.includes('kortere indhold'), text);
    const min = Math.ceil(4 / 300 * 25.4 * (count + 8));
    assert.ok(text.includes(`mindst ${min} mm`), text);
    assert.ok(!/[—–]/.test(text), 'no dashes');
});

test('field: the recommended size makes the warning go away, and the download size is untouched', () => {
    const api = loadApp();
    fillText(api, LONG);
    api.field('printSizeMm').value = '5';
    api.updatePrintWarning();
    const count = modulesFor(LONG);
    const min = Math.ceil(4 / 300 * 25.4 * (count + 8));
    api.field('printSizeMm').value = String(min);
    api.updatePrintWarning();
    assert.equal(api.field('printSizeWarning').textContent, '');
    assert.equal(api.parsePrintSizeMm(), min, 'the entered size is used as typed');
    api.field('printSizeMm').value = '5';
    assert.equal(api.parsePrintSizeMm(), 5, 'a too small size is not adjusted');
});

test('field: no print size or SVG shows no warning', () => {
    const api = loadApp();
    fillText(api, LONG);
    api.field('printSizeMm').value = '';
    api.updatePrintWarning();
    assert.equal(api.field('printSizeWarning').textContent, '');
    api.field('printSizeMm').value = '5';
    api.field('fileFormat').value = 'svg';
    api.updatePrintWarning();
    assert.equal(api.field('printSizeWarning').textContent, '');
});

test('batch: the longest line is named and the buttons stay enabled', () => {
    const api = loadApp();
    fillText(api, 'https://qrtool.dk');
    api.field('fileFormat').value = 'pdf';
    api.field('printSizeMm').value = '10';
    api.field('batchInput').value = ['https://a.dk', LONG, 'https://b.dk'].join('\n');
    api.updatePrintWarning();
    const text = api.field('batchPrintWarning').textContent;
    assert.ok(text.includes('120 tegn'), text);
    assert.ok(text.includes('kortere linjer'), text);
    assert.notEqual(api.field('batchGenerateBtn').disabled, true);
    assert.notEqual(api.field('batchSheetBtn').disabled, true);
    // kun korte linjer: ingen advarsel
    api.field('batchInput').value = 'https://a.dk\nhttps://b.dk';
    api.updatePrintWarning();
    assert.equal(api.field('batchPrintWarning').textContent, '');
});

test('English texts exist for all four messages', () => {
    const api = loadApp();
    const count = modulesFor(LONG);
    const en = api.printWarningText(count, 5, 'single');
    assert.ok(en && en.length > 20);
    const source = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
    for (const key of ['print.warn', 'print.strong', 'print.batchWarn', 'print.batchStrong']) {
        assert.equal(source.split(`'${key}':`).length - 1, 2, `${key} in both language tables`);
    }
    assert.ok(!/print\.\w+': '[^']*[—–]/.test(source), 'no dashes in the print texts');
});
