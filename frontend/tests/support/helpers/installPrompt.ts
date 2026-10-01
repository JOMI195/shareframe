import { act } from '@testing-library/react';
import { vi } from 'vitest';

// jsdom has no beforeinstallprompt; this builds the Chromium shape the app relies on.
export const fireBeforeInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
};

const stubbedKeys: string[] = [];

export const stubNavigator = (values: { userAgent?: string; platform?: string; maxTouchPoints?: number }) => {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { value, configurable: true });
    stubbedKeys.push(key);
  }
};

export const restoreNavigator = () => {
  for (const key of stubbedKeys.splice(0)) {
    delete (navigator as unknown as Record<string, unknown>)[key];
  }
};

export const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
