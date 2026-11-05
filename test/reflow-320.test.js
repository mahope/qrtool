'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const { pages, read } = require('./helpers/pages');
// Inline <style> blocks and style="" attributes count too.
const inlineStyles = pages.map(file => [file, read(file)]);

function rules(source) {
    return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
        selectors: selectors.trim().split(',').map(value => value.trim()),
        body
    }));
}

function declarations(selector) {
    return rules(css).filter(rule => rule.selectors.includes(selector)).map(rule => rule.body).join(';');
}

// WCAG 1.4.10 asks for a layout without horizontal scroll at 320 CSS px. A column minimum above 200px
// plus the page padding would not fit, so it has to be capped by the container width.
test('grid column minimums above 200px are capped with min(..., 100%)', () => {
    const sources = [['style.css', css], ...inlineStyles];
    for (const [file, source] of sources) {
        for (const match of source.matchAll(/minmax\(\s*(min\()?\s*(\d+(?:\.\d+)?)px/g)) {
            if (Number(match[2]) > 200) {
                assert.ok(match[1], `${file}: ${match[0]} needs min(${match[2]}px, 100%)`);
            }
        }
    }
});

test('example blocks have no fixed pixel width above 240px', () => {
    for (const { selectors, body } of rules(css)) {
        if (!selectors.some(value => /\.example-/.test(value))) continue;
        for (const match of body.matchAll(/(?:^|;)\s*(?:min-)?width:\s*(\d+(?:\.\d+)?)px/g)) {
            assert.ok(Number(match[1]) <= 240, `${selectors.join(', ')} has ${match[0].trim()}`);
        }
    }
});

test('vCard example lets its columns shrink and wraps long values', () => {
    assert.match(declarations('.example-card > *'), /min-width:\s*0/);
    assert.match(declarations('.example-fields dd'), /min-width:\s*0/);
    assert.match(declarations('.example-fields dd'), /overflow-wrap:\s*anywhere/);
    assert.match(declarations('.example-block'), /max-width:\s*100%/);
});

test('guide hero text and feature cards may shrink below their content', () => {
    assert.match(declarations('.hero-text'), /overflow-wrap:\s*(?:anywhere|break-word)/);
    assert.match(declarations('.feature-item'), /min-width:\s*0/);
    assert.match(declarations('.footer-tool-card'), /min-width:\s*0/);
});
