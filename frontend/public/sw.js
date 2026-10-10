const SHARE_PATH = '/teilen/';
const SHARE_CACHE = 'share-target';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Only the share target is handled; every other request goes to the network uncached.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.pathname !== SHARE_PATH) return;
  event.respondWith(storeSharedFiles(event.request));
});

const storeSharedFiles = async (request) => {
  const formData = await request.formData();
  await caches.delete(SHARE_CACHE);
  const cache = await caches.open(SHARE_CACHE);
  const sharedAt = String(Date.now());

  await Promise.all(formData.getAll('images').map((file, index) =>
    cache.put(`${SHARE_PATH}${index}`, new Response(file, {
      headers: {
        'content-type': file.type,
        'x-file-name': encodeURIComponent(file.name),
        'x-shared-at': sharedAt,
      },
    })),
  ));

  return Response.redirect('/fotos/', 303);
};

const readPayload = (data) => {
  try {
    const payload = data ? data.json() : null;
    return payload && typeof payload === 'object' ? payload : {};
  } catch {
    return {};
  }
};

// Every push must show a notification, else Safari revokes the subscription.
self.addEventListener('push', (event) => {
  const { title, body, url, tag } = readPayload(event.data);
  event.waitUntil(self.registration.showNotification(title || 'ShareFrame', {
    body: body || 'Schau mal wieder bei ShareFrame vorbei.',
    tag,
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    data: { url: url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((client) => client.url.startsWith(self.location.origin));
    if (open) {
      await open.focus();
      return open.navigate(target);
    }
    return self.clients.openWindow(target);
  })());
});
