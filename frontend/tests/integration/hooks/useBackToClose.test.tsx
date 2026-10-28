import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBackToClose } from '@/hooks/navigation/useBackToClose';

const marker = () => (window.history.state as Record<string, unknown> | null)?.backToClose;

const back = async () => {
  await act(async () => {
    window.history.back();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
};

// An unmount in the previous test may still have a history traversal in flight.
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
});

describe('useBackToClose', () => {
  it('closes the overlay on back instead of leaving the page', async () => {
    const onClose = vi.fn();
    renderHook(() => useBackToClose(true, onClose));
    expect(marker()).toBeDefined();

    await back();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('removes its history entry when closed some other way', async () => {
    const { rerender } = renderHook(({ open }) => useBackToClose(open, vi.fn()), { initialProps: { open: true } });
    const own = marker();
    expect(own).toBeDefined();

    rerender({ open: false });

    await waitFor(() => expect(marker()).not.toBe(own));
  });

  // e.g. the upload dialog asking before it drops unsaved edits
  it('keeps catching back while the overlay stays open', async () => {
    const onClose = vi.fn();
    renderHook(() => useBackToClose(true, onClose));

    await back();
    expect(marker()).toBeDefined();
    await back();

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes only the top overlay when two are open', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    renderHook(() => useBackToClose(true, outer));
    const outerMarker = marker();
    const { rerender } = renderHook(({ open }) => useBackToClose(open, inner), { initialProps: { open: true } });

    await back();
    expect(inner).toHaveBeenCalledOnce();
    expect(outer).not.toHaveBeenCalled();

    rerender({ open: false });
    await waitFor(() => expect(marker()).toBe(outerMarker));
    await back();
    expect(outer).toHaveBeenCalledOnce();
  });
});
