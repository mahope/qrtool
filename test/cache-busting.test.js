'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const { VERSIONED, computeVersion } = require('../build-version');

// Cloudflare caches app.js/style.css for 7 days per URL. If the `?v=` token is
// not derived from the asset contents, a deploy keeps serving the old file to
// every visitor until the cache expires. The build injects the token; these
// tests fail when that stops happening (e.g. a hardcoded `?v=8`).

function distHtml() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const rel = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html')) files.push(rel);
        }
    };
    walk(DIST);
    return files;
}

test('cache-busting: every versioned asset reference in dist/ uses the content hash', () => {
    const expected = computeVersion(DIST);
    const refs = [
        ...distHtml().flatMap(rel => {
            const html = fs.readFileSync(rel, 'utf8');
            return [...html.matchAll(/(?:href|src)="([^"]*(?:style\.css|app\.js|lib\/qrcode\.js)[^"]*)"/g)]
                .map(m => `${path.relative(DIST, rel)}: ${m[1]}`);
        })
    ];
    assert.ok(refs.length > 0, 'no versioned asset references found in dist/');

    const wrong = refs.filter(ref => !ref.includes(`?v=${expected}`));
    assert.deepEqual(wrong, [], `references not carrying the content hash ?v=${expected}`);
});

test('cache-busting: the token changes when a versioned asset changes', () => {
    // Work on a copy so parallel test files never see a half-written dist/.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qrtool-version-'));
    try {
        for (const rel of VERSIONED) {
            fs.mkdirSync(path.join(tmp, path.dirname(rel)), { recursive: true });
            fs.copyFileSync(path.join(DIST, rel), path.join(tmp, rel));
        }
        const expected = computeVersion(tmp);
        fs.appendFileSync(path.join(tmp, 'app.js'), '\n/* changed */\n');
        assert.notEqual(computeVersion(tmp), expected, 'changing app.js must change the token');
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('cache-busting: the service worker precaches the same versioned URLs', () => {
    const expected = computeVersion(DIST);
    const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
    assert.match(sw, new RegExp(`CACHE_NAME\\s*=\\s*["']qrtool-${expected}["']`), 'SW cache name is not the content hash');
    for (const asset of VERSIONED) {
        const name = asset.split('/').pop();
        assert.ok(
            sw.includes(`${name}?v=${expected}`),
            `sw.js does not precache ${name}?v=${expected}`
        );
    }
});
