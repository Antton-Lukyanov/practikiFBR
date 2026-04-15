var CACHE_NAME = 'notes-cache-v6';
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
    
    if (url.pathname.indexOf('/socket.io/') !== -1) return;
    if (url.pathname === '/subscribe' || url.pathname === '/unsubscribe' || url.pathname === '/snooze') return;
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) return response;
            return fetch(event.request).then(function(fetchResponse) {
                if (fetchResponse && fetchResponse.status === 200 && url.origin === location.origin) {
                    var responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        }).catch(function() {
            if (event.request.headers.get('accept').indexOf('text/html') !== -1) {
                return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
        })
    );
});

self.addEventListener('push', function(event) {
    var data = { title: 'Reminder', body: '', reminderId: null };
    
    if (event.data) {
        try {
            var parsed = event.data.json();
            data.title = parsed.title || 'Reminder';
            data.body = parsed.body || '';
            data.reminderId = parsed.reminderId || null;
        } catch(e) {
            data.body = event.data.text();
        }
    }
    
    var options = {
        body: data.body,
        icon: '/icons/favicon-128x128.png',
        badge: '/icons/favicon-48x48.png',
        vibrate: [200, 100, 200],
        tag: 'reminder-' + (data.reminderId || Date.now()),
        requireInteraction: true,
        data: {
            reminderId: data.reminderId
        }
    };
    
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Snooze 5 min' },
            { action: 'open', title: 'Open' }
        ];
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'snooze') {
        var reminderId = event.notification.data.reminderId;
        
        event.waitUntil(
            fetch('/snooze?reminderId=' + reminderId, { method: 'POST' })
                .then(function(response) {
                    if (response.ok) {
                        self.registration.showNotification('Reminder snoozed', {
                            body: 'You will be reminded again in 5 minutes',
                            icon: '/icons/favicon-128x128.png',
                            tag: 'snooze-confirm'
                        });
                    }
                })
                .catch(function(err) {})
        );
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    if (clientList[i].url === '/' || clientList[i].url.includes('/index.html')) {
                        return clientList[i].focus();
                    }
                }
                return clients.openWindow('/');
            })
    );
});