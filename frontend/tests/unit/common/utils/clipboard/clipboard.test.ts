import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '@/common/utils/clipboard/clipboard';

const setSecureContext = (value: boolean) =>
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value });

const stubClipboard = (writeText: () => Promise<void>) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

const removeClipboard = () =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  removeClipboard();
  setSecureContext(false);
});

describe('copyToClipboard', () => {
  it('uses the async Clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setSecureContext(true);
    stubClipboard(writeText);

    await expect(copyToClipboard('hallo')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hallo');
  });

  it('falls back to execCommand outside a secure context', async () => {
    setSecureContext(false);
    removeClipboard();
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    await expect(copyToClipboard('hallo')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.body.querySelector('textarea')).toBeNull();
  });

  it('falls back when the Clipboard API rejects', async () => {
    setSecureContext(true);
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    await expect(copyToClipboard('hallo')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  // A MUI dialog traps focus; a textarea on document.body would lose its selection.
  it('mounts the textarea inside the active dialog subtree', async () => {
    setSecureContext(false);
    removeClipboard();

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    const input = document.createElement('input');
    dialog.appendChild(input);
    document.body.appendChild(dialog);
    input.focus();

    let host: Node | null = null;
    document.execCommand = vi.fn(() => {
      host = dialog.querySelector('textarea')?.parentElement ?? null;
      return true;
    });

    await copyToClipboard('hallo');
    expect(host).toBe(dialog);
  });

  it('returns the execCommand result', async () => {
    setSecureContext(false);
    removeClipboard();
    document.execCommand = vi.fn().mockReturnValue(false);

    await expect(copyToClipboard('hallo')).resolves.toBe(false);
  });

  it('returns false when the fallback throws', async () => {
    setSecureContext(false);
    removeClipboard();
    document.execCommand = vi.fn(() => {
      throw new Error('boom');
    });

    await expect(copyToClipboard('hallo')).resolves.toBe(false);
  });
});
