import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDelayedLoading } from '@/hooks/loading/useDelayedLoading';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDelayedLoading', () => {
  it('stays false until loading has lasted the delay', () => {
    const { result } = renderHook(() => useDelayedLoading(true));

    act(() => vi.advanceTimersByTime(599));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('never turns true for a request faster than the delay', () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => vi.advanceTimersByTime(300));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(false);
  });

  it('turns false as soon as loading ends', () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => vi.advanceTimersByTime(1000));
    rerender({ loading: false });

    expect(result.current).toBe(false);
  });

  it('restarts the delay when loading toggles back on', () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => vi.advanceTimersByTime(1000));
    rerender({ loading: false });
    rerender({ loading: true });
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(600));
    expect(result.current).toBe(true);
  });

  it('honours a custom delay', () => {
    const { result } = renderHook(() => useDelayedLoading(true, 50));

    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe(true);
  });
});
