// Must match public/sw.js.
const SHARE_CACHE = 'share-target';
const MAX_AGE_MS = 10 * 60 * 1000;

const sharedCacheExists = async () => typeof caches !== 'undefined' && caches.has(SHARE_CACHE);

export const hasSharedFiles = async () => {
  if (!(await sharedCacheExists())) return false;
  const cache = await caches.open(SHARE_CACHE);
  return (await cache.keys()).length > 0;
};

// Stale entries are dropped so a later login on a shared device does not pick them up.
export const takeSharedFiles = async (): Promise<File[]> => {
  if (!(await sharedCacheExists())) return [];

  const cache = await caches.open(SHARE_CACHE);
  const requests = await cache.keys();
  const responses = await Promise.all(requests.map((request) => cache.match(request)));
  await caches.delete(SHARE_CACHE);

  const now = Date.now();
  const files = await Promise.all(responses.map(async (response) => {
    if (!response) return null;
    const sharedAt = Number(response.headers.get('x-shared-at'));
    if (!(now - sharedAt <= MAX_AGE_MS)) return null;

    const name = decodeURIComponent(response.headers.get('x-file-name') ?? 'geteiltes-foto');
    const type = response.headers.get('content-type') ?? '';
    return new File([await response.blob()], name, { type, lastModified: sharedAt });
  }));

  return files.filter((file): file is File => file !== null);
};
