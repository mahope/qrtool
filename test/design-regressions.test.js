'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

test('shared typography scales with the root text-size preference', () => {
    assert.doesNotMatch(css, /font-size:\s*\d+(?:\.\d+)?px/);
    assert.match(css, /body\s*\{\s*font-size: 1rem;/);
});

test('mobile and desktop headings keep the design scale', () => {
    const headings = [...css.matchAll(/header h1\s*\{([^}]+)\}/g)];
    assert.ok(headings.length >= 3);
    for (const heading of headings) {
        assert.match(heading[1], /font-size: (?:2\.25|3)rem;/);
    }
});

test('policy pages keep the shared body font', () => {
    for (const file of ['privatlivspolitik.html', 'cookiepolitik.html', 'en/privacy-policy.html', 'en/cookie-policy.html']) {
        const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        assert.doesNotMatch(html, /body\s*\{[^}]*font-family:/, file);
        assert.match(html, /href="\/style.css/);
    }
});

test('transition timing is defined without a custom-property cycle', () => {
    const value = css.match(/--transition:\s*([^;]+);/)[1];
    assert.match(value, /^0\.2s ease$/);
    assert.match(css, /transition: transform var\(--transition\), opacity var\(--transition\);/);
});

test('lightbox close icon uses the always-white paper token', () => {
    const close = css.match(/\.lightbox-close\s*\{([^}]+)\}/)[1];
    assert.match(close, /color: var\(--paper\);/);
});
