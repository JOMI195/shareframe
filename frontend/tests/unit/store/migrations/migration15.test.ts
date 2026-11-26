import { describe, expect, it } from 'vitest';
import migration15 from '@/store/migrations/migration15';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration15', () => {
  it('starts uploads with auto-delete on, as before', () => {
    const before = rootState();
    delete (before.ui.settings as Partial<typeof before.ui.settings>).upload;

    expect(migration15(before).ui.settings.upload.autoDelete).toBe(true);
  });

  it('keeps the other settings', () => {
    const before = rootState();
    before.ui.settings.design.colorTheme = 'dark';

    expect(migration15(before).ui.settings.design.colorTheme).toBe('dark');
  });
});
