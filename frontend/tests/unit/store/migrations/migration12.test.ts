import { describe, expect, it } from 'vitest';
import migration12 from '@/store/migrations/migration12';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration12', () => {
  it('adds the push prompt flag', () => {
    expect(migration12(rootState()).ui.settings.pwa.pushPromptDismissed).toBe(false);
  });

  it('keeps the install prompt flag', () => {
    const before = rootState();
    before.ui.settings.pwa.installPromptDismissed = true;

    expect(migration12(before).ui.settings.pwa.installPromptDismissed).toBe(true);
  });
});
