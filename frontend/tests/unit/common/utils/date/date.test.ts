import { describe, expect, it } from 'vitest';
import { formatDate, formatDateOnly } from '@/common/utils/date/date';

const ISO = '2026-03-05T14:07:09Z';

describe('formatDateOnly', () => {
  it('formats German long dates', () => {
    expect(formatDateOnly(ISO)).toBe('5. März 2026');
  });

  it('accepts Date and epoch input', () => {
    expect(formatDateOnly(new Date(ISO))).toBe('5. März 2026');
    expect(formatDateOnly(Date.parse(ISO))).toBe('5. März 2026');
  });

  it('honours an explicit locale', () => {
    expect(formatDateOnly(ISO, 'en-US')).toBe('March 5, 2026');
  });

  // Intl.DateTimeFormat.format throws rather than returning "Invalid Date";
  // a bad timestamp from the API therefore crashes the rendering component.
  it('throws on unparseable input', () => {
    expect(() => formatDateOnly('nope')).toThrow(RangeError);
  });
});

describe('formatDate', () => {
  it('includes time and zone (TZ is pinned to UTC in vitest.config)', () => {
    expect(formatDate(ISO)).toContain('5. März 2026');
    expect(formatDate(ISO)).toContain('14:07:09');
  });

  it('throws on unparseable input', () => {
    expect(() => formatDate('nope')).toThrow(RangeError);
  });
});
