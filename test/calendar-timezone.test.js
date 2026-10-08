'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

// The timezone the site is written for. The tests below prove that the QR
// payload does not depend on it.
const SITE_TZ = 'Europe/Copenhagen';

function withFields(values) {
    const api = loadApp();
    api.setTab('calendar');
    for (const [id, value] of Object.entries(values)) api.field(id).value = value;
    return api;
}

function stamp(ical, property) {
    const match = ical.match(new RegExp(`${property}:(\\d{8}T\\d{6})`));
    return match ? match[1] : null;
}

test('a midnight event keeps the calendar day the user typed', () => {
    const api = withFields({ calTitle: 'Sankthans', calStart: '2026-06-23T00:00', calEnd: '2026-06-24T00:00' });
    const ical = api.getQRData();
    assert.equal(stamp(ical, 'DTSTART'), '20260623T000000');
    assert.equal(stamp(ical, 'DTEND'), '20260624T000000');
});

test('a Christmas Eve event starting at midnight lands on 24 December', () => {
    const api = withFields({ calTitle: 'Juleaften', calStart: '2026-12-24T00:00' });
    assert.equal(stamp(api.getQRData(), 'DTSTART'), '20261224T000000');
});

test('an event with minutes and seconds keeps its wall-clock time', () => {
    const api = withFields({ calTitle: 'Møde', calStart: '2026-03-01T08:30', calEnd: '2026-03-01T10:45:15' });
    const ical = api.getQRData();
    assert.equal(stamp(ical, 'DTSTART'), '20260301T083000');
    assert.equal(stamp(ical, 'DTEND'), '20260301T104515');
});

test('a date-only value is treated as midnight', () => {
    const api = withFields({ calTitle: 'Hele dagen', calStart: '2026-05-17' });
    assert.equal(stamp(api.getQRData(), 'DTSTART'), '20260517T000000');
});

test('the payload is the same whatever timezone the page runs in', () => {
    const values = { calTitle: 'Julefrokost', calStart: '2026-12-05T17:30', calEnd: '2026-12-05T21:00' };

    const previous = process.env.TZ;
    const results = {};
    try {
        for (const tz of [SITE_TZ, 'UTC', 'America/New_York', 'Asia/Tokyo']) {
            process.env.TZ = tz;
            results[tz] = withFields(values).getQRData();
        }
    } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
    }

    for (const tz of Object.keys(results)) {
        assert.equal(results[tz], results[SITE_TZ], `${tz} produced a different QR payload`);
    }
    assert.equal(stamp(results[SITE_TZ], 'DTSTART'), '20261205T173000');
    assert.equal(stamp(results[SITE_TZ], 'DTEND'), '20261205T210000');
});

test('the payload has no timezone marker, so it is read in the reader’s zone', () => {
    const api = withFields({ calTitle: 'Fødselsdag', calStart: '2026-07-04T12:00' });
    const ical = api.getQRData();
    assert.match(ical, /DTSTART:\d{8}T\d{6}\n/);
    assert.ok(!/DTSTART:\d{8}T\d{6}Z/.test(ical), 'DTSTART must not claim a UTC instant');
});
