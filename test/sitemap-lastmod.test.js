'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://qrtool.dk';

function entries() {
    const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
        loc: /<loc>([^<]+)<\/loc>/.exec(m[1])[1].trim(),
        lastmod: (/<lastmod>([^<]+)<\/lastmod>/.exec(m[1]) || [])[1]
    }));
}

// https://qrtool.dk/             -> index.html
// https://qrtool.dk/en/          -> en/index.html
// https://qrtool.dk/wifi-qr-kode -> wifi-qr-kode.html
function fileOf(loc) {
    const pathname = new URL(loc).pathname;
    return pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : `${pathname.slice(1)}.html`;
}

function git(...args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function historyAvailable() {
    try {
        return git('rev-parse', '--is-inside-work-tree') === 'true'
            && git('rev-parse', '--is-shallow-repository') === 'false';
    } catch {
        return false;
    }
}

test('sitemap: every URL has a lastmod that is a real, past date', () => {
    const today = new Date().toISOString().slice(0, 10);
    const problems = [];
    for (const { loc, lastmod } of entries()) {
        if (!lastmod) problems.push(`${loc}: no lastmod`);
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || Number.isNaN(Date.parse(lastmod))) problems.push(`${loc}: "${lastmod}" is not a date`);
        else if (lastmod > today) problems.push(`${loc}: ${lastmod} is in the future`);
    }
    assert.deepEqual(problems, []);
});

test('sitemap: every URL is part of the site', () => {
    const outside = entries().filter(e => !e.loc.startsWith(`${SITE}/`));
    assert.deepEqual(outside, []);
});

// Google reads lastmod as "this page changed". It was 2026-02-18 on 28 of 30
// URLs long after the pages were rewritten, so it carried no information.
// Run `node scripts/update-sitemap-lastmod.js` after the last content commit.
// A squash merge on a later day dates the files after lastmod: run it again.
test('sitemap: lastmod is not older than the last commit that changed the page', { skip: !historyAvailable() && 'needs the full git history' }, () => {
    const stale = [];
    for (const { loc, lastmod } of entries()) {
        const file = fileOf(loc);
        const committed = git('log', '-1', '--format=%cs', '--', file);
        if (committed && lastmod < committed) stale.push(`${loc}: lastmod ${lastmod}, ${file} last changed ${committed}`);
    }
    assert.deepEqual(stale, [], 'run: node scripts/update-sitemap-lastmod.js');
});

test('sitemap script: it plans one date per URL from the commit dates and rewrites only lastmod', () => {
    const { planLastmods, applyLastmods } = require('../scripts/update-sitemap-lastmod.js');
    const xml = [
        '<urlset>',
        '<url><loc>https://qrtool.dk/</loc><lastmod>2026-02-18</lastmod><priority>1.0</priority></url>',
        '<url><loc>https://qrtool.dk/en/wifi-qr-code</loc><lastmod>2026-02-18</lastmod></url>',
        '<url><loc>https://qrtool.dk/guides/</loc><lastmod>2026-02-18</lastmod></url>',
        '</urlset>'
    ].join('\n');
    const dates = { 'index.html': '2026-10-18', 'en/wifi-qr-code.html': '2026-10-11', 'guides/index.html': '' };
    const plan = planLastmods(xml, file => dates[file]);

    assert.deepEqual(plan.map(p => [p.file, p.to]), [
        ['index.html', '2026-10-18'],
        ['en/wifi-qr-code.html', '2026-10-11'],
        // a page with no history keeps the date it has: the script never invents one
        ['guides/index.html', '2026-02-18']
    ]);
    const out = applyLastmods(xml, plan);
    assert.match(out, /<loc>https:\/\/qrtool\.dk\/<\/loc><lastmod>2026-10-18<\/lastmod><priority>1\.0<\/priority>/);
    assert.match(out, /en\/wifi-qr-code<\/loc><lastmod>2026-10-11</);
    assert.match(out, /guides\/<\/loc><lastmod>2026-02-18</);
    assert.equal(applyLastmods(out, planLastmods(out, file => dates[file])), out, 'a second run changes nothing');
});
