'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const DA = 'index.html';
const EN = 'en/index.html';
const PAGES = [DA, EN];

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function decode(value) {
    return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function meta(html, attr, key) {
    const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 'i'));
    return m ? decode(m[1]) : null;
}

function title(html) {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return m ? decode(m[1].trim()) : null;
}

function text(fragment) {
    return fragment.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function h1s(html) {
    return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => text(m[1]));
}

function jsonLd(html) {
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
        .map(m => JSON.parse(m[1]));
}

// What `/` ranks for today (GSC 11/10: 729 impressions, position 14.5) is "qr kode",
// "lav qr kode" and "gratis qr kode", and the small Danish sites that outrank it open
// with the search itself in the title and the H1 instead of the brand.

// ------------------------------------------------------------ title, H1, description

test('front page: the title starts with the search, not the brand', () => {
    assert.match(title(read(DA)), /^Lav QR-kode gratis/);
    assert.match(title(read(EN)), /^Free QR Code Generator/);
});

test('front page: the title fits Google’s result snippet', () => {
    for (const rel of PAGES) {
        const value = title(read(rel));
        assert.ok(value.length <= 60, `${rel}: title is ${value.length} characters`);
        assert.match(value, /QRTool\.dk$/, `${rel}: the brand closes the title`);
    }
});

test('front page: the description is a complete pitch within 160 characters', () => {
    for (const rel of PAGES) {
        const value = meta(read(rel), 'name', 'description');
        assert.ok(value, `${rel} is missing the meta description`);
        assert.ok(value.length >= 120, `${rel}: description is only ${value.length} characters`);
        assert.ok(value.length <= 160, `${rel}: description is ${value.length} characters`);
        assert.match(value, rel === DA ? /gratis/i : /free/i);
        assert.match(value, rel === DA ? /ingen login/i : /no login/i);
        assert.match(value, /PNG/);
        assert.match(value, /SVG/);
        assert.match(value, /PDF/);
    }
});

test('front page: og and twitter cards repeat the title and the description', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        const pageTitle = title(html);
        const description = meta(html, 'name', 'description');
        assert.equal(meta(html, 'name', 'title'), pageTitle, `${rel}: meta title`);
        assert.equal(meta(html, 'property', 'og:title'), pageTitle, `${rel}: og:title`);
        assert.equal(meta(html, 'name', 'twitter:title'), pageTitle, `${rel}: twitter:title`);
        assert.equal(meta(html, 'property', 'og:description'), description, `${rel}: og:description`);
        assert.equal(meta(html, 'name', 'twitter:description'), description, `${rel}: twitter:description`);
    }
});

test('front page: there is one H1, and it is the search, not the brand', () => {
    const da = h1s(read(DA));
    const en = h1s(read(EN));
    assert.equal(da.length, 1, `index.html has ${da.length} h1 elements`);
    assert.equal(en.length, 1, `en/index.html has ${en.length} h1 elements`);
    assert.match(da[0], /^Lav en QR-kode gratis$/);
    assert.match(en[0], /^Make a free QR code$/);
});

test('front page: the subtitle says there is no login and no expiry', () => {
    const da = /<header>[\s\S]*?<\/header>/.exec(read(DA))[0];
    const en = /<header>[\s\S]*?<\/header>/.exec(read(EN))[0];
    const daSub = text(/<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(da)[1]);
    const enSub = text(/<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(en)[1]);
    assert.match(daSub, /uden login/);
    assert.match(daSub, /uden udløb/);
    assert.match(daSub, /virker, så længe linket virker/);
    assert.match(enSub, /no login/i);
    assert.match(enSub, /no expiry/i);
    assert.match(enSub, /as long as the link works/i);
});

// ------------------------------------------------------------ canonical og hreflang

test('front page: canonical, og:url and the language alternates use the trailing slash', () => {
    const daHtml = read(DA);
    const enHtml = read(EN);
    assert.match(daHtml, /<link rel="canonical" href="https:\/\/qrtool\.dk\/">/);
    assert.equal(meta(daHtml, 'property', 'og:url'), 'https://qrtool.dk/');
    assert.equal(meta(daHtml, 'name', 'twitter:url'), 'https://qrtool.dk/');
    assert.match(daHtml, /hreflang="da" href="https:\/\/qrtool\.dk\/">/);
    assert.match(daHtml, /hreflang="x-default" href="https:\/\/qrtool\.dk\/">/);
    assert.match(enHtml, /hreflang="da" href="https:\/\/qrtool\.dk\/">/);
    assert.match(enHtml, /hreflang="x-default" href="https:\/\/qrtool\.dk\/">/);
    assert.match(enHtml, /<link rel="canonical" href="https:\/\/qrtool\.dk\/en\/">/);
});

// ------------------------------------------------------------ copy that has to go

