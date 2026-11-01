'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function checkPages(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || ['node_modules', 'dist'].includes(entry.name)) continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) checkPages(file);
        else if (entry.name.endsWith('.html')) {
            test(`inline JavaScript parses: ${path.relative(ROOT, file)}`, () => {
                const html = fs.readFileSync(file, 'utf8');
                for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
                    if (/\bsrc\s*=/.test(match[1])) continue;
                    if (/\btype\s*=\s*["'](?:application\/ld\+json|speculationrules)["']/.test(match[1])) {
                        assert.doesNotThrow(() => JSON.parse(match[2]));
                    } else {
                        assert.doesNotThrow(() => new vm.Script(match[2], { filename: file }));
                    }
                }
            });
        }
    }
}

checkPages(ROOT);
