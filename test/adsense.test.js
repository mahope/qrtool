'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TAG = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1902871361369866" crossorigin="anonymous"></script>';
// offline.html is only shown when there is no network, so the script could never load there.
const NO_TAG = new Set(['offline.html']);

function htmlFiles(dir = '.') {
    const files = [];
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
        const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
        if (entry.isDirectory()) files.push(...htmlFiles(rel));
        else if (entry.name.endsWith('.html')) files.push(rel);
    }
    return files;
}

test('AdSense: every public page loads the script once, inside <head>', () => {
    const problems = [];
    for (const rel of htmlFiles()) {
        if (NO_TAG.has(rel)) continue;
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        const head = html.slice(0, html.indexOf('</head>'));
        if (head.split(TAG).length !== 2) problems.push(rel);
    }
    assert.deepEqual(problems, []);
});

test('AdSense: no ad units yet, and no home-made consent banner', () => {
    const hits = htmlFiles().filter(rel => /class="[^"]*adsbygoogle|cookie-consent-banner/.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
    assert.deepEqual(hits, []);
});

test('AdSense: ads.txt names the publisher and is built into dist/', () => {
    const ads = fs.readFileSync(path.join(ROOT, 'ads.txt'), 'utf8').trim();
    assert.equal(ads, 'google.com, pub-1902871361369866, DIRECT, f08c47fec0942fa0');
    assert.match(fs.readFileSync(path.join(ROOT, 'build.js'), 'utf8'), /'ads\.txt'/);
});

test('AdSense: the policies mention AdSense and Google\'s consent dialog', () => {
    for (const rel of ['privatlivspolitik.html', 'cookiepolitik.html', 'en/privacy-policy.html', 'en/cookie-policy.html']) {
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        assert.match(html, /AdSense/, rel);
        assert.match(html, /20\. november 2026|20 November 2026/, rel);
    }
});