test('front page: the copy-pasted "about this tool" block is gone', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        assert.doesNotMatch(html, /data-seo-explainer/, `${rel}: explainer section is still there`);
        assert.doesNotMatch(html, /Om dette værktøj|About this tool/, `${rel}: explainer heading is still there`);
        assert.doesNotMatch(html, /beregningen|the calculation/i, `${rel}: explainer talks about a calculation`);
    }
});

test('copy: nothing claims to be the most advanced generator', () => {
    for (const rel of [DA, EN, 'om-qr-tool.html', 'en/about.html']) {
        assert.doesNotMatch(read(rel), /mest avancerede|most advanced/i, `${rel} still has the unsupported superlative`);
    }
});

test('copy: no page promises a code that works "forever"', () => {
    // A static code works as long as what it points at works, no longer.
    for (const rel of PAGES) {
        assert.doesNotMatch(read(rel), /for evigt|work forever|will last forever/i, `${rel} promises forever`);
    }
});

// ------------------------------------------------------------ tillid under værktøjet

test('front page: three trust points sit under the generator', () => {
    const da = read(DA);
    const en = read(EN);
    for (const [rel, html, patterns] of [
        [DA, da, [/Ingen konto/i, /også virker, hvis QRTool\.dk forsvinder/, /forlader aldrig din browser/]],
        [EN, en, [/No account/i, /still work if QRTool\.dk disappears/, /never leaves your browser/]]
    ]) {
        const block = /<section class="trust-line"[\s\S]*?<\/section>/.exec(html);
        assert.ok(block, `${rel} has no trust line`);
        assert.equal((block[0].match(/<li>/g) || []).length, 3, `${rel}: the trust line has three points`);
        for (const pattern of patterns) assert.match(block[0], pattern, `${rel}: trust line misses ${pattern}`);
        // under the generator cards, above the scanner teaser
        const mainEnd = html.indexOf('<!-- QR Scanner Section -->');
        assert.ok(html.indexOf('class="trust-line"') < mainEnd, `${rel}: trust line comes after the scanner teaser`);
        assert.ok(html.indexOf('class="trust-line"') > html.indexOf('class="options-section"'),
            `${rel}: trust line sits above the options`);
    }
});

test('front page: the trust line does not promise "no tracking" or "free forever"', () => {
    for (const rel of PAGES) {
        const block = /<section class="trust-line"[\s\S]*?<\/section>/.exec(read(rel))[0];
        assert.doesNotMatch(block, /tracking|for evigt|forever/i, `${rel}: trust line overclaims`);
    }
});

// ------------------------------------------------------------ sektioner under værktøjet

const SECTIONS = [
    { id: { [DA]: 'saadan-laver-man-en-qr-kode', [EN]: 'how-to-make-a-qr-code' }, da: /Sådan laver man en QR-kode/, en: /How to make a QR code/ },
    { id: { [DA]: 'qr-kode-med-logo', [EN]: 'qr-code-with-a-logo' }, da: /QR-kode med logo/, en: /QR code with a logo/ },
    { id: { [DA]: 'qr-kode-som-png-svg-pdf', [EN]: 'qr-code-as-png-svg-pdf' }, da: /QR-kode som PNG, SVG eller PDF/, en: /QR code as PNG, SVG or PDF/ },
    { id: { [DA]: 'statisk-eller-dynamisk-qr-kode', [EN]: 'static-or-dynamic-qr-code' }, da: /Statisk eller dynamisk QR-kode/, en: /Static or dynamic QR code/ }
];

function section(html, id) {
    const start = html.indexOf(`id="${id}"`);
    if (start === -1) return null;
    const open = html.lastIndexOf('<article', start);
    return html.slice(open, html.indexOf('</article>', start));
}

test('front page: the four sections for the long searches are on the page', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        for (const s of SECTIONS) {
            const block = section(html, s.id[rel]);
            assert.ok(block, `${rel}: no section #${s.id[rel]}`);
            const heading = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(block);
            assert.ok(heading, `${rel}: #${s.id[rel]} has no h2`);
            assert.match(text(heading[1]), rel === DA ? s.da : s.en);
        }
    }
});

test('front page: each section is 100 to 220 words and links on to the matching pages', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        for (const s of SECTIONS) {
            const block = section(html, s.id[rel]);
            const words = text(block).split(' ').length;
            assert.ok(words >= 100 && words <= 220, `${rel}: #${s.id[rel]} has ${words} words`);
            assert.ok((block.match(/<a href="\/[^"]*"/g) || []).length >= 1, `${rel}: #${s.id[rel]} has no internal link`);
        }
    }
});

test('front page: the how-to section replaces the old "use QR Tool effectively" block', () => {
    for (const rel of PAGES) {
        assert.doesNotMatch(read(rel), /Sådan bruger du QR Tool effektivt|How to use QR Tool effectively/);
    }
});

