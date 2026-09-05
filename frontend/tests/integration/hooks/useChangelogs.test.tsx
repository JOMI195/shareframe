import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HttpResponse, http as mswHttp } from 'msw';
import { useChangelogs } from '@/hooks/changelogs/useChangelogs';
import { getChangelogIdsUrl, getChangelogsByIdsUrl } from '@/assets/endpoints/api/changelogsEndpoints';
import { createWrapper } from '@tests/helpers/renderWithProviders';
import { makeChangelog, makeChangelogId } from '@tests/fixtures';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const ids = [
  makeChangelogId({ id: 1, date: '2026-01-01' }),
  makeChangelogId({ id: 2, date: '2026-03-01' }),
  makeChangelogId({ id: 3, date: '2026-02-01' }),
];

const setup = (deactivatedIds: number[] = [], changelogs = ids.map((id) => makeChangelog({ id: id.id }))) => {
  const { store, Wrapper } = createWrapper({
    preloadedState: {
      entities: { changelogs: { changelogIds: ids, changelogs } },
      ui: { changelogs: { deactivatedIds } },
    },
  });

  return { store, ...renderHook(() => useChangelogs(), { wrapper: Wrapper }) };
};

describe('useChangelogs loading', () => {
  it('is true while either request is in flight', () => {
    const { Wrapper } = createWrapper({
      preloadedState: { entities: { changelogs: { api: { idsLoading: true } } } },
    });

    expect(renderHook(() => useChangelogs(), { wrapper: Wrapper }).result.current.isLoading).toBe(true);
  });

  it('is false when nothing is loading', () => {
    expect(setup().result.current.isLoading).toBe(false);
  });
});

describe('getNewestActiveChangelog', () => {
  it('returns the newest entry by date, not by id', () => {
    expect(setup().result.current.getNewestActiveChangelog()?.id).toBe(2);
  });

  // It deliberately does NOT fall through to the second-newest.
  it('returns null when the newest one is dismissed', () => {
    expect(setup([2]).result.current.getNewestActiveChangelog()).toBeNull();
  });

  it('returns null when the content for the newest id is not loaded', () => {
    expect(setup([], [makeChangelog({ id: 1 })]).result.current.getNewestActiveChangelog()).toBeNull();
  });

  it('returns null when there are no changelogs at all', () => {
    const { Wrapper } = createWrapper();
    expect(renderHook(() => useChangelogs(), { wrapper: Wrapper }).result.current.getNewestActiveChangelog()).toBeNull();
  });
});

describe('dismissals', () => {
  it('toggles a changelog both ways', () => {
    const { result, store } = setup();

    act(() => result.current.toggleChangelogActive(1));
    expect(store.getState().ui.changelogs.deactivatedIds).toEqual([1]);

    act(() => result.current.toggleChangelogActive(1));
    expect(store.getState().ui.changelogs.deactivatedIds).toEqual([]);
  });

  // deactivate is idempotent where toggle is not.
  it('does not re-toggle an already dismissed changelog', () => {
    const { result, store } = setup([1]);

    act(() => result.current.deactivateChangelog(1));

    expect(store.getState().ui.changelogs.deactivatedIds).toEqual([1]);
  });

  it('reports whether a changelog is dismissed', () => {
    const { result } = setup([2]);

    expect(result.current.isChangelogDeactivated(2)).toBe(true);
    expect(result.current.isChangelogDeactivated(1)).toBe(false);
  });
});

describe('cleanUpdDeactivatedIds', () => {
  it('drops dismissals the server no longer knows about', () => {
    const { result, store } = setup([2, 99]);

    act(() => result.current.cleanUpdDeactivatedIds());

    expect(store.getState().ui.changelogs.deactivatedIds).toEqual([2]);
  });

  // Callers fire this on mount, before the ids arrive; clearing then would drop everything.
  it('no-ops while the id list is still empty', () => {
    const { store, Wrapper } = createWrapper({
      preloadedState: { ui: { changelogs: { deactivatedIds: [1, 2] } } },
    });
    const { result } = renderHook(() => useChangelogs(), { wrapper: Wrapper });

    act(() => result.current.cleanUpdDeactivatedIds());

    expect(store.getState().ui.changelogs.deactivatedIds).toEqual([1, 2]);
  });
});

describe('loading actions', () => {
  it('fetches the id list', async () => {
    const requests = vi.fn();
    server.use(
      mswHttp.get(apiUrl(getChangelogIdsUrl()), () => {
        requests();
        return HttpResponse.json(ids);
      }),
    );

    const { result, store } = setup();
    act(() => result.current.loadChangelogIds());

    await waitFor(() => expect(requests).toHaveBeenCalledOnce());
    expect(store.getState().entities.changelogs.changelogIds).toHaveLength(3);
  });

  it('requests only the active ids', async () => {
    const body = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getChangelogsByIdsUrl()), async ({ request }) => {
        body(await request.json());
        return HttpResponse.json([]);
      }),
    );

    const { result } = setup([2]);
    act(() => result.current.loadChangelogs());

    await waitFor(() => expect(body).toHaveBeenCalledWith({ ids: [1, 3] }));
  });

  it('requests every id when loading all', async () => {
    const body = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getChangelogsByIdsUrl()), async ({ request }) => {
        body(await request.json());
        return HttpResponse.json([]);
      }),
    );

    const { result } = setup([2]);
    act(() => result.current.loadAllChangelogs());

    await waitFor(() => expect(body).toHaveBeenCalledWith({ ids: [1, 2, 3] }));
  });
});
