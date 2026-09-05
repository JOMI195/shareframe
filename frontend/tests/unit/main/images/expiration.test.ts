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
    ['a blank value falls back to one', '', 'hours' as const, 1],
    ['a non-numeric value falls back to one', 'abc', 'days' as const, 24],
    ['a decimal is truncated', '2.9', 'hours' as const, 2],
  ])('%s', (_name, value, unit, expected) => {
    expect(toExpirationHours(value, unit)).toBe(expected);
  });

  // The number input allows 0, which parseInt keeps but `|| 1` rewrites.
  it('treats zero as one hour', () => {
    expect(toExpirationHours('0', 'hours')).toBe(1);
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
