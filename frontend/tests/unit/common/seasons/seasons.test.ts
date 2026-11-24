import { describe, expect, it } from 'vitest';
import { activeSeason, isInWindow, pickNext, pickOne, SEASONS, type Season } from '@/common/seasons/seasons';
import { christmasGreeting } from '@/common/seasons/christmas/christmas';
import { newYearGreeting } from '@/common/seasons/newyear/newyear';
import { newYearNumber } from '@/common/seasons/newyear/year';

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

  it.each([
    [11, 30, null],
    [12, 1, 'christmas'],
    [12, 27, 'christmas'],
    [12, 28, 'newyear'],
    [12, 31, 'newyear'],
    [1, 2, 'newyear'],
    [1, 3, null],
  ])('on %i/%i is %s', (month, day, expected) => {
    expect(activeSeason(on(month, day))?.id ?? null).toBe(expected);
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

describe('christmasGreeting', () => {
  it.each([
    [1, 'Noch 23 Mal schlafen bis Heiligabend!'],
    [22, 'Noch 2 Mal schlafen bis Heiligabend!'],
    [23, 'Noch einmal schlafen bis Heiligabend!'],
    [24, 'Frohe Weihnachten!'],
    [26, 'Frohe Weihnachten!'],
    [27, 'Schöne Feiertage und einen guten Rutsch!'],
  ])('on 12/%i says %s', (day, expected) => {
    expect(christmasGreeting(on(12, day))).toBe(expected);
  });
});

describe('newYearGreeting', () => {
  it.each([
    [new Date(2026, 11, 28, 12), 'Noch 3 Tage bis Silvester!'],
    [new Date(2026, 11, 29, 12), 'Noch 2 Tage bis Silvester!'],
    [new Date(2026, 11, 30, 12), 'Morgen ist Silvester!'],
    [new Date(2026, 11, 31, 12), 'Guten Rutsch ins Jahr 2027!'],
    [new Date(2027, 0, 1, 12), 'Frohes neues Jahr 2027!'],
    [new Date(2027, 0, 2, 12), 'Frohes neues Jahr 2027!'],
  ])('on %s says %s', (date, expected) => {
    expect(newYearGreeting(date)).toBe(expected);
  });
});

describe('newYearNumber', () => {
  it.each([
    [new Date(2026, 10, 24, 12), 2027],
    [new Date(2026, 11, 28, 12), 2027],
    [new Date(2027, 0, 2, 12), 2027],
  ])('on %s is %i', (date, expected) => {
    expect(newYearNumber(date)).toBe(expected);
  });
});

describe('pickOne', () => {
  it('is empty for no items', () => {
    expect(pickOne([])).toBeNull();
  });

  it('takes the item the random number lands on', () => {
    expect(pickOne(['a', 'b', 'c'], () => 0.5)).toBe('b');
  });
});

describe('pickNext', () => {
  it('repeats a single item', () => {
    expect(pickNext(['a'], 'a')).toBe('a');
  });

  it.each([0, 0.5, 0.99])('never repeats the last one (random %s)', (value) => {
    expect(pickNext(['a', 'b', 'c'], 'b', () => value)).not.toBe('b');
  });
});
