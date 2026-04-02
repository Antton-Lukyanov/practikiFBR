const CACHE_NAME = 'notes-cache-v3';
const ASSETS = [
    '.',
    './index.html',
    './app.js',
    './style.css',
    './manifest.json',
    './icons/favicon.ico',
    './icons/favicon-16x16.png',
    './icons/favicon-32x32.png',
    './icons/favicon-48x48.png',
    './icons/favicon-64x64.png',
    './icons/favicon-128x128.png',
    './icons/favicon-256x256.png',
    './icons/favicon-512x512.png'
];

// Установка - кэшируем ресурсы
self.addEventListener('install', (event) => {
    console.log('Service Worker: установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: кэширование ресурсов');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация - чистим старые кэши
self.addEventListener('activate', (event) => {
    console.log('Service Worker: активация');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('Service Worker: удаление старого кэша', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((fetchResponse) => {
                    if (!fetchResponse || fetchResponse.status !== 200 || event.request.method !== 'GET') {
                        return fetchResponse;
                    }
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return fetchResponse;
                });
            }).catch(() => {
                return new Response('Вы офлайн. Некоторые ресурсы недоступны.', {
                    status: 200,
                    headers: new Headers({ 'Content-Type': 'text/plain' })
                });
            })
    );
});