// =============================================================================
// TEAMTOWERS SOS V11 — SERVICE WORKER (UX-LEGENDARY · PWA pass)
// Ruta · /sw.js
//
// Service worker minimal · stale-while-revalidate per a static · network-first
// per a JSON/API. Offline graceful · cau pantalla amb missatge si network fail.
//
// VERSION bump quan canvies estructura · força purga de cache vell.
// =============================================================================

const CACHE_NAME = 'sos-v11-static-v3';
const RUNTIME_CACHE = 'sos-v11-runtime-v3';

// Static essentials · pre-cache install
const ESSENTIAL_URLS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
];

// Install · pre-cache essentials
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ESSENTIAL_URLS))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting())
    );
});

// Activate · clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Helper · same origin
function _sameOrigin(url) {
    try { return new URL(url).origin === self.location.origin; } catch (_) { return false; }
}

// Fetch handler · estratègia ·
//   - GET same-origin JS/CSS/HTML · stale-while-revalidate
//   - GET same-origin JSON (docs/backlog.json) · network-first (fresh) ·
//     fallback cache si offline
//   - Externes · network passthrough (no toquem)
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    if (!_sameOrigin(req.url)) return;

    const url = new URL(req.url);
    const isJson = url.pathname.endsWith('.json') || url.pathname.includes('/api/');

    if (isJson) {
        // Network-first
        event.respondWith((async () => {
            try {
                const fresh = await fetch(req);
                const cache = await caches.open(RUNTIME_CACHE);
                cache.put(req, fresh.clone());
                return fresh;
            } catch (e) {
                const cached = await caches.match(req);
                if (cached) return cached;
                return new Response(JSON.stringify({ error: 'offline · no cached data' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        })());
        return;
    }

    // Static · stale-while-revalidate
    event.respondWith((async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req).then(res => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
        }).catch(() => cached);
        return cached || fetchPromise;
    })());
});

// Optional · listen for SKIP_WAITING from app · force activation
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
