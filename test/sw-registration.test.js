'use strict';

// The service-worker registration is an inline one-liner repeated on every
// page. Keeping it inline avoids an extra request on each page view, so the
// duplication is accepted; this test makes sure the copies cannot drift apart.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNIPPET = "<script>if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }</script>";

function pages(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || ['node_modules', 'dist'].includes(entry.name)) continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) pages(file, out);
        else if (entry.name.endsWith('.html')) out.push(file);
    }
    return out;
}

test('every page registers the service worker with the identical snippet', () => {
    for (const file of pages(ROOT)) {
        const html = fs.readFileSync(file, 'utf8');
        const rel = path.relative(ROOT, file);
        if (rel === 'offline.html') continue; // served from the cache, never registers
        assert.equal(html.split(SNIPPET).length - 1, 1, `${rel} must contain the registration snippet exactly once`);
        const registrations = html.match(/serviceWorker\.register\(/g) || [];
        assert.equal(registrations.length, 1, `${rel} must not register the service worker any other way`);
    }
});
