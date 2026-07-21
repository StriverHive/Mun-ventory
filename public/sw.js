/* Mun-ventory service worker */
var CACHE = 'munventory-v2';
var ASSETS = [
  '/',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/vendor/xlsx.full.min.js',
  '/vendor/html2canvas.min.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// App-owned files that change between deploys: always try the network first
// so installed clients pick up updates; cache is only the offline fallback.
var NETWORK_FIRST = ['/app.js', '/styles.css', '/manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Never cache API calls or non-GET requests
  if (e.request.method !== 'GET' || url.pathname.indexOf('/api/') === 0) return;
  if (url.origin !== location.origin) return;

  // Navigations: network first, cached shell as offline fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('/', copy); });
        }
        return res;
      }).catch(function () { return caches.match('/'); })
    );
    return;
  }

  // App shell JS/CSS: network first so deploys reach installed clients
  if (NETWORK_FIRST.indexOf(url.pathname) !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // Vendor libs & icons (effectively immutable): cache first
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
