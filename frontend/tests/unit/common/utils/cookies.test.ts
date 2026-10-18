import { afterEach, describe, expect, it, vi } from 'vitest';
import { areCookiesEnabled, isCookieConsentExpired } from '@/common/utils/cookies';

const NOW = 1_800_000_000_000;

afterEach(() => vi.useRealTimers());

describe('isCookieConsentExpired', () => {
  it('treats a missing expiry as expired', () => {
    expect(isCookieConsentExpired(null)).toBe(true);
  });

  it('expires only strictly past the timestamp', () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(isCookieConsentExpired(NOW - 1)).toBe(true);
    expect(isCookieConsentExpired(NOW)).toBe(false);
    expect(isCookieConsentExpired(NOW + 1)).toBe(false);
  });
});

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
