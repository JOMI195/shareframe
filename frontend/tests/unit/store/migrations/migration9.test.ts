import { describe, expect, it } from 'vitest';
import migration9 from '@/store/migrations/migration9';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage, makePage } from '@tests/fixtures';

describe('migration9', () => {
  it('adds the sent images page, page size and filters', () => {
    const after = migration9(rootState());

    expect(after.entities.images.sentImagesPaginated).toEqual({
      count: 0,
      next: null,
      previous: null,
      page: 1,
      results: [],
    });
    expect(after.entities.images.sentImagesPaginatedPageSize).toBe(10);
    expect(after.entities.images.sentImagesFilters).toEqual({
      status: 'all',
      shipping: 'all',
      sender: '',
      receiver: '',
    });
  });

  it('leaves the uploaded images page alone', () => {
    const before = rootState();
    before.entities.images.imagesPaginated = makePage([makeImage()], { count: 1 });

    expect(migration9(before).entities.images.imagesPaginated.results).toHaveLength(1);
  });
});
