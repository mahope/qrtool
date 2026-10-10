'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

// The batch export could only give one file per code (ZIP). For labels and
// sheets the user wants several codes on one printable A4 page. These tests
// pin the grid layout and that every code actually lands on the page.

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

test('buildBatchSheetCanvas caps the sheet at one page', () => {
    const api = loadApp();
    const lines = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
    const { used, perPage } = api.buildBatchSheetCanvas(lines, 'square', 'M');
    assert.equal(used, perPage);
});

test('buildSheetPDF fills an A4 page and is a real PDF', () => {
    const api = loadApp();
    const blob = api.buildSheetPDF(new Uint8Array([1, 2, 3]), 2480, 3508);
    assert.equal(blob.type, 'application/pdf');
    return blob.arrayBuffer().then(buf => {
        const text = Buffer.from(buf).toString('latin1');
        assert.ok(text.startsWith('%PDF-1.4'));
        assert.ok(text.includes('/MediaBox [0 0 595.28 841.89]'));
    });
});
