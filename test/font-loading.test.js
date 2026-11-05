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
