var CACHE_NAME = 'notes-cache-v5';
var STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/config.js',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-48x48.png',
    '/icons/favicon-64x64.png',
    '/icons/favicon-128x128.png',
    '/icons/favicon-256x256.png',
    '/icons/favicon-512x512.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            var promises = [];
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] !== CACHE_NAME) {
                    promises.push(caches.delete(keys[i]));
                }
            }
            return Promise.all(promises);
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);
    
    // НЕ перехватываем запросы к Socket.IO
    if (url.pathname.indexOf('/socket.io/') !== -1) {
        return;
    }
    
    // НЕ перехватываем запросы к API сервера
    if (url.pathname === '/subscribe' || url.pathname === '/unsubscribe') {
        return;
    }
    
    // Только для GET запросов
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request).then(function(fetchResponse) {
                // Кэшируем только успешные ответы с нашего сервера
                if (fetchResponse && fetchResponse.status === 200 && url.origin === location.origin) {
                    var responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        }).catch(function() {
            // Офлайн fallback только для HTML страниц
            if (event.request.headers.get('accept').indexOf('text/html') !== -1) {
                return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
        })
    );
});

self.addEventListener('push', function(event) {
    var data = { title: 'New task', body: '' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch(e) {
            data.body = event.data.text();
        }
    }
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/favicon-128x128.png',
            badge: '/icons/favicon-48x48.png'
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});