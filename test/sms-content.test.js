'use strict';

// The SMS page gets visitors who ask "hvordan opretter jeg en sms-kode" — Search
// Console shows those queries at position 29-34 while the page used to have only
// a FAQ in HTML and nothing a search engine could show as a rich result. The page
// now answers the scanning question with a real how-to for both platforms, and
// both the how-to and the FAQ are marked up. These tests keep the markup, the
// visible text and the two language versions from drifting apart.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    { rel: 'sms-qr-kode.html', lang: 'da' },
    { rel: 'en/sms-qr-code.html', lang: 'en' },
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

test('sms page: JSON-LD parses in both languages', () => {
    for (const { rel } of PAGES) {
        const blocks = jsonLdBlocks(read(rel));
        assert.ok(blocks.length >= 3, `${rel}: only ${blocks.length} ld+json blocks`);
    }
});

test('sms page: marks up a how-to for iPhone and for Android', () => {
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

test('sms page: every FAQ entry in the markup is also visible on the page', () => {
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

test('sms page: the visible how-to names both platforms', () => {
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

test('sms page: the how-to text and the page agree on the minimum Android version', () => {
    // The version is a factual claim in the heading and in the markup, so every
    // mention of it has to name the same release.
    for (const { rel } of PAGES) {
        const mentions = [...read(rel).matchAll(/Android (\d+) /g)].map(m => m[1]);
        assert.ok(mentions.length >= 2, `${rel}: the Android version is only mentioned ${mentions.length} times`);
        assert.deepEqual([...new Set(mentions)], ['10'], `${rel}: the Android versions disagree: ${mentions.join(', ')}`);
    }
});

test('sms page: the how-to section answers the "how do I create one" question', () => {
    // The top uncovered query for this page in Search Console is exactly that
    // question, and the answer must be readable without leaving the page.
    const expect = {
        da: 'Hvordan opretter jeg en SMS QR-kode?',
        en: 'How do I create an SMS QR code?',
    };
    const heading = { da: 'Sådan scanner du en SMS QR-kode', en: 'How to scan an SMS QR code' };
    for (const { rel, lang } of PAGES) {
        const html = read(rel);
        assert.ok(html.includes(expect[lang]), `${rel}: missing the question "${expect[lang]}"`);
        const start = html.indexOf(`<h2>${heading[lang]}</h2>`);
        assert.ok(start !== -1, `${rel}: missing the how-to heading "${heading[lang]}"`);
        const section = html.slice(start, html.indexOf('</article>', start));
        assert.match(section, /<ol class="guide-list">/, `${rel}: the how-to section has no numbered steps`);
    }
});

test('sms page: no raw angle brackets or ampersands inside JSON-LD', () => {
    // A < or > in inline JSON ends the script block in some parsers, and & can
    // turn into an HTML entity. Both break the rich result without any error.
    for (const { rel } of PAGES) {
        for (const m of read(rel).matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)) {
            assert.doesNotMatch(m[1], /[<>]/, `${rel}: JSON-LD contains a raw < or >`);
            assert.doesNotMatch(m[1], /&(?!amp;|lt;|gt;|quot;|#)/, `${rel}: JSON-LD contains a bare &`);
        }
    }
});
