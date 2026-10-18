'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Forward slashes on every platform, so the file names read the same on Windows.
function htmlFiles() {
    const files = [];
    const walk = dir => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
            const rel = dir === '.' ? entry.name : `${dir}/${entry.name}`;
            if (entry.isDirectory()) walk(rel);
            else if (entry.name.endsWith('.html')) files.push(rel);
        }
    };
    walk('.');
    return files.sort();
}

function blocksOf(rel) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m => m[1]);
}

function walkNodes(value, visit) {
    if (Array.isArray(value)) return value.forEach(v => walkNodes(v, visit));
    if (value && typeof value === 'object') {
        visit(value);
        Object.values(value).forEach(v => walkNodes(v, visit));
    }
}

test('structured data: every JSON-LD block on every page parses', () => {
    const broken = [];
    let total = 0;
    for (const rel of htmlFiles()) {
        blocksOf(rel).forEach((raw, i) => {
            total += 1;
            try {
                const parsed = JSON.parse(raw);
                if (!parsed['@context'] || !(parsed['@type'] || parsed['@graph'])) broken.push(`${rel} #${i + 1}: no @context/@type`);
            } catch (err) {
                broken.push(`${rel} #${i + 1}: ${err.message}`);
            }
        });
    }
    assert.ok(total > 20, `only ${total} JSON-LD blocks found`);
    assert.deepEqual(broken, []);
});

// Mahoje is the company behind the site, not a person.
test('structured data: no organization has a person called Mahoje as founder', () => {
    const hits = [];
    for (const rel of htmlFiles()) {
        for (const raw of blocksOf(rel)) {
            walkNodes(JSON.parse(raw), node => {
                const founder = node.founder;
                const list = Array.isArray(founder) ? founder : founder ? [founder] : [];
                for (const f of list) {
                    if (f['@type'] === 'Person' && /^Mahoje$/i.test(f.name)) hits.push(rel);
                }
            });
        }
    }
    assert.deepEqual(hits, []);
});

// No reviews exist. A rating in the markup would be an invented one.
test('structured data: no page carries an aggregateRating or a review', () => {
    const hits = [];
    for (const rel of htmlFiles()) {
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        if (/aggregateRating|"@type"\s*:\s*"(Review|Rating)"|itemprop="(ratingValue|reviewCount|aggregateRating|review)"/i.test(html)) hits.push(rel);
    }
    assert.deepEqual(hits, []);
});

test('structured data: the front pages describe a free web application in their own language', () => {
    for (const [rel, lang, currency] of [['index.html', 'da', 'DKK'], ['en/index.html', 'en', 'USD']]) {
        const blocks = blocksOf(rel).map(raw => JSON.parse(raw));
        const app = blocks.find(b => b['@type'] === 'WebApplication');
        assert.ok(app, `${rel}: no WebApplication`);
        assert.equal(app.inLanguage, lang);
        assert.equal(app.isAccessibleForFree, true);
        assert.equal(app.offers.price, '0');
        assert.equal(app.offers.priceCurrency, currency);
        assert.equal(app.url, lang === 'da' ? 'https://qrtool.dk/' : 'https://qrtool.dk/en/');
    }
});

test('structured data: the organization is QR Tool, a part of Mahoje', () => {
    for (const rel of ['index.html', 'en/index.html']) {
        const blocks = blocksOf(rel).map(raw => JSON.parse(raw));
        const org = blocks.find(b => b['@type'] === 'Organization');
        assert.ok(org, `${rel}: no Organization`);
        assert.equal(org.name, 'QR Tool');
        assert.equal(org.founder, undefined, `${rel}: founder should be gone`);
        assert.equal(org.parentOrganization['@type'], 'Organization');
        assert.equal(org.parentOrganization.name, 'Mahoje');
        assert.equal(org.parentOrganization.url, 'https://mahoje.dk');
        // sameAs would say that QR Tool *is* Mahoje
        assert.ok(!(org.sameAs || []).includes('https://mahoje.dk'), `${rel}: sameAs points at the parent`);
    }
});
