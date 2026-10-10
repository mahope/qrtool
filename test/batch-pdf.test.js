'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, APP_FILE } = require('./helpers/load-app');

// En canvas der opfører sig som browserens lige nok til canvasToPdfBlob
function stubCanvas(api, size) {
    const canvas = api.env.document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

// Batch-genereringen blev kørt med det samme `format` som enkelt-download, så
// en ZIP med "PDF" valgt blev til filer med PNG-bytes og endelsen .pdf. Disse
// tests holder PDF-grenen på plads.

test('the batch ZIP holds a real PDF when the format is PDF', () => {
    const api = loadApp();
    assert.deepEqual(api.batchOutput('pdf'), { ext: 'pdf', mime: 'application/pdf' });
});

test('a PDF entry in the batch ZIP still starts with the PDF header', () => {
    const api = loadApp();
    const canvas = stubCanvas(api, 354);
    return api.canvasToPdfBlob(canvas, 30).then(blob => {
        assert.equal(blob.type, 'application/pdf');
        return blob.arrayBuffer();
    }).then(buf => {
        const head = Buffer.from(buf).subarray(0, 8).toString('latin1');
        assert.equal(head, '%PDF-1.4');
    });
});

test('a PDF entry in the batch ZIP is one page at the chosen print size', () => {
    const api = loadApp();
    const canvas = stubCanvas(api, 354);
    return api.canvasToPdfBlob(canvas, 30).then(blob => blob.arrayBuffer()).then(buf => {
        const text = Buffer.from(buf).toString('latin1');
        // 30 mm = 85.04 pt (mm * 72 / 25.4)
        assert.match(text, /\/MediaBox \[0 0 85\.04 85\.04\]/);
        assert.match(text, /\/Count 1 >>/);
    });
});

test('without a print size the batch PDF falls back to A4', () => {
    const api = loadApp();
    const canvas = stubCanvas(api, 512);
    return api.canvasToPdfBlob(canvas, null).then(blob => blob.arrayBuffer()).then(buf => {
        const text = Buffer.from(buf).toString('latin1');
        assert.match(text, /\/MediaBox \[0 0 595\.28 841\.89\]/);
    });
});

test('the batch loop renders a PDF at print resolution, not at the picker size', () => {
    const source = require('fs').readFileSync(APP_FILE, 'utf8');
    assert.match(source, /const renderSize = mm \? mmToPixels\(mm\) : size;/);
    assert.match(source, /zip\.file\(`qr-\$\{i \+ 1\}\.pdf`, await canvasToPdfBlob\(canvas, mm\)\);/);
});

test('PNG, JPG, WebP and SVG still keep their own file types in the batch ZIP', () => {
    const api = loadApp();
    assert.deepEqual(api.batchOutput('png'), { ext: 'png', mime: 'image/png' });
    assert.deepEqual(api.batchOutput('jpg'), { ext: 'jpg', mime: 'image/jpeg' });
    assert.deepEqual(api.batchOutput('webp'), { ext: 'webp', mime: 'image/webp' });
    assert.deepEqual(api.batchOutput('svg'), { ext: 'svg', mime: 'image/svg+xml' });
});
