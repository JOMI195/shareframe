import { describe, expect, it } from 'vitest';
import migration10 from '@/store/migrations/migration10';
import { rootState } from '@tests/helpers/preloadedState';

const persisted = () => ({ ...rootState(), _persist: { version: 9, rehydrated: true } });

describe('migration10', () => {
  it('passes undefined state through', () => {
    expect(migration10(undefined)).toBeUndefined();
  });

  // The only destructive migration: auth and entities stop being persisted.
  it('drops the auth and entities roots', () => {
    const after = migration10(persisted() as never) as unknown as Record<string, unknown>;

    expect(after).not.toHaveProperty('auth');
    expect(after).not.toHaveProperty('entities');
  });

  it('keeps ui and the persist metadata', () => {
    const before = persisted();
    before.ui.settings.design.colorTheme = 'dark';

    const after = migration10(before as never) as unknown as {
      ui: { settings: { design: { colorTheme: string } } };
      _persist: { version: number };
    };

    expect(after.ui.settings.design.colorTheme).toBe('dark');
    expect(after._persist.version).toBe(9);
  });

  it('does not mutate the input', () => {
    const before = persisted();
    migration10(before as never);

    expect(before).toHaveProperty('auth');
    expect(before).toHaveProperty('entities');
  });
});
