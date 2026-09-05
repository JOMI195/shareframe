import { describe, expect, it } from 'vitest';
import migration8 from '@/store/migrations/migration8';
import { rootState } from '@tests/helpers/preloadedState';

describe('migration8', () => {
  it('adds the images sending flag', () => {
    expect(migration8(rootState()).entities.images.api.sending).toBe(false);
  });

  it('keeps the existing loading flag', () => {
    const before = rootState();
    before.entities.images.api.loading = true;

    expect(migration8(before).entities.images.api.loading).toBe(true);
  });
});
