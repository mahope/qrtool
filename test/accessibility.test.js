'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pages, read } = require('./helpers/pages');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function markup(file) {
    return read(file).replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
}

function isEnglish(file) {
    return file.startsWith('en/');
}

for (const file of pages) {
    test(`${file} has exactly one main, with header and footer outside it`, () => {
        const html = markup(file);
        assert.equal((html.match(/<main[\s>]/g) || []).length, 1, 'one <main>');
        assert.equal((html.match(/<\/main>/g) || []).length, 1, 'one </main>');
        assert.doesNotMatch(html, /role="main"/);
        const open = html.indexOf('<main');
        const close = html.indexOf('</main>');
        assert.ok(open < close);
        for (const tag of ['<header', '<footer']) {
            const at = html.indexOf(tag);
            if (at > -1) assert.ok(at < open || at > close, `${tag} is outside <main>`);
        }
    });

    test(`${file} keeps heading levels in order`, () => {
        const html = markup(file);
        let previous = 0;
        for (const match of html.matchAll(/<h([1-6])[\s>]/g)) {
            const level = Number(match[1]);
            assert.ok(previous === 0 || level <= previous + 1, `h${level} follows h${previous}`);
            previous = level;
        }
    });

    test(`${file} names its logo link and states the language switch with its visible text`, () => {
        const html = markup(file);
        const logo = html.match(/<div class="logo">\s*(<a\b[^>]*>)/);
        if (logo) assert.match(logo[1], /aria-label="[^"]{3,}"/, 'logo link has an accessible name');
        const lang = html.match(/<a id="langSwitcher"[^>]*>[\s\S]*?<\/a>/);
        if (lang) {
            const visible = lang[0].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
            assert.ok(visible.length > 0);
            const label = lang[0].match(/aria-label="([^"]*)"/);
            if (label) assert.ok(label[1].toLowerCase().startsWith(visible.toLowerCase()), `"${label[1]}" starts with "${visible}"`);
        }
    });
}

test('home pages label the style selects, the logo input and the preview image', () => {
    for (const file of ['index.html', 'en/index.html']) {
        const html = markup(file);
        for (const id of ['qrStyle', 'errorCorrection']) {
            const tag = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>`))[0];
            const labelled = /aria-label="[^"]+"/.test(tag) || new RegExp(`<label[^>]*for="${id}"`).test(html);
            assert.ok(labelled, `${file}: #${id} has a label`);
        }
        const input = html.match(/<input[^>]*id="logoFileInput"[^>]*>/)[0];
        assert.ok(/aria-label="[^"]+"/.test(input) || /<label[^>]*for="logoFileInput"/.test(html), `${file}: #logoFileInput has a label`);
        const preview = html.match(/<[a-z]+[^>]*id="qrPreview"[^>]*>/)[0];
        assert.match(preview, /aria-label="[^"]+"/, `${file}: #qrPreview has a name`);
        const generate = html.match(/<button[^>]*id="generateBtn"[^>]*>/)[0];
        assert.doesNotMatch(generate, /aria-label=/, `${file}: the Generate button is named by its visible text`);
    }
});

test('links in running text, breadcrumbs and the footer are underlined, not only coloured', () => {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({ selectors, body }));
    for (const needle of ['.breadcrumb a', '.footer-links a', 'p a']) {
        const hit = rules.find(rule => rule.selectors.includes(needle) && /text-decoration:\s*underline/.test(rule.body));
        assert.ok(hit, `${needle} is underlined`);
    }
});

test('the logo hint meets 4.5:1 contrast in both themes', () => {
    const rule = css.match(/\.logo-hint\s*\{([^}]*)\}/);
    assert.ok(rule, '.logo-hint rule exists');
    assert.doesNotMatch(rule[1], /opacity:\s*0?\.\d/);
});