test('front page: the how-to steps in the schema match the visible steps', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        const howTo = jsonLd(html).find(block => block['@type'] === 'HowTo');
        assert.ok(howTo, `${rel}: no HowTo block`);
        const items = (section(html, SECTIONS[0].id[rel]).match(/<li>/g) || []).length;
        assert.equal(howTo.step.length, items, `${rel}: HowTo has ${howTo.step.length} steps, the page shows ${items}`);
    }
});

test('front page: the static-or-dynamic section is honest about the trade-off', () => {
    const da = text(section(read(DA), SECTIONS[3].id[DA]));
    const en = text(section(read(EN), SECTIONS[3].id[EN]));
    assert.match(da, /scan-statistik|statistik over scans/i);
    assert.match(da, /kan ikke ændres|ikke kan ændres/);
    assert.match(en, /scan statistics|statistics/i);
    assert.match(en, /cannot be changed|can’t be changed|can't be changed/);
});

test('copy: the page does not name competitors', () => {
    for (const rel of PAGES) {
        assert.doesNotMatch(read(rel), /QR Code Generator PRO|QR TIGER|qrcode-tiger|qrfy|me-qr|lavqrkode/i, rel);
    }
});

// ------------------------------------------------------------ FAQ

test('FAQ: the answer about expiry comes first and is the accurate one', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        const faq = html.slice(html.indexOf('id="faq"'), html.indexOf('</article>', html.indexOf('id="faq"')));
        const first = /<h3 itemprop="name">([\s\S]*?)<\/h3>[\s\S]*?<p itemprop="text">([\s\S]*?)<\/p>/.exec(faq);
        assert.ok(first, `${rel}: no FAQ items`);
        assert.match(first[1], rel === DA ? /Udløber/ : /expire/i);
        assert.match(first[2], rel === DA ? /virker, så længe/ : /as long as/);
    }
});

test('FAQ: the questions are marked up as one FAQPage', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        assert.match(html, /<article class="content-block faq-section" id="faq" itemscope itemtype="https:\/\/schema\.org\/FAQPage">/,
            `${rel}: the FAQ article is not a FAQPage`);
    }
});

// ------------------------------------------------------------ scanner og genveje

test('front page: the embedded scanner is a short teaser that points at the scanner page', () => {
    for (const [rel, href] of [[DA, '/scan-qr-kode'], [EN, '/en/scan-qr-code']]) {
        const html = read(rel);
        const start = html.indexOf('<!-- QR Scanner Section -->');
        assert.notEqual(start, -1, `${rel}: lost the scanner marker`);
        const block = html.slice(start, html.indexOf('</section>', start));
        assert.ok(block.includes(`href="${href}"`), `${rel}: teaser does not link to ${href}`);
        assert.doesNotMatch(block, /<video|<canvas|startScanBtn|scanFileInput/, `${rel}: the scanner UI is still embedded`);
        assert.ok(text(block).split(' ').length <= 60, `${rel}: the teaser is not short`);
    }
});

test('front page: the keyboard-shortcuts dialog does not add a heading to the outline', () => {
    for (const rel of PAGES) {
        const html = read(rel);
        const dialog = html.slice(html.indexOf('id="shortcutsOverlay"'), html.indexOf('id="scrollToTop"'));
        assert.doesNotMatch(dialog, /<h[1-6]/, `${rel}: the shortcuts dialog still has a heading`);
        assert.match(dialog, /class="shortcuts-title"/, `${rel}: the shortcuts title lost its class`);
    }
    assert.match(read('style.css'), /\.shortcuts-title\s*\{/, 'style.css styles the shortcuts title');
});

test('front page: the unparseable cookie-banner script is gone', () => {
    // `var k=consent:v1` (unquoted) threw "Unexpected token ':'" on every load.
    for (const rel of PAGES) {
        assert.doesNotMatch(read(rel), /var k=consent:v1/, `${rel} still has the broken script`);
    }
});

// ------------------------------------------------------------ interne links

test('front page: the type pages and the scanner are linked from the body copy', () => {
    const wanted = {
        [DA]: ['/wifi-qr-kode', '/vcard-qr-kode', '/tekst-qr-kode', '/scan-qr-kode', '/guides/'],
        [EN]: ['/en/wifi-qr-code', '/en/vcard-qr-code', '/en/text-qr-code', '/en/scan-qr-code', '/en/guides/']
    };
    for (const rel of PAGES) {
        const html = read(rel);
        const body = html.slice(html.indexOf('<section class="seo-content'), html.indexOf('<footer'));
        for (const href of wanted[rel]) {
            assert.ok(body.includes(`href="${href}`), `${rel}: no link to ${href} in the content below the tool`);
        }
    }
});
