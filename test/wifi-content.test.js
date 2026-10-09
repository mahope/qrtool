'use strict';

// The WiFi landing page is the biggest Danish landing page on the site and it
// bounces 100 %: people arrive from Facebook with a question about scanning,
// not with an intention to use our generator. The page answers that question
// with a real how-to plus a FAQ, and both are marked up so search engines can
// show them. The tests below keep the markup, the visible text and the two
// language versions from drifting apart.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    { rel: 'wifi-qr-kode.html', lang: 'da' },
    { rel: 'en/wifi-qr-code.html', lang: 'en' },
];

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Every ld+json block, parsed. A block that does not parse is a hard error:
// the browser silently ignores it and the rich result disappears.
function jsonLdBlocks(html) {
    return [...html.matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)]
        .map(m => JSON.parse(m[1]));
}

function graph(html) {
    const nodes = jsonLdBlocks(html).flatMap(block => (block['@graph'] ? block['@graph'] : [block]));
    return nodes;
}

test('wifi page: JSON-LD parses in both languages', () => {
    for (const { rel } of PAGES) {
        const blocks = jsonLdBlocks(read(rel));
        assert.ok(blocks.length >= 3, `${rel}: only ${blocks.length} ld+json blocks`);
    }
});

test('wifi page: marks up a how-to for iPhone and for Android', () => {
    for (const { rel } of PAGES) {
        const howTos = graph(read(rel)).filter(n => n['@type'] === 'HowTo');
        assert.equal(howTos.length, 2, `${rel}: expected 2 HowTo nodes, got ${howTos.length}`);
        for (const howTo of howTos) {
            assert.ok(howTo.name, `${rel}: a HowTo has no name`);
            assert.ok(Array.isArray(howTo.step) && howTo.step.length >= 3,
                `${rel}: "${howTo.name}" has fewer than 3 steps`);
            for (const step of howTo.step) {
                assert.ok(step['@type'] === 'HowToStep' && step.name && step.text,
                    `${rel}: "${howTo.name}" has a step without name and text`);
            }
        }
    }
});

test('wifi page: every FAQ entry in the markup is also visible on the page', () => {
    for (const { rel } of PAGES) {
        const html = read(rel);
        const faq = graph(html).find(n => n['@type'] === 'FAQPage');
        assert.ok(faq, `${rel}: no FAQPage node`);

        const marked = faq.mainEntity.map(q => q.name);
        assert.ok(marked.length >= 3, `${rel}: only ${marked.length} marked questions`);

        const visible = [...html.matchAll(/<div class="faq-item">\s*<h3>([^<]+)<\/h3>/g)].map(m => m[1].trim());
        assert.deepEqual(marked, visible,
            `${rel}: the marked questions and the visible ones are not the same, in the same order`);
    }
});

test('wifi page: the visible how-to names both platforms', () => {
    // The two platform walkthroughs are the whole point of the section.
    const expect = { da: ['På iPhone og iPad', 'På Android'], en: ['On iPhone and iPad', 'On Android'] };
    for (const { rel, lang } of PAGES) {
        const html = read(rel);
        for (const heading of expect[lang]) {
            const found = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
            assert.ok(found.some(h => h.startsWith(heading)), `${rel}: missing the walkthrough "${heading}"`);
        }
    }
});

test('wifi page: the how-to text and the page agree on the minimum iOS version', () => {
    // The version is a factual claim in the heading and in the markup, so every
    // mention of it has to name the same release.
    for (const { rel } of PAGES) {
        const mentions = [...read(rel).matchAll(/iOS (\d+) (?:og nyere|and newer)/gi)].map(m => m[1]);
        assert.ok(mentions.length >= 2, `${rel}: the iOS version is only mentioned ${mentions.length} times`);
        assert.deepEqual([...new Set(mentions)], ['11'], `${rel}: the iOS versions disagree: ${mentions.join(', ')}`);
    }
});

test('wifi page: no raw angle brackets or ampersands inside JSON-LD', () => {
    // A < or > in inline JSON ends the script block in some parsers, and & can
    // turn into an HTML entity. Both break the rich result without any error.
    for (const { rel } of PAGES) {
        for (const m of read(rel).matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)) {
            assert.doesNotMatch(m[1], /[<>]/, `${rel}: JSON-LD contains a raw < or >`);
            assert.doesNotMatch(m[1], /&(?!amp;|lt;|gt;|quot;|#)/, `${rel}: JSON-LD contains a bare &`);
        }
    }
});