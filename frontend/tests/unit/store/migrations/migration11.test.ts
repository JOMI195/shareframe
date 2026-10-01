import { describe, expect, it } from 'vitest';
import migration11 from '@/store/migrations/migration11';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration11', () => {
  it('adds the install prompt flag', () => {
    expect(migration11(rootState()).ui.settings.pwa.installPromptDismissed).toBe(false);
  });

  it('keeps the existing settings', () => {
    const before = rootState();
    before.ui.settings.design.colorTheme = 'dark';

    expect(migration11(before).ui.settings.design.colorTheme).toBe('dark');
  });
});
