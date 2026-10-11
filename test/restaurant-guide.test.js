'use strict';

// Google Search Console shows the two restaurant guides at position 11-18 with
// zero clicks: /guides/qr-koder-til-restauranter 67 impressions, position 11.7,
// /en/guides/qr-codes-for-restaurants 72 impressions, position 18.4. The pages
// described QR codes without ever showing one. These tests pin the title and
// description that now name what people search for, the printable table-tent
// example with two real QR codes, and the answer to the most common question
// ("which system for QR ordering at the table").

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { qrcode, jsQR, loadQRPage } = require('./helpers/load-qr-page');

const ROOT = path.join(__dirname, '..');

const PAGES = [
    {
        rel: 'guides/qr-koder-til-restauranter.html', lang: 'da',
        titleWords: [/QR/i, /restauranter/i, /bordopstiller/i, /WiFi/i],
        descriptionWords: [/menukort/i, /mm/i, /WiFi/i],
        captionMenu: 'Scan for menukort',
        captionWifi: 'Scan for gratis WiFi',
        printWords: [/SVG/, /PDF/, /4 × 4 cm/i],
        question: 'Hvilke systemer skal jeg bruge til QR-bestilling ved bordet?',
        answerWords: [/Lightspeed/, /iZettle/, /QR Tool/]
    },
    {
        rel: 'en/guides/qr-codes-for-restaurants.html', lang: 'en',
        titleWords: [/QR/i, /Restaurants/i, /Table Tents/i, /WiFi/i],
        descriptionWords: [/menu/i, /millimetres/i, /WiFi/i],
        captionMenu: 'Scan for the menu',
        captionWifi: 'Scan for free WiFi',
        printWords: [/SVG/, /PDF/, /4 × 4 cm/],
        question: 'Which systems do I need for QR ordering at the table?',
        answerWords: [/Lightspeed/, /iZettle/, /QR Tool/]
    }
];

const QUIET_ZONE = 4;

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function metaDescription(html) {
    const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    return m ? m[1] : null;
}

function title(html) {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return m ? m[1].trim() : null;
}

// The page renders the codes itself from data-qr attributes. Run the inline
// script with a stub document so the produced SVG can be inspected.
function renderTentCodes(html) {
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const source = scripts.find(s => s.includes('drawTentQR'));
    assert.ok(source, 'render script for the table tents not found');

    const payloads = [...html.matchAll(/data-qr="([^"]*)"/g)].map(m => m[1]);
    assert.equal(payloads.length, 2, `expected two QR codes, found ${payloads.length}`);

    const hosts = payloads.map(payload => ({ dataset: { qr: payload }, innerHTML: '' }));
    const document = {
        readyState: 'complete',
        querySelectorAll: selector => (selector === '[data-qr]' ? hosts : []),
        addEventListener: () => {}
    };

    const factory = new Function('document', 'qrcode', 'setTimeout', source);
    factory(document, qrcode, () => {
        throw new Error('the QR library was not available, so nothing was rendered');
    });

    return hosts;
}

// A canvas with real pixels, so jsQR can read the finished code back.
function pixelCanvas(width, height) {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    let dark = false;

    const paint = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
    };

    const ctx = {
        get fillStyle() { return dark ? '#000000' : '#ffffff'; },
        set fillStyle(value) { dark = value === '#000000'; },
        fillRect: (x, y, w, h) => {
            for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
                for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
                    if (dark) paint(px, py);
                }
            }
        },
        beginPath() {}, arc() {}, rect() {}, fill() {}, drawImage() {},
        getImageData: (x, y, w, h) => ({ data, width: w, height: h })
    };

    return { width, height, data, getContext: () => ctx };
}

