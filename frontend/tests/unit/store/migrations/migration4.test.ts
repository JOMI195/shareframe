import { describe, expect, it } from 'vitest';
import migration4 from '@/store/migrations/migration4';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage, makePage } from '@tests/fixtures';

describe('migration4', () => {
  it('resets the images page and adds a page size', () => {
    const before = rootState();
    before.entities.images.imagesPaginated = makePage([makeImage()], { count: 5, page: 3 });

    const after = migration4(before);

    expect(after.entities.images.imagesPaginated).toEqual({
      count: 0,
      next: null,
      previous: null,
      page: 1,
      results: [],
    });
    expect(after.entities.images.imagesPaginatedPageSize).toBe(10);
  });

  it('keeps the rest of the images entity', () => {
    const before = rootState();
    before.entities.images.api.loading = true;

    expect(migration4(before).entities.images.api.loading).toBe(true);
  });
});
