const CACHE_NAME = 'nautilus-cache-v' + new Date().getTime();

self.addEventListener('install', (event) => {
  // Pula a fase de espera e ativa imediatamente o novo service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos e assume o controle imediatamente
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia: Network First (tenta rede, se falha usa cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona a resposta para salvar no cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Se offline, tenta pegar do cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('push', function(event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova Notificação', body: event.data.text() };
    }

    const options = {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Nautilus Engenharia', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
