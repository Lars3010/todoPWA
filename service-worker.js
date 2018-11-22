var cacheName = 'TODO - 1.0';
//add frameworks to the cache
var filesToCache = [
  '',
  '/',
  '/index.html',
  '/manifest.json',
  '/scripts/app.js',
  '/scripts/jquery-3.2.1.min.js',
  '/scripts/jquery.visible.min.js',
  '/scripts/mustache/mustache.min.js',
  '/scripts/localForage/dist/localforage.js',
  '/scripts/localForage-startsWith/dist/localforage-startswith.js',
  '/scripts/localForage-getItems/dist/localforage-getitems.js',
  '/scripts/localForage-setItems/dist/localforage-setitems.js',
  '/styles/inline.css',
  '/images/ic_more_vert_black_24px.svg',
  '/images/ic_add_white_24px.svg',
  '/images/ic_delete_sweep_white_24px.svg',
  '/images/ic_delete_black_24px.svg',
  '/images/ic_mode_edit_black_24px.svg'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
