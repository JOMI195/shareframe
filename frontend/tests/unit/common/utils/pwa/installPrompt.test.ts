import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSnapshot, initInstallPrompt, isIos, promptInstall } from '@/common/utils/pwa/installPrompt';
import { fireBeforeInstallPrompt, IPHONE_UA, restoreNavigator, stubNavigator } from '@tests/helpers/installPrompt';

beforeEach(() => initInstallPrompt());
afterEach(() => restoreNavigator());

describe('beforeinstallprompt', () => {
  it('suppresses the browser banner and keeps the event', () => {
    const event = fireBeforeInstallPrompt();

    expect(event.defaultPrevented).toBe(true);
    expect(getSnapshot().deferred).toBe(event);
  });
});

describe('promptInstall', () => {
  it('reports unavailable without a deferred event', async () => {
    expect(await promptInstall()).toBe('unavailable');
  });

  it('prompts once and returns the outcome', async () => {
    const event = fireBeforeInstallPrompt('dismissed');

    expect(await promptInstall()).toBe('dismissed');
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(getSnapshot().deferred).toBeNull();
  });
});

describe('installed', () => {
  it('flips on appinstalled and drops the deferred event', () => {
    fireBeforeInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));

    expect(getSnapshot()).toEqual({ deferred: null, installed: true });
  });

  it('starts installed when running standalone', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValueOnce({ matches: true } as MediaQueryList);
    initInstallPrompt();

    expect(getSnapshot().installed).toBe(true);
  });
});

describe('isIos', () => {
  it('detects an iPhone', () => {
    stubNavigator({ userAgent: IPHONE_UA });
    expect(isIos()).toBe(true);
  });

  it('detects an iPad posing as a Mac', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 });
    expect(isIos()).toBe(true);
  });

  it('ignores a desktop Mac', () => {
    stubNavigator({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 });
    expect(isIos()).toBe(false);
  });
});
