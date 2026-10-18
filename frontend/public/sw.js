const SHARE_PATH = '/teilen/';
const SHARE_CACHE = 'share-target';
const SHARE_EMPTY_URL = '/fotos/?geteilt=leer';
// Upper bounds only; the upload dialog checks the format.
const SHARE_MAX_FILES = 20;
const SHARE_MAX_BYTES = 25 * 1024 * 1024;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Only the share target is handled; every other request goes to the network uncached.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.pathname !== SHARE_PATH) return;
  event.respondWith(storeSharedFiles(event.request));
});

const readSharedFiles = async (request) => {
  try {
    return (await request.formData()).getAll('images');
  } catch {
    return [];
  }
};

// Some Chrome versions on Android deliver the share without its files.
const storeSharedFiles = async (request) => {
  const files = (await readSharedFiles(request))
    .filter((file) => file instanceof File && file.size > 0 && file.size <= SHARE_MAX_BYTES)
    .slice(0, SHARE_MAX_FILES);
  if (files.length === 0) return Response.redirect(SHARE_EMPTY_URL, 303);

  await caches.delete(SHARE_CACHE);
  const cache = await caches.open(SHARE_CACHE);
  const sharedAt = String(Date.now());

  await Promise.all(files.map((file, index) =>
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

const sameOriginUrl = (url) => {
  const root = new URL('/', self.location.origin);
  try {
    const target = new URL(url, root);
    return (target.origin === root.origin ? target : root).href;
  } catch {
    return root.href;
  }
};

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = sameOriginUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    // Only controlled windows can be navigated.
    const [open] = await self.clients.matchAll({ type: 'window' });
    if (open) {
      await open.focus();
      const navigated = await open.navigate(target).catch(() => null);
      if (navigated) return navigated;
    }
    return self.clients.openWindow(target);
  })());
});
