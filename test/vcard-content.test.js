'use strict';

// The vCard landing page ranks position 9-10 for "digitalt visitkort" and
// "digitalt visitkort iphone" (121 impressions, 0 clicks in Search Console),
// but its title and description never mentioned iPhone or Android. These tests
// pin the rewrite: the title and description promise what the searcher asked
// for, the new questions are visible to readers AND in the FAQPage schema, and
// the two language versions carry the same facts.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    { rel: 'vcard-qr-kode.html', lang: 'da' },
    { rel: 'en/vcard-qr-code.html', lang: 'en' },
];

const DA = 'vcard-qr-kode.html';
const EN = 'en/vcard-qr-code.html';

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function meta(html, attr, key) {
    const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 'i'));
    return m ? m[1] : null;
}

function title(html) {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return m ? m[1] : null;
}

function jsonLdBlocks(html) {
    return [...html.matchAll(/<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g)]
        .map(m => JSON.parse(m[1]));
}

function faqSchemaQuestions(html) {
    const nodes = jsonLdBlocks(html).flatMap(block => (block['@graph'] ? block['@graph'] : [block]));
    const faq = nodes.find(n => n['@type'] === 'FAQPage');
    return faq ? faq.mainEntity.map(q => q.name) : [];
}

// The visible questions of every .faq-section on the page, in document order.
function visibleFaqQuestions(html) {
    const questions = [];
    const sections = html.match(/<article[^>]*class="[^"]*faq-section[^"]*"[^>]*>[\s\S]*?<\/article>/g) || [];
    for (const section of sections) {
        for (const m of section.matchAll(/<h3>([\s\S]*?)<\/h3>/g)) {
            questions.push(m[1].trim());
        }
    }
    return questions;
}

test('vcard page: title and og/twitter titles name iPhone and Android', () => {
    for (const { rel } of PAGES) {
        const html = read(rel);
        for (const value of [title(html), meta(html, 'property', 'og:title'), meta(html, 'property', 'twitter:title')]) {
            assert.match(value, /iPhone/, `${rel}: title "${value}" does not mention iPhone`);
            assert.match(value, /Android/, `${rel}: title "${value}" does not mention Android`);
        }
    }
});

test('vcard page: meta description names iPhone and Android and stays short enough for a snippet', () => {
    for (const { rel } of PAGES) {
        const desc = meta(read(rel), 'name', 'description');
        assert.match(desc, /iPhone/, `${rel}: description does not mention iPhone`);
        assert.match(desc, /Android/, `${rel}: description does not mention Android`);
        assert.ok(desc.length <= 160, `${rel}: description is ${desc.length} characters, over 160`);
    }
});

test('vcard page: the FAQPage schema lists the same questions as the visible FAQ, in order', () => {
    for (const { rel } of PAGES) {
        const schema = faqSchemaQuestions(read(rel));
        const visible = visibleFaqQuestions(read(rel));
        assert.ok(schema.length >= 7, `${rel}: only ${schema.length} schema questions`);
        assert.deepEqual(schema, visible, `${rel}: schema FAQ and visible FAQ drifted apart`);
    }
});

test('vcard page: the FAQ answers the iPhone question that scores 25 impressions at position 10', () => {
    const schema = faqSchemaQuestions(read(DA));
    assert.ok(schema.some(q => /iPhone/.test(q) && /digitalt visitkort/i.test(q)),
        `da: no FAQ question about a digitalt visitkort on iPhone, got: ${schema.join(' | ')}`);
    const schemaEn = faqSchemaQuestions(read(EN));
    assert.ok(schemaEn.some(q => /iPhone/.test(q) && /business card/i.test(q)),
        `en: no FAQ question about a digital business card on iPhone, got: ${schemaEn.join(' | ')}`);
});

test('vcard page: the FAQ states a print size and the standard business card format', () => {
    for (const { rel } of PAGES) {
        const html = read(rel);
        assert.match(html, /2×2 cm/, `${rel}: no minimum QR size of 2×2 cm`);
        assert.match(html, /85×55 mm/, `${rel}: no standard card size of 85×55 mm`);
    }
});

test('vcard page: questions and answers mirror across the two languages', () => {
    assert.equal(faqSchemaQuestions(read(DA)).length, faqSchemaQuestions(read(EN)).length,
        'da and en FAQ have a different number of questions');
});
