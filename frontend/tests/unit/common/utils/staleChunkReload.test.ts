import { beforeAll, describe, expect, it } from 'vitest';
import { initStaleChunkReload } from '@/common/utils/staleChunkReload';

const firePreloadError = () => {
  const event = new Event('vite:preloadError', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

// The listener lives on window for the whole file, so it is registered once.
beforeAll(() => initStaleChunkReload());

describe('stale chunk reload', () => {
  it('reloads and swallows the error the first time', () => {
    const event = firePreloadError();

    expect(window.location.reload).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('lets the error through when a reload already happened for this build', () => {
    firePreloadError();
    const event = firePreloadError();

    expect(window.location.reload).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(false);
  });
});
