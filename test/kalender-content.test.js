'use strict';

// The calendar page grows +500 % off a small base (6 visitors/28 days, Plausible
// 2026-10-10) and Search Console shows "qr code calendar event" (34 impressions,
// position 14), "qr code to add calendar event" (26, position 15) and "calendar
// qr code" (29, position 17) with zero clicks. The page already carries a
// scanning walkthrough for both platforms; these tests lock that markup in and
// keep the two language versions, the FAQPage data and the links to the other
// QR types from drifting apart.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    { rel: 'kalender-qr-kode.html', lang: 'da' },
    { rel: 'en/calendar-qr-code.html', lang: 'en' },
];

// The five other generator pages. A visitor who lands on the calendar page from
// Facebook or search often needs one of these instead.
const OTHER_TYPES = {
    da: ['/wifi-qr-kode', '/vcard-qr-kode', '/sms-qr-kode', '/email-qr-kode', '/tekst-qr-kode'],
    en: ['/en/wifi-qr-code', '/en/vcard-qr-code', '/en/sms-qr-code', '/en/email-qr-code', '/en/text-qr-code'],
};

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

test('calendar page: JSON-LD parses in both languages', () => {
    for (const { rel } of PAGES) {
        const blocks = jsonLdBlocks(read(rel));
        assert.ok(blocks.length >= 3, `${rel}: only ${blocks.length} ld+json blocks`);
    }
});

test('calendar page: marks up a how-to for iPhone and for Android', () => {
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

test('calendar page: every FAQ entry in the markup is also visible on the page', () => {
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

test('calendar page: the how-to answers the creation question first', () => {
    // "qr code to add calendar event" (position 15) and "qr code calendar event"
    // (position 14) get impressions but no clicks; the page had no visible answer
    // to the most basic question - how the code is made. It is now the first FAQ.
    const expect = {
        da: 'Hvordan opretter jeg en kalender QR-kode?',
        en: 'How do I create a calendar QR code?',
    };
    for (const { rel, lang } of PAGES) {
        const html = read(rel);
        assert.ok(html.includes(`<h3>${expect[lang]}</h3>`),
            `${rel}: missing the question "${expect[lang]}"`);

        const faq = graph(html).find(n => n['@type'] === 'FAQPage');
        assert.equal(faq.mainEntity[0].name, expect[lang],
            `${rel}: the creation question is not first in the marked FAQ`);

        const visible = [...html.matchAll(/<div class="faq-item">\s*<h3>([^<]+)<\/h3>/g)].map(m => m[1].trim());
        assert.equal(visible[0], expect[lang],
            `${rel}: the creation question is not first in the visible FAQ`);
    }
});

test('calendar page: the visible how-to names both platforms', () => {
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

test('calendar page: links to the other QR types for both languages', () => {
    for (const { rel, lang } of PAGES) {
        const html = read(rel);
        for (const href of OTHER_TYPES[lang]) {
            assert.ok(html.includes(`href="${href}"`), `${rel}: missing the link to ${href}`);
        }
    }
});

test('calendar page: no raw angle brackets or ampersands inside JSON-LD', () => {
    // A < or > in inline JSON ends the script block in some parsers, and & can
    // turn into an HTML entity. Both break the rich result without any error.
    for (const { rel } of PAGES) {
        for (const m of read(rel).matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)) {
            assert.doesNotMatch(m[1], /[<>]/, `${rel}: JSON-LD contains a raw < or >`);
            assert.doesNotMatch(m[1], /&(?!amp;|lt;|gt;|quot;|#)/, `${rel}: JSON-LD contains a bare &`);
        }
    }
});
