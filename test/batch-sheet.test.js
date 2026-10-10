'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

// The batch export could only give one file per code (ZIP). For labels and
// sheets the user wants several codes on one printable A4 page. These tests
// pin the grid layout, that every code lands on a page, and that a batch too
// big for one sheet is split over several A4 pages in the same PDF.

function pdfText(promise) {
    return promise.then(buf => Buffer.from(buf).toString('latin1'));
}

// Every xref entry must point at the object it claims to (byte offset ===
// "N 0 obj"), otherwise readers reject the file.
function xrefPointsAtObjects(text) {
    const xref = text.indexOf('xref\n');
    const header = text.slice(xref).match(/xref\n0 (\d+)\n/);
    assert.ok(header, 'xref header');
    const count = Number(header[1]);
    const start = xref + 5 + 2 + header[1].length + 1;
    for (let i = 1; i < count; i++) {
        const entry = text.slice(start + i * 20, start + (i + 1) * 20);
        const offset = Number(entry.slice(0, 10));
        const expected = `${i} 0 obj`;
        if (text.slice(offset, offset + expected.length) !== expected) return false;
    }
    return true;
}

test('sheetLayout fits one code in a 2-column A4 grid', () => {
    const api = loadApp();
    const layout = api.sheetLayout(1);
    assert.equal(layout.cols, 2);
    assert.ok(layout.perPage >= 1);
    assert.ok(layout.cell > 0);
});

test('sheetLayout grows the column count with the number of codes', () => {
    const api = loadApp();
    const small = api.sheetLayout(4);
    const big = api.sheetLayout(30);
    assert.ok(big.cols > small.cols);
    assert.ok(big.cell < small.cell);
    assert.ok(big.perPage >= big.cols);
});

test('buildBatchSheetCanvas places one image per code', () => {
    const api = loadApp();
    const lines = ['https://a.dk', 'https://b.dk', 'https://c.dk', 'https://d.dk', 'https://e.dk'];
    const { canvas, used, perPage } = api.buildBatchSheetCanvas(lines, 'square', 'M');
    assert.equal(used, 5);
    assert.ok(perPage >= 5);
    const draws = canvas.calls.filter(c => c.method === 'drawImage');
    assert.equal(draws.length, 5);
});

test('buildBatchSheetCanvas draws only the codes of the page it is given', () => {
    const api = loadApp();
    const layout = api.sheetLayout(100);
    const page = Array.from({ length: 16 }, (_, i) => `https://example.com/${i}`);
    const { canvas, used } = api.buildBatchSheetCanvas(page, 'square', 'M', layout);
    assert.equal(used, 16);
    const draws = canvas.calls.filter(c => c.method === 'drawImage');
    assert.equal(draws.length, 16);
});

test('sheetPages splits a 100-code batch into full A4 pages', () => {
    const api = loadApp();
    const lines = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
    const { perPage } = api.sheetLayout(100);
    const pages = api.sheetPages(lines);
    assert.ok(pages.length > 1, 'a batch of 100 needs more than one page');
    pages.forEach(page => assert.ok(page.length <= perPage));
    assert.equal(pages[0].length, perPage, 'the first page is filled up');
    assert.equal(pages.flat().length, 100, 'every code lands on a page');
});

test('sheetPages keeps a small batch on one page', () => {
    const api = loadApp();
    const pages = api.sheetPages(['https://a.dk', 'https://b.dk']);
    assert.equal(pages.length, 1);
    assert.deepEqual(pages[0], ['https://a.dk', 'https://b.dk']);
});

test('buildSheetPDF fills an A4 page and is a real PDF', () => {
    const api = loadApp();
    const blob = api.buildSheetPDF(new Uint8Array([1, 2, 3]), 2480, 3508);
    assert.equal(blob.type, 'application/pdf');
    return pdfText(blob.arrayBuffer()).then(text => {
        assert.ok(text.startsWith('%PDF-1.4'));
        assert.ok(text.includes('/MediaBox [0 0 595.28 841.89]'));
        assert.ok(xrefPointsAtObjects(text));
    });
});

test('buildMultiPageSheetPDF gives every sheet its own PDF page', () => {
    const api = loadApp();
    const jpegs = [0, 1, 2].map(i => ({ bytes: new Uint8Array([i + 1]), w: 2480, h: 3508 }));
    const blob = api.buildMultiPageSheetPDF(jpegs);
    assert.equal(blob.type, 'application/pdf');
    return pdfText(blob.arrayBuffer()).then(text => {
        assert.ok(text.startsWith('%PDF-1.4'));
        assert.ok(text.includes('/Count 3'));
        assert.equal((text.match(/\/Type \/Page /g) || []).length, 3);
        assert.equal((text.match(/\/DCTDecode/g) || []).length, 3, 'each page embeds its sheet image');
        assert.ok(text.trimEnd().endsWith('%%EOF'));
        assert.ok(xrefPointsAtObjects(text));
    });
});

test('the print sheet button downloads one PDF with a page per sheet', async () => {
    const captured = [];
    const URLStub = {
        createObjectURL: blob => { captured.push(blob); return 'blob:mock'; },
        revokeObjectURL: () => {}
    };
    const api = loadApp({ globals: { URL: URLStub } });
    api.field('qrStyle').value = 'square';
    api.field('errorCorrection').value = 'M';
    api.field('batchInput').value = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`).join('\n');

    api.field('batchSheetBtn').click();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(captured.length, 1, 'exactly one file is downloaded');
    assert.equal(captured[0].type, 'application/pdf');
    const text = await pdfText(captured[0].arrayBuffer());
    assert.ok(text.includes('/Count 3'), '100 codes become three A4 pages');

    const toasts = api.env.getElementById('toastContainer').children;
    const message = toasts[toasts.length - 1].children[1].textContent;
    assert.ok(message.includes('100') && message.includes('3'), `toast tells the whole batch: ${message}`);
});
