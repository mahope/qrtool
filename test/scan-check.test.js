'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode } = require('./helpers/load-app');

const SCALE = 8;

function rgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        255
    ];
}

// Draws a QR matrix into RGBA pixels the same way the site draws a code:
// one block per module, no quiet zone, so the test measures what the
// browser actually puts on the canvas.
function drawMatrix(qr, { fg, bg, cover = 0 } = {}) {
    const cells = qr.getModuleCount();
    const side = cells * SCALE;
    const data = new Uint8ClampedArray(side * side * 4);
    const dark = rgb(fg || '#000000');
    const light = rgb(bg || '#ffffff');

    const paint = (x, y, c) => {
        const i = (y * side + x) * 4;
        data[i] = c[0];
        data[i + 1] = c[1];
        data[i + 2] = c[2];
        data[i + 3] = c[3];
    };

    for (let y = 0; y < side; y++) {
        for (let x = 0; x < side; x++) {
            const col = Math.floor(x / SCALE);
            const row = Math.floor(y / SCALE);
            paint(x, y, qr.isDark(row, col) ? dark : light);
        }
    }

    // A logo: a white square with a dark frame in the middle of the code
    if (cover > 0) {
        const size = Math.floor(cells * cover) * SCALE;
        const offset = Math.floor((side - size) / 2);
        for (let y = offset; y < offset + size; y++) {
            for (let x = offset; x < offset + size; x++) {
                const frame = x - offset < 2 || y - offset < 2 || offset + size - x < 3 || offset + size - y < 3;
                paint(x, y, frame ? dark : light);
            }
        }
    }

    return { data, side };
}

function matrixFor(text, correction = 'M') {
    const qr = qrcode(0, correction);
    qr.addData(text);
    qr.make();
    return qr;
}

// A canvas object with real pixels, so decodeQRCanvas can be exercised in Node
function canvasWith(data, side) {
    return {
        width: side,
        height: side,
        getContext: () => ({ getImageData: () => ({ data, width: side, height: side }) })
    };
}

function load(extra = {}) {
    return loadApp({ globals: Object.assign({ setTimeout: fn => { fn(); return 0; } }, extra) });
}

test('scan check: a generated code is read back to the same payload', () => {
    const api = load();
    const qr = matrixFor('https://qrtool.dk');
    const { data, side } = drawMatrix(qr);
    assert.equal(api.decodeQRCanvas(canvasWith(data, side)), 'https://qrtool.dk');
});

test('scan check: the shipped colour presets still decode', () => {
    const api = load();
    const qr = matrixFor('https://qrtool.dk');
    for (const [fg, bg] of [['#1a365d', '#ffffff'], ['#c53030', '#fff5f5'], ['#553c9a', '#faf5ff']]) {
        const { data, side } = drawMatrix(qr, { fg, bg });
        assert.equal(api.decodeQRCanvas(canvasWith(data, side)), 'https://qrtool.dk', `${fg} on ${bg} must scan`);
    }
});

test('scan check: a light code on white is caught', () => {
    const api = load();
    const qr = matrixFor('https://qrtool.dk');
    const { data, side } = drawMatrix(qr, { fg: '#cccccc', bg: '#ffffff' });
    assert.equal(api.decodeQRCanvas(canvasWith(data, side)), null);
});

test('scan check: a code in the same colour as its background is caught', () => {
    const api = load();
    const qr = matrixFor('https://qrtool.dk');
    const { data, side } = drawMatrix(qr, { fg: '#555555', bg: '#666666' });
    assert.equal(api.decodeQRCanvas(canvasWith(data, side)), null);
});

test('scan check: a logo that covers too much at low error correction is caught', () => {
    const api = load();
    for (const correction of ['L', 'M']) {
        const qr = matrixFor('https://qrtool.dk', correction);
        const { data, side } = drawMatrix(qr, { cover: 0.35 });
        assert.equal(api.decodeQRCanvas(canvasWith(data, side)), null, `35% logo at ${correction} must be caught`);
    }
});

test('scan check: the same logo is fine at high error correction', () => {
    const api = load();
    const qr = matrixFor('https://qrtool.dk', 'H');
    const { data, side } = drawMatrix(qr, { cover: 0.35 });
    assert.equal(api.decodeQRCanvas(canvasWith(data, side)), 'https://qrtool.dk');
});

test('scan check: the status says the code scans when it does', () => {
    const api = load();
    api.setTab('text');
    api.field('qrText').value = 'https://qrtool.dk';
    const payload = api.getQRData();

    const qr = matrixFor(payload);
    const { data, side } = drawMatrix(qr);
    api.setScanCanvas(canvasWith(data, side));
    api.updateScanStatus(payload);

    const status = api.scanStatus();
    assert.equal(status.dataset.state, 'ok');
    assert.equal(status.hidden, false);
    assert.equal(status.textContent, api.translate('scan.ok'));
});

test('scan check: the status warns when the code cannot be read back', () => {
    const api = load();
    api.setTab('text');
    api.field('qrText').value = 'https://qrtool.dk';
    const payload = api.getQRData();

    const qr = matrixFor(payload);
    const { data, side } = drawMatrix(qr, { fg: '#cccccc', bg: '#ffffff' });
    api.setScanCanvas(canvasWith(data, side));
    api.updateScanStatus(payload);

    const status = api.scanStatus();
    assert.equal(status.dataset.state, 'warn');
    assert.equal(status.textContent, api.translate('scan.fail'));
});

test('scan check: the status warns when the content reads back wrong', () => {
    const api = load();
    api.setTab('text');
    api.field('qrText').value = 'https://qrtool.dk';
    const payload = api.getQRData();

    // The canvas carries a different code than the one the tool handed out
    const { data, side } = drawMatrix(matrixFor('https://qrtool.dk/om-qr-tool'));
    api.setScanCanvas(canvasWith(data, side));
    api.updateScanStatus(payload);

    const status = api.scanStatus();
    assert.equal(status.dataset.state, 'warn');
    assert.equal(status.textContent, api.translate('scan.mismatch'));
});

test('scan check: no code generated keeps the status hidden', () => {
    const api = load();
    api.updateScanStatus('https://qrtool.dk');
    const status = api.scanStatus();
    assert.equal(status.hidden, true);
    assert.equal(status.dataset.state, 'ok');
});

test('scan check: generating a code runs the check on the rendered canvas', () => {
    const api = load();
    // De indstillinger genereringen læser, med de værdier siden sender
    api.field('qrSize').value = '512';
    api.field('fileFormat').value = 'png';
    api.field('qrStyle').value = 'square';
    api.field('errorCorrection').value = 'M';
    api.setTab('text');
    api.field('qrText').value = 'https://qrtool.dk';
    api.generateQRCode();

    const status = api.scanStatus();
    assert.equal(status.hidden, false);
    assert.equal(status.getAttribute('role'), 'status');
    assert.ok(status.textContent.length > 0, 'the status must carry a message');
});
