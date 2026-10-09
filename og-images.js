#!/usr/bin/env node
'use strict';

// Generates the Open Graph cards (1200×630) that Facebook, WhatsApp, LinkedIn
// and other crawlers fetch when a page is shared.
//
// The pages already reference og-image.png / og-image-<type>.png, but the files
// were never generated — every share currently lands without a preview image.
// The PNGs are committed as static assets and copied by build.js, because the
// Docker build stage has no rasteriser.
//
// Requires rsvg-convert (brew install librsvg). Run: node og-images.js

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 630;

// Colors from style.css tokens and icon.svg.
const BG = '#0f172a';
const PANEL = '#1e293b';
const RING = '#334155';
const TEXT = '#f1f5f9';
const MUTED = '#acb7c6';
const PRIMARY = '#6366f1';
const SECONDARY = '#8b5cf6';

// A QR motif drawn from the same finder eyes and data dots as icon.svg, sized
// to fit exactly inside a square of `size` pixels (15-cell grid, like a real
// QR code's quiet-zone layout).
function motif(x, y, size) {
    const cell = size / 15;
    const ring = `${cell}`;
    const finder = (cx, cy, color) => `
    <g transform="translate(${cx * cell}, ${cy * cell})">
      <rect x="${cell / 2}" y="${cell / 2}" width="${6 * cell}" height="${6 * cell}" rx="${cell}" fill="none" stroke="${color}" stroke-width="${cell}"/>
      <rect x="${2 * cell}" y="${2 * cell}" width="${3 * cell}" height="${3 * cell}" rx="${cell / 2}" fill="${color}"/>
    </g>`;
    const dot = (cx, cy, color) => `<rect x="${cx * cell}" y="${cy * cell}" width="${3 * cell}" height="${3 * cell}" rx="${cell / 2}" fill="${color}"/>`;
    const dots = [
        [8, 1], [9, 4], [11, 1], [12, 3], [8, 7], [10, 9], [12, 8], [13, 11],
        [9, 10], [11, 12], [8, 13], [10, 14], [12, 13],
    ];
    return `<g transform="translate(${x}, ${y})">${finder(0, 0, PRIMARY)}${finder(9, 0, PRIMARY)}${finder(0, 9, PRIMARY)}${dots.map(([cx, cy]) => dot(cx, cy, SECONDARY)).join('')}</g>`;
}

function logoMark() {
    // The app icon: rounded square, brand gradient, white QR finder eyes.
    return `
  <defs>
    <linearGradient id="logo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${SECONDARY}"/>
    </linearGradient>
  </defs>
  <g transform="translate(96, 96)">
    <rect width="112" height="112" rx="24" fill="url(#logo)"/>
    <g fill="#ffffff">
      <path d="M28 20h-8a8 8 0 0 0-8 8v8a8 8 0 0 0 8 8h8a8 8 0 0 0 8-8v-8a8 8 0 0 0-8-8zm-2 20h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
      <path d="M80 20h-8a8 8 0 0 0-8 8v8a8 8 0 0 0 8 8h8a8 8 0 0 0 8-8v-8a8 8 0 0 0-8-8zm-2 20h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2z"/>
      <path d="M28 72h-8a8 8 0 0 0-8 8v8a8 8 0 0 0 8 8h8a8 8 0 0 0 8-8v-8a8 8 0 0 0-8-8zm-2 20h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2z"/>
      <rect x="24" y="48" width="8" height="8" rx="1"/>
      <rect x="48" y="48" width="8" height="8" rx="1"/>
      <rect x="48" y="72" width="8" height="8" rx="1"/>
      <rect x="72" y="72" width="8" height="8" rx="1"/>
      <rect x="72" y="48" width="8" height="8" rx="1"/>
      <rect x="48" y="24" width="8" height="8" rx="1"/>
      <rect x="72" y="24" width="8" height="8" rx="1"/>
    </g>
  </g>`;
}

