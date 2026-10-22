import { reloadOnce } from './reloadOnce';

const STALE_CHUNK_KEY = 'stale-chunk-reload';

// A deploy removes the old hashed chunks, so an open tab can only recover by loading the new build.
export const initStaleChunkReload = () => {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce(STALE_CHUNK_KEY, import.meta.env.VITE_APP_BUILD_VERSION ?? '')) event.preventDefault();
  });
};
