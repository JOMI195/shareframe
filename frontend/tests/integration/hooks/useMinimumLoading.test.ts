import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMinimumLoading } from '@/hooks/loading/useMinimumLoading';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useMinimumLoading', () => {
  it('mirrors the initial value', () => {
    expect(renderHook(() => useMinimumLoading(false)).result.current).toBe(false);
    expect(renderHook(() => useMinimumLoading(true)).result.current).toBe(true);
  });

  it('holds true for the minimum span when the response is fast', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => vi.advanceTimersByTime(100));
    rerender({ loading: false });
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('clears immediately when the response is slower than the minimum', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => vi.advanceTimersByTime(500));
    rerender({ loading: false });

    expect(result.current).toBe(false);
  });

  it('honours a custom minimum', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumLoading(loading, 1000), {
      initialProps: { loading: true },
    });

    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(999));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  // startedAt stays null until loading first goes true, so nothing is scheduled.
  it('does nothing when loading was never true', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumLoading(loading), {
      initialProps: { loading: false },
    });

    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(false);
  });

  it('restarts the window when loading toggles back on', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumLoading(loading), {
      initialProps: { loading: true },
    });

    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(200));
    rerender({ loading: true });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(true);

    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe(false);
  });

  it('clears the pending timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { rerender, unmount } = renderHook(({ loading }) => useMinimumLoading(loading), {
      initialProps: { loading: true },
    });

    rerender({ loading: false });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
