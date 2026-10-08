'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

function setup(tab) {
    const api = loadApp();
    api.setTab(tab);
    return { api, field: id => api.field(id), qrData: () => api.getQRData() };
}

// ---------------------------------------------------------------- WiFi

test('WiFi: escapes semicolon, comma, quote and backslash in SSID and password', () => {
    const { field, qrData } = setup('wifi');
    field('wifiSSID').value = 'Cafe;Nord';
    field('wifiPassword').value = 'p,a"s\\s';
    field('wifiEncryption').value = 'WPA';
    field('wifiHidden').checked = false;

    assert.equal(
        qrData(),
        'WIFI:T:WPA;S:Cafe\\;Nord;P:p\\,a\\"s\\\\s;H:false;;'
    );
});

test('WiFi: uses the selected encryption and the hidden flag', () => {
    const { field, qrData } = setup('wifi');
    field('wifiSSID').value = 'Gæstenet';
    field('wifiPassword').value = 'hemmelig';
    field('wifiEncryption').value = 'WEP';
    field('wifiHidden').checked = true;

    assert.equal(qrData(), 'WIFI:T:WEP;S:Gæstenet;P:hemmelig;H:true;;');
});

test('WiFi: an open network keeps an empty password', () => {
    const { field, qrData } = setup('wifi');
    field('wifiSSID').value = 'Biblioteket';
    field('wifiPassword').value = '';
    field('wifiEncryption').value = 'nopass';
    field('wifiHidden').checked = false;

    assert.equal(qrData(), 'WIFI:T:nopass;S:Biblioteket;P:;H:false;;');
});

test('WiFi: returns null without an SSID', () => {
    const { field, qrData } = setup('wifi');
    field('wifiSSID').value = '';
    field('wifiPassword').value = 'x';
    assert.equal(qrData(), null);
});

// ---------------------------------------------------------------- vCard

test('vCard: builds a 3.0 card from every filled field', () => {
    const { field, qrData } = setup('vcard');
    field('vcardName').value = 'Mads Æøå';
    field('vcardOrg').value = 'Mahoje';
    field('vcardTitle').value = 'Udvikler';
    field('vcardPhone').value = '+4512345678';
    field('vcardEmail').value = 'mads@mahoje.dk';
    field('vcardWebsite').value = 'https://mahoje.dk';
    field('vcardAddress').value = 'Søndergade 1, 8000 Aarhus';

    assert.equal(qrData(), [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Mads Æøå',
        'ORG:Mahoje',
        'TITLE:Udvikler',
        'TEL:+4512345678',
        'EMAIL:mads@mahoje.dk',
        'URL:https://mahoje.dk',
        'ADR:;;Søndergade 1, 8000 Aarhus',
        'END:VCARD'
    ].join('\n'));
});

test('vCard: leaves out the optional fields when they are empty', () => {
    const { field, qrData } = setup('vcard');
    field('vcardName').value = 'Mads';
    field('vcardOrg').value = '';
    field('vcardTitle').value = '';
    field('vcardPhone').value = '';
    field('vcardEmail').value = '';
    field('vcardWebsite').value = '';
    field('vcardAddress').value = '';

    assert.equal(qrData(), 'BEGIN:VCARD\nVERSION:3.0\nFN:Mads\nEND:VCARD');
});

test('vCard: returns null without a name', () => {
    const { field, qrData } = setup('vcard');
    field('vcardName').value = '  ';
    assert.equal(qrData(), null);
});

// ---------------------------------------------------------------- e-mail

test('e-mail: percent-encodes subject and body, æøå included', () => {
    const { field, qrData } = setup('email');
    field('emailTo').value = 'hej@mahoje.dk';
    field('emailSubject').value = 'Spørgsmål & tilbud';
    field('emailBody').value = 'Hej Æøå\nMvh Mads';

    assert.equal(
        qrData(),
        'mailto:hej@mahoje.dk?subject=Sp%C3%B8rgsm%C3%A5l%20%26%20tilbud&body=Hej%20%C3%86%C3%B8%C3%A5%0AMvh%20Mads'
    );
});

test('e-mail: returns null without a recipient', () => {
    const { field, qrData } = setup('email');
    field('emailTo').value = '';
    field('emailSubject').value = 'x';
    assert.equal(qrData(), null);
});

// ---------------------------------------------------------------- SMS

test('SMS: percent-encodes the message', () => {
    const { field, qrData } = setup('sms');
    field('smsPhone').value = '12345678';
    field('smsMessage').value = 'Hej Æøå!';

    assert.equal(qrData(), 'sms:12345678?body=Hej%20%C3%86%C3%B8%C3%A5!');
});

test('SMS: returns null without a phone number', () => {
    const { field, qrData } = setup('sms');
    field('smsPhone').value = '';
    field('smsMessage').value = 'x';
    assert.equal(qrData(), null);
});

// ---------------------------------------------------------------- Kalender

test('calendar: builds a VEVENT with the filled fields', () => {
    const { field, qrData } = setup('calendar');
    field('calTitle').value = 'Julefrokost';
    field('calLocation').value = 'Kontoret';
    field('calStart').value = '2026-12-05T17:30';
    field('calEnd').value = '2026-12-05T21:00';
    field('calDescription').value = 'Husk gave';

    const data = qrData();
    assert.match(data, /^BEGIN:VCALENDAR\nVERSION:2\.0\nBEGIN:VEVENT\n/);
    assert.match(data, /END:VEVENT\nEND:VCALENDAR$/);
    assert.match(data, /SUMMARY:Julefrokost\n/);
    assert.match(data, /LOCATION:Kontoret\n/);
    assert.match(data, /DTSTART:\d{8}T\d{6}Z\n/);
    assert.match(data, /DTEND:\d{8}T\d{6}Z\n/);
    assert.match(data, /DESCRIPTION:Husk gave\n/);
});

test('calendar: omits end and description when they are empty', () => {
    const { field, qrData } = setup('calendar');
    field('calTitle').value = 'Møde';
    field('calLocation').value = '';
    field('calStart').value = '2026-03-01T08:00';
    field('calEnd').value = '';
    field('calDescription').value = '';

    const data = qrData();
    assert.ok(data.includes('SUMMARY:Møde'));
    assert.ok(!data.includes('DTEND'));
    assert.ok(!data.includes('DESCRIPTION'));
    assert.ok(!data.includes('LOCATION'));
});

test('calendar: returns null without a title or a start', () => {
    const { field, qrData } = setup('calendar');
    field('calTitle').value = '';
    field('calStart').value = '2026-01-01T10:00';
    assert.equal(qrData(), null);
});

// ---------------------------------------------------------------- tekst

test('text: passes the trimmed value straight through', () => {
    const { field, qrData } = setup('text');
    field('qrText').value = '  https://qrtool.dk  ';
    assert.equal(qrData(), 'https://qrtool.dk');
});
