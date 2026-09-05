import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFrameActive } from '@/common/utils/frame';

const NOW = new Date('2026-01-01T12:00:00Z');

afterEach(() => vi.useRealTimers());

describe('isFrameActive', () => {
  it('rejects missing or non-string timestamps', () => {
    expect(isFrameActive(null)).toBe(false);
    expect(isFrameActive(undefined)).toBe(false);
    expect(isFrameActive('')).toBe(false);
    expect(isFrameActive(42 as unknown as string)).toBe(false);
  });

  it('rejects unparseable dates', () => {
    expect(isFrameActive('not-a-date')).toBe(false);
  });

  // The parameter is named maxInactivityMins but the default is 30 minutes in ms,
  // and it is compared against a millisecond delta. Pinning the value, not the name.
  it('treats the default window as 30 minutes', () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(isFrameActive('2026-01-01T11:31:00Z')).toBe(true);
    expect(isFrameActive('2026-01-01T11:30:00Z')).toBe(true);
    expect(isFrameActive('2026-01-01T11:29:59Z')).toBe(false);
  });

  it('honours an explicit window in milliseconds', () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(isFrameActive('2026-01-01T11:59:59Z', 1000)).toBe(true);
    expect(isFrameActive('2026-01-01T11:59:58Z', 1000)).toBe(false);
  });

  it('counts future timestamps as active', () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(isFrameActive('2026-01-01T13:00:00Z')).toBe(true);
  });
});
