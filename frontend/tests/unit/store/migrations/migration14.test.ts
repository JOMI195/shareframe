import { describe, expect, it } from 'vitest';
import migration14 from '@/store/migrations/migration14';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration14', () => {
  it('drops the old bottom navigation state', () => {
    const before = rootState();
    Object.assign(before.ui.settings, { navigation: { bottomNavigation: { open: true } } });

    expect(migration14(before).ui.settings).not.toHaveProperty('navigation');
  });

  it('keeps the other settings', () => {
    const before = rootState();
    before.ui.settings.design.colorTheme = 'dark';

    expect(migration14(before).ui.settings.design.colorTheme).toBe('dark');
  });
});
