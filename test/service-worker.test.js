'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

// Runs sw.js in a vm with stubbed self/caches/fetch. `network` maps path -> body
// (or is null for offline); `shell` lists what the install event caches.
function loadSw({ network }) {
    const listeners = {};
    const store = new Map();
    const requested = [];
    const makeResponse = (text, ok = true) => ({
        ok, type: 'basic', text, clone() { return this; }
    });
    const key = (r) => (typeof r === 'string' ? new URL(r, 'https://qrtool.dk').href : r.url);
    const cache = {
        addAll: async (urls) => { for (const u of urls) store.set(key(u), makeResponse('shell:' + u)); },
        put: async (r, res) => { store.set(key(r), res); },
        keys: async () => [...store.keys()].map((url) => ({ url })),
        delete: async (r) => store.delete(key(r))
    };
    const sandbox = {
        self: {
            location: { origin: 'https://qrtool.dk' },
            addEventListener: (type, fn) => { listeners[type] = fn; },
            skipWaiting() {}, clients: { claim() {} }
        },
        caches: {
            open: async () => cache,
            match: async (r) => store.get(key(r)),
            keys: async () => ['qrtool-v9'],
            delete: async () => true
        },
        fetch: async (r) => {
            requested.push(r.url);
            if (!network || !(new URL(r.url).pathname in network)) throw new TypeError('offline');
            return makeResponse(network[new URL(r.url).pathname]);
        },
        URL, setTimeout, Promise
    };
    vm.createContext(sandbox);
    vm.runInContext(SOURCE + '\n;this.__ASSETS = ASSETS;', sandbox);
    const dispatch = async (url, init = {}) => {
        const request = { url: new URL(url, 'https://qrtool.dk').href, method: 'GET', mode: 'cors', ...init };
        let result, waits = [];
        listeners.fetch({
            request,
            respondWith: (p) => { result = p; },
            waitUntil: (p) => { waits.push(p); }
        });
        const response = result ? await result : undefined;
        await Promise.all(waits);
        return response;
    };
    const install = async () => {
        let p;
        listeners.install({ waitUntil: (x) => { p = x; } });
        await p;
    };
    return { sandbox, dispatch, install, store, requested };
}

test('service worker: the precache is the small app shell', () => {
    const { sandbox } = loadSw({ network: null });
    const assets = [...sandbox.__ASSETS].map((a) => a.replace(/\?v=.*/, ''));
    assert.ok(assets.includes('/') && assets.includes('/offline.html'));
    assert.ok(assets.length <= 10, `precache has ${assets.length} entries`);
    assert.deepEqual(assets.filter((a) => /(^\/(?!offline\.html$)[^.]*$)|\.html$/.test(a) && a !== '/' && a !== '/offline.html'), [], 'pages other than / are precached');
    assert.ok(!assets.some((a) => /jszip|jsQR/i.test(a)), 'jszip/jsQR must not be precached');
});

test('service worker: the precache stays within the gzip budget (160 KB)', () => {
    const { sandbox } = loadSw({ network: null });
    let total = 0;
    for (const a of sandbox.__ASSETS) {
        const rel = a.replace(/\?v=.*/, '').replace(/^\//, '') || 'index.html';
        total += zlib.gzipSync(fs.readFileSync(path.join(ROOT, rel)), { level: 9 }).length;
    }
    assert.ok(total <= 160 * 1024, `precache is ${total} bytes gzip`);
});

test('service worker: an uncached navigation offline gets offline.html', async () => {
    const sw = loadSw({ network: null });
    await sw.install();
    const res = await sw.dispatch('/guides/qr-koder-til-restauranter', { mode: 'navigate' });
    assert.equal(res.text, 'shell:/offline.html');
});

test('service worker: a cached navigation offline gets its own page, never another', async () => {
    const online = loadSw({ network: { '/wifi-qr-kode': 'wifi page' } });
    await online.install();
    assert.equal((await online.dispatch('/wifi-qr-kode', { mode: 'navigate' })).text, 'wifi page');
    // Same store, now offline
    const offline = loadSw({ network: null });
    for (const [k, v] of online.store) offline.store.set(k, v);
    assert.equal((await offline.dispatch('/wifi-qr-kode', { mode: 'navigate' })).text, 'wifi page');
    assert.equal((await offline.dispatch('/cookiepolitik', { mode: 'navigate' })).text, 'shell:/offline.html');
    assert.equal((await offline.dispatch('/', { mode: 'navigate' })).text, 'shell:/');
});

test('service worker: navigation prefers the network over the cache', async () => {
    const sw = loadSw({ network: { '/wifi-qr-kode': 'fresh' } });
    sw.store.set('https://qrtool.dk/wifi-qr-kode', { ok: true, type: 'basic', text: 'stale', clone() { return this; } });
    assert.equal((await sw.dispatch('/wifi-qr-kode', { mode: 'navigate' })).text, 'fresh');
});

test('service worker: assets are served from the cache and revalidated', async () => {
    const sw = loadSw({ network: { '/style.css': 'new css' } });
    sw.store.set('https://qrtool.dk/style.css', { ok: true, type: 'basic', text: 'old css', clone() { return this; } });
    assert.equal((await sw.dispatch('/style.css')).text, 'old css');
    assert.equal(sw.store.get('https://qrtool.dk/style.css').text, 'new css');
});

test('service worker: statistics hosts and other origins are left alone', async () => {
    const sw = loadSw({ network: null });
    for (const url of ['https://stats.mahoje.dk/s.js', 'https://analytics.holstjensen.eu/js/script.js', 'https://example.com/x.js']) {
        assert.equal(await sw.dispatch(url), undefined, url);
    }
    assert.equal(await sw.dispatch('/x', { method: 'POST' }), undefined);
    assert.deepEqual(sw.requested, []);
});

test('service worker: the cache is bounded', async () => {
    const paths = {};
    for (let i = 0; i < 100; i++) paths[`/p${i}`] = 'x';
    const sw = loadSw({ network: paths });
    for (let i = 0; i < 100; i++) await sw.dispatch(`/p${i}`, { mode: 'navigate' });
    assert.ok(sw.store.size <= 80, `cache holds ${sw.store.size} entries`);
});
