import { describe, expect, it } from 'vitest';
import { possessive } from '@/common/utils/text/possessive';

describe('possessive', () => {
  it.each([
    ['Anna', 'Annas'],
    ['Klaus', 'Klaus’'],
    ['Max', 'Max’'],
    ['Fritz', 'Fritz’'],
    ['Strauß', 'Strauß’'],
  ])('%s → %s', (name, expected) => {
    expect(possessive(name)).toBe(expected);
  });
});
