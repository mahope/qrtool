const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const JSZip = require('./lib/jszip.min.js');
const qrcode = require('./lib/qrcode.js');
const jsQR = require('./lib/jsQR.min.js');

const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const svgStart = source.indexOf('function toSvgString(');
const svgEnd = source.indexOf('// Download QR-kode', svgStart);
const batchStart = source.indexOf('const batchPreviewBtn =');
const batchEnd = source.indexOf('// CSV Import for batch generation', batchStart);
assert.ok(svgStart >= 0 && svgEnd > svgStart);
assert.ok(batchStart >= 0 && batchEnd > batchStart);

function setup(input, zipLibrary = JSZip) {
    let generate;
    const downloads = [];
    const toasts = [];
    const button = {
        textContent: 'Download ZIP',
        disabled: false,
        addEventListener(event, handler) {
            assert.equal(event, 'click');
            generate = handler;
        }
    };
    const context = {
        document: { getElementById: () => null },
        batchInput: { value: input },
        batchGenerateBtn: button,
        qrSize: { value: '512' },
        fileFormat: { value: 'svg' },
        errorCorrection: { value: 'M' },
        qrStyle: { value: 'square' },
        transparentBg: { checked: false },
        bgColor: { value: '#ffffff' },
        qrColor: { value: '#000000' },
        qrcode,
        JSZip: zipLibrary === null ? undefined : zipLibrary,
        t: key => key,
        showToast: (message, type) => toasts.push({ message, type }),
        downloadBlob: (blob, filename) => downloads.push({ blob, filename }),
        console: { error: () => {} }
    };
    vm.runInNewContext(source.slice(svgStart, svgEnd) + source.slice(batchStart, batchEnd), context);
    return { generate, downloads, toasts, button };
}

function decodeSquareSvg(svg) {
    const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    assert.ok(viewBox);
    assert.equal(viewBox[1], viewBox[2]);
    const scale = 8;
    const size = Number(viewBox[1]) * scale;
    const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
    const modules = [...svg.matchAll(/M(\d+),(\d+)h1v1h-1z/g)];
    assert.ok(modules.length > 0);
    for (const [, x, y] of modules) {
        for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
                const offset = ((Number(y) * scale + dy) * size + Number(x) * scale + dx) * 4;
                pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
            }
        }
    }
    const decoded = jsQR(pixels, size, size);
    assert.ok(decoded, 'Exported SVG modules must decode');
    return decoded.data;
}

test('SVG batch ZIP round-trips URL, escaped WiFi and plain text', async () => {
    const payloads = [
        'https://example.com/guest-guide?house=1&lang=da',
        'WIFI:T:WPA;S:Guest\\;House;P:demo\\:pass\\,word\\\\123;;',
        'BEGIN:VCARD\\nVERSION:3.0\\nFN:Test Guest\\nEND:VCARD'
    ];
    const run = setup('\n' + payloads.join('\n\n') + '\n');
    await run.generate();
    assert.equal(run.downloads.length, 1);
    assert.match(run.downloads[0].filename, /^qr-codes-\d+\.zip$/);
    const zip = await JSZip.loadAsync(await run.downloads[0].blob.arrayBuffer(), { checkCRC32: true });
    assert.deepEqual(Object.keys(zip.files), ['qr-1.svg', 'qr-2.svg', 'qr-3.svg']);
    for (const [index, payload] of payloads.entries()) {
        const svg = await zip.file(`qr-${index + 1}.svg`).async('string');
        assert.equal(decodeSquareSvg(svg), payload);
    }
    assert.equal(run.button.disabled, false);
    assert.equal(run.button.textContent, 'Download ZIP');
    assert.equal(run.toasts.at(-1).message, 'batch.downloaded');
});

test('100 SVG entries are accepted and preserve first and last payloads', async () => {
    const run = setup(Array.from({ length: 100 }, (_, i) => `Guest ${i + 1}`).join('\n'));
    await run.generate();
    assert.equal(run.downloads.length, 1);
    const zip = await JSZip.loadAsync(await run.downloads[0].blob.arrayBuffer(), { checkCRC32: true });
    assert.equal(Object.keys(zip.files).length, 100);
    assert.equal(decodeSquareSvg(await zip.file('qr-1.svg').async('string')), 'Guest 1');
    assert.equal(decodeSquareSvg(await zip.file('qr-100.svg').async('string')), 'Guest 100');
});

for (const [name, input, library, expected] of [
    ['empty input', '\n  \n', JSZip, 'batch.enterText'],
    ['101 entries', Array(101).fill('test').join('\n'), JSZip, 'batch.max100'],
    ['missing JSZip', 'test', null, 'batch.jszipMissing']
]) {
    test(`${name} does not start a download`, async () => {
        const run = setup(input, library);
        await run.generate();
        assert.equal(run.downloads.length, 0);
        assert.equal(run.toasts.at(-1).message, expected);
        assert.equal(run.button.disabled, false);
    });
}

test('ZIP failure restores the button without reporting success', async () => {
    class BrokenZip {
        file() {}
        async generateAsync() { throw new Error('test ZIP failure'); }
    }
    const run = setup('test', BrokenZip);
    await run.generate();
    assert.equal(run.downloads.length, 0);
    assert.equal(run.button.disabled, false);
    assert.equal(run.button.textContent, 'Download ZIP');
    assert.equal(run.toasts.at(-1).message, 'batch.errortest ZIP failure');
    assert.equal(run.toasts.some(toast => toast.message === 'batch.downloaded'), false);
});

test('both language pages load the bundled ZIP library before the app', () => {
    for (const page of ['index.html', 'en/index.html']) {
        const html = fs.readFileSync(path.join(__dirname, page), 'utf8');
        const zip = html.indexOf('<script src="/lib/jszip.min.js">');
        const app = html.search(/<script src="\/?app\.js/);
        assert.ok(zip >= 0 && app > zip, page);
    }
    const build = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
    assert.match(build, /'lib'/);
});
