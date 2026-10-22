import { describe, expect, it } from 'vitest';
import migration13 from '@/store/migrations/migration13';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration13', () => {
  it('turns seasonal themes on', () => {
    const before = rootState();
    delete (before.ui.settings.design as Partial<typeof before.ui.settings.design>).seasonalThemes;

    expect(migration13(before).ui.settings.design.seasonalThemes).toBe(true);
  });

  it('keeps the color theme', () => {
    const before = rootState();
    before.ui.settings.design.colorTheme = 'dark';

    expect(migration13(before).ui.settings.design.colorTheme).toBe('dark');
  });
});
