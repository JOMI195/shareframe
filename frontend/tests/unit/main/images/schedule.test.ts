import { describe, expect, it } from 'vitest';
import {
  MAX_SCHEDULE_DAYS,
  defaultScheduleDate,
  scheduleError,
  toUnixSeconds,
} from '@/main/images/dialogs/sendImageToUserFrame/schedule';

const now = Date.UTC(2026, 0, 1, 12, 0, 0);

describe('defaultScheduleDate', () => {
  it('is at least an hour ahead on a full hour', () => {
    expect(defaultScheduleDate(Date.UTC(2026, 0, 1, 10, 5))).toEqual(new Date(Date.UTC(2026, 0, 1, 12)));
  });

  it('keeps an exact hour', () => {
    expect(defaultScheduleDate(Date.UTC(2026, 0, 1, 10))).toEqual(new Date(Date.UTC(2026, 0, 1, 11)));
  });
});

describe('scheduleError', () => {
  it('accepts a time in the near future', () => {
    expect(scheduleError(new Date(Date.UTC(2026, 0, 1, 13)), now)).toBeNull();
  });

  it.each([
    ['no date', null],
    ['an invalid date', new Date(Number.NaN)],
    ['the past', new Date(Date.UTC(2026, 0, 1, 11, 59))],
    ['now', new Date(now)],
  ])('rejects %s', (_name, date) => {
    expect(scheduleError(date, now)).not.toBeNull();
  });

  it('rejects more than the maximum ahead', () => {
    const tooFar = new Date(now + (MAX_SCHEDULE_DAYS + 1) * 24 * 3600 * 1000);
    expect(scheduleError(tooFar, now)).toMatch(/Tage im Voraus/);
  });
});

describe('toUnixSeconds', () => {
  it('drops the milliseconds', () => {
    expect(toUnixSeconds(new Date(now + 999))).toBe(now / 1000);
  });
});
