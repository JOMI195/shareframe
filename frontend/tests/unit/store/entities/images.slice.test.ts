import { afterEach, describe, expect, it, vi } from 'vitest';
import reducer, {
  createImageFailed,
  createImageFulfilled,
  createImagePending,
  deactivateSentImageFailed,
  deactivateSentImageFulfilled,
  deactivateSentImagePending,
  deleteImageFailed,
  deleteImageFulfilled,
  deleteImagePending,
  downloadImageFailed,
  downloadImageReceived,
  downloadImageRequested,
  getApiState,
  imagesPageSet,
  imagesPageSizeSet,
  imagesReceived,
  imagesRequestFailed,
  imagesRequested,
  sendImageToUserFrameFailed,
  sendImageToUserFrameFulfilled,
  sendImageToUserFramePending,
  sentImagesFiltersSet,
  sentImagesPageSet,
  sentImagesPageSizeSet,
  sentImagesReceived,
  sentImagesRequestFailed,
  sentImagesRequested,
} from '@/store/entities/images/images.slice';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage, makePage, makeSentImage } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

afterEach(() => vi.useRealTimers());

describe('images slice api flags', () => {
  it.each([
    ['imagesRequested', imagesRequested, { loading: true, sending: false }],
    ['sentImagesRequested', sentImagesRequested, { loading: true, sending: false }],
    ['deactivateSentImagePending', deactivateSentImagePending, { loading: true, sending: false }],
    ['createImagePending', createImagePending, { loading: false, sending: true }],
    ['deleteImagePending', deleteImagePending, { loading: false, sending: true }],
    ['sendImageToUserFramePending', sendImageToUserFramePending, { loading: false, sending: true }],
  ])('%s sets the right flag', (_name, action, expected) => {
    expect(reducer(initial(), action()).api).toMatchObject(expected);
  });

  // resetApiState clears BOTH flags, so a failing upload also clears a concurrent fetch.
  it.each([
    ['imagesRequestFailed', imagesRequestFailed],
    ['sentImagesRequestFailed', sentImagesRequestFailed],
    ['createImageFailed', createImageFailed],
    ['deleteImageFailed', deleteImageFailed],
    ['sendImageToUserFrameFailed', sendImageToUserFrameFailed],
    ['sendImageToUserFrameFulfilled', sendImageToUserFrameFulfilled],
    ['deactivateSentImageFailed', deactivateSentImageFailed],
  ])('%s clears loading and sending', (_name, action) => {
    const busy = { ...initial(), api: { loading: true, sending: true, lastFetch: null } };
    expect(reducer(busy, action()).api).toMatchObject({ loading: false, sending: false });
  });

  it('leaves state untouched for the download actions', () => {
    const before = initial();
    [downloadImageRequested, downloadImageReceived, downloadImageFailed].forEach((action) => {
      expect(reducer(before, action())).toEqual(before);
    });
  });
});

describe('getApiState', () => {
  it('is true while either flag is set', () => {
    const state = rootState();
    expect(getApiState(state)).toBe(false);

    state.entities.images.api.sending = true;
    expect(getApiState(state)).toBe(true);

    state.entities.images.api = { loading: true, sending: false, lastFetch: null };
    expect(getApiState(state)).toBe(true);
  });
});

describe('imagesReceived', () => {
  // The server response has no notion of the client's current page.
  it('keeps the locally selected page', () => {
    const onPageThree = reducer(initial(), imagesPageSet(3));
    const state = reducer(onPageThree, imagesReceived(makePage([makeImage()], { count: 42, page: 1 })));

    expect(state.imagesPaginated.page).toBe(3);
    expect(state.imagesPaginated.count).toBe(42);
    expect(state.imagesPaginated.results).toHaveLength(1);
  });

  it('stamps lastFetch', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const state = reducer(initial(), imagesReceived(makePage([])));
    expect(state.api.lastFetch).toBe(Date.parse('2026-01-01T00:00:00Z'));
  });
});

describe('sentImagesReceived', () => {
  it('keeps the locally selected page', () => {
    const onPageTwo = reducer(initial(), sentImagesPageSet(2));
    const state = reducer(onPageTwo, sentImagesReceived(makePage([makeSentImage()], { page: 1 })));

    expect(state.sentImagesPaginated.page).toBe(2);
  });
});

describe('page size', () => {
  it('is set independently per list', () => {
    let state = reducer(initial(), imagesPageSizeSet(25));
    state = reducer(state, sentImagesPageSizeSet(50));

    expect(state.imagesPaginatedPageSize).toBe(25);
    expect(state.sentImagesPaginatedPageSize).toBe(50);
  });
});

describe('createImageFulfilled', () => {
  it('prepends the image and bumps the count', () => {
    const existing = makeImage({ id: 1, created_at: '2026-01-01T00:00:00Z' });
    const base = { ...initial(), imagesPaginated: makePage([existing], { count: 1 }) };

    const state = reducer(base, createImageFulfilled(makeImage({ id: 2, created_at: '2026-02-01T00:00:00Z' })));

    expect(state.imagesPaginated.results.map((i) => i.id)).toEqual([2, 1]);
    expect(state.imagesPaginated.count).toBe(2);
  });
});

describe('deleteImageFulfilled', () => {
  const a = makeImage({ id: 1, created_at: '2026-01-01T00:00:00Z' });
  const b = makeImage({ id: 2, created_at: '2026-02-01T00:00:00Z' });
  const base = () => ({ ...initial(), imagesPaginated: makePage([a, b], { count: 2 }) });

  it('removes the image matching created_at and decrements the count', () => {
    const state = reducer(base(), deleteImageFulfilled(a));

    expect(state.imagesPaginated.results.map((i) => i.id)).toEqual([2]);
    expect(state.imagesPaginated.count).toBe(1);
  });

  it('keeps the page and the count untouched when nothing matches', () => {
    const state = reducer(base(), deleteImageFulfilled(makeImage({ id: 9, created_at: '2099-01-01T00:00:00Z' })));

    expect(state.imagesPaginated.results.map((i) => i.id)).toEqual([1, 2]);
    expect(state.imagesPaginated.count).toBe(2);
  });
});

describe('deactivateSentImageFulfilled', () => {
  const sent = makeSentImage({ id: 1, sent_at: '2026-01-01T00:00:00Z' });
  const base = () => ({ ...initial(), sentImagesPaginated: makePage([sent]) });

  it('replaces the entry matching sent_at', () => {
    const updated = makeSentImage({ id: 1, sent_at: sent.sent_at, expires_at: '2026-01-01T00:00:00Z' });

    const state = reducer(base(), deactivateSentImageFulfilled(updated));

    expect(state.sentImagesPaginated.results[0].expires_at).toBe('2026-01-01T00:00:00Z');
  });

  // This one DOES guard index !== -1, unlike the delete reducers above.
  it('leaves the list unchanged when nothing matches', () => {
    const state = reducer(base(), deactivateSentImageFulfilled(makeSentImage({ sent_at: '2099-01-01T00:00:00Z' })));

    expect(state.sentImagesPaginated.results).toEqual([sent]);
  });
});

describe('sentImagesFiltersSet', () => {
  it('merges partially into the existing filters', () => {
    const withSender = reducer(initial(), sentImagesFiltersSet({ sender: 'alice' }));
    const state = reducer(withSender, sentImagesFiltersSet({ status: 'active' }));

    expect(state.sentImagesFilters).toEqual({
      status: 'active',
      shipping: 'all',
      sender: 'alice',
      receiver: '',
    });
  });
});
