'use strict';

// /vcard-qr-kode ranks position 9-13 for "digitalt visitkort" og "qr kode
// visitkort" (121 impressions, 0 clicks), but a visitor used to have to imagine
// the result: empty fields and a placeholder. These tests pin the example that
// now sits above the form — a finished business card and a scannable QR code —
// plus the fill button, and the escaping that comes with the shared builder.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { createBrowserEnv } = require('./helpers/dom-stub');
const { loadQRPage, qrcode, jsQR } = require('./helpers/load-qr-page');

const ROOT = path.join(__dirname, '..');
const PAGES = [
    {
        rel: 'vcard-qr-kode.html', lang: 'da',
        name: 'Maria Jensen',
        role: 'Indretningsrådgiver · Nordisk Sofa A/S',
        phone: '+45 20 45 67 89',
        email: 'maria@nordisksofa.dk',
        website: 'https://nordisksofa.dk',
        address: 'Strandvejen 12, 2900 Hellerup'
    },
    {
        rel: 'en/vcard-qr-code.html', lang: 'en',
        name: 'Emma Clark',
        role: 'Interior Consultant · Nordic Home ApS',
        phone: '+45 20 45 67 89',
        email: 'emma@nordichome.dk',
        website: 'https://nordichome.dk',
        address: 'Strandvejen 12, 2900 Hellerup'
    }
];

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Runs the page's own inline script with stubbed browser globals and hands its
// internals back, the same way load-app does for app.js. jsQR is left out on
// purpose: the scan check then skips its timer, so the run stays synchronous.
function loadPage(rel) {
    const html = read(rel);
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    const source = scripts.find(s => s.includes('vcardFirstName'));
    assert.ok(source, `${rel}: inline vCard script not found`);

    const env = createBrowserEnv();
    const QRPage = loadQRPage().api;
    const injected = Object.assign({}, env.globals, {
        qrcode,
        QRPage,
        setTimeout: () => 0,
        __testApi: {}
    });
    const names = Object.keys(injected);

    const exportLine = ';__testApi.api = { buildVCard: buildVCard, getVCardData: getVCardData, fillExample: fillExample, VCARD_EXAMPLE: VCARD_EXAMPLE };';
    assert.match(source, /\}\)\(\);\s*$/, `${rel}: the inline script does not end in the expected IIFE`);
    const factory = new Function(...names, source.replace(/\}\)\(\);\s*$/, `${exportLine}})();`));
    factory(...names.map(name => injected[name]));

    return { api: injected.__testApi.api, html, env };
}

// En canvas med rigtige pixels, så jsQR kan læse den færdige kode tilbage
function pixelCanvas(width, height) {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    let fillStyle = '#ffffff';

    const paint = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
    };

    const fillRectShape = (x, y, w, h) => {
        const dark = fillStyle !== '#ffffff' && fillStyle !== 'white';
        for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
            for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
                if (dark) paint(px, py);
            }
        }
    };

    const ctx = {
        get fillStyle() { return fillStyle; },
        set fillStyle(value) { fillStyle = value; },
        fillRect: fillRectShape,
        beginPath() {},
        arc() {},
        rect() {},
        fill() {},
        drawImage() {},
        getImageData: (x, y, w, h) => ({ data, width: w, height: h })
    };

    return {
        width,
        height,
        data,
        getContext: () => ctx
    };
}

for (const page of PAGES) {
    test(`${page.lang}: eksempelblokken viser et fyldt kort før formularen`, () => {
        const { html } = loadPage(page.rel);
        assert.match(html, new RegExp(`id="vcardExampleBtn"[^>]*>[^<]*`), 'fill button mangler');
        assert.match(html, /id="vcardExampleQR"[^>]*role="img"[^>]*aria-label="/, 'eksempel-QR uden aria-label');
        assert.ok(html.indexOf('vcardExampleBtn') < html.indexOf('id="vcardFirstName"'),
            'eksemplet skal stå over formularen, ikke under den');
        for (const value of [page.name, page.role, page.phone, page.email, page.address]) {
            assert.ok(html.includes(value), `${page.rel}: "${value}" er ikke synligt i eksempelkortet`);
        }
        const host = new URL(page.website).host;
        assert.ok(html.includes(host), `${page.rel}: "${host}" er ikke synligt i eksempelkortet`);
    });

    test(`${page.lang}: knappen udfylder alle felter, og koden bliver genereret`, () => {
        const { api, env } = loadPage(page.rel);
        env.getElementById('vcardExampleBtn').click();

        const expected = {
            vcardFirstName: page.name.split(' ')[0],
            vcardLastName: page.name.split(' ')[1],
            vcardOrg: page.role.split(' · ')[1],
            vcardTitle: page.role.split(' · ')[0],
            vcardPhone: page.phone,
            vcardEmail: page.email,
            vcardWebsite: page.website,
            vcardAddress: page.address
        };
        for (const [id, value] of Object.entries(expected)) {
            assert.equal(env.getElementById(id).value, value, `${id} skal udfyldes med eksemplet`);
        }

        assert.equal(env.getElementById('qrPreview').children.length, 1, 'der skal tegnes en QR-kode');
        assert.equal(env.getElementById('downloadBtn').disabled, false, 'download skal være aktiv');
        assert.equal(env.getElementById('vcardExampleQR').innerHTML.includes('<svg'), true,
            'eksemplets QR-kode skal være tegnet i blokken');
    });

    test(`${page.lang}: eksemplets vCard-streng er korrekt`, () => {
        const { api, env } = loadPage(page.rel);
        env.getElementById('vcardExampleBtn').click();

        assert.equal(api.getVCardData(), [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${page.name.split(' ')[1]};${page.name.split(' ')[0]};;;`,
            `FN:${page.name}`,
            `ORG:${page.role.split(' · ')[1]}`,
            `TITLE:${page.role.split(' · ')[0]}`,
            `TEL;TYPE=CELL:${page.phone}`,
            `EMAIL:${page.email}`,
            `URL:${page.website}`,
            `ADR;TYPE=WORK:;;${page.address.replace(/,/g, '\\,')};;;;`,
            'END:VCARD'
        ].join('\n'));
    });
}

test('eksemplets QR-kode kan scannes igen og give kontakten', () => {
    const { api, env } = loadPage('vcard-qr-kode.html');
    env.getElementById('vcardExampleBtn').click();
    const expected = api.getVCardData();

    const qr = qrcode(0, 'M');
    qr.addData(expected);
    qr.make();

    // Blokken viser den samme kode med fire modulers hvid kant omkring
    const cells = qr.getModuleCount();
    assert.match(env.getElementById('vcardExampleQR').innerHTML,
        new RegExp(`viewBox="0 0 ${cells + 8} ${cells + 8}"`),
        'eksemplets SVG skal have fire modulers kant på hver side');

    // 512 px giver nok pixels pr. modul til, at jsQR kan læse koden igen
    const canvas = pixelCanvas(512, 512);
    loadQRPage().api.drawCanvas(qr, 512, canvas, '#000000');

    const decoded = jsQR(canvas.data, 512, 512);
    assert.ok(decoded, 'den færdige kode skal kunne læses igen');
    assert.equal(decoded.data, expected);
});

test('buildVCard escaper semikolon, komma, kolon og omvendt skråstreg', () => {
    const { api } = loadPage('vcard-qr-kode.html');
    const vcard = api.buildVCard({
        firstName: 'Jens',
        lastName: 'Pede; A\\B',
        org: 'Firma: A/S, Ltd',
        title: 'Råd, giver',
        phone: '+45 12 34 56 78',
        email: 'jens@firma.dk',
        website: 'https://firma.dk',
        address: 'Vej 1, 2;3'
    });

    assert.ok(vcard.includes('N:Pede\\; A\\\\B;Jens;;;'), `N-linjen skal escape: ${vcard}`);
    assert.ok(vcard.includes('FN:Jens Pede\\; A\\\\B'), `FN-linjen skal escape: ${vcard}`);
    assert.ok(vcard.includes('ORG:Firma\\: A/S\\, Ltd'), `ORG-linjen skal escape: ${vcard}`);
    assert.ok(vcard.includes('ADR;TYPE=WORK:;;Vej 1\\, 2\\;3;;;;'), `ADR-linjen skal escape: ${vcard}`);

    // Telefon, e-mail og URL må IKKE escapes — det er det RFC 2426 siger
    assert.ok(vcard.includes('TEL;TYPE=CELL:+45 12 34 56 78'), 'telefonen skal stå rå');
    assert.ok(vcard.includes('EMAIL:jens@firma.dk'), 'e-mailen skal stå rå');
    assert.ok(vcard.includes('URL:https://firma.dk'), 'URLen skal stå rå');

    // Uden escapes ville N-linjen have seks komponenter i stedet for fem
    const nLine = vcard.split('\n').find(l => l.startsWith('N:'));
    assert.equal(nLine.split(/(?<!\\);/).length, 5, `N-linjen skal have fem komponenter: ${nLine}`);
});

test('buildVCard afviser tomme navnefelter', () => {
    const { api } = loadPage('vcard-qr-kode.html');
    assert.equal(api.buildVCard({ firstName: '', lastName: '', org: 'Firma A/S' }), null);
});

test('eksempelværdierne spejler hinanden på begge sprog', () => {
    const da = loadPage('vcard-qr-kode.html').api.VCARD_EXAMPLE;
    const en = loadPage('en/vcard-qr-code.html').api.VCARD_EXAMPLE;
    assert.equal(da.phone, en.phone, 'telefonnummeret skal være det samme');
    assert.equal(da.address, en.address, 'adressen skal være den samme');
    assert.equal(da.website, 'https://nordisksofa.dk');
    assert.equal(en.website, 'https://nordichome.dk');
    assert.equal(da.email, 'maria@nordisksofa.dk');
    assert.equal(en.email, 'emma@nordichome.dk');
    assert.equal(da.org, 'Nordisk Sofa A/S');
    assert.equal(en.org, 'Nordic Home ApS');
});
