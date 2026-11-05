'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode, jsQR } = require('./helpers/load-app');

const PAYLOAD = 'https://qrtool.dk/pdf-test';

// PDF-eksporten tegner koden som vektor direkte fra modulmatricen. Disse tests
// læser selve PDF-teksten: ingen indlejret billede, rektangler svarende til
// matricen, nøjagtig sidestørrelse i mm og en indholdsstrøm der kan
// rasteriseres og afkodes igen.

function setup(style = 'square', extra = {}) {
    const api = loadApp(extra.load);
    api.field('qrColor').value = '#000000';
    api.field('bgColor').value = '#ffffff';
    api.field('transparentBg').checked = false;
    api.field('qrStyle').value = style;
    const qr = qrcode(0, 'M');
    qr.addData(extra.payload || PAYLOAD);
    qr.make();
    return { api, qr };
}

async function pdfOf(blob) {
    return Buffer.from(await blob.arrayBuffer()).toString('latin1');
}

function darkCount(qr) {
    let n = 0;
    const cells = qr.getModuleCount();
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) if (qr.isDark(y, x)) n++;
    return n;
}

function rowRuns(qr) {
    const cells = qr.getModuleCount();
    let runs = 0;
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            if (qr.isDark(y, x) && (x === 0 || !qr.isDark(y, x - 1))) runs++;
        }
    }
    return runs;
}

// Indholdsstrømmen af (første) side
function contentOf(text) {
    const m = text.match(/\/Contents (\d+) 0 R/);
    const obj = text.match(new RegExp(`\\n${m[1]} 0 obj\\n<<\\s+/Length \\d+ >>\\nstream\\n([\\s\\S]*?)\\nendstream`));
    return obj[1];
}

test('vector PDF has no embedded image for the code itself', async () => {
    for (const style of ['square', 'rounded', 'dots']) {
        const { api, qr } = setup(style);
        const text = await pdfOf(api.buildQRVectorPDF(qr, 30, style, null));
        assert.ok(text.startsWith('%PDF-1.4'));
        assert.ok(!text.includes('/Subtype /Image'), `${style}: no image`);
        assert.ok(!text.includes('DCTDecode'), `${style}: no JPEG`);
    }
});

test('square style: filled area equals the dark modules of the matrix', async () => {
    const { api, qr } = setup('square');
    const content = contentOf(await pdfOf(api.buildQRVectorPDF(qr, 30, 'square', null)));
    const rects = [...content.matchAll(/^(\d+) (\d+) (\d+) 1 re$/gm)];
    assert.equal(rects.length, rowRuns(qr), 'one rectangle per run of dark modules');
    const area = rects.reduce((sum, m) => sum + Number(m[3]), 0);
    assert.equal(area, darkCount(qr), 'summed run lengths equal the dark module count');
    assert.ok(rects.length < darkCount(qr), 'runs are merged');
});

test('rounded and dots: one module shape per dark module, drawn as Bezier curves', async () => {
    for (const style of ['rounded', 'dots']) {
        const { api, qr } = setup(style);
        const text = await pdfOf(api.buildQRVectorPDF(qr, 30, style, null));
        const content = contentOf(text);
        assert.equal((content.match(/\/M Do/g) || []).length, darkCount(qr), style);
        const form = text.match(/\/Subtype \/Form[^>]*>>\nstream\n([\s\S]*?)\nendstream/)[1];
        assert.match(form, / c\n/, `${style}: curves`);
    }
});

