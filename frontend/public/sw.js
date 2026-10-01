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
