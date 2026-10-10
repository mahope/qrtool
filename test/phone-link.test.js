'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');
const { createBrowserEnv } = require('./helpers/dom-stub');

function setup() {
    const api = loadApp();
    api.setTab('phone');
    return {
        api,
        field: id => api.field(id),
        qrData: () => api.getQRData()
    };
}

function setupSocial(platform) {
    const api = loadApp();
    api.setTab('social');
    api.field('socialPlatform').value = platform;
    return {
        api,
        field: id => api.field(id),
        qrData: () => api.getQRData()
    };
}

test('Phone QR: builds a tel: link from a number typed with spaces and dashes', () => {
    const { field, qrData } = setup();
    field('phoneNumber').value = '12 34-56.78';
    assert.equal(qrData(), 'tel:12345678');
});

test('Phone QR: keeps the + country prefix and drops later plus signs', () => {
    const { field, qrData } = setup();
    field('phoneNumber').value = '+45 12 34 56 78';
    assert.equal(qrData(), 'tel:+4512345678');
});

test('Phone QR: returns null without a number', () => {
    const { field, qrData } = setup();
    field('phoneNumber').value = '';
    assert.equal(qrData(), null);
});

test('Phone QR: returns null for a number with fewer than six digits', () => {
    const { field, qrData } = setup();
    field('phoneNumber').value = '12345';
    assert.equal(qrData(), null);
});

test('Phone QR: validation accepts a number with a country prefix', () => {
    const { api, field } = setup();
    field('phoneNumber').value = '+45 12 34 56 78';
    assert.equal(api.validateForm(), true);
});

test('Phone QR: validation rejects a number that is too short', () => {
    const { api, field } = setup();
    field('phoneNumber').value = '123';
    assert.equal(api.validateForm(), false);
});

test('WhatsApp: builds a wa.me link from a number with spaces', () => {
    const { field, qrData } = setupSocial('whatsapp');
    field('socialUsername').value = '+45 12 34 56 78';
    assert.equal(qrData(), 'https://wa.me/4512345678');
});

test('WhatsApp: returns null for a username without digits', () => {
    const { field, qrData } = setupSocial('whatsapp');
    field('socialUsername').value = 'mitfirma';
    assert.equal(qrData(), null);
});

test('WhatsApp: validation rejects a name without digits', () => {
    const { api, field } = setupSocial('whatsapp');
    field('socialUsername').value = 'mitfirma';
    assert.equal(api.validateForm(), false);
});

test('Social: other platforms still build profile links', () => {
    const { field, qrData } = setupSocial('instagram');
    field('socialUsername').value = 'ditbrugernavn';
    assert.equal(qrData(), 'https://instagram.com/ditbrugernavn');
});

test('Phone QR: tab label is translated in both languages', () => {
    const danish = loadApp().translate('type.phone');
    assert.equal(danish, 'Telefon');

    const env = createBrowserEnv();
    env.document.documentElement.lang = 'en';
    const english = loadApp({ globals: { document: env.document } }).translate('type.phone');
    assert.equal(english, 'Phone');
});
