'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function pages(dir = root) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (['.git', 'dist', 'node_modules'].includes(entry.name)) return [];
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? pages(file) : entry.name.endsWith('.html') ? [file] : [];
    });
}

for (const file of [path.join(root, 'app.js'), ...pages()]) {
    const source = fs.readFileSync(file, 'utf8');
    const snippet = source.match(/(?:const|var) themeToggle = document\.getElementById\('themeToggle'\);[\s\S]+?localStorage\.setItem\('theme', newTheme\);\s*}\);\s*}/);
    if (!snippet) continue;
    test(`${path.relative(root, file)}: system theme, saved overrides and toggle`, () => {
        for (const systemDark of [false, true]) {
            for (const saved of [null, 'invalid', 'light', 'dark']) {
                let attribute = null;
                let click;
                let stored = saved;
                const html = {
                    setAttribute: (name, value) => { attribute = value; },
                    getAttribute: () => attribute
                };
                vm.runInNewContext(snippet[0], {
                    document: {
                        documentElement: html,
                        getElementById: () => ({ addEventListener: (name, fn) => { click = fn; } })
                    },
                    localStorage: { getItem: () => stored, setItem: (name, value) => { stored = value; } },
                    matchMedia: () => ({ matches: systemDark })
                });
                const valid = saved === 'light' || saved === 'dark';
                assert.equal(attribute, valid ? saved : null, 'system preference must stay in CSS');
                const effective = valid ? saved : systemDark ? 'dark' : 'light';
                click();
                assert.equal(attribute, effective === 'dark' ? 'light' : 'dark');
                assert.equal(stored, attribute);
                click();
                assert.equal(attribute, effective, 'a second click restores the original theme');
            }
        }
    });
}
