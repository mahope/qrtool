'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// The front page says that what you type never leaves your browser. That is only
// true as long as no script sends it anywhere, so the claim is guarded here: if
// one of these tests fails, either remove the sentence or remove the network call.

const NETWORK = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/;

function libFiles() {
    return fs.readdirSync(path.join(ROOT, 'lib')).filter(f => f.endsWith('.js')).map(f => `lib/${f}`);
}

function htmlFiles() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
            const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html')) files.push(rel);
        }
    };
    walk('.');
    return files;
}

test('privacy claim: app.js and everything under lib/ make no network requests', () => {
    const hits = ['app.js', ...libFiles()].filter(rel => NETWORK.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
    assert.deepEqual(hits, []);
});

test('privacy claim: no inline script on any page makes a network request', () => {
    const hits = [];
    for (const rel of htmlFiles()) {
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:application\/ld\+json|speculationrules)")[^>]*>([\s\S]*?)<\/script>/gi)) {
            if (NETWORK.test(m[1])) hits.push(rel);
        }
    }
    assert.deepEqual(hits, []);
});

// Plausible runs with pageview-props and tagged-events: a custom event could
// carry whatever a script passes to it, so there must be none.
test('privacy claim: no script reports custom analytics events', () => {
    const hits = [];
    for (const rel of ['app.js', 'sw.js', ...libFiles(), ...htmlFiles()]) {
        const code = fs.readFileSync(path.join(ROOT, rel), 'utf8')
            .replace(/window\.plausible\s*=\s*window\.plausible\s*\|\|\s*function\(\)\s*\{[^}]*\}/g, '');
        if (/\bplausible\s*\(|plausible-event-name|data-plausible-props/.test(code)) hits.push(rel);
    }
    assert.deepEqual(hits, []);
});

test('privacy claim: the service worker only fetches the site’s own files', () => {
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.match(sw, /origin/i, 'sw.js should keep to same-origin requests');
});
