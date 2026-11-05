'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function htmlFiles(dir) {
    return fs.readdirSync(path.join(ROOT, dir))
        .filter(name => name.endsWith('.html'))
        .map(name => path.posix.join(dir, name).replace(/^\.\//, ''));
}

const PAGES = [...htmlFiles('.'), ...htmlFiles('en'), ...htmlFiles('guides')];

test('lazy libs: no page references jsQR or JSZip up front', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        assert.ok(!/jsQR\.min\.js|jszip\.min\.js/.test(html), `${rel} must not load the heavy libs`);
    }
});

test('lazy libs: the scripts load them on use from the same origin', () => {
    assert.match(read('app.js'), /loadLib\('\/lib\/jsQR\.min\.js'/);
    assert.match(read('app.js'), /loadLib\('\/lib\/jszip\.min\.js'/);
    assert.match(read('lib/qr-page.js'), /script\.src = '\/lib\/jsQR\.min\.js'/);
    assert.match(read('lib/qr-scan.js'), /script\.src = '\/lib\/jsQR\.min\.js'/);
});

test('lazy libs: batch shows a loading message and a failure message', () => {
    const app = read('app.js');
    assert.match(app, /'batch\.loadingZip': 'Henter ZIP/);
    assert.match(app, /'batch\.loadingZip': 'Loading the ZIP/);
    assert.match(app, /batch\.jszipMissing/);
});
