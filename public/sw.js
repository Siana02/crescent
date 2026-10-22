const CACHE_NAME = 'crescent-shell-v1';
const APP_SHELL = ['/','/manifest.webmanifest','/crescent-icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
  }
});
self.addEventListener('push', event => {
  let payload = { title: 'Crescent', body: 'You have a new update.', url: '/dashboard' };
  try { payload = { ...payload, ...(event.data ? event.data.json() : {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title || 'Crescent', {
    body: payload.body || 'You have a new update.',
    icon: '/crescent-icon.svg',
    badge: '/crescent-icon.svg',
    data: { url: payload.url || '/dashboard' },
    tag: payload.tag || 'crescent-update',
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => client.url.startsWith(self.location.origin));
    if (existing) { existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  }));
});
