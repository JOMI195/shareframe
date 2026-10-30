import { reloadOnce } from './reloadOnce';

const STALE_CHUNK_KEY = 'stale-chunk-reload';
const STALE_CHUNK_MESSAGE = /dynamically imported module|Importing a module script failed|error loading dynamically/i;

export const reloadForStaleChunk = () => reloadOnce(STALE_CHUNK_KEY, import.meta.env.VITE_APP_BUILD_VERSION ?? '');

export const isStaleChunkError = (error: unknown) =>
  error instanceof Error && STALE_CHUNK_MESSAGE.test(error.message);

// A deploy removes the old hashed chunks, so an open tab can only recover by loading the new build.
export const initStaleChunkReload = () => {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForStaleChunk()) event.preventDefault();
  });
};
