const CACHE_NAME = 'qrtool-v1';
const ASSETS = [
    '/',
    '/style.css',
    '/app.js',
    '/icon.svg',
    '/manifest.json',
    '/om-qr-tool',
    '/privatlivspolitik',
    '/wifi-qr-kode',
    'https://unpkg.com/qrcode-generator@2.0.4/dist/qrcode.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://unpkg.com/jsqr@1.4.0/dist/jsQR.min.js'
];

// Install: cache alle statiske assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: slet gamle caches
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

// Fetch: cache-first for assets, network-first for navigation
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests and analytics
    if (request.method !== 'GET' || request.url.includes('analytics')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // Returner cache, men opdater i baggrunden
                event.waitUntil(
                    fetch(request).then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
                        }
                    }).catch(() => {})
                );
                return cached;
            }

            // Ikke i cache: hent fra netværk
            return fetch(request).then((response) => {
                if (response.ok && request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
