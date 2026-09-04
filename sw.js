self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('cargaxpress-v1').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './invoice.css',
        './invoice.js',
        './manifest.json',
        './tulogo.jpeg'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
