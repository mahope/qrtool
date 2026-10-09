'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const { loadApp, APP_FILE } = require('./helpers/load-app');

function closeTo(actual, expected, epsilon = 0.01) {
    assert.ok(
        Math.abs(actual - expected) <= epsilon,
        `expected ${actual} to be within ${epsilon} of ${expected}`
    );
}

test('contrast: black on white is the maximum 21:1', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#000000', '#ffffff'), 21);
});

test('contrast: #767676 on white is the AA boundary 4.54:1', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#767676', '#ffffff'), 4.54);
});

test('contrast: #777777 on white is just below the boundary', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#777777', '#ffffff'), 4.48);
});

test('contrast: red on blue is about 2.15:1', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#ff0000', '#0000ff'), 2.15);
});

test('contrast: identical colors are 1:1', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#1a365d', '#1a365d'), 1);
});

test('contrast: shorthand hex and uppercase are accepted', () => {
    const { contrastRatio } = loadApp();
    closeTo(contrastRatio('#FFF', '#000000'), 21);
    closeTo(contrastRatio('#FFFFFF', '#000'), 21);
    closeTo(contrastRatio(' #ffffff ', '#000000'), 21);
});

test('contrast: invalid colors return null', () => {
    const { contrastRatio } = loadApp();
    assert.equal(contrastRatio('#gggggg', '#ffffff'), null);
    assert.equal(contrastRatio('#12345', '#ffffff'), null);
    assert.equal(contrastRatio('', '#ffffff'), null);
    assert.equal(contrastRatio(null, '#ffffff'), null);
});

test('contrast levels: thresholds match the WCAG scale', () => {
    const { contrastLevel } = loadApp();
    assert.equal(contrastLevel(21), 'high');
    assert.equal(contrastLevel(7), 'high');
    assert.equal(contrastLevel(4.5), 'good');
    assert.equal(contrastLevel(3), 'low');
    assert.equal(contrastLevel(2.99), 'bad');
    assert.equal(contrastLevel(null), null);
});

test('contrast readout: black on white reads as strong contrast', () => {
    const api = loadApp();
    api.field('qrColor').value = '#000000';
    api.field('bgColor').value = '#ffffff';
    api.updateContrastDisplay();
    const el = api.contrastStatus();
    assert.ok(el, 'the readout element is created');
    assert.equal(el.dataset.state, 'ok');
    assert.equal(el.textContent, 'Kontrast: 21,0:1 — stærk kontrast');
});

test('contrast readout: near-identical colors raise a warning', () => {
    const api = loadApp();
    api.field('qrColor').value = '#777777';
    api.field('bgColor').value = '#888888';
    api.updateContrastDisplay();
    const el = api.contrastStatus();
    closeTo(contrastOf(el), 1.3);
    assert.equal(el.dataset.state, 'warn');
    assert.match(el.textContent, /1,3:1/);
});

test('contrast readout: a transparent background is measured against white', () => {
    const api = loadApp();
    api.field('qrColor').value = '#000000';
    api.field('bgColor').value = '#000000';
    api.field('transparentBg').checked = true;
    api.updateContrastDisplay();
    const el = api.contrastStatus();
    assert.equal(el.dataset.state, 'ok');
    assert.match(el.textContent, /21,0:1/);
});

test('contrast readout: the color inputs update the readout', () => {
    const api = loadApp();
    api.field('qrColor').value = '#000000';
    const bg = api.field('bgColor');
    bg.value = '#ffffff';
    bg.nextElementSibling = { textContent: '' };
    bg.dispatchEvent({ type: 'input', target: bg });
    const el = api.contrastStatus();
    assert.equal(el.dataset.state, 'ok');
    assert.match(el.textContent, /21,0:1/);
});

test('contrast strings are translated in both languages', () => {
    const source = fs.readFileSync(APP_FILE, 'utf8');
    const keys = ['contrast.label', 'contrast.high', 'contrast.good', 'contrast.low', 'contrast.bad'];
    for (const key of keys) {
        const entries = source.match(new RegExp(`'${key}':`, 'g')) || [];
        assert.equal(entries.length, 2, `${key} must be translated in both Danish and English`);
    }
});

// Reads the ratio the readout shows, so the assertion does not hard-code the
// same constant twice
function contrastOf(el) {
    return Number(el.textContent.match(/([\d,]+):1/)[1].replace(',', '.'));
}
