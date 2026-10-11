import axiosInstance from '@/services/api';

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

// Avatar URLs change on every upload, so a cached blob never goes stale.
const cache = new Map<string, Promise<string>>();

export const loadAvatar = (url: string): Promise<string> => {
    let pending = cache.get(url);
    if (!pending) {
        pending = axiosInstance
            .get<Blob>(`${MEDIA_BASE_URL}${url}`, { responseType: 'blob' })
            .then((response) => URL.createObjectURL(response.data));
        pending.catch(() => cache.delete(url));
        cache.set(url, pending);
    }
    return pending;
};

export const clearAvatarCache = () => {
    for (const pending of cache.values()) {
        pending.then((objectUrl) => URL.revokeObjectURL(objectUrl), () => undefined);
    }
    cache.clear();
};
