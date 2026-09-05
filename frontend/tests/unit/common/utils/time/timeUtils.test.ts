import { afterEach, describe, expect, it, vi } from 'vitest';
import { wait } from '@/common/utils/time/timeUtils';

afterEach(() => vi.useRealTimers());

describe('wait', () => {
  it('resolves only after the delay elapses', async () => {
    vi.useFakeTimers();
    const settled = vi.fn();
    wait(500).then(settled);

    await vi.advanceTimersByTimeAsync(499);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toHaveBeenCalledOnce();
  });
});
