const CACHE_NAME = 'tia-info-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './frontend/css/global.css',
  './frontend/css/home.css',
  './frontend/js/data.js',
  './frontend/js/db.js',
  './frontend/js/app.js',
  './manifest.json',
  './frontend/img/Logo_Tia_Infos.jpg',
  './frontend/img/Photo_aceuil.jpg',
  './frontend/img/Masterclass_ia.jpg',
  './frontend/img/informatique-bureautique.jpg',
  './frontend/img/ouverture_tia_infos.jpg',
  './frontend/img/Cours_de_langue.jpg',
  './frontend/img/Marketing_digital.jpg',
  './frontend/img/nos-formations.jpg',
  './frontend/img/hero-bg.png',
  './frontend/img/course-web.png',
  './frontend/img/Appel_aux_association-de_jeune.jpg'
];

// Installation : Mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Mise en cache des ressources');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch : Stratégie Stale-While-Revalidate
// Essayer le réseau, sinon cache. Et mettre à jour le cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(() => {
            // Optionnel: Retourner une page offline-custom si nécessaire
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});
