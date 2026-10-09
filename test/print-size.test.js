'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode, jsQR } = require('./helpers/load-app');

const PAYLOAD = 'https://qrtool.dk/print';

// En canvas med rigtige pixels, så jsQR kan læse den færdige kode
function pixelCanvas(width, height) {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    let fillStyle = '#000000';

    const paint = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
    };

    const fillRectShape = (x, y, w, h) => {
        const dark = fillStyle !== '#ffffff' && fillStyle !== 'white';
        for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
            for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
                if (dark) paint(px, py);
            }
        }
    };

    const ctx = {
        get fillStyle() { return fillStyle; },
        set fillStyle(value) { fillStyle = value; },
        fillRect: fillRectShape,
        beginPath() {},
        arc() {},
        rect() {},
        roundRect() {},
        fill() {},
        drawImage() {}
    };

    const canvas = { width, height, data, getContext: () => ctx };
    return canvas;
}

function generate(api, { cta = '' } = {}) {
    api.setTab('text');
    api.field('qrText').value = PAYLOAD;
    api.field('qrColor').value = '#000000';
    api.field('bgColor').value = '#ffffff';
    api.field('transparentBg').checked = false;
    api.field('qrSize').value = '512';
    api.field('errorCorrection').value = 'M';
    api.field('qrStyle').value = 'square';
    api.field('fileFormat').value = 'png';
    api.field('ctaText').value = cta;
    api.generateQRCode();
}

function pdfText(blob) {
    return blob.arrayBuffer().then(buf => new TextDecoder().decode(buf));
}

// xref-offsets er byte-positioner, og PDF-headerens binære kommentar er
// multi-byte UTF-8 efter TextEncoder — så tjekket sker på rå bytes
function bytesIndexOf(haystack, needle, from = 0) {
    const n = new TextEncoder().encode(needle);
    outer: for (let i = from; i <= haystack.length - n.length; i++) {
        for (let j = 0; j < n.length; j++) {
            if (haystack[i + j] !== n[j]) continue outer;
        }
        return i;
    }
    return -1;
}

function xrefOffsets(bytes) {
    const xref = bytesIndexOf(bytes, 'xref\n');
    const trailer = bytesIndexOf(bytes, 'trailer');
    const slice = new TextDecoder().decode(bytes.slice(xref, trailer));
    return [...slice.matchAll(/(\d{10}) 00000 n/g)].map(m => Number(m[1]));
}

test('mmToPixels: mm omregnes korrekt til pixels ved 300 dpi', () => {
    const api = loadApp();
    assert.equal(api.mmToPixels(25.4), 300);
    assert.equal(api.mmToPixels(30), 354);
    assert.equal(api.mmToPixels(50), 591);
    assert.equal(api.mmToPixels(100), 1181);
});

test('mmToPixels: andet dpi respekteres', () => {
    const api = loadApp();
    assert.equal(api.mmToPixels(30, 150), 177);
    assert.equal(api.mmToPixels(25.4, 600), 600);
});

test('parsePrintSizeMm: tom eller ugyldig værdi giver null', () => {
    const api = loadApp();
    assert.equal(api.parsePrintSizeMm(), null);

    api.field('printSizeMm').value = '30';
    assert.equal(api.parsePrintSizeMm(), 30);

    api.field('printSizeMm').value = '30.5';
    assert.equal(api.parsePrintSizeMm(), 30.5);

    for (const bad of ['abc', '0', '-5', '']) {
        api.field('printSizeMm').value = bad;
        assert.equal(api.parsePrintSizeMm(), null, `"${bad}" skal ikke accepteres`);
    }
});

test('parsePrintSizeMm: klampes til 5–300 mm', () => {
    const api = loadApp();
    api.field('printSizeMm').value = '5000';
    assert.equal(api.parsePrintSizeMm(), 300, 'større værdier klampes til 300 mm');
    api.field('printSizeMm').value = '1';
    assert.equal(api.parsePrintSizeMm(), 5, 'mindre værdier klampes til 5 mm');
});

