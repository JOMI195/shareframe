import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPIRATION_HOURS,
  expirationTimestamp,
  toExpirationHours,
} from '@/main/images/dialogs/sendImageToUserFrame/expiration';

describe('toExpirationHours', () => {
  it.each([
    ['hours stay as they are', '5', 'hours' as const, 5],
    ['days become hours', '3', 'days' as const, 72],
    ['the upper bound is allowed', '365', 'days' as const, 365 * 24],
  ])('%s', (_name, value, unit, expected) => {
    expect(toExpirationHours(value, unit)).toBe(expected);
  });

  it.each([
    ['blank', ''],
    ['not a number', 'abc'],
    ['zero', '0'],
    ['negative', '-2'],
    ['a fraction', '2.9'],
    ['above the limit', '366'],
  ])('refuses a value that is %s', (_name, value) => {
    expect(toExpirationHours(value, 'hours')).toBeNull();
  });
});

describe('expirationTimestamp', () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  it('returns whole unix seconds', () => {
    expect(expirationTimestamp(DEFAULT_EXPIRATION_HOURS, now)).toBe(now / 1000 + 24 * 3600);
  });

  it('scales with the selected hours', () => {
    expect(expirationTimestamp(168, now) - expirationTimestamp(24, now)).toBe(144 * 3600);
  });

  it('floors sub-second precision away', () => {
    expect(Number.isInteger(expirationTimestamp(1, now + 543))).toBe(true);
  });
});
