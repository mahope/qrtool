'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SCANNER = { da: '/scan-qr-kode', en: '/en/scan-qr-code' };
const SCANNER_FILE = { da: 'scan-qr-kode.html', en: 'en/scan-qr-code.html' };

function htmlFiles() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
            const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html') && entry.name !== '404.html') files.push(rel);
        }
    };
    walk('.');
    return files.sort();
}

function langOf(rel) {
    return rel.startsWith('en/') ? 'en' : 'da';
}

function anchors(html) {
    return [...html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>/gi)].map(m => m[1]);
}

// /scan-qr-kode used to get links from the front page only, so Google had one
// internal vote for a cluster of 6,700 searches a month.
test('scanner: every page links to the scanner page in its own language', () => {
    const missing = [];
    for (const rel of htmlFiles()) {
        const lang = langOf(rel);
        if (rel === SCANNER_FILE[lang]) continue;
        const hrefs = anchors(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
        if (!hrefs.includes(SCANNER[lang])) missing.push(`${rel} -> ${SCANNER[lang]}`);
    }
    assert.deepEqual(missing, []);
});

test('scanner: the link sits in the footer of the pages, not only in the body', () => {
    const missing = [];
    for (const rel of htmlFiles()) {
        const lang = langOf(rel);
        if (rel === SCANNER_FILE[lang]) continue;
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        // The legal pages are one-liners with a "back to the front page" row instead of a footer.
        const start = Math.max(html.lastIndexOf('<footer'), html.lastIndexOf('<p><a href="/'));
        const tail = start === -1 ? html.slice(-2500) : html.slice(start);
        if (!tail.includes(`href="${SCANNER[lang]}"`)) missing.push(rel);
    }
    assert.deepEqual(missing, []);
});

test('scanner: the front pages teach where the scanner lives, from the footer and the body', () => {
    for (const [rel, lang] of [['index.html', 'da'], ['en/index.html', 'en']]) {
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        const count = anchors(html).filter(h => h === SCANNER[lang]).length;
        assert.ok(count >= 3, `${rel} links to the scanner ${count} times`);
    }
});

test('scanner: no page links to the scanner of the other language', () => {
    const wrong = [];
    for (const rel of htmlFiles()) {
        const lang = langOf(rel);
        // each scanner page links to its counterpart through the language switcher
        if (rel === SCANNER_FILE[lang]) continue;
        const other = lang === 'da' ? SCANNER.en : SCANNER.da;
        if (anchors(fs.readFileSync(path.join(ROOT, rel), 'utf8')).includes(other)) wrong.push(rel);
    }
    assert.deepEqual(wrong, []);
});
