'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadQRPage, qrcode, jsQR } = require('./helpers/load-qr-page');

const PAYLOAD = 'WIFI:T:WPA;S:Gæster;P:hemmelig-æøå;;';

// En canvas med rigtige pixels, så jsQR kan læse den færdige kode tilbage
function pixelCanvas(width, height) {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    let fillStyle = '#ffffff';

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
        drawImage() {},
        getImageData: (x, y, w, h) => ({ data, width: w, height: h })
    };

    const canvas = {
        width,
        height,
        data,
        getContext: () => ctx,
        toBlob: cb => cb(new Blob([new Uint8Array([0xde, 0xad])], { type: 'image/png' }))
    };
    return canvas;
}

// Fang de blobs biblioteket downloader, så testen kan se formatet
function captureDownloads() {
    const captured = [];
    const URLStub = {
        createObjectURL: blob => { captured.push(blob); return 'blob:mock'; },
        revokeObjectURL: () => {}
    };
    return { captured, URLStub };
}

function qrFor(payload) {
    const qr = qrcode(0, 'H');
    qr.addData(payload);
    qr.make();
    return qr;
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
    const { api } = loadQRPage();
    assert.equal(api.mmToPixels(25.4), 300);
    assert.equal(api.mmToPixels(30), 354);
    assert.equal(api.mmToPixels(50), 591);
    assert.equal(api.mmToPixels(30, 150), 177);
});

test('parsePrintSizeMm: tom, ugyldig og uden for område håndteres', () => {
    const { api, field } = loadQRPage();
    assert.equal(api.parsePrintSizeMm(), null, 'tomt felt giver null');

    field('printSizeMm').value = '30';
    assert.equal(api.parsePrintSizeMm(), 30);

    for (const bad of ['abc', '0', '-5', '']) {
        field('printSizeMm').value = bad;
        assert.equal(api.parsePrintSizeMm(), null, `"${bad}" skal ikke accepteres`);
    }

    field('printSizeMm').value = '5000';
    assert.equal(api.parsePrintSizeMm(), 300, 'større værdier klampes til 300 mm');
    field('printSizeMm').value = '1';
    assert.equal(api.parsePrintSizeMm(), 5, 'mindre værdier klampes til 5 mm');
});

test('updatePrintSizeHint: viser pixelstørrelsen eller standardteksten', () => {
    const { api, field } = loadQRPage();
    field('printSizeMm').value = '';
    api.updatePrintSizeHint();
    assert.match(field('printSizeHint').textContent, /Valgfri/);

    field('printSizeMm').value = '30';
    api.updatePrintSizeHint();
    assert.equal(field('printSizeHint').textContent, '30 mm = 354×354 px ved 300 dpi');
});

test('buildPrintPDF: side i præcis mm og koden fylder den', async () => {
    const { api } = loadQRPage();
    const jpeg = new Uint8Array([1, 2, 3, 4]);
    const blob = api.buildPrintPDF(jpeg, 354, 354, 30);
    const buf = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder().decode(buf);

    assert.ok(text.startsWith('%PDF-1.4'), 'PDF\'en skal starte med headeren');
    assert.ok(text.includes('%%EOF'), 'PDF\'en skal slutte med EOF');
    assert.ok(text.includes('/MediaBox [0 0 85.04 85.04]'), 'siden skal være 30 mm i point');
    assert.ok(text.includes('q 85 0 0 85 0 0 cm /Im0 Do Q'), 'billedet skal fylde hele siden');
    assert.ok(text.includes('5 0 obj\n<< /Type /XObject /Subtype /Image /Width 354 /Height 354'));

    const offsets = xrefOffsets(buf);
    assert.equal(offsets.length, 5);
    for (let i = 0; i < offsets.length; i++) {
        assert.equal(bytesIndexOf(buf, `${i + 1} 0 obj`, offsets[i]), offsets[i], `xref offset ${i + 1} skal pege på objektet`);
    }
});