test('MediaBox and code width follow the print size within 0.01 mm', async () => {
    for (const mm of [20, 30, 50]) {
        const { api, qr } = setup('square');
        const text = await pdfOf(api.buildQRVectorPDF(qr, mm, 'square', null));
        const box = text.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
        const pageMm = Number(box[1]) * 25.4 / 72;
        assert.ok(Math.abs(pageMm - mm) < 0.01, `${mm} mm page is ${pageMm} mm`);
        assert.equal(box[1], box[2]);
        // Baggrunden dækker hele koden inkl. stille zone: dens bredde er kodens bredde
        const bg = contentOf(text).match(/^([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re f$/m);
        const codeMm = Number(bg[3]) * 25.4 / 72;
        assert.ok(Math.abs(codeMm - mm) < 0.01, `${mm} mm code is ${codeMm} mm`);
        // Modulstørrelsen i cm gange modulantallet giver samme bredde
        const cm = contentOf(text).match(/^([\d.]+) 0 0 ([\d.]+) 0 0 cm$/m);
        const modules = qr.getModuleCount() + 8;
        assert.ok(Math.abs(Number(cm[1]) * modules * 25.4 / 72 - mm) < 0.01);
    }
});

test('without a print size the code is 400 pt, centred on A4', async () => {
    const { api, qr } = setup('square');
    const text = await pdfOf(api.buildQRVectorPDF(qr, null, 'square', null));
    assert.match(text, /\/MediaBox \[0 0 595\.28 841\.89\]/);
    assert.match(contentOf(text), /^97\.64 220\.945 400 400 re f$/m);
});

test('transparent background draws no background fill', async () => {
    const { api, qr } = setup('square');
    api.field('transparentBg').checked = true;
    const content = contentOf(await pdfOf(api.buildQRVectorPDF(qr, 30, 'square', null)));
    assert.ok(!/ re f$/m.test(content));
});

test('colors become rg operators', async () => {
    const { api, qr } = setup('square');
    api.field('qrColor').value = '#ff0000';
    api.field('bgColor').value = '#0000ff';
    const content = contentOf(await pdfOf(api.buildQRVectorPDF(qr, 30, 'square', null)));
    assert.match(content, /^0 0 1 rg$/m);
    assert.match(content, /^1 0 0 rg$/m);
});

test('a 30 mm code is not larger than the old JPEG file (32 KB)', async () => {
    for (const style of ['square', 'rounded', 'dots']) {
        const { api, qr } = setup(style);
        const blob = api.buildQRVectorPDF(qr, 30, style, null);
        assert.ok(blob.size <= 32 * 1024, `${style}: ${blob.size} bytes`);
    }
});

test('a logo is placed as an image on top while the code stays vector', async () => {
    const { api, qr } = setup('square');
    const logo = { bytes: new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9]), w: 10, h: 10 };
    const text = await pdfOf(api.buildQRVectorPDF(qr, 30, 'square', logo));
    assert.equal((text.match(/\/Subtype \/Image/g) || []).length, 1, 'only the logo is an image');
    assert.match(contentOf(text), /\/Im0 Do/);
    assert.ok(/^\d+ 0 0 1 re$|^\d+ \d+ \d+ 1 re$/m.test(contentOf(text)), 'modules are still rectangles');
});

test('xref offsets point at every object', async () => {
    const { api, qr } = setup('dots');
    const text = await pdfOf(api.buildQRVectorPDF(qr, 30, 'dots', null));
    const xref = text.lastIndexOf('\nxref\n') + 1;
    const count = Number(text.slice(xref).match(/xref\n0 (\d+)\n/)[1]);
    const start = text.indexOf('\n', text.indexOf('\n', xref) + 1) + 1;
    for (let i = 1; i < count; i++) {
        const entry = text.slice(start + i * 20, start + (i + 1) * 20);
        const offset = Number(entry.slice(0, 10));
        assert.equal(text.slice(offset, offset + `${i} 0 obj`.length), `${i} 0 obj`);
    }
    assert.equal(Number(text.match(/startxref\n(\d+)/)[1]), xref);
});

// --- Rasterisering af indholdsstrømmen ---------------------------------
// En lille fortolker for præcis de operatorer bygger bruger (q, Q, cm, re, f,
// rg, Do mod modulformen). Den viser at koordinater og y-vending er rigtige
// ved at afkode resultatet med jsQR. En rigtig PDF-gengivelse er målt separat.

function mul(m, n) {
    return [
        m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
        m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
        m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]
    ];
}

