import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWeeklyActivityData } from '@/main/home/dashboard/stats/weeklyActivity/useWeeklyActivityData';
import { makeSentImage } from '@tests/fixtures';

// A Wednesday, so the Monday-first window starts two days earlier.
const WEDNESDAY = new Date('2026-01-07T12:00:00Z');

const daysFromMonday = (offset: number, hours = 12) =>
  new Date(Date.UTC(2026, 0, 5 + offset, hours)).toISOString();

const activity = (sentImages = [] as ReturnType<typeof makeSentImage>[]) =>
  renderHook(() => useWeeklyActivityData(sentImages, 'alice')).result.current;

describe('useWeeklyActivityData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(WEDNESDAY);
  });
  afterEach(() => vi.useRealTimers());

  it('always returns the seven days of the current week, Monday first', () => {
    expect(activity().map((day) => day.day)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
  });

  it('counts what I sent on the matching day', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'alice', reciever: 'bob', sent_at: daysFromMonday(1) }),
      makeSentImage({ id: 2, sender: 'alice', reciever: 'carol', sent_at: daysFromMonday(1) }),
    ]);

    expect(result[1]).toEqual({ day: 'Di', sentCount: 2, receivedCount: 0 });
  });

  it('counts what I received separately', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'bob', reciever: 'alice', sent_at: daysFromMonday(0) }),
    ]);

    expect(result[0]).toEqual({ day: 'Mo', sentCount: 0, receivedCount: 1 });
  });

  // Sending to your own frames is both, and the bar chart shows both.
  it('counts an image sent to myself on both axes', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'alice', reciever: 'alice', sent_at: daysFromMonday(2) }),
    ]);

    expect(result[2]).toEqual({ day: 'Mi', sentCount: 1, receivedCount: 1 });
  });

  it('ignores traffic between other people', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'bob', reciever: 'carol', sent_at: daysFromMonday(2) }),
    ]);

    expect(result.every((day) => day.sentCount === 0 && day.receivedCount === 0)).toBe(true);
  });

  it('ignores anything outside the current week', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'alice', reciever: 'bob', sent_at: daysFromMonday(-1) }),
      makeSentImage({ id: 2, sender: 'alice', reciever: 'bob', sent_at: daysFromMonday(7) }),
    ]);

    expect(result.every((day) => day.sentCount === 0)).toBe(true);
  });

  it('includes the very edges of a day', () => {
    const result = activity([
      makeSentImage({ id: 1, sender: 'alice', reciever: 'bob', sent_at: daysFromMonday(0, 0) }),
      makeSentImage({ id: 2, sender: 'alice', reciever: 'bob', sent_at: daysFromMonday(0, 23) }),
    ]);

    expect(result[0].sentCount).toBe(2);
  });
});
