self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('descargas-store-v1').then((cache) => {
      return cache.addAll([
        './',
        './descarga.html',
        './descarga.css',
        './descarga.js',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
