'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { createBrowserEnv, createElement } = require('./helpers/dom-stub');

const ROOT = path.join(__dirname, '..');

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// What this guards
//
// Every page loads Plausible with the outbound-links and file-downloads
// extensions. They listen for clicks on the whole document, find the nearest
// <a href>, and report it on their own, with no plausible(...) call anywhere in
// our code:
//   - a link to another host is sent as "Outbound Link: Click", url = the full
//     href, query string included
//   - a link that ends in .pdf, .zip and so on is sent as "File Download"
//
// The scanner used to put the text it had just read into <a id="scanOpenLink">.
// Clicking "Åbn link" therefore sent whatever URL was inside the QR code to the
// analytics server. The privacy claim in privacy-claim.test.js cannot see that,
// because it only looks for explicit calls.
//
// The extensions only look at <a> elements, so the scanned link is opened from a
// button with window.open instead, and the tests below keep it that way.

const SCANNED = 'https://example.com/private/menu.pdf?token=abc123';
const SCAN_PAGES = ['scan-qr-kode.html', 'en/scan-qr-code.html'];
const VENDOR_LIBS = new Set(['jsQR.min.js', 'jszip.min.js', 'qrcode.js']);

function htmlFiles() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
            const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html')) files.push(rel);
        }
    };
    walk('.');
    return files.sort();
}

function inlineScripts(html) {
    return [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:application\/ld\+json|speculationrules)")[^>]*>([\s\S]*?)<\/script>/gi)]
        .map(m => m[1]);
}

// ---- the class: nothing typed or scanned may end up in a link ----------------

