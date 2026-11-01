'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

for (const selector of ['.visually-hidden', '.sr-only']) {
    test(`${selector} keeps its position and dimensions despite form styles`, () => {
        const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
            .find(([, selectors]) => selectors.split(',').some(value => value.trim() === selector));
        assert.ok(rule, `${selector} rule exists`);
        for (const [property, value] of Object.entries({ position: 'absolute', width: '1px', height: '1px' })) {
            assert.match(rule[2], new RegExp(`(?:^|;)\\s*${property}:\\s*${value}\\s*!important\\s*;`));
        }
    });
}