test('buildPrintPDF: side i præcis mm og koden fylder den', async () => {
    const api = loadApp();
    const jpeg = new Uint8Array([1, 2, 3, 4]);
    const blob = api.buildPrintPDF(jpeg, 354, 354, 30);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder().decode(buf);

    assert.ok(text.startsWith('%PDF-1.4'), 'PDF\'en skal starte med headeren');
    assert.ok(text.includes('%%EOF'), 'PDF\'en skal slutte med EOF');

    // 30 mm = 85,04 point
    assert.ok(text.includes('/MediaBox [0 0 85.04 85.04]'), `siden skal være 30 mm i point: ${text.match(/MediaBox.*/)}`);
    assert.ok(text.includes('q 85 0 0 85 0 0 cm /Im0 Do Q'), 'billedet skal fylde hele siden');

    // Det indlejrete JPEG skal være i filen
    assert.ok(text.includes('5 0 obj\n<< /Type /XObject /Subtype /Image /Width 354 /Height 354'));

    // xref-skiftet skal pege på de fem objekter
    const offsets = xrefOffsets(buf);
    assert.equal(offsets.length, 5);
    for (let i = 0; i < offsets.length; i++) {
        assert.equal(bytesIndexOf(buf, `${i + 1} 0 obj`, offsets[i]), offsets[i], `xref offset ${i + 1} skal pege på objektet`);
    }
});

test('buildPDF: A4-varianten er uændret (centreret, maks 400 pt)', async () => {
    const api = loadApp();
    const jpeg = new Uint8Array([9]);

    const square = await pdfText(api.buildPDF(jpeg, 512, 512));
    assert.ok(square.includes('/MediaBox [0 0 595.28 841.89]'));
    assert.ok(square.includes('q 400 0 0 400 98 221 cm /Im0 Do Q'), 'kvadratisk kode centreret på A4');

    const wide = await pdfText(api.buildPDF(jpeg, 800, 400));
    assert.ok(wide.includes('q 400 0 0 200 98 321 cm /Im0 Do Q'), 'bred kode skaleres ned til 400 pt');
});

test('renderPrintCanvas: genmaler i printstørrelsen og den kan scannes', () => {
    const api = loadApp();
    assert.equal(api.renderPrintCanvas(30), null, 'ingen kode genereret endnu');

    generate(api);
    const canvas = api.renderPrintCanvas(30);
    assert.ok(canvas, 'en printstørrelse skal give en canvas');
    assert.equal(canvas.width, 354);
    assert.equal(canvas.height, 354);

    // Baggrundsdækningen viser at koden er malet i printstørrelsen
    const bg = canvas.calls.find(call => call.method === 'fillRect');
    assert.deepEqual(bg.args, [0, 0, 354, 354]);

    // Den genmalte kode skal indeholde præcis det samme indhold
    const pixels = pixelCanvas(354, 354);
    api.drawCanvas(api.lastQR(), 354, pixels, 'square');
    const decoded = jsQR(pixels.data, 354, 354);
    assert.ok(decoded, 'den genmalte kode skal kunne scannes');
    assert.equal(decoded.data, PAYLOAD);
});

test('renderPrintCanvas: CTA under koden medtages i højden', () => {
    const api = loadApp();
    generate(api, { cta: 'Scan mig!' });

    const canvas = api.renderPrintCanvas(30);
    assert.equal(canvas.width, 354);
    assert.equal(canvas.height, 354 + 40, 'CTA\'en giver 40 px ekstra ved lave opløsninger');
});

test('downloadQRCode: printstørrelsen bruges og nævnes i beskeden', () => {
    const api = loadApp();
    generate(api);

    api.field('printSizeMm').value = '30';
    api.field('fileFormat').value = 'png';
    api.downloadQRCode();

    const toast = api.field('toastContainer').children.at(-1).children[1].textContent;
    assert.ok(toast.includes('30 mm'), `beskeden skal nævne størrelsen: ${toast}`);
});

test('downloadQRCode: PDF uden printstørrelse giver A4 som før', () => {
    const api = loadApp();
    generate(api);

    api.field('fileFormat').value = 'pdf';
    api.downloadQRCode();

    const toast = api.field('toastContainer').children.at(-1).children[1].textContent;
    assert.ok(toast.includes('QR-kode downloadet!'), `beskeden skal være den normale: ${toast}`);
});
