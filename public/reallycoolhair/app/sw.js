/**
 * Service worker for Clover's phone app.
 *
 * Exists solely to receive push notifications — it deliberately does NOT cache
 * anything. An offline cache would mean the app could show a stale client list
 * or a stale calendar with no indication it was stale, and for a salon that is
 * worse than showing nothing: Clover would plan a day around appointments that
 * had since moved. The app already handles the server being unreachable and
 * says so.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Really Cool Hair', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Really Cool Hair';
  const options = {
    body: data.body || '',
    icon: '/app-icons/icon-192.png',
    badge: '/app-icons/icon-192.png',
    // Same tag replaces an earlier notification instead of stacking, so five
    // bookings do not become five identical banners to dismiss.
    tag: data.tag || 'rch',
    renotify: true,
    data: { url: data.url || '/app/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Tapping a notification should land on the thing it is about — and reuse the
 * app if it is already open rather than launching a second copy.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/app/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/app') && 'focus' in client) {
          if ('navigate' in client) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