for (const page of PAGES) {
    test(`${page.lang}: the title and description name the menu, the table tent and the print`, () => {
        const html = read(page.rel);
        const value = title(html);
        for (const word of page.titleWords) {
            assert.match(value, word, `${page.rel}: title "${value}" does not match ${word}`);
        }
        assert.ok(value.length <= 65, `${page.rel}: title is ${value.length} characters`);

        const description = metaDescription(html);
        for (const word of page.descriptionWords) {
            assert.match(description, word, `${page.rel}: description does not match ${word}`);
        }
        assert.ok(description.length >= 120 && description.length <= 260,
            `${page.rel}: description is ${description.length} characters`);

        // Every place the title is repeated must say the same thing
        for (const attr of ['property="og:title"', 'name="twitter:title"']) {
            assert.ok(html.includes(`${attr} content="${value}"`),
                `${page.rel}: ${attr} still carries another title`);
        }
    });

    test(`${page.lang}: the printable table tent shows both codes and the print size`, () => {
        const html = read(page.rel);
        assert.match(html, /<h2>[^<]*bordopstiller[^<]*<\/h2>|<h2>What a table tent looks like<\/h2>/,
            `${page.rel}: the table-tent section is missing`);
        assert.ok(html.includes(page.captionMenu), `${page.rel}: "${page.captionMenu}" is missing`);
        assert.ok(html.includes(page.captionWifi), `${page.rel}: "${page.captionWifi}" is missing`);

        // The tent sits after the menu section, where the reader needs it
        assert.ok(html.indexOf('tentMenuQR') > html.indexOf('Digitale menukort') ||
            html.indexOf('tentMenuQR') > html.indexOf('Digital menus with QR codes'),
            `${page.rel}: the example should follow the menu section`);

        for (const word of page.printWords) {
            assert.match(html, word, `${page.rel}: the print guidance does not mention ${word}`);
        }
    });

    test(`${page.lang}: the FAQ answers which system QR ordering needs`, () => {
        const html = read(page.rel);
        assert.ok(html.includes(`<h3 itemprop="name">${page.question}</h3>`),
            `${page.rel}: the ordering question is missing from the FAQ`);
        const answer = html.split(page.question)[1].split('</div>')[0];
        for (const word of page.answerWords) {
            assert.match(answer, word, `${page.rel}: the answer does not mention ${word}`);
        }
    });
}

test('the WiFi example is a valid WIFI string that phones understand', () => {
    for (const page of PAGES) {
        const html = read(page.rel);
        const wifi = html.match(/data-qr="(WIFI:[^"]*)"/);
        assert.ok(wifi, `${page.rel}: no WiFi example code`);
        assert.match(wifi[1], /^WIFI:T:WPA;S:[^;]+;P:[^;]*;;$/,
            `${page.rel}: "${wifi[1]}" is not a scannable WIFI string`);
    }
});

test('both languages carry the same example codes', () => {
    const da = [...read(PAGES[0].rel).matchAll(/data-qr="([^"]*)"/g)].map(m => m[1]);
    const en = [...read(PAGES[1].rel).matchAll(/data-qr="([^"]*)"/g)].map(m => m[1]);
    assert.deepEqual(en, da, 'the English page must show the same codes as the Danish one');
    assert.equal(da[0], 'https://qrtool.dk/');
});

test('the example codes are drawn with a quiet zone and can be scanned again', () => {
    for (const page of PAGES) {
        const hosts = renderTentCodes(read(page.rel));

        hosts.forEach((host, index) => {
            const svg = host.innerHTML;
            assert.match(svg, /<svg viewBox="0 0 \d+ \d+"/, `${page.rel}: code ${index} was not drawn`);

            const qr = qrcode(0, 'M');
            qr.addData(host.dataset.qr);
            qr.make();
            const cells = qr.getModuleCount();

            assert.match(svg, new RegExp(`viewBox="0 0 ${cells + QUIET_ZONE * 2} ${cells + QUIET_ZONE * 2}"`),
                `${page.rel}: code ${index} must keep a ${QUIET_ZONE} module white border`);
            assert.ok(svg.includes('fill="#ffffff"'), `${page.rel}: code ${index} needs a white background`);

            // 512 px leaves enough pixels per module for jsQR to read it back
            const canvas = pixelCanvas(512, 512);
            loadQRPage().api.drawCanvas(qr, 512, canvas, '#000000');
            const decoded = jsQR(canvas.data, 512, 512);
            assert.ok(decoded, `${page.rel}: code ${index} could not be read back`);
            assert.equal(decoded.data, host.dataset.qr,
                `${page.rel}: code ${index} decoded into something else`);
        });
    }
});
