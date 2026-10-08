'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://qrtool.dk';

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function exists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
}

// https://qrtool.dk/             -> index.html
// https://qrtool.dk/en/          -> en/index.html
// https://qrtool.dk/wifi-qr-kode -> wifi-qr-kode.html
function urlToFile(url) {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/')) return pathname.slice(1) + 'index.html';
    return pathname.slice(1) + '.html';
}

function fileToUrl(rel) {
    const urlPath = rel.replace(/index\.html$/, '').replace(/\.html$/, '');
    return `${SITE}/${urlPath}`;
}

function sitemapUrls() {
    const xml = read('sitemap.xml');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
    assert.ok(urls.length > 0, 'sitemap.xml must list URLs');
    return urls;
}

// 404.html is an error page: it must stay out of the sitemap and needs no
// canonical, because it should never be indexed.
function htmlFiles() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue;
            const rel = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html') && entry.name !== '404.html') files.push(rel);
        }
    };
    walk('.');
    return files.sort();
}

// ------------------------------------------------------------ sitemap

test('sitemap: every listed URL has a page in the source tree', () => {
    const missing = sitemapUrls().filter(url => !exists(urlToFile(url)));
    assert.deepEqual(missing, []);
});

test('sitemap: every listed URL is also built into dist/', () => {
    if (!exists('dist')) {
        // The build is part of the gate: run `npm run build` before the tests.
        assert.fail('dist/ is missing — run npm run build (or npm test, which builds first)');
    }
    const missing = sitemapUrls().filter(url => !fs.existsSync(path.join(ROOT, 'dist', urlToFile(url))));
    assert.deepEqual(missing, []);
});

test('sitemap: every indexable page in the repo is listed in the sitemap', () => {
    const listed = new Set(sitemapUrls().map(urlToFile));
    const missing = htmlFiles().filter(rel => rel !== '404.html' && !listed.has(rel));
    assert.deepEqual(missing, []);
});

test('sitemap: contains no duplicates', () => {
    const urls = sitemapUrls();
    assert.equal(new Set(urls).size, urls.length);
});

// ------------------------------------------------------------ sprogpar

function alternatesOf(html) {
    return [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi)]
        .map(m => ({ lang: m[1], href: m[2] }));
}

test('language: every page links to its counterpart, and the link is reciprocal', () => {
    const problems = [];
    for (const rel of htmlFiles()) {
        const html = read(rel);
        const alternates = alternatesOf(html);
        const ownUrl = fileToUrl(rel);
        const ownLang = rel.startsWith('en/') ? 'en' : 'da';
        const otherLang = ownLang === 'da' ? 'en' : 'da';

        const back = alternates.find(a => a.lang === ownLang);
        if (back && back.href !== ownUrl && back.href !== SITE) {
            problems.push(`${rel}: hreflang ${ownLang} points at ${back.href} instead of itself`);
        }

        const forward = alternates.find(a => a.lang === otherLang);
        if (!forward) {
            problems.push(`${rel}: no hreflang ${otherLang}`);
            continue;
        }
        if (!exists(urlToFile(forward.href))) {
            problems.push(`${rel}: hreflang ${otherLang} -> ${forward.href} has no file`);
            continue;
        }
        const other = alternatesOf(read(urlToFile(forward.href)));
        const reciprocal = other.find(a => a.lang === ownLang);
        if (!reciprocal || (reciprocal.href !== ownUrl && reciprocal.href !== SITE)) {
            problems.push(`${forward.href} does not link back to ${rel}`);
        }
    }
    assert.deepEqual(problems, []);
});

test('language: page lang attribute matches the folder', () => {
    const wrong = [];
    for (const rel of htmlFiles()) {
        const expected = rel.startsWith('en/') ? 'en' : 'da';
        const html = read(rel);
        const match = html.match(/<html[^>]*\blang="([^"]+)"/i);
        if (!match || match[1] !== expected) wrong.push(`${rel} (expected ${expected})`);
    }
    assert.deepEqual(wrong, []);
});

// ------------------------------------------------------------ canonical / hreflang

test('seo: every page has a canonical pointing at itself', () => {
    const wrong = [];
    for (const rel of htmlFiles()) {
        const html = read(rel);
        const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
        if (!match) {
            wrong.push(`${rel}: no canonical`);
            continue;
        }
        const canonical = match[1];
        const own = fileToUrl(rel);
        // The front page is published with and without the trailing slash.
        const normalised = u => u === SITE ? `${SITE}/` : u;
        if (normalised(canonical) !== normalised(own)) {
            wrong.push(`${rel}: canonical ${canonical} != ${own}`);
        }
    }
    assert.deepEqual(wrong, []);
});

test('seo: every page has da, en and x-default alternates that exist', () => {
    const problems = [];
    for (const rel of htmlFiles()) {
        const html = read(rel);
        const alternates = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi)]
            .map(m => ({ lang: m[1], href: m[2] }));

        for (const lang of ['da', 'en', 'x-default']) {
            if (!alternates.some(a => a.lang === lang)) {
                problems.push(`${rel}: missing hreflang ${lang}`);
            }
        }
        for (const alt of alternates) {
            if (!exists(urlToFile(alt.href))) problems.push(`${rel}: ${alt.lang} -> ${alt.href} has no file`);
        }
    }
    assert.deepEqual(problems, []);
});

// ------------------------------------------------------------ grundlæggende filer

test('assets: robots.txt, manifest and icon are present', () => {
    for (const rel of ['robots.txt', 'manifest.json', 'icon.svg', '404.html', 'ads.txt']) {
        assert.ok(exists(rel), `${rel} is missing`);
    }
});

test('assets: robots.txt links the sitemap', () => {
    assert.match(read('robots.txt'), /Sitemap:\s*https:\/\/qrtool\.dk\/sitemap\.xml/);
});

test('pages: no page still contains copy-paste Lorem ipsum', () => {
    const hits = htmlFiles().filter(rel => /lorem ipsum/i.test(read(rel)));
    assert.deepEqual(hits, []);
});
