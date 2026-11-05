'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

function tokens(selector) {
    const start = css.indexOf(selector + ' {');
    assert.notEqual(start, -1, selector);
    return Object.fromEntries([...css.slice(start, css.indexOf('}', start)).matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(m => [m[1], m[2]]));
}

function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
        .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(a, b) {
    const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

test('contrast calculation distinguishes WCAG thresholds', () => {
    assert.equal(contrast('#000000', '#ffffff'), 21);
    assert.equal(contrast('#ffffff', '#ffffff'), 1);
    assert.ok(contrast('#777777', '#ffffff') < 4.5);
    assert.ok(contrast('#767676', '#ffffff') >= 4.5);
});

for (const selector of [':root', '[data-theme="dark"]', ':root:not([data-theme])']) {
    test(`${selector}: semantic tokens meet text and control contrast`, () => {
        const palette = tokens(selector);
        for (const surface of ['bench', 'panel']) {
            for (const foreground of ['ink', 'ink-2', 'ink-3', 'ok', 'warn', 'err', 'link']) {
                assert.ok(contrast(palette[foreground], palette[surface]) >= 4.5, `${foreground}/${surface}`);
            }
            for (const foreground of ['field-edge', 'ink']) {
                assert.ok(contrast(palette[foreground], palette[surface]) >= 3, `${foreground}/${surface}`);
            }
        }
        assert.equal(palette.paper, '#ffffff');
        assert.ok(contrast(palette['on-mark'], palette.mark) >= 4.5);
        if (selector === ':root') {
            for (const foreground of ['ink', 'ink-2', 'ink-3', 'ok', 'warn', 'err', 'link']) {
                assert.ok(contrast(palette[foreground], palette.paper) >= 4.5, `${foreground}/paper`);
            }
        }
    });
}
