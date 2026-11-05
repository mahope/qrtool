'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadApp, APP_FILE } = require('./helpers/load-app');
const { loadQRPage, QR_PAGE_FILE } = require('./helpers/load-qr-page');

for (const size of [256, 512, 1024, 2048]) {
    for (const renderer of ['app', 'page']) {
        test(`${renderer}: integer cells tile the full ${size}px canvas`, () => {
            const calls = [];
            const canvas = { width: size, height: size, getContext: () => ({
                fillRect: (...args) => calls.push(args)
            }) };
            const cells = 25;
            const qr = { getModuleCount: () => cells, isDark: () => true };
            const app = loadApp();
            app.field('transparentBg').checked = false;
            if (renderer === 'app') app.drawCanvas(qr, size, canvas, 'square');
            else loadQRPage().api.drawCanvas(qr, size, canvas, '#000000');
            assert.equal(canvas.width, size);
            assert.equal(canvas.height, size);
            assert.deepEqual(calls.shift(), [0, 0, size, size]);
            assert.equal(calls.length, cells * cells);
            const boundary = i => Math.round(i * size / (cells + 8));
            for (let row = 0; row < cells; row++) {
                for (let col = 0; col < cells; col++) {
                    const [x, y, w, h] = calls[row * cells + col];
                    assert.ok([x, y, w, h].every(Number.isInteger), 'module bounds must be integers');
                    assert.deepEqual([x, y, x + w, y + h],
                        [boundary(col + 4), boundary(row + 4), boundary(col + 5), boundary(row + 5)]);
                    if (col + 1 < cells) assert.equal(x + w, calls[row * cells + col + 1][0]);
                    if (row + 1 < cells) assert.equal(y + h, calls[(row + 1) * cells + col][1]);
                    assert.ok(Math.abs(w - h) <= 1);
                }
            }
            assert.equal(boundary(0), 0);
            assert.equal(boundary(cells + 8), size);
        });
    }
}

test('the two module-boundary helpers stay identical without extra script tags', () => {
    const helper = file => fs.readFileSync(file, 'utf8')
        .match(/function moduleBounds\(index, scale\) \{[\s\S]*?\n\s*\}/)?.[0].replace(/\s+/g, ' ');
    assert.ok(helper(APP_FILE), 'app must define moduleBounds');
    assert.equal(helper(APP_FILE), helper(QR_PAGE_FILE));
});
