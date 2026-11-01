'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

function pages(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        if (entry.name.startsWith('.') || ['node_modules', 'dist'].includes(entry.name)) return [];
        const file = path.join(dir, entry.name);
        return entry.isDirectory() ? pages(file) : file.endsWith('.html') ? [file] : [];
    });
}

test('every Plausible page also loads Umami once with the site id', () => {
    const tracked = pages(ROOT).filter(file => fs.readFileSync(file, 'utf8').includes('src="https://analytics.holstjensen.eu/'));
    assert.equal(tracked.length, 26);
    for (const file of tracked) {
        const html = fs.readFileSync(file, 'utf8');
        assert.equal((html.match(/<script defer src="https:\/\/stats.mahoje.dk\/s.js" data-website-id="32b62544-1363-4358-9e37-0acd30296a2a"><\/script>/g) || []).length, 1, file);
        assert.match(html, /<link rel="dns-prefetch" href="https:\/\/stats.mahoje.dk">/);
        const built = fs.readFileSync(path.join(ROOT, 'dist', path.relative(ROOT, file)), 'utf8');
        assert.ok(built.includes('https://stats.mahoje.dk/s.js'), file);
        assert.ok(built.includes('https://analytics.holstjensen.eu/js/'), file);
    }
});

test('both CSP configurations permit both analytics hosts for scripts and connections', () => {
    for (const file of ['nginx.conf', '.htaccess']) {
        const config = fs.readFileSync(path.join(ROOT, file), 'utf8');
        for (const directive of ['script-src', 'connect-src']) {
            const sources = config.match(new RegExp(directive + ' ([^;]+)'))[1];
            assert.ok(sources.includes('https://analytics.holstjensen.eu'));
            assert.ok(sources.includes('https://stats.mahoje.dk'));
        }
    }
});
