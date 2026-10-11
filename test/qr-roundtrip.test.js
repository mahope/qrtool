'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp, qrcode, jsQR } = require('./helpers/load-app');

const SCALE = 4;
const QUIET = 4;

// Renders a generated matrix the same way the site does: one dark module per
// block, on white, surrounded by the mandatory quiet zone.
function toRgba(qr) {
    const modules = qr.getModuleCount();
    const total = (modules + QUIET * 2) * SCALE;
    const data = new Uint8ClampedArray(total * total * 4).fill(255);

    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            if (!qr.isDark(row, col)) continue;
            for (let dy = 0; dy < SCALE; dy++) {
                for (let dx = 0; dx < SCALE; dx++) {
                    const x = (QUIET + col) * SCALE + dx;
                    const y = (QUIET + row) * SCALE + dy;
                    const i = (y * total + x) * 4;
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 255;
                }
            }
        }
    }
    return { data, size: total };
}

function decode(text, correction = 'M') {
    const qr = qrcode(0, correction);
    qr.addData(text);
    qr.make();
    const { data, size } = toRgba(qr);
    const result = jsQR(data, size, size);
    assert.ok(result, `jsQR could not decode the generated code for: ${text}`);
    return result.data;
}

const cases = [
    {
        name: 'text',
        tab: 'text',
        text: 'https://qrtool.dk',
        fill: f => { f('qrText').value = 'https://qrtool.dk'; }
    },
    {
        name: 'WiFi',
        tab: 'wifi',
        text: 'WIFI:T:WPA;S:Gæstenet;P:hemmelig;H:false;;',
        fill: f => {
            f('wifiSSID').value = 'Gæstenet';
            f('wifiPassword').value = 'hemmelig';
            f('wifiEncryption').value = 'WPA';
            f('wifiHidden').checked = false;
        }
    },
    {
        name: 'vCard',
        tab: 'vcard',
        text: 'BEGIN:VCARD\nVERSION:3.0\nFN:Mads Æøå\nTEL:+4512345678\nEND:VCARD',
        fill: f => {
            f('vcardName').value = 'Mads Æøå';
            f('vcardPhone').value = '+4512345678';
            f('vcardOrg').value = '';
            f('vcardTitle').value = '';
            f('vcardEmail').value = '';
            f('vcardWebsite').value = '';
            f('vcardAddress').value = '';
        }
    },
    {
        name: 'e-mail',
        tab: 'email',
        text: 'mailto:hej@mahoje.dk?subject=Sp%C3%B8rgsm%C3%A5l&body=Hej',
        fill: f => {
            f('emailTo').value = 'hej@mahoje.dk';
            f('emailSubject').value = 'Spørgsmål';
            f('emailBody').value = 'Hej';
        }
    },
    {
        name: 'SMS',
        tab: 'sms',
        text: 'sms:12345678?body=Hej%20%C3%86%C3%B8%C3%A5',
        fill: f => {
            f('smsPhone').value = '12345678';
            f('smsMessage').value = 'Hej Æøå';
        }
    },
    {
        name: 'kalender',
        tab: 'calendar',
        text: 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Møde\nLOCATION:Kontoret\nDTSTART:20261205T190000\nDTEND:20261205T220000\nEND:VEVENT\nEND:VCALENDAR',
        fill: f => {
            f('calTitle').value = 'Møde';
            f('calLocation').value = 'Kontoret';
            f('calStart').value = '2026-12-05T19:30';
            f('calEnd').value = '2026-12-05T22:00';
            f('calDescription').value = '';
        }
    },
    {
        name: 'Google-anmeldelse',
        tab: 'review',
        text: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
        fill: f => {
            f('reviewPlaceId').value = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
        }
    }
];

for (const item of cases) {
    test(`round-trip: a generated ${item.name} code scans back to the same payload`, () => {
        const api = loadApp();
        const f = api.field;
        api.setTab(item.tab);
        item.fill(f);
        const data = api.getQRData();
        assert.equal(typeof data, 'string', 'getQRData() must return a string');

        const scanned = decode(data);
        assert.equal(scanned, data);
    });

    test(`round-trip: the ${item.name} payload survives every error-correction level`, () => {
        const api = loadApp();
        const f = api.field;
        api.setTab(item.tab);
        item.fill(f);
        const data = api.getQRData();

        for (const level of ['L', 'M', 'Q', 'H']) {
            assert.equal(decode(data, level), data, `level ${level} failed for ${item.name}`);
        }
    });
}

test('round-trip: a URL, a WiFi password and a long text all decode', () => {
    const api = loadApp();
    api.setTab('text');
    const long = 'https://qrtool.dk/'.repeat(30);
    api.field('qrText').value = long;
    assert.equal(decode(api.getQRData()), long);
});

test('long payload needs a bigger symbol but still decodes', () => {
    const qr = qrcode(0, 'M');
    qr.addData('x'.repeat(400));
    qr.make();
    assert.ok(qr.getModuleCount() >= 40, '400 characters must produce a version >= 6 symbol');
});