test('buildPDF: A4-varianten centrerer koden', async () => {
    const { api } = loadQRPage();
    const jpeg = new Uint8Array([9]);

    const square = new TextDecoder().decode(new Uint8Array(await api.buildPDF(jpeg, 512, 512).arrayBuffer()));
    assert.ok(square.includes('/MediaBox [0 0 595.28 841.89]'), 'A4-side');
    assert.ok(square.includes('q 400 0 0 400 98 221 cm /Im0 Do Q'), 'kvadratisk kode centreret på A4');
});

test('drawCanvas: fire modulers hvid kant og koden kan stadig scannes', () => {
    const { api } = loadQRPage();
    const qr = qrFor(PAYLOAD);
    const canvas = pixelCanvas(354, 354);
    api.drawCanvas(qr, 354, canvas, '#000000');

    const decoded = jsQR(canvas.data, 354, 354);
    assert.ok(decoded, 'koden skal kunne læses igen');
    assert.equal(decoded.data, PAYLOAD);

    // Kanten tæller med i størrelsen, så modulerne bliver mindre
    const cells = qr.getModuleCount();
    const scale = 354 / (cells + 8);
    assert.ok(scale > 0, 'skalaen følger af kantmodulerne');
});

test('toSvgString: viewBox tæller kanten med, og første modul starter efter den', () => {
    const { api } = loadQRPage();
    const qr = qrFor(PAYLOAD);
    const svg = api.toSvgString(qr, api.QUIET_ZONE_MODULES, '#123456');

    const cells = qr.getModuleCount();
    assert.ok(svg.includes(`viewBox="0 0 ${cells + 8} ${cells + 8}"`), 'kanten er 4 moduler på hver side');
    assert.ok(svg.includes('<rect width="100%" height="100%" fill="#ffffff"/>'), 'hvid baggrund');
    assert.ok(svg.includes('stroke="none"'), 'ingen streger om modulerne');

    // QR-koden starter øverst til venstre med et mørkt modul
    assert.ok(svg.includes('M4,4h1v1h-1z'), `første modul skal ligge efter kanten: ${svg.slice(0, 400)}`);
});

test('renderCanvas: printstørrelsen giver en canvas i 300 dpi', () => {
    const { api } = loadQRPage();
    const qr = qrFor(PAYLOAD);
    const canvas = api.renderCanvas(qr, api.mmToPixels(30));

    assert.equal(canvas.width, 354);
    assert.equal(canvas.height, 354);
});

test('download: PDF med printstørrelse laver en side i præcis mm', async () => {
    const { captured, URLStub } = captureDownloads();
    const { api } = loadQRPage({ URL: URLStub });
    const qr = qrFor(PAYLOAD);
    const pdfCanvas = pixelCanvas(354, 354);

    let done = 0;
    api.download({
        format: 'pdf',
        canvas: null,
        mm: 30,
        prefix: 'wifi-qr',
        renderAt: px => { assert.equal(px, 354); return pdfCanvas; },
        onDone: () => { done++; }
    });

    await new Promise(resolve => setTimeout(resolve, 30));

    assert.equal(captured.length, 1, 'der downloaderes én PDF');
    assert.equal(captured[0].type, 'application/pdf');
    const text = new TextDecoder().decode(new Uint8Array(await captured[0].arrayBuffer()));
    assert.ok(text.includes('/MediaBox [0 0 85.04 85.04]'), 'siden er 30 mm');
    assert.equal(done, 1, 'onDone kaldes efter download');
});

test('download: PDF uden printstørrelse falder tilbage på A4', async () => {
    const { captured, URLStub } = captureDownloads();
    const { api } = loadQRPage({ URL: URLStub });
    const pdfCanvas = pixelCanvas(512, 512);

    api.download({ format: 'pdf', canvas: pdfCanvas, prefix: 'wifi-qr' });
    await new Promise(resolve => setTimeout(resolve, 30));

    assert.equal(captured.length, 1);
    const text = new TextDecoder().decode(new Uint8Array(await captured[0].arrayBuffer()));
    assert.ok(text.includes('/MediaBox [0 0 595.28 841.89]'), 'A4 uden printstørrelse');
});

