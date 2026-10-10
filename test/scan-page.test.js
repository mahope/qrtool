'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// lib/qr-scan.js reads the global jsQR, exactly like the browser does, so the
// decoder can be exercised in Node without a DOM.
global.jsQR = require('../lib/jsQR.min.js');
const QRScan = require('../lib/qr-scan.js');
const qrcode = require('../lib/qrcode.js');

// The site generates QR codes as UTF-8 (see lib/qr-page.js), so æøå survives a
// scan. The qrcode library defaults to Latin-1, so mirror the site here.
if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
}

const ROOT = path.join(__dirname, '..');
const SCALE = 4;
const QUIET = 4;

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Same rendering as the site and qr-roundtrip.test.js: one dark module per
// block, on white, with the mandatory quiet zone around it.
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

test('scan: a rendered QR code decodes back to its payload', () => {
    const payload = 'https://qrtool.dk/scan-qr-kode';
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();
    const { data, size } = toRgba(qr);
    assert.equal(QRScan.decodeImageData(data, size, size), payload);
});

test('scan: a WiFi payload decodes as well', () => {
    const payload = 'WIFI:T:WPA;S:Gæstenet;P:hemmelig;H:false;;';
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();
    const { data, size } = toRgba(qr);
    assert.equal(QRScan.decodeImageData(data, size, size), payload);
});

test('scan: isUrl only accepts real links', () => {
    assert.equal(QRScan.isUrl('https://example.com'), true);
    assert.equal(QRScan.isUrl('http://example.com/path?x=1'), true);
    assert.equal(QRScan.isUrl('WIFI:T:WPA;S:x;P:y;;'), false);
    assert.equal(QRScan.isUrl('BEGIN:VCARD\nFN:Test\nEND:VCARD'), false);
    assert.equal(QRScan.isUrl(''), false);
});

test('scan page: the Danish scanner page has the camera, the upload and the reader', () => {
    const html = read('scan-qr-kode.html');
    assert.match(html, /id="startScanBtn"/);
    assert.match(html, /id="scanFileInput"/);
    assert.match(html, /id="scanResult"/);
    assert.match(html, /\/lib\/jsQR\.min\.js/);
    assert.match(html, /\/lib\/qr-scan\.js/);
    assert.match(html, /<h1[^>]*>[\s\S]*Scan QR-Kode Online/);
    assert.match(html, /Sådan scanner du en QR-kode/);
});

test('scan page: the English mirror is translated and wired the same way', () => {
    const en = read('en/scan-qr-code.html');
    assert.match(en, /id="startScanBtn"/);
    assert.match(en, /id="scanFileInput"/);
    assert.match(en, /\/lib\/qr-scan\.js/);
    assert.match(en, /How to scan a QR code/);
    assert.doesNotMatch(en, /Start kamera/);
    assert.doesNotMatch(en, /Upload billede/);
});

test('scan page: both pages are listed in the sitemap', () => {
    const sitemap = read('sitemap.xml');
    assert.ok(sitemap.includes('https://qrtool.dk/scan-qr-kode'));
    assert.ok(sitemap.includes('https://qrtool.dk/en/scan-qr-code'));
});
