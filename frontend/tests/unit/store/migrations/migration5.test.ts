import { describe, expect, it } from 'vitest';
import migration5 from '@/store/migrations/migration5';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage, makePage } from '@tests/fixtures';

describe('migration5', () => {
  it('resets the images page', () => {
    const before = rootState();
    before.entities.images.imagesPaginated = makePage([makeImage()], { count: 5, page: 3 });

    expect(migration5(before).entities.images.imagesPaginated.results).toEqual([]);
  });

  // Unlike migration4 it does not touch the page size.
  it('preserves an existing page size', () => {
    const before = rootState();
    before.entities.images.imagesPaginatedPageSize = 25;

    expect(migration5(before).entities.images.imagesPaginatedPageSize).toBe(25);
  });
});
