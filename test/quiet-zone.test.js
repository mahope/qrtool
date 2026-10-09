'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode, jsQR } = require('./helpers/load-app');

const SIZE = 512;

function rgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}

// En canvas med rigtige pixels: drawCanvas males direkte i bufferen, så testen
// kan aflæse kanten præcis som en scanner gør.
function pixelCanvas(width, height) {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const calls = [];
    const path = [];
    let fillStyle = '#000000';

    const paint = (x, y, color) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        const [r, g, b] = rgb(color);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
    };

    const fillRectShape = (x, y, w, h) => {
        for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
            for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
                paint(px, py, fillStyle);
            }
        }
    };

    const ctx = {
        canvas: null,
        get fillStyle() { return fillStyle; },
        set fillStyle(value) { fillStyle = value; },
        fillRect(x, y, w, h) {
            calls.push({ method: 'fillRect', args: [x, y, w, h], fillStyle });
            fillRectShape(x, y, w, h);
        },
        beginPath() { path.length = 0; },
        arc(cx, cy, r) { path.push({ type: 'circle', cx, cy, r }); },
        rect(x, y, w, h) { path.push({ type: 'rect', x, y, w, h }); },
        roundRect(x, y, w, h) { path.push({ type: 'rect', x, y, w, h }); },
        fill() {
            for (const shape of path) {
                if (shape.type === 'circle') {
                    const r2 = shape.r * shape.r;
                    for (let py = Math.floor(shape.cy - shape.r); py <= Math.ceil(shape.cy + shape.r); py++) {
                        for (let px = Math.floor(shape.cx - shape.r); px <= Math.ceil(shape.cx + shape.r); px++) {
                            const dx = px + 0.5 - shape.cx;
                            const dy = py + 0.5 - shape.cy;
                            if (dx * dx + dy * dy <= r2) paint(px, py, fillStyle);
                        }
                    }
                } else {
                    fillRectShape(shape.x, shape.y, shape.w, shape.h);
                }
            }
        },
        drawImage() {}
    };

    const canvas = { width, height, calls, data, getContext: () => ctx };
    ctx.canvas = canvas;
    return canvas;
}

function pixelAt(canvas, x, y) {
    const i = (y * canvas.width + x) * 4;
    return [canvas.data[i], canvas.data[i + 1], canvas.data[i + 2]];
}

// Hvor mange pixler den hvide kant skal være: fire modulers bredde
function quietPixels(moduleCount, size) {
    return Math.floor((size / (moduleCount + 8)) * 4);
}

function load(fields = {}) {
    const api = loadApp({ globals: { setTimeout: fn => { fn(); return 0; } } });
    Object.assign(api.field('qrColor'), { value: '#000000' });
    Object.assign(api.field('bgColor'), { value: '#ffffff' });
    Object.assign(api.field('transparentBg'), { checked: false });
    Object.assign(api.field('qrSize'), { value: String(SIZE) });
    Object.assign(api.field('qrStyle'), { value: 'square' });
    Object.assign(api.field('errorCorrection'), { value: 'M' });
    for (const [id, value] of Object.entries(fields)) {
        Object.assign(api.field(id), typeof value === 'object' ? value : { value });
    }
    return api;
}

function matrixFor(text, correction = 'M') {
    const qr = qrcode(0, correction);
    qr.addData(text);
    qr.make();
    return qr;
}

const PAYLOAD = 'https://qrtool.dk';

test('quiet zone: the drawn code keeps the white margin the standard requires', () => {
    const api = load();
    const qr = matrixFor(PAYLOAD);
    const canvas = pixelCanvas(SIZE, SIZE);

    api.drawCanvas(qr, SIZE, canvas, 'square');

    const cells = qr.getModuleCount();
    const quiet = quietPixels(cells, SIZE);
    assert.ok(quiet >= 4, `the margin must be at least four modules, got ${quiet}px at ${cells} modules`);

    const white = rgb('#ffffff');
    for (let i = 0; i < quiet; i++) {
        for (let j = 0; j < SIZE; j++) {
            assert.deepEqual(pixelAt(canvas, i, j), white, `column ${i} must be background`);
            assert.deepEqual(pixelAt(canvas, SIZE - 1 - i, j), white, `column ${SIZE - 1 - i} must be background`);
            assert.deepEqual(pixelAt(canvas, j, i), white, `row ${i} must be background`);
            assert.deepEqual(pixelAt(canvas, j, SIZE - 1 - i), white, `row ${SIZE - 1 - i} must be background`);
        }
    }
});

test('quiet zone: a code with the margin still scans back to the same payload', () => {
    const api = load();
    const qr = matrixFor(PAYLOAD);
    const canvas = pixelCanvas(SIZE, SIZE);

    api.drawCanvas(qr, SIZE, canvas, 'square');

    const decoded = jsQR(canvas.data, SIZE, SIZE, { inversionAttempts: 'attemptBoth' });
    assert.ok(decoded, 'jsQR must read the code the site draws');
    assert.equal(decoded.data, PAYLOAD);
});

