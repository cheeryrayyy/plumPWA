// Service Worker — 网络优先，离线降级
const CACHE_NAME = 'plum-v2';

const CACHE_FILES = [
    '/plumPWA/',
    '/plumPWA/index.html',
    '/plumPWA/css/style.css',
    '/plumPWA/js/hexagram.js',
    '/plumPWA/js/ganzhi.js',
    '/plumPWA/js/strokes.js',
    '/plumPWA/js/hexagram-canvas.js',
    '/plumPWA/js/methods.js',
    '/plumPWA/js/app.js',
    '/plumPWA/data/strokes.json',
    '/plumPWA/data/lunar_data.json',
    '/plumPWA/manifest.json',
    '/plumPWA/icons/icon-192.png',
    '/plumPWA/icons/icon-512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                CACHE_FILES.map(url =>
                    cache.add(url).catch(() => {})
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// 网络优先：先尝试网络，失败才用缓存
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).then(response => {
            if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache =>
                    cache.put(event.request, clone)
                );
            }
            return response;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
