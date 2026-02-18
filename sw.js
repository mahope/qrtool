const CACHE_NAME = 'qrtool-v8';
const ASSETS = [
    '/',
    '/style.css',
    '/app.js',
    '/icon.svg',
    '/manifest.json',
    '/lib/qrcode.js',
    '/lib/jszip.min.js',
    '/lib/jsQR.min.js',
    '/wifi-qr-kode',
    '/vcard-qr-kode',
    '/email-qr-kode',
    '/sms-qr-kode',
    '/kalender-qr-kode',
    '/tekst-qr-kode',
    '/om-qr-tool',
    '/privatlivspolitik',
    '/en/',
    '/en/wifi-qr-code',
    '/en/vcard-qr-code',
    '/en/email-qr-code',
    '/en/sms-qr-code',
    '/en/calendar-qr-code',
    '/en/text-qr-code',
    '/en/about',
    '/en/privacy-policy'
];

// Install: cache all static assets
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

// Fetch: stale-while-revalidate for assets, network-first with cache fallback for navigation
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests and analytics
    if (request.method !== 'GET' || request.url.includes('analytics')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // Return cache, update in background
                event.waitUntil(
                    fetch(request).then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
                        }
                    }).catch(() => {})
                );
                return cached;
            }

            // Not in cache: fetch from network
            return fetch(request).then((response) => {
                if (response.ok && request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/');
                }
            });
        })
    );
});