test('quiet zone: the margin is painted in the colour the user chose', () => {
    const api = load({ bgColor: '#faf5ff', qrColor: '#1a365d' });
    const qr = matrixFor(PAYLOAD);
    const canvas = pixelCanvas(SIZE, SIZE);

    api.drawCanvas(qr, SIZE, canvas, 'square');

    const expected = rgb('#faf5ff');
    const quiet = quietPixels(qr.getModuleCount(), SIZE);
    for (let i = 0; i < quiet; i++) {
        assert.deepEqual(pixelAt(canvas, i, i), expected, 'the margin must follow the background colour');
        assert.deepEqual(pixelAt(canvas, SIZE - 1 - i, SIZE - 1 - i), expected);
    }
});

test('quiet zone: the dotted and rounded styles keep the margin too', () => {
    for (const style of ['dots', 'rounded']) {
        const api = load({ qrStyle: style });
        const qr = matrixFor(PAYLOAD);
        const canvas = pixelCanvas(SIZE, SIZE);

        api.drawCanvas(qr, SIZE, canvas, style);

        const quiet = quietPixels(qr.getModuleCount(), SIZE);
        const white = rgb('#ffffff');
        for (let i = 0; i < quiet; i++) {
            for (let j = 0; j < SIZE; j++) {
                assert.deepEqual(pixelAt(canvas, i, j), white, `${style}: column ${i} must stay background`);
                assert.deepEqual(pixelAt(canvas, j, i), white, `${style}: row ${i} must stay background`);
            }
        }
    }
});

test('quiet zone: a transparent background leaves the margin transparent', () => {
    const api = load({ transparentBg: { checked: true } });
    const qr = matrixFor(PAYLOAD);
    const canvas = pixelCanvas(SIZE, SIZE);

    api.drawCanvas(qr, SIZE, canvas, 'square');

    const quiet = quietPixels(qr.getModuleCount(), SIZE);
    for (let i = 0; i < quiet; i++) {
        // Pixlerne er aldrig blevet malet, så de er gennemsigtige i den hentede PNG
        const [r, g, b, a] = [canvas.data[i * 4], canvas.data[i * 4 + 1], canvas.data[i * 4 + 2], canvas.data[i * 4 + 3]];
        assert.deepEqual([r, g, b, a], [255, 255, 255, 255]);
    }
});

test('quiet zone: the SVG download carries four modules of margin', () => {
    const api = load();
    api.setTab('text');
    api.field('qrText').value = PAYLOAD;
    api.field('fileFormat').value = 'svg';
    api.generateQRCode();

    const svg = api.qrSvg();
    assert.ok(svg, 'generating an SVG must keep the markup for download');

    const qr = matrixFor(api.getQRData());
    const expectedSide = qr.getModuleCount() + 8;
    assert.ok(svg.includes(`viewBox="0 0 ${expectedSide} ${expectedSide}"`),
        `the SVG canvas must be ${expectedSide} modules wide, got: ${svg.split('\n').find(l => l.includes('viewBox'))}`);

    // Baggrundsdæmperne dækker hele SVG'en, og modulerne starter først efter margenen
    const firstMove = svg.match(/M(\d+),(\d+)h1v1h-1z/);
    assert.ok(firstMove, 'the path must carry at least one module');
    assert.ok(Number(firstMove[1]) >= 4, 'no module may start inside the margin');
    assert.ok(Number(firstMove[2]) >= 4, 'no module may start inside the margin');
});

test('quiet zone: the canvas that is handed to the download has the margin', () => {
    const api = load();
    api.setTab('text');
    api.field('qrText').value = PAYLOAD;
    api.field('fileFormat').value = 'png';
    api.generateQRCode();

    const canvas = api.qrCanvas();
    assert.ok(canvas, 'generating a PNG must keep the canvas for download');

    const qr = matrixFor(PAYLOAD);
    const quiet = (SIZE / (qr.getModuleCount() + 8)) * 4;

    const background = canvas.calls.find(call => call.method === 'fillRect');
    assert.ok(background, 'the canvas must be filled with the background colour');
    assert.deepEqual(background.args, [0, 0, SIZE, SIZE], 'the background must cover the whole canvas');

    const modules = canvas.calls.filter(call => call.method === 'fillRect' && call !== background);
    assert.ok(modules.length > 0, 'the code must draw modules');
    for (const call of modules) {
        const [x, y, w, h] = call.args;
        assert.ok(x >= quiet - 0.001, `a module starts at x=${x}, inside the ${quiet}px margin`);
        assert.ok(y >= quiet - 0.001, `a module starts at y=${y}, inside the ${quiet}px margin`);
        assert.ok(x + w <= SIZE - quiet + 0.001, `a module ends at x=${x + w}, inside the ${quiet}px margin`);
        assert.ok(y + h <= SIZE - quiet + 0.001, `a module ends at y=${y + h}, inside the ${quiet}px margin`);
    }
});