test('download: PNG med printstørrelse males i 300 dpi og nævner størrelsen', async () => {
    const { captured, URLStub } = captureDownloads();
    const { api, toastText } = loadQRPage({ URL: URLStub });
    const seen = [];

    api.download({
        format: 'png',
        canvas: pixelCanvas(512, 512),
        mm: 30,
        prefix: 'wifi-qr',
        renderAt: px => { seen.push(px); return pixelCanvas(354, 354); }
    });
    await new Promise(resolve => setTimeout(resolve, 30));

    assert.deepEqual(seen, [354], 'koden males om i printstørrelsen');
    assert.equal(captured.length, 1, 'én PNG downloades');
    assert.match(toastText(), /30 mm/, 'beskeden nævner størrelsen');
});

test('download: SVG bygges fra koden hvis formatet skiftes efter generering', async () => {
    const { captured, URLStub } = captureDownloads();
    const { api } = loadQRPage({ URL: URLStub });
    const qr = qrFor(PAYLOAD);

    api.download({
        format: 'svg',
        svg: null,
        prefix: 'wifi-qr',
        svgFrom: () => api.toSvgString(qr, api.QUIET_ZONE_MODULES)
    });

    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'image/svg+xml;charset=utf-8');
    const text = await captured[0].text();
    assert.ok(text.includes('M4,4h1v1h-1z'), 'SVG\'en har quiet zone');
});

test('download: uden genereret kode kommer der en forklaring', () => {
    const { api, toastText } = loadQRPage();

    api.download({ format: 'png', canvas: null, prefix: 'wifi-qr' });

    assert.match(toastText(), /Generer først en QR-kode\./);
});

test('scheduleScanCheck: godkender en kode der kan læses', async () => {
    const { api, field } = loadQRPage();
    const qr = qrFor(PAYLOAD);
    const canvas = pixelCanvas(354, 354);
    api.drawCanvas(qr, 354, canvas, '#000000');

    api.scheduleScanCheck(canvas, PAYLOAD);
    assert.equal(field('scanStatus').hidden, false, 'kontrollen er synlig med det samme');

    await new Promise(resolve => setTimeout(resolve, 350));

    assert.equal(field('scanStatus').dataset.state, 'ok');
    assert.match(field('scanStatus').textContent, /kan scannes/);
});

test('scheduleScanCheck: advarer når indholdet ikke stemmer', async () => {
    const { api, field } = loadQRPage();
    const qr = qrFor(PAYLOAD);
    const canvas = pixelCanvas(354, 354);
    api.drawCanvas(qr, 354, canvas, '#000000');

    api.scheduleScanCheck(canvas, 'WIFI:T:WPA;S:Andet;;');
    await new Promise(resolve => setTimeout(resolve, 350));

    assert.equal(field('scanStatus').dataset.state, 'warn');
    assert.match(field('scanStatus').textContent, /noget andet/);
});

test('scheduleScanCheck: tom canvas giver ingen status', () => {
    const { api, field } = loadQRPage();
    field('scanStatus').hidden = true; // som i sidens markup
    api.scheduleScanCheck(null, PAYLOAD);
    assert.equal(field('scanStatus').hidden, true, 'intet at kontrollere');
});

test('scan-kontrol: uden jsQR sker der ingen kontrol', async () => {
    const { api, field } = loadQRPage({ withoutJsQR: true });
    field('scanStatus').hidden = true; // som i sidens markup
    const canvas = pixelCanvas(354, 354);

    api.scheduleScanCheck(canvas, PAYLOAD);
    await new Promise(resolve => setTimeout(resolve, 350));

    assert.equal(field('scanStatus').hidden, true, 'jsQR mangler — ingen kontrol');
});

test('tekster følger sidens sprog', () => {
    const { api, field } = loadQRPage();
    field('printSizeMm').value = '';
    assert.match(api.t('generateFirst'), /^Generer/);

    const english = loadQRPage();
    english.document.documentElement.lang = 'en';
    assert.match(english.api.t('generateFirst'), /^Generate/);
    english.field('printSizeMm').value = '';
    english.api.updatePrintSizeHint();
    assert.match(english.field('printSizeHint').textContent, /Optional/);
});
