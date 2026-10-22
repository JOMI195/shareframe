import { describe, expect, it } from 'vitest';
import { activeSeason, isInWindow, SEASONS, type Season } from '@/common/seasons/seasons';

const on = (month: number, day: number) => new Date(2026, month - 1, day, 12);

describe('isInWindow', () => {
  const from = { month: 10, day: 17 };
  const to = { month: 10, day: 31 };

  it.each([
    [10, 16, false],
    [10, 17, true],
    [10, 31, true],
    [11, 1, false],
  ])('%i/%i is %s', (month, day, expected) => {
    expect(isInWindow(on(month, day), from, to)).toBe(expected);
  });

  it('wraps over the new year', () => {
    const winterFrom = { month: 12, day: 20 };
    const winterTo = { month: 1, day: 6 };

    expect(isInWindow(on(12, 24), winterFrom, winterTo)).toBe(true);
    expect(isInWindow(on(1, 6), winterFrom, winterTo)).toBe(true);
    expect(isInWindow(on(1, 7), winterFrom, winterTo)).toBe(false);
    expect(isInWindow(on(12, 19), winterFrom, winterTo)).toBe(false);
  });
});

describe('activeSeason', () => {
  it('finds halloween in late October', () => {
    expect(activeSeason(on(10, 22))?.id).toBe('halloween');
  });

  it('is empty outside every season', () => {
    expect(activeSeason(on(11, 1))).toBeNull();
  });

  it('picks the first matching season', () => {
    const first = { ...SEASONS[0], id: 'first' } as Season;
    const second = { ...SEASONS[0], id: 'second' } as Season;

    expect(activeSeason(on(10, 22), [first, second])?.id).toBe('first');
  });
});
