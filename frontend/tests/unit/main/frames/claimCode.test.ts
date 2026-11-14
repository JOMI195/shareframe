import { describe, expect, it } from 'vitest';
import { formatClaimCode } from '@/main/frames/dialogs/register/claimCode';

describe('formatClaimCode', () => {
  it.each([
    ['groups plain input', 'k7m2qx9p', 'K7M2-QX9P'],
    ['keeps a typed dash in place', 'K7M2-', 'K7M2'],
    ['drops spaces and other characters', 'k7m2 - qx/9p', 'K7M2-QX9P'],
    ['stops at eight characters', 'K7M2QX9PZZZZ', 'K7M2-QX9P'],
  ])('%s', (_name, input, expected) => {
    expect(formatClaimCode(input)).toBe(expected);
  });
});
