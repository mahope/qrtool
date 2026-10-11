'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { loadApp } = require('./helpers/load-app');
const { createBrowserEnv } = require('./helpers/dom-stub');

const ROOT = path.join(__dirname, '..');
const WRITE_REVIEW = 'https://search.google.com/local/writereview?placeid=';

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function setup() {
    const api = loadApp();
    api.setTab('review');
    return {
        api,
        field: id => api.field(id),
        qrData: () => api.getQRData()
    };
}

test('Google review QR: builds the write-review link from a place id', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    assert.equal(qrData(), WRITE_REVIEW + 'ChIJN1t_tDeuEmsRUsoyG83frY4');
});

test('Google review QR: returns null without a place id', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value = '   ';
    assert.equal(qrData(), null);
});

test('Google review QR: returns null for an id that does not start with ChIJ', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value = 'restaurant-koebenhavn-42';
    assert.equal(qrData(), null);
});

test('Google review QR: returns null for a truncated id', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value = 'ChIJ12';
    assert.equal(qrData(), null);
});

test('Google review QR: uses a pasted full link as-is', () => {
    const { field, qrData } = setup();
    const pasted = 'https://example.dk/anmeld-os';
    field('reviewPlaceId').value = pasted;
    assert.equal(qrData(), pasted);
});

test('Google review QR: normalises a pasted Google link that carries a place id', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value =
        'https://search.google.com/local/writereview?placeid=ChIJP0warDDowokRfvXMkBqL5Cg&hl=da';
    assert.equal(qrData(), WRITE_REVIEW + 'ChIJP0warDDowokRfvXMkBqL5Cg');
});

test('Google review QR: reads a place id from a pasted reviews link', () => {
    const { field, qrData } = setup();
    field('reviewPlaceId').value =
        'https://search.google.com/local/reviews?placeid=ChIJP0warDDowokRfvXMkBqL5Cg';
    assert.equal(qrData(), WRITE_REVIEW + 'ChIJP0warDDowokRfvXMkBqL5Cg');
});

test('Google review QR: validation accepts a place id', () => {
    const { api, field } = setup();
    field('reviewPlaceId').value = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    assert.equal(api.validateForm(), true);
});

test('Google review QR: validation accepts a pasted link', () => {
    const { api, field } = setup();
    field('reviewPlaceId').value = 'https://g.page/r/CVaH2xMPBQKPEBM/review';
    assert.equal(api.validateForm(), true);
});

test('Google review QR: validation rejects a missing id', () => {
    const { api, field } = setup();
    field('reviewPlaceId').value = '';
    assert.equal(api.validateForm(), false);
    assert.equal(field('reviewPlaceIdError').textContent, 'Place-ID eller link er påkrævet.');
});

test('Google review QR: validation rejects a malformed id', () => {
    const { api, field } = setup();
    field('reviewPlaceId').value = 'ChIJ';
    assert.equal(api.validateForm(), false);
    assert.equal(
        field('reviewPlaceIdError').textContent,
        'Indtast et Place-ID, der begynder med ChIJ (fx ChIJN1t_tDeuEmsRUsoyG83frY4), eller indsæt et helt link.'
    );
});

test('Google review QR: tab label is translated in both languages', () => {
    assert.equal(loadApp().translate('type.review'), 'Anmeldelse');

    const env = createBrowserEnv();
    env.document.documentElement.lang = 'en';
    const english = loadApp({ globals: { document: env.document } }).translate('type.review');
    assert.equal(english, 'Review');
});

test('Google review QR: both language variants have the tab, the form and the preview', () => {
    for (const rel of ['index.html', 'en/index.html']) {
        const html = read(rel);
        assert.ok(html.includes('data-tab="review"'), `${rel} is missing the review tab button`);
        assert.ok(html.includes('data-content="review"'), `${rel} is missing the review tab content`);
        assert.ok(html.includes('id="reviewPlaceId"'), `${rel} is missing the place id field`);
        assert.ok(html.includes('id="reviewPlaceIdError"'), `${rel} is missing the field error slot`);
        assert.ok(html.includes('id="reviewPreviewUrl"'), `${rel} is missing the live preview`);
        assert.ok(
            /<label for="reviewPlaceId">/.test(html),
            `${rel} is missing the label for the place id field`
        );
    }
});

test('Google review QR: the Danish and English guidance differ but describe the same link', () => {
    const da = read('index.html');
    const en = read('en/index.html');
    assert.ok(da.includes('Googles anmeldelsesformular'));
    assert.ok(en.includes('Google review form'));
    for (const html of [da, en]) {
        assert.ok(
            html.includes('https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder'),
            'the Place ID Finder link must point at the official Google page'
        );
        assert.ok(/rel="noopener"/.test(html));
    }
});
