'use strict';

// Mobile keyboards capitalise, autocorrect and spell-check by default. Fields that
// hold URLs, passwords, handles and ids must keep exactly what the user types.
// The attributes must be in the markup, not set by JavaScript after load.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test', 'lib']);

function htmlFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) out.push(...htmlFiles(path.join(dir, entry.name)));
        } else if (entry.name.endsWith('.html')) {
            out.push(path.join(dir, entry.name));
        }
    }
    return out;
}

function parseAttrs(tag) {
    const attrs = {};
    const re = /([a-zA-Z-]+)(?:="([^"]*)")?/g;
    const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
    let m;
    while ((m = re.exec(body))) attrs[m[1]] = m[2] === undefined ? '' : m[2];
    return attrs;
}

// Fields in document order, grouped per generator panel (tab-content) or per page.
function fieldGroups(html) {
    const parts = html.split(/(?=<div class="tab-content)/);
    return parts.map(part => {
        const fields = [];
        const re = /<(input|textarea)\b[^>]*>/g;
        let m;
        while ((m = re.exec(part))) {
            const attrs = parseAttrs(m[0]);
            fields.push({ tag: m[1], attrs, id: attrs.id });
        }
        return fields;
    });
}

const NONE = { autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false' };
const RULES = {
    qrText: NONE,
    vcardWebsite: { ...NONE, inputmode: 'url' },
    wifiSSID: { ...NONE, autocomplete: 'off' },
    wifiPassword: { ...NONE, autocomplete: 'off' },
    socialUsername: NONE,
    appId: NONE,
    paypalUsername: NONE,
    reviewPlaceId: NONE,
    emailTo: { ...NONE, type: 'email', inputmode: 'email' },
    vcardEmail: { ...NONE, type: 'email', inputmode: 'email' },
    smsPhone: { type: 'tel', inputmode: 'tel' },
    vcardPhone: { type: 'tel', inputmode: 'tel' },
    phoneNumber: { type: 'tel', inputmode: 'tel' },
    mobilepayPhone: { type: 'tel', inputmode: 'tel' }
};
const UNTOUCHED = ['vcardName', 'vcardFirstName', 'vcardLastName', 'vcardTitle', 'vcardOrg', 'vcardAddress',
    'emailSubject', 'emailBody', 'smsMessage', 'smsBody', 'calTitle', 'calLocation', 'eventTitle', 'eventLocation'];
const SINGLE_LINE_TYPES = new Set(['text', 'tel', 'email', 'url']);
const NOT_IN_FLOW = new Set(['ctaText', 'historySearch', 'batchInput']);

const files = htmlFiles(root);
const parsed = files.map(file => ({
    file: path.relative(root, file),
    groups: fieldGroups(fs.readFileSync(file, 'utf8'))
}));

test('finds all 32 HTML files (31 pages and the service worker offline fallback, which has no fields)', () => {
    assert.equal(files.length, 32);
});

test('every listed field carries the required attributes', () => {
    const seen = new Set();
    for (const { file, groups } of parsed) {
        for (const field of groups.flat()) {
            const rule = RULES[field.id];
            if (!rule) continue;
            seen.add(field.id);
            for (const [name, value] of Object.entries(rule)) {
                assert.equal(field.attrs[name], value, `${file}: #${field.id} needs ${name}="${value}"`);
            }
        }
    }
    assert.deepEqual([...seen].sort(), Object.keys(RULES).sort());
});

test('free-text fields stay unchanged', () => {
    for (const { file, groups } of parsed) {
        for (const field of groups.flat()) {
            if (!UNTOUCHED.includes(field.id)) continue;
            for (const name of ['autocapitalize', 'autocorrect', 'spellcheck']) {
                assert.equal(field.attrs[name], undefined, `${file}: #${field.id} must not set ${name}`);
            }
        }
    }
});

test('Danish and English pages use identical attributes per field id', () => {
    const byId = new Map();
    const relevant = ['autocapitalize', 'autocorrect', 'spellcheck', 'inputmode', 'autocomplete'];
    for (const { file, groups } of parsed) {
        for (const field of groups.flat()) {
            if (!field.id) continue;
            const sig = JSON.stringify(relevant.map(n => field.attrs[n] ?? null));
            if (!byId.has(field.id)) byId.set(field.id, { sig, file });
            else assert.equal(sig, byId.get(field.id).sig, `${file}: #${field.id} differs from ${byId.get(field.id).file}`);
        }
    }
});

test('enterkeyhint: next on inner single-line fields, done on the last, never on textarea', () => {
    for (const { file, groups } of parsed) {
        for (const group of groups) {
            const inFlow = f => f.tag === 'textarea' ? !NOT_IN_FLOW.has(f.id) : SINGLE_LINE_TYPES.has(f.attrs.type || 'text') && !NOT_IN_FLOW.has(f.id);
            const fields = group.filter(inFlow);
            fields.forEach((field, i) => {
                if (field.tag === 'textarea') return;
                const expected = i === fields.length - 1 ? 'done' : 'next';
                assert.equal(field.attrs.enterkeyhint, expected, `${file}: #${field.id} needs enterkeyhint="${expected}"`);
            });
            for (const field of group) {
                if (field.tag === 'textarea') assert.equal(field.attrs.enterkeyhint, undefined, `${file}: textarea #${field.id} must not set enterkeyhint`);
            }
        }
    }
});
