const CACHE_NAME = 'qrtool-v9';
const NAV_TIMEOUT_MS = 3000;
const MAX_ENTRIES = 80;
const OFFLINE_URL = '/offline.html';

// App shell only: enough for the generator on / to work offline. Every other
// page and asset is cached when the visitor uses it.
const ASSETS = [
    '/',
    OFFLINE_URL,
    '/style.css?v=8',
    '/app.js?v=8',
    '/lib/qrcode.js',
    '/lib/qr-page.js',
    '/lib/qr-scan.js?v=8',
    '/icon.svg',
    '/fonts/schibsted-grotesk-latin.woff2',
    '/manifest.json'
];

// Statistics hosts (Plausible and Umami) and anything else with "analytics" in the URL
const STATS_HOSTS = ['analytics.holstjensen.eu', 'stats.mahoje.dk'];

// Install: cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

function store(request, response) {
    if (!response.ok || response.type !== 'basic') return Promise.resolve();
    const copy = response.clone();
    return caches.open(CACHE_NAME).then((cache) =>
        cache.put(request, copy).then(() => cache.keys()).then((keys) => {
            // Keep the cache bounded: drop the oldest entries beyond the cap
            const extra = keys.length - MAX_ENTRIES;
            return Promise.all(keys.slice(0, Math.max(extra, 0)).map((key) => cache.delete(key)));
        })
    );
}

// Navigation: network first (3 s), then the page's own cached copy, then offline.html.
// A navigation never gets another page's content.
function navigate(request, event) {
    const network = fetch(request).then((response) => {
        event.waitUntil(store(request, response).catch(() => {}));
        return response;
    });
    const timeout = new Promise((resolve, reject) => setTimeout(reject, NAV_TIMEOUT_MS));
    return Promise.race([network, timeout]).catch(() => {
        network.catch(() => {});
        return caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL));
    });
}

// Assets: stale-while-revalidate
function revalidate(request, event) {
    return caches.match(request).then((cached) => {
        const update = fetch(request).then((response) => {
            event.waitUntil(store(request, response).catch(() => {}));
            return response;
        });
        if (cached) {
            update.catch(() => {});
            return cached;
        }
        return update;
    });
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests, statistics and other origins
    if (request.method !== 'GET' || request.url.includes('analytics')) {
        return;
    }
    const url = new URL(request.url);
    if (STATS_HOSTS.includes(url.hostname) || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        request.mode === 'navigate' ? navigate(request, event) : revalidate(request, event)
    );
});
