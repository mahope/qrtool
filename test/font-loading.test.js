'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { pages, read } = require('./helpers/pages');

const FONT = '/fonts/schibsted-grotesk-latin.woff2';

test('there are 31 pages to check', () => {
    assert.equal(pages.length, 31);
});

for (const file of pages) {
    test(`${file} preloads the body font exactly once`, () => {
        const html = read(file);
        const preloads = html.match(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g) || [];
        assert.equal(preloads.length, 1, 'one font preload');
        assert.ok(preloads[0].includes(`href="${FONT}"`), 'points at the self-hosted font');
        assert.match(preloads[0], /type="font\/woff2"/);
        assert.match(preloads[0], /\scrossorigin(?:[\s>=])/);
    });

    test(`${file} preloads the font before the stylesheet that uses it`, () => {
        const html = read(file);
        const font = html.indexOf('as="font"');
        const sheet = html.search(/<link[^>]+rel="stylesheet"/);
        assert.ok(font > -1 && sheet > -1);
        assert.ok(font < sheet);
    });
}

const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'style.css'), 'utf8');

test('the web font never swaps in late, and the fallback face has matched metrics', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g);
    const web = faces.find(face => face.includes("'Schibsted Grotesk'"));
    const fallback = faces.find(face => face.includes("'Schibsted Fallback'"));
    assert.match(web, /font-display:\s*optional/);
    assert.match(fallback, /size-adjust:\s*[\d.]+%/);
    assert.match(fallback, /ascent-override:\s*[\d.]+%/);
    assert.match(fallback, /descent-override:\s*[\d.]+%/);
    assert.match(css, /font-family:[^;]*'Schibsted Fallback'/);
});

test('the inline critical CSS of the home pages uses the same font-display', () => {
    for (const file of ['index.html', 'en/index.html']) {
        const html = read(file);
        assert.doesNotMatch(html, /font-display:\s*swap/);
        assert.match(html, /font-display:\s*optional/);
    }
});
