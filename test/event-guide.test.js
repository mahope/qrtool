'use strict';

// Google Search Console shows /guides/qr-koder-til-events at 75 impressions,
// position 21.7 and 0 clicks, /en/guides/qr-codes-for-events at 81 impressions,
// position 16.1 and 1 click, plus the Danish queries "qr stafet" and "qr kode
// léb" (24 impressions, position 45-49). The guides explained QR codes without
// ever showing one. These tests pin the new title and description, the printable
// attendee card with a real calendar code and a real WiFi code, the relay-race
// answer, and that both example codes decode again after rendering.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { qrcode, jsQR, loadQRPage } = require('./helpers/load-qr-page');

const ROOT = path.join(__dirname, '..');

const PAGES = [
    {
        rel: 'guides/qr-koder-til-events.html', lang: 'da',
        titleWords: [/QR-koder til events/i, /billetter/i, /stafet/i],
        descriptionWords: [/kalenderinvitation/i, /gæste-WiFi/i, /stafet/i],
        captionCalendar: 'Gem i kalender',
        captionWifi: 'Scan for gratis WiFi',
        printWords: [/SVG/, /PDF/],
        question: 'Kan jeg bruge QR-koder til en stafet eller et løb?',
        answerWords: [/rutekort/, /tidtagningssystem/]
    },
    {
        rel: 'en/guides/qr-codes-for-events.html', lang: 'en',
        titleWords: [/QR Codes for Events/i, /Tickets/i, /Relay/i],
        descriptionWords: [/calendar invitations/i, /guest WiFi/i, /relay/i],
        captionCalendar: 'Save to calendar',
        captionWifi: 'Scan for free WiFi',
        printWords: [/SVG/, /PDF/],
        question: 'Can I use QR codes for a relay race or a run?',
        answerWords: [/route map/, /timing system/]
    }
];

const QUIET_ZONE = 4;
const EXAMPLE_DATE = { year: 2027, month: 5, day: 12 }; // 12 June 2027

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function title(html) {
    const m = html.match(/<title>([\s\S]*?)<\/title>/i);
    return m ? m[1].trim() : null;
}

function metaDescription(html) {
    const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    return m ? m[1] : null;
}

