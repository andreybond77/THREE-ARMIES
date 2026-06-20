const CACHE_NAME = 'battle-commander-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/start.html',
    '/game.html',
    '/difficulty.html',
    '/stats.html',
    '/auth.html',
    '/rules.html',
    '/privacy.html',
    '/css/common.css',
    '/css/index.css',
    '/css/start.css',
    '/css/game.css',
    '/css/difficulty.css',
    '/css/stats.css',
    '/css/auth.css',
    '/css/rules.css',
    '/js/common.js',
    '/js/index.js',
    '/js/start.js',
    '/js/game.js',
    '/js/difficulty.js',
    '/js/stats.js',
    '/js/auth.js',
    '/js/rules.js',
    '/js/yandex.js',
    '/manifest.json',
    '/favicon.ico',
    '/favicon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Кэш открыт');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.warn('⚠️ Ошибка кэширования:', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
            })
            .catch(() => {
                return new Response('Офлайн режим. Подключитесь к интернету для загрузки контента.', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});