import axiosInstance from '@/services/api';

// Media file names never change, so a cached blob stays valid until sign-out.
const MAX_BYTES = 50 * 1024 * 1024;

type Entry = {
    objectUrl: Promise<string>;
    resolved?: string;
    bytes: number;
    users: number;
};

const entries = new Map<string, Entry>();
let totalBytes = 0;

// Only unused entries go: revoking a blob that is still on screen would break the image.
const evict = () => {
    for (const [url, entry] of entries) {
        if (totalBytes <= MAX_BYTES) return;
        if (entry.users > 0 || !entry.resolved) continue;
        URL.revokeObjectURL(entry.resolved);
        totalBytes -= entry.bytes;
        entries.delete(url);
    }
};

const load = (url: string): Entry => {
    const entry: Entry = { objectUrl: Promise.resolve(''), bytes: 0, users: 0 };
    entry.objectUrl = axiosInstance
        .get<Blob>(url, { responseType: 'blob' })
        .then((response) => {
            const objectUrl = URL.createObjectURL(response.data);
            if (entries.get(url) !== entry) {
                URL.revokeObjectURL(objectUrl);
                throw new Error('Image cache was cleared');
            }
            entry.resolved = objectUrl;
            entry.bytes = response.data.size;
            totalBytes += entry.bytes;
            evict();
            return objectUrl;
        });
    entry.objectUrl.catch(() => {
        if (entries.get(url) === entry) entries.delete(url);
    });
    return entry;
};

export const peekImage = (url: string): string | undefined => entries.get(url)?.resolved;

export const acquireImage = (url: string) => {
    let entry = entries.get(url);
    if (entry) {
        entries.delete(url);
    } else {
        entry = load(url);
    }
    entries.set(url, entry);
    entry.users += 1;

    const acquired = entry;
    let released = false;
    return {
        objectUrl: acquired.objectUrl,
        release: () => {
            if (released) return;
            released = true;
            acquired.users -= 1;
            evict();
        },
    };
};

export const clearImageCache = () => {
    for (const entry of entries.values()) {
        if (entry.resolved) URL.revokeObjectURL(entry.resolved);
    }
    entries.clear();
    totalBytes = 0;
};
