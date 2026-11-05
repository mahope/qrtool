'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const load = () => import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'quality', 'budgets.mjs')).href);

const budgets = {
    lighthouse: { maxCls: 0.02, minAccessibility: 95, maxHomeJsBytes: 80000 },
    axe: { failImpacts: ['critical', 'serious'] },
};

test('lighthouse: results inside the budgets give no failures', async () => {
    const { checkLighthouse } = await load();
    const runs = [
        { path: '/', cls: 0, accessibility: 100, jsBytes: 79000 },
        { path: '/wifi-qr-kode', cls: 0.02, accessibility: 95, jsBytes: 500000 },
    ];
    assert.deepEqual(checkLighthouse(runs, budgets.lighthouse), []);
});

test('lighthouse: CLS, accessibility and front page JavaScript can each fail', async () => {
    const { checkLighthouse } = await load();
    const runs = [
        { path: '/', cls: 0.021, accessibility: 94, jsBytes: 80001 },
    ];
    const failures = checkLighthouse(runs, budgets.lighthouse);
    assert.equal(failures.length, 3);
    assert.ok(failures.some((f) => /CLS/.test(f)));
    assert.ok(failures.some((f) => /accessibility/i.test(f)));
    assert.ok(failures.some((f) => /JavaScript/.test(f)));
});

test('lighthouse: the JavaScript budget only applies to the front page', async () => {
    const { checkLighthouse } = await load();
    const runs = [{ path: '/guides/qr-koder-til-restauranter', cls: 0, accessibility: 100, jsBytes: 900000 }];
    assert.deepEqual(checkLighthouse(runs, budgets.lighthouse), []);
});

test('overflow: a page wider than the viewport fails, a known one may not get worse', async () => {
    const { checkOverflow } = await load();
    const results = [
        { path: '/', width: 320, overflowPx: 0 },
        { path: '/a', width: 320, overflowPx: 40 },
        { path: '/b', width: 320, overflowPx: 12 },
        { path: '/b', width: 390, overflowPx: 1 },
    ];
    const failures = checkOverflow(results, { '/b@320': 12 });
    assert.equal(failures.length, 2);
    assert.ok(failures.some((f) => f.includes('/a') && f.includes('320')));
    assert.ok(failures.some((f) => f.includes('/b') && f.includes('390')));
    assert.deepEqual(checkOverflow([{ path: '/b', width: 320, overflowPx: 13 }], { '/b@320': 12 }).length, 1);
});

test('axe: only critical and serious violations count, known ones may not get worse', async () => {
    const { checkAxe } = await load();
    const results = [
        { path: '/', width: 390, theme: 'default', violations: [
            { id: 'color-contrast', impact: 'serious', nodes: 3 },
            { id: 'region', impact: 'moderate', nodes: 9 },
            { id: 'link-in-text-block', impact: 'serious', nodes: 2 },
        ] },
    ];
    const failures = checkAxe(results, budgets.axe, { '/|link-in-text-block': 2 });
    assert.equal(failures.length, 1);
    assert.match(failures[0], /color-contrast/);
    const worse = checkAxe(results, budgets.axe, { '/|link-in-text-block': 1, '/|color-contrast': 3 });
    assert.equal(worse.length, 1);
    assert.match(worse[0], /link-in-text-block/);
});

test('axe: the baseline is per page, so a fix on one page cannot hide a new violation on another', async () => {
    const { checkAxe } = await load();
    const known = { '/|color-contrast': 10 };
    // The front page was fixed (4 nodes left), but /wifi-qr-kode gained 6.
    const results = [
        { path: '/', width: 390, theme: 'default', violations: [{ id: 'color-contrast', impact: 'serious', nodes: 4 }] },
        { path: '/wifi-qr-kode', width: 390, theme: 'default', violations: [{ id: 'color-contrast', impact: 'serious', nodes: 6 }] },
    ];
    const failures = checkAxe(results, budgets.axe, known);
    assert.equal(failures.length, 1);
    assert.ok(failures[0].includes('/wifi-qr-kode'));
});

test('axe: nodes are summed over widths and themes for the same page', async () => {
    const { checkAxe } = await load();
    const v = [{ id: 'label', impact: 'critical', nodes: 2 }];
    const results = [
        { path: '/a', width: 390, theme: 'default', violations: v },
        { path: '/a', width: 1440, theme: 'toggled', violations: v },
    ];
    assert.deepEqual(checkAxe(results, budgets.axe, { '/a|label': 4 }), []);
    assert.equal(checkAxe(results, budgets.axe, { '/a|label': 3 }).length, 1);
});

test('lighthouse: a known baseline loosens the budget for that page only, and may not get worse', async () => {
    const { checkLighthouse } = await load();
    const known = { '/': { minAccessibility: 84, maxJsBytes: 125000 } };
    const ok = [
        { path: '/', cls: 0, accessibility: 84, jsBytes: 125000 },
        { path: '/wifi-qr-kode', cls: 0, accessibility: 95, jsBytes: 1 },
    ];
    assert.deepEqual(checkLighthouse(ok, budgets.lighthouse, known), []);
    const worse = [
        { path: '/', cls: 0, accessibility: 83, jsBytes: 125001 },
        { path: '/wifi-qr-kode', cls: 0, accessibility: 94, jsBytes: 1 },
    ];
    assert.equal(checkLighthouse(worse, budgets.lighthouse, known).length, 3);
});
