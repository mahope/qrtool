'use strict';

// The email page is the English mirror's search engine: Search Console shows
// "email qr code" (35 impressions, position 11), "qr code email" and
// "qr code for email" without clicks. The page used to answer the scanning
// question nowhere a visitor reads it, and it had no structured data at all —
// nothing a search engine could show as a rich result. The page now carries a
// real how-to for iPhone and Android, marked-up how-tos, and FAQPage JSON-LD
// that matches the six visible questions. These tests keep the markup, the
// visible text and the two language versions from drifting apart.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    { rel: 'email-qr-kode.html', lang: 'da' },
    { rel: 'en/email-qr-code.html', lang: 'en' },
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

test('email page: JSON-LD parses in both languages', () => {
    for (const { rel } of PAGES) {
        const blocks = jsonLdBlocks(read(rel));
        assert.ok(blocks.length >= 3, `${rel}: only ${blocks.length} ld+json blocks`);
    }
});

test('email page: marks up a how-to for iPhone and for Android', () => {
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

test('email page: the markup and the visible text agree on the mailto protocol', () => {
    // The pages claim the code works because mailto is supported everywhere.
    // The reader finds that claim in the walkthroughs, the fallback section and
    // the FAQ answer — so the markup has to name the same protocol.
    for (const { rel } of PAGES) {
        const html = read(rel);
        const marked = graph(html).filter(n => n['@type'] === 'HowTo' || n['@type'] === 'FAQPage')
            .map(n => JSON.stringify(n)).join(' ');
        assert.match(marked, /mailto/i, `${rel}: the markup never names the protocol`);
        const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
        assert.match(visible, /mailto/i, `${rel}: the visible text never names the protocol`);
    }
});

test('email page: every FAQ entry in the markup is also visible on the page', () => {
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

test('email page: every visible answer repeats the claim made in the markup', () => {
    // The 300-character recommendation is a factual claim in both the visible
    // answer and the JSON-LD. If the two numbers disagree, one of them is a lie.
    for (const { rel } of PAGES) {
        const html = read(rel);
        const faq = graph(html).find(n => n['@type'] === 'FAQPage');
        const marked = faq.mainEntity.map(q => q.acceptedAnswer.text).join(' ');
        const numbers = [...new Set([...html.matchAll(/(\d+) tegn|(\d+) characters/g)].map(m => m[1] || m[2]))];
        assert.deepEqual(numbers, ['300'], `${rel}: the length limit disagrees across the page: ${numbers.join(', ')}`);
        assert.match(marked, /300 (tegn|characters)/, `${rel}: the marked answer does not repeat the limit`);
    }
});

test('email page: the visible how-to names both platforms', () => {
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

test('email page: the how-to section answers the "how do I create one" question', () => {
    // The top uncovered query for this page in Search Console is exactly that
    // question, and the answer must be readable without leaving the page.
    const expect = {
        da: 'Hvordan opretter jeg en email QR-kode?',
        en: 'How do I create an email QR code?',
    };
    const heading = {
        da: 'Sådan sender dine kunder en email med ét scan',
        en: 'How your customers send an email with a single scan',
    };
    for (const { rel, lang } of PAGES) {
        const html = read(rel);
        assert.ok(html.includes(expect[lang]), `${rel}: missing the question "${expect[lang]}"`);
        const start = html.indexOf(`<h2>${heading[lang]}</h2>`);
        assert.ok(start !== -1, `${rel}: missing the how-to heading "${heading[lang]}"`);
        const section = html.slice(start, html.indexOf('</article>', start));
        assert.match(section, /<ol class="guide-list">/, `${rel}: the how-to section has no numbered steps`);
    }
});

test('email page: the how-to covers phones that cannot read mailto codes', () => {
    // "What if it does not work" is the support question every email QR code
    // earns. It is the reason the visible answer tells the reader to print the
    // address anyway.
    const expect = { da: 'Hvis koden ikke åbner mailappen', en: 'If the code does not open the mail app' };
    for (const { rel, lang } of PAGES) {
        const found = [...read(rel).matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
        assert.ok(found.some(h => h.startsWith(expect[lang])), `${rel}: missing "${expect[lang]}"`);
    }
});

test('email page: no raw angle brackets or ampersands inside JSON-LD', () => {
    // A < or > in inline JSON ends the script block in some parsers, and & can
    // turn into an HTML entity. Both break the rich result without any error.
    for (const { rel } of PAGES) {
        for (const m of read(rel).matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)) {
            assert.doesNotMatch(m[1], /[<>]/, `${rel}: JSON-LD contains a raw < or >`);
            assert.doesNotMatch(m[1], /&(?!amp;|lt;|gt;|quot;|#)/, `${rel}: JSON-LD contains a bare &`);
        }
    }
});
