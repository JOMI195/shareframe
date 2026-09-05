const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MEDIA_BASE = import.meta.env.VITE_API_MEDIA_BASE_URL;

// Handlers are built from the app's own URL builders, so a path change breaks
// the handler instead of silently passing.
export const apiUrl = (path: string) => `${API_BASE}/${path}`;

export const mediaUrl = (path: string) => `${MEDIA_BASE}${path}`;

// MSW path params are strings; the URL builders are typed for numeric ids.
export const pathParam = (name: string) => `:${name}` as unknown as number;
