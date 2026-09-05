import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  frameOTPRecieved,
  frameOTPRequestFailed,
  frameOTPRequested,
  framesReceived,
  framesRequestFailed,
  framesRequested,
  registerFrameFailed,
  registerFrameFulfilled,
  registerFramePending,
  unregisterFrameFailed,
  unregisterFrameFulfilled,
  unregisterFramePending,
} from '@/store/entities/frames/frames.slice';
import { makeFrame } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

afterEach(() => vi.useRealTimers());

describe('frames slice loading flags', () => {
  it.each([
    [framesRequested, 'loading', true],
    [registerFramePending, 'loading', true],
    [unregisterFramePending, 'loading', true],
    [frameOTPRequested, 'otpLoading', true],
    [framesRequestFailed, 'loading', false],
    [registerFrameFailed, 'loading', false],
    [unregisterFrameFailed, 'loading', false],
    [frameOTPRequestFailed, 'otpLoading', false],
  ])('%o toggles the flag', (action, flag, expected) => {
    const state = reducer(initial(), action());
    expect(state.api[flag as 'loading' | 'otpLoading']).toBe(expected);
  });

  it('keeps loading and otpLoading independent', () => {
    const state = reducer(reducer(initial(), framesRequested()), frameOTPRequested());
    expect(state.api).toMatchObject({ loading: true, otpLoading: true });
  });
});

describe('framesReceived', () => {
  it('replaces the list and stamps lastFetch', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const frames = [makeFrame({ id: 1 }), makeFrame({ id: 2 })];

    const state = reducer(reducer(initial(), framesRequested()), framesReceived(frames));

    expect(state.frames).toEqual(frames);
    expect(state.api.loading).toBe(false);
    expect(state.api.lastFetch).toBe(Date.parse('2026-01-01T00:00:00Z'));
  });
});

describe('registerFrameFulfilled', () => {
  it('prepends the new frame', () => {
    const existing = makeFrame({ id: 1, registered_at: '2026-01-01T00:00:00Z' });
    const added = makeFrame({ id: 2, registered_at: '2026-02-01T00:00:00Z' });

    const state = reducer({ ...initial(), frames: [existing] }, registerFrameFulfilled(added));

    expect(state.frames.map((f) => f.id)).toEqual([2, 1]);
  });
});

describe('unregisterFrameFulfilled', () => {
  const a = makeFrame({ id: 1, registered_at: '2026-01-01T00:00:00Z' });
  const b = makeFrame({ id: 2, registered_at: '2026-02-01T00:00:00Z' });

  it('removes the frame matching registered_at', () => {
    const state = reducer({ ...initial(), frames: [a, b] }, unregisterFrameFulfilled(a));
    expect(state.frames.map((f) => f.id)).toEqual([2]);
  });

  it('keeps the list untouched when nothing matches', () => {
    const unknown = makeFrame({ id: 9, registered_at: '2099-01-01T00:00:00Z' });

    const state = reducer({ ...initial(), frames: [a, b] }, unregisterFrameFulfilled(unknown));

    expect(state.frames.map((f) => f.id)).toEqual([1, 2]);
  });

  it('matches on registered_at, not id', () => {
    const sameTimestamp = makeFrame({ id: 99, registered_at: a.registered_at });

    const state = reducer({ ...initial(), frames: [a, b] }, unregisterFrameFulfilled(sameTimestamp));

    expect(state.frames.map((f) => f.id)).toEqual([2]);
  });
});

describe('frameOTPRecieved', () => {
  it('clears otpLoading without touching the list', () => {
    const frames = [makeFrame()];
    const state = reducer({ ...initial(), frames }, frameOTPRecieved());

    expect(state.api.otpLoading).toBe(false);
    expect(state.frames).toEqual(frames);
  });
});
