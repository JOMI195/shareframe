import { afterEach, describe, expect, it, vi } from 'vitest';
import { areCookiesEnabled } from '@/common/utils/cookies';

afterEach(() => vi.useRealTimers());

describe('areCookiesEnabled', () => {
  it('is true when the browser stores cookies and leaves no probe behind', () => {
    expect(areCookiesEnabled()).toBe(true);
    expect(document.cookie).toBe('');
  });

  it('is false when the browser reports cookies as disabled', () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false);
    expect(areCookiesEnabled()).toBe(false);
  });

  // Per-site blocking can leave cookieEnabled true while dropping every write.
  it('is false when a written cookie cannot be read back', () => {
    vi.spyOn(Document.prototype, 'cookie', 'get').mockReturnValue('');
    expect(areCookiesEnabled()).toBe(false);
  });
});
