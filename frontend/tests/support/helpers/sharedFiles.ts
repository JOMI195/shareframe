// jsdom has no Cache Storage; this mirrors what public/sw.js leaves behind for a share.
export interface SharedPhoto {
  name: string;
  type?: string;
  sharedAt?: number;
}

export const stubSharedFiles = (photos: SharedPhoto[]) => {
  const entries = new Map(photos.map((photo, index) => [`/teilen/${index}`, {
    headers: new Headers({
      'content-type': photo.type ?? 'image/jpeg',
      'x-file-name': encodeURIComponent(photo.name),
      'x-shared-at': String(photo.sharedAt ?? Date.now()),
    }),
    blob: async () => new Blob(['x'.repeat(64)], { type: photo.type ?? 'image/jpeg' }),
  }]));

  const cache = {
    keys: async () => [...entries.keys()],
    match: async (key: string) => entries.get(key),
  };

  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: {
      has: async () => entries.size > 0,
      open: async () => cache,
      delete: async () => entries.clear() === undefined,
    },
  });

  return entries;
};

export const clearSharedFilesStub = () => {
  delete (globalThis as { caches?: unknown }).caches;
};