// Everything that can give an <a> an href from script. Each hit must be listed
// below with the reason it carries no typed or scanned content. A new hit means
// the author has to prove the same thing, here, before the test goes green.
const LINK_SINK = /[\w$.]+\.href\s*=(?!=)\s*[^;\n]+|setAttribute\(\s*['"]href['"][^)]*\)|createElement\(\s*['"]a['"]\s*\)|<a\s[^>]*href\s*=/g;

const ALLOWED_LINK_SINKS = [
    // Download buttons: a blob: URL for the file the visitor just made. A blob URL
    // has no host and no file extension, so neither extension reports it.
    "app.js: createElement('a')",
    'app.js: link.href = url',
    "lib/qr-page.js: createElement('a')",
    'lib/qr-page.js: link.href = url',
    // The language switch points at the same page in the other language.
    'app.js: langBtn.href = altLink.href'
];

test('privacy claim: no script gives a link an href that holds typed or scanned content', () => {
    const sources = ['app.js', 'sw.js'];
    for (const f of fs.readdirSync(path.join(ROOT, 'lib'))) {
        if (f.endsWith('.js') && !VENDOR_LIBS.has(f)) sources.push(`lib/${f}`);
    }

    const found = [];
    for (const rel of sources) {
        for (const m of read(rel).matchAll(LINK_SINK)) found.push(`${rel}: ${m[0].trim()}`);
    }
    for (const rel of htmlFiles()) {
        for (const code of inlineScripts(read(rel))) {
            for (const m of code.matchAll(LINK_SINK)) found.push(`${rel} (inline): ${m[0].trim()}`);
        }
    }

    assert.deepEqual(found.sort(), ALLOWED_LINK_SINKS.slice().sort());
});

// Plausible sends location.href with every pageview, and the hash extension also
// reports the fragment. Typed or scanned content would reach it if a script wrote
// it to the address bar, or if a <form> sent the inputs along in a GET query. No
// page does either today.
test('privacy claim: nothing typed or scanned can end up in the page URL', () => {
    // `var location = ...` is a local variable (the calendar form's place field), not the address bar.
    const URL_WRITE = /(?<!(?:var|let|const)\s+)\blocation(?:\.(?:hash|search|href|pathname))?\s*=(?!=)|\blocation\.(?:replace|assign)\s*\(|\b(?:push|replace)State\s*\(/;
    const hits = [];

    for (const rel of htmlFiles()) {
        const html = read(rel);
        if (/<form\b/i.test(html)) hits.push(`${rel}: <form>`);
        for (const code of inlineScripts(html)) {
            if (URL_WRITE.test(code)) hits.push(`${rel}: writes to the URL`);
        }
    }
    const sources = ['app.js', 'sw.js'];
    for (const f of fs.readdirSync(path.join(ROOT, 'lib'))) {
        if (f.endsWith('.js') && !VENDOR_LIBS.has(f)) sources.push(`lib/${f}`);
    }
    for (const rel of sources) {
        if (URL_WRITE.test(read(rel))) hits.push(`${rel}: writes to the URL`);
    }

    assert.deepEqual(hits, []);
});

// ---- the scanner pages -------------------------------------------------------

function openControlTag(rel) {
    const m = read(rel).match(/<(\w+)\b[^>]*\bid="scanOpenLink"/);
    assert.ok(m, `${rel} has no #scanOpenLink`);
    return m[1].toLowerCase();
}

for (const rel of SCAN_PAGES) {
    test(`scanner privacy: ${rel} opens the scanned link from a button, not an <a>`, () => {
        assert.equal(openControlTag(rel), 'button');
        assert.doesNotMatch(read(rel), /<a\b[^>]*\bid="scanOpenLink"/);
    });
}

// Runs the real lib/qr-scan.js against a stub DOM in which #scanOpenLink has the
// tag the page really uses, and records every way the code could reach out.
function loadScanner(tag) {
    const env = createBrowserEnv();
    const { document, window } = env;
    const openControl = createElement('scanOpenLink', tag);
    document.elements.set('scanOpenLink', openControl);

    const calls = { opened: [], plausible: [], beacons: [], fetches: [] };
    window.open = (...args) => { calls.opened.push(args); return null; };
    window.plausible = (...args) => { calls.plausible.push(args); };
    env.globals.navigator.sendBeacon = (...args) => { calls.beacons.push(args); return true; };
    const fetchStub = (...args) => { calls.fetches.push(args); return Promise.resolve({ ok: false }); };

    vm.runInNewContext(read('lib/qr-scan.js'), {
        window,
        document,
        navigator: env.globals.navigator,
        fetch: fetchStub,
        plausible: window.plausible,
        console
    });

    return { QRScan: window.QRScan, document, openControl, calls };
}

function anchorsHolding(document, needle) {
    return [...document.elements.values()]
        .filter(el => el.tagName === 'A')
        .filter(el => String(el.href || '').includes(needle) || String(el.attributes.href || '').includes(needle))
        .map(el => el.id);
}

for (const rel of SCAN_PAGES) {
    test(`scanner privacy: ${rel} never puts the scanned link in an anchor`, () => {
        const { QRScan, document } = loadScanner(openControlTag(rel));
        QRScan.showResult(SCANNED);
        assert.deepEqual(anchorsHolding(document, 'token=abc123'), []);
    });

    test(`scanner privacy: ${rel} still opens a scanned link in a new tab`, () => {
        const { QRScan, openControl, calls } = loadScanner(openControlTag(rel));
        QRScan.showResult(SCANNED);
        assert.equal(openControl.style.display, '');
        openControl.click();
        assert.equal(calls.opened.length, 1);
        const [url, target, features] = calls.opened[0];
        assert.equal(url, SCANNED);
        assert.equal(target, '_blank');
        assert.match(features, /noopener/);
    });

    test(`scanner privacy: ${rel} offers no open button for text that is not a link`, () => {
        const { QRScan, openControl, calls } = loadScanner(openControlTag(rel));
        QRScan.showResult('WIFI:T:WPA;S:Gæstenet;P:hemmelig;;');
        assert.equal(openControl.style.display, 'none');
        openControl.click();
        assert.deepEqual(calls.opened, []);
    });

    test(`scanner privacy: ${rel} reads a result without any analytics or network call`, () => {
        const { QRScan, openControl, calls } = loadScanner(openControlTag(rel));
        QRScan.showResult(SCANNED);
        openControl.click();
        assert.deepEqual(calls.plausible, []);
        assert.deepEqual(calls.beacons, []);
        assert.deepEqual(calls.fetches, []);
    });
}
