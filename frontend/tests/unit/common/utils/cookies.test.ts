import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCookieConsentExpired } from '@/common/utils/cookies';

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
