const CACHE_NAME = 'medimind-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    clients.claim()
  );
});

self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event);
  
  let data = {
    title: 'MediMind Reminder',
    body: 'Time for your medication!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/dashboard',
    tag: 'medimind'
  };
  
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      try {
        data.body = event.data.text();
      } catch (e2) {
        data.body = 'Time for your medication!';
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    tag: data.tag || 'medimind',
    requireInteraction: true,
    data: {
      url: data.url || '/dashboard',
      medicineId: data.medicineId
    },
    actions: [
      { action: 'taken', title: '✅ Taken' },
      { action: 'snooze', title: '⏰ Snooze' }
    ]
  };

  console.log('[ServiceWorker] Showing notification:', data.title);
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
  
  if (event.action === 'taken' || event.action === 'snooze') {
    console.log('[ServiceWorker] Action handled:', event.action);
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