// The page renders the codes from data-qr attributes itself. Run that inline
// script with a stub document so the produced SVG can be inspected.
function renderTentCodes(html) {
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const source = scripts.find(s => s.includes('drawTentQR'));
    assert.ok(source, 'render script for the attendee card not found');

    const payloads = [...html.matchAll(/data-qr="([^"]*)"/g)]
        .map(m => m[1].replace(/&#10;/g, '\n'));
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
function pixelCanvas(size) {
    const data = new Uint8ClampedArray(size * size * 4).fill(255);
    let dark = false;

    const paint = (x, y) => {
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const i = (Math.floor(y) * size + Math.floor(x)) * 4;
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

    return { width: size, height: size, data, getContext: () => ctx };
}

function scansBack(payload) {
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();

    const canvas = pixelCanvas(512);
    loadQRPage().api.drawCanvas(qr, 512, canvas, '#000000');
    const decoded = jsQR(canvas.data, 512, 512);
    assert.ok(decoded, `the code for "${payload.slice(0, 24)}…" could not be read back`);
    return decoded.data;
}

for (const page of PAGES) {
    test(`${page.lang}: the title and description name tickets, access and the relay`, () => {
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

        for (const attr of ['property="og:title"', 'name="twitter:title"']) {
            assert.ok(html.includes(`${attr} content="${value}"`),
                `${page.rel}: ${attr} still carries another title`);
        }
    });

    test(`${page.lang}: the attendee card shows a calendar code, a WiFi code and the print sizes`, () => {
        const html = read(page.rel);
        assert.match(html, /<h2>(Sådan ser et kort til deltagerne ud|What a card for attendees looks like)<\/h2>/,
            `${page.rel}: the attendee-card section is missing`);
        assert.ok(html.includes(page.captionCalendar), `${page.rel}: "${page.captionCalendar}" is missing`);
        assert.ok(html.includes(page.captionWifi), `${page.rel}: "${page.captionWifi}" is missing`);
        assert.ok(html.includes('3-4 cm') || html.includes('3-4 cm'),
            `${page.rel}: the print size for table cards is missing`);
        for (const word of page.printWords) {
            assert.match(html, word, `${page.rel}: the print guidance does not mention ${word}`);
        }
        assert.ok(html.indexOf('tentCalQR') > html.indexOf('Kalender QR-koder til invitationer') ||
            html.indexOf('tentCalQR') > html.indexOf('Calendar QR codes for invitations'),
            `${page.rel}: the card should follow the calendar section`);
    });

    test(`${page.lang}: the FAQ answers what a relay race can and cannot use QR codes for`, () => {
        const html = read(page.rel);
        assert.ok(html.includes(`<h3 itemprop="name">${page.question}</h3>`),
            `${page.rel}: the relay question is missing from the FAQ`);
        const answer = html.split(page.question)[1].split('</div>')[0];
        for (const word of page.answerWords) {
            assert.match(answer, word, `${page.rel}: the answer does not mention ${word}`);
        }
    });
}

test('the calendar example is a valid VEVENT on a real Saturday', () => {
    for (const page of PAGES) {
        const html = read(page.rel);
        const match = html.match(/data-qr="(BEGIN:VCALENDAR[^"]*)"/);
        assert.ok(match, `${page.rel}: no calendar example code`);
        const ical = match[1].replace(/&#10;/g, '\n');

        const lines = ical.split('\n');
        assert.equal(lines[0], 'BEGIN:VCALENDAR', `${page.rel}: the calendar must start with BEGIN:VCALENDAR`);
        assert.equal(lines.at(-1), 'END:VCALENDAR', `${page.rel}: the calendar must end with END:VCALENDAR`);
        assert.ok(lines.includes('VERSION:2.0'), `${page.rel}: VERSION is missing`);
        assert.ok(lines.includes('BEGIN:VEVENT') && lines.includes('END:VEVENT'),
            `${page.rel}: the event block is incomplete`);
        assert.ok(lines.some(l => l.startsWith('SUMMARY:')), `${page.rel}: SUMMARY is missing`);
        assert.ok(lines.some(l => l.startsWith('LOCATION:')), `${page.rel}: LOCATION is missing`);

        const dtstart = lines.find(l => l.startsWith('DTSTART:'));
        const dtend = lines.find(l => l.startsWith('DTEND:'));
        assert.equal(dtstart, 'DTSTART:20270612T090000', `${page.rel}: the start time is ${dtstart}`);
        assert.equal(dtend, 'DTEND:20270612T150000', `${page.rel}: the end time is ${dtend}`);

        // The example date must be a real day: 12 June 2027 is a Saturday
        const [y, m, d] = dtstart.slice(8).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/).slice(1);
        assert.equal([y, m, d].join('-'), '2027-06-12');
        assert.equal(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay(), 6,
            `${page.rel}: 12 June 2027 should be a Saturday`);

        // No raw characters that would break the attribute or the JSON-LD
        assert.ok(!/[<>&]/.test(ical), `${page.rel}: the calendar contains a raw < > or &`);
    }

    assert.equal(scansBack('BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Sommerstafetten 2027\nEND:VEVENT\nEND:VCALENDAR'),
        'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Sommerstafetten 2027\nEND:VEVENT\nEND:VCALENDAR',
        'a calendar code must decode back into the same iCalendar text');
});

test('both languages carry the same example codes', () => {
    const da = [...read(PAGES[0].rel).matchAll(/data-qr="([^"]*)"/g)].map(m => m[1]);
    const en = [...read(PAGES[1].rel).matchAll(/data-qr="([^"]*)"/g)].map(m => m[1]);
    assert.deepEqual(en, da, 'the English page must show the same codes as the Danish one');
});

test('both example codes are drawn with a quiet zone and decode again', () => {
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
            assert.equal(scansBack(host.dataset.qr), host.dataset.qr,
                `${page.rel}: code ${index} decoded into something else`);
        });
    }
});