function rasterize(text, style, scale) {
    const box = text.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    const W = Math.round(Number(box[1]) * scale);
    const H = Math.round(Number(box[2]) * scale);
    const px = new Uint8ClampedArray(W * H * 4).fill(255);
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    let dark = false;
    const rects = [];

    // pdf-punkt til pixel (y vendt)
    const paintShape = (m, test) => {
        const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [u * m[0] + v * m[2] + m[4], u * m[1] + v * m[3] + m[5]]);
        const xs = corners.map(c => c[0] * scale);
        const ys = corners.map(c => (Number(box[2]) - c[1]) * scale);
        const det = m[0] * m[3] - m[1] * m[2];
        for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(H, Math.ceil(Math.max(...ys))); y++) {
            for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(W, Math.ceil(Math.max(...xs))); x++) {
                const X = (x + 0.5) / scale;
                const Y = Number(box[2]) - (y + 0.5) / scale;
                const dx = X - m[4];
                const dy = Y - m[5];
                const u = (dx * m[3] - dy * m[2]) / det;
                const v = (dy * m[0] - dx * m[1]) / det;
                if (u < 0 || u > 1 || v < 0 || v > 1 || !test(u, v)) continue;
                const i = (y * W + x) * 4;
                const c = dark ? 0 : 255;
                px[i] = px[i + 1] = px[i + 2] = c;
            }
        }
    };

    // Operander samles på en stak til næste operator; q/Q/cm/rg/re/f/Do forstås
    let operands = [];
    for (const token of contentOf(text).split(/\s+/)) {
        if (!/^(q|Q|cm|rg|re|f|h|m|l|c|Do|BT|ET|Tf|Tm|Tj)$/.test(token)) {
            operands.push(token);
            continue;
        }
        const n = operands.map(Number);
        if (token === 'q') stack.push(ctm.slice());
        else if (token === 'Q') ctm = stack.pop();
        else if (token === 'cm') ctm = mul(n, ctm);
        else if (token === 'rg') dark = n[0] === 0 && n[1] === 0 && n[2] === 0;
        else if (token === 're') rects.push(n);
        else if (token === 'f') {
            rects.forEach(r => paintShape(mul([r[2], 0, 0, r[3], r[0], r[1]], ctm), () => true));
            rects.length = 0;
        } else if (token === 'Do' && operands[0] === '/M') {
            const test = style === 'dots'
                ? (u, v) => (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.25
                : (u, v) => {
                    const cx = Math.min(Math.max(u, 0.3), 0.7);
                    const cy = Math.min(Math.max(v, 0.3), 0.7);
                    return (u - cx) ** 2 + (v - cy) ** 2 <= 0.09;
                };
            paintShape(ctm, test);
        }
        operands = [];
    }
    return { px, W, H };
}

// jsQR er følsom over for rund-formede moduler: den læser de tegnede afrundede
// og prikkede koder ved nogle opløsninger og ikke ved andre, også når de males
// direkte fra matricen uden PDF. 3 px pr. punkt (ca. 8 px pr. modul ved 30 mm)
// er en opløsning, hvor alle tre stilarter læses. Standard læses ved alle.
test('square vector PDF decodes at every raster scale', async () => {
    const { api, qr } = setup('square');
    const text = await pdfOf(api.buildQRVectorPDF(qr, 30, 'square', null));
    for (const scale of [2, 3, 4, 6, 8]) {
        const { px, W, H } = rasterize(text, 'square', scale);
        const decoded = jsQR(px, W, H);
        assert.ok(decoded, `scale ${scale}`);
        assert.equal(decoded.data, PAYLOAD);
    }
});

test('a rasterised vector PDF decodes to the exact string (square, rounded, dots)', async () => {
    for (const style of ['square', 'rounded', 'dots']) {
        const { api, qr } = setup(style);
        const text = await pdfOf(api.buildQRVectorPDF(qr, 30, style, null));
        const { px, W, H } = rasterize(text, style, 3);
        const decoded = jsQR(px, W, H);
        assert.ok(decoded, `${style}: jsQR reads the rasterised page`);
        assert.equal(decoded.data, PAYLOAD, style);
    }
});

test('the A4 vector PDF decodes too', async () => {
    const { api, qr } = setup('square');
    const text = await pdfOf(api.buildQRVectorPDF(qr, null, 'square', null));
    const { px, W, H } = rasterize(text, 'square', 2);
    const decoded = jsQR(px, W, H);
    assert.ok(decoded);
    assert.equal(decoded.data, PAYLOAD);
});

test('batch print sheet is a vector PDF with one page per sheet and text labels', async () => {
    const { api } = setup('rounded');
    const lines = Array.from({ length: 30 }, (_, i) => `https://example.com/${i}`);
    const text = await pdfOf(api.buildBatchSheetVectorPDF(lines, 'rounded', 'M'));
    assert.ok(!text.includes('/Subtype /Image'));
    const pages = api.sheetPages(lines).length;
    assert.ok(text.includes(`/Count ${pages}`));
    assert.equal((text.match(/\/Type \/Page /g) || []).length, pages);
    assert.ok((text.match(/ Tj ET/g) || []).length === lines.length, 'one label per code');
});
