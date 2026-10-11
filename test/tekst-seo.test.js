'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const DA = 'tekst-qr-kode.html';
const EN = 'en/text-qr-code.html';

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function meta(html, attr, key) {
    const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 'i'));
    return m ? m[1] : null;
}

function title(html) {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return m ? m[1].trim() : null;
}

// The query this page is ranked for but does not convert on: Google Search
// Console shows /tekst-qr-kode at position 20 for "url kode" and 29 for
// "statisk qr kode", both with zero clicks.
test('tekst page: the title names the URL-to-QR and the static code', () => {
    for (const rel of [DA, EN]) {
        const value = title(read(rel));
        assert.match(value, /URL/, `${rel}: title "${value}" does not mention URL`);
        assert.match(value, /QR/i, `${rel}: title "${value}" does not mention QR`);
        assert.match(
            value,
            rel === DA ? /Statisk/i : /Static/i,
            `${rel}: title "${value}" does not say the code is static`
        );
    }
});

test('tekst page: the title fits Google’s result snippet', () => {
    for (const rel of [DA, EN]) {
        const value = title(read(rel));
        assert.ok(value.length <= 62, `${rel}: title is ${value.length} characters`);
    }
});

test('tekst page: the description promises the free, expiring code', () => {
    for (const rel of [DA, EN]) {
        const value = meta(read(rel), 'name', 'description');
        assert.ok(value, `${rel} is missing the meta description`);
        assert.ok(value.length >= 80, `${rel}: description is only ${value.length} characters`);
        assert.ok(value.length <= 165, `${rel}: description is ${value.length} characters`);
        assert.match(value, /QR/i);
        assert.match(value, /gratis|free/i);
        assert.match(value, /for altid|never expires|keep/i);
        assert.match(value, /PNG/);
    }
});

test('tekst page: og and twitter cards repeat the new title and description', () => {
    for (const rel of [DA, EN]) {
        const html = read(rel);
        const pageTitle = title(html);
        assert.equal(meta(html, 'property', 'og:title'), pageTitle, `${rel}: og:title differs from <title>`);
        assert.equal(meta(html, 'property', 'twitter:title'), pageTitle, `${rel}: twitter:title differs from <title>`);
        assert.equal(
            meta(html, 'property', 'og:description'),
            meta(html, 'name', 'description'),
            `${rel}: og:description differs from the meta description`
        );
        assert.equal(
            meta(html, 'property', 'twitter:description'),
            meta(html, 'name', 'description'),
            `${rel}: twitter:description differs from the meta description`
        );
        assert.equal(meta(html, 'name', 'title'), pageTitle, `${rel}: meta name="title" differs from <title>`);
    }
});

test('tekst page: the heading and the intro say the same thing as the title', () => {
    for (const rel of [DA, EN]) {
        const html = read(rel);
        const h1 = /<h1>[\s\S]*?<\/h1>/.exec(html);
        assert.ok(h1, `${rel} has no h1`);
        const text = h1[0].replace(/<[^>]*>/g, '');
        assert.match(text, /URL/);
        assert.match(text, rel === DA ? /Statisk/i : /Static/i);
    }
});

test('tekst page: the Danish and English variants keep the same keywords', () => {
    const da = meta(read(DA), 'name', 'keywords');
    const en = meta(read(EN), 'name', 'keywords');
    assert.match(da, /statisk qr kode/);
    assert.match(da, /url kode/);
    assert.match(en, /static qr code/);
    assert.match(en, /url qr code/);
    assert.ok(da && en, 'both variants must keep a keyword meta tag');
});
