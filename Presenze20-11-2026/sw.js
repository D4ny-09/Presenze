/**
 * Service Worker per Registro Presenze Oratorio (PWA)
 * Consente l'installazione su Smartphone e Tablet e garantisce l'uso offline.
 */
const CACHE_NAME = 'oratorio-presenze-v5';
const ASSETS_TO_CACHE = [
  './',
  './login.html',
  './index.html',
  './appello-parrocchia.html',
  './catechista.html',
  './squadre.html',
  './manifest.json',
  './icons/icon.svg',
  './css/style.css',
  './js/auth.js',
  './js/data.js',
  './js/app.js',
  './js/parrocchia.js',
  './js/appello-parrocchia.js',
  './js/catechista.js',
  './js/squadre.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache pre-fetch warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first con fallback a cache per essere sempre aggiornati
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET' && e.request.url.startsWith('http')) {
            cache.put(e.request, copy);
          }
        });
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
