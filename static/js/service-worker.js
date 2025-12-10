const CACHE_NAME = 'furlife-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/static/css/common.css',
    '/static/css/calendar.css',
    '/static/css/pet_detail.css',
    '/static/css/shop.css',
    '/static/css/login.css',
    '/static/css/levelup-modal.css',
    '/static/js/calendar.js',
    '/static/js/pet_detail.js',
    '/static/js/shop.js',
    '/static/js/login.js',
    // ペット画像（代表的なもの）
    '/static/images/pet1/egg.jpg',
    '/static/images/pet1/lv1.gif',
    '/static/images/coin/coin.jpg'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('キャッシュを開きました');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// フェッチ時のキャッシュ戦略（Network First）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // ネットワークから取得できたらキャッシュに保存
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // ネットワークエラー時はキャッシュから返す
                return caches.match(event.request);
            })
    );
});