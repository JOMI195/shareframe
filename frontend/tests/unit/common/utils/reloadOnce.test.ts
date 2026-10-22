import { describe, expect, it, vi } from 'vitest';
import { reloadOnce } from '@/common/utils/reloadOnce';

describe('reloadOnce', () => {
  it('reloads the first time for a value', () => {
    expect(reloadOnce('key', 'v1')).toBe(true);
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('does not reload twice for the same value', () => {
    reloadOnce('key', 'v1');

    expect(reloadOnce('key', 'v1')).toBe(false);
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('reloads again for a new value', () => {
    reloadOnce('key', 'v1');

    expect(reloadOnce('key', 'v2')).toBe(true);
    expect(window.location.reload).toHaveBeenCalledTimes(2);
  });

  // Without storage the guard cannot work, and reloading blind could loop.
  it('does not reload when session storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(reloadOnce('key', 'v1')).toBe(false);
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