function card({ file, titleLines, subtitleLines, domain }) {
    const title = titleLines.map((line, i) =>
        `<text x="96" y="${300 + i * 76}" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" fill="${TEXT}">${line}</text>`
    ).join('\n');
    const subtitle = subtitleLines.map((line, i) =>
        `<text x="96" y="${440 + i * 44}" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="${MUTED}">${line}</text>`
    ).join('\n');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect x="850" y="90" width="300" height="450" rx="28" fill="${PANEL}" stroke="${RING}" stroke-width="2"/>
  ${motif(890, 210, 210)}
  ${logoMark()}
  <text x="224" y="164" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="600" fill="${TEXT}">QR Tool</text>
  ${title}
  ${subtitle}
  <text x="96" y="556" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="600" fill="${PRIMARY}">${domain}</text>
</svg>`;

    const svgPath = path.join(__dirname, `.og-${path.basename(file)}.svg`);
    fs.writeFileSync(svgPath, svg);
    execFileSync('rsvg-convert', ['-w', String(WIDTH), '-h', String(HEIGHT), '-o', file, svgPath], { stdio: 'inherit' });
    fs.rmSync(svgPath);
    console.log(`wrote ${path.relative(__dirname, file)}`);
}

const cards = [
    {
        file: 'og-image.png',
        domain: 'qrtool.dk',
        titleLines: ['Gratis QR-kode-', 'generator'],
        subtitleLines: ['QR-koder til WiFi, visitkort, e-mail,', 'SMS og kalender — laves i browseren.'],
    },
    {
        file: 'og-image-en.png',
        domain: 'qrtool.dk',
        titleLines: ['Free QR code', 'generator'],
        subtitleLines: ['QR codes for WiFi, business cards,', 'email, SMS and calendar — in-browser.'],
    },
    {
        file: 'og-image-wifi.png',
        domain: 'qrtool.dk/wifi-qr-kode',
        titleLines: ['WiFi QR-kode'],
        subtitleLines: ['Gæsterne forbinder til netværket med', 'ét scan — uden at taste koden.'],
    },
    {
        file: 'og-image-wifi-en.png',
        domain: 'qrtool.dk/en/wifi-qr-code',
        titleLines: ['WiFi QR code'],
        subtitleLines: ['Guests join your network with one', 'scan — without typing the password.'],
    },
    {
        file: 'og-image-vcard.png',
        domain: 'qrtool.dk/vcard-qr-kode',
        titleLines: ['vCard QR-kode'],
        subtitleLines: ['Dit digitale visitkort gemmes direkte', 'i telefonbogen med ét scan.'],
    },
    {
        file: 'og-image-vcard-en.png',
        domain: 'qrtool.dk/en/vcard-qr-code',
        titleLines: ['vCard QR code'],
        subtitleLines: ['Your digital business card is saved', 'straight to contacts with one scan.'],
    },
    {
        file: 'og-image-kalender.png',
        domain: 'qrtool.dk/kalender-qr-kode',
        titleLines: ['Kalender QR-kode'],
        subtitleLines: ['Deltagerne tilføjer begivenheden til', 'kalenderen med ét scan.'],
    },
    {
        file: 'og-image-kalender-en.png',
        domain: 'qrtool.dk/en/calendar-qr-code',
        titleLines: ['Calendar QR code'],
        subtitleLines: ['Attendees add the event to their', 'calendar with one scan.'],
    },
    {
        file: 'og-image-sms.png',
        domain: 'qrtool.dk/sms-qr-kode',
        titleLines: ['SMS QR-kode'],
        subtitleLines: ['Ét scan åbner en færdigudfyldt SMS', 'til dit nummer.'],
    },
    {
        file: 'og-image-sms-en.png',
        domain: 'qrtool.dk/en/sms-qr-code',
        titleLines: ['SMS QR code'],
        subtitleLines: ['One scan opens a pre-filled SMS', 'to your number.'],
    },
    {
        file: 'og-image-email.png',
        domain: 'qrtool.dk/email-qr-kode',
        titleLines: ['E-mail QR-kode'],
        subtitleLines: ['Ét scan åbner en færdigudfyldt', 'e-mail til din adresse.'],
    },
    {
        file: 'og-image-email-en.png',
        domain: 'qrtool.dk/en/email-qr-code',
        titleLines: ['Email QR code'],
        subtitleLines: ['One scan opens a pre-filled email', 'to your address.'],
    },
    {
        file: 'og-image-tekst.png',
        domain: 'qrtool.dk/tekst-qr-kode',
        titleLines: ['Tekst QR-kode'],
        subtitleLines: ['Lav en QR-kode af enhver tekst', 'eller et link.'],
    },
    {
        file: 'og-image-tekst-en.png',
        domain: 'qrtool.dk/en/text-qr-code',
        titleLines: ['Text QR code'],
        subtitleLines: ['Turn any text or link into', 'a QR code.'],
    },
];

for (const spec of cards) {
    card({ ...spec, file: path.join(__dirname, spec.file) });
}
