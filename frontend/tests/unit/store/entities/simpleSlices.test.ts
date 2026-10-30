import { afterEach, describe, expect, it, vi } from 'vitest';
import contactReducer, {
  contactEmailSendingFailed,
  contactEmailSendingFulfilled,
  contactEmailSendingPending,
} from '@/store/entities/contact/contact.slice';
import dashboardReducer, {
  dashboardStatsReceived,
  dashboardStatsRequestFailed,
  dashboardStatsRequested,
} from '@/store/entities/dashboard/dashboard.slice';
import changelogsReducer, {
  changelogIdsReceived,
  changelogIdsRequestFailed,
  changelogIdsRequested,
  changelogsReceived,
  changelogsRequestFailed,
  changelogsRequested,
} from '@/store/entities/changelogs/changelogs.slice';
import { makeChangelog, makeChangelogId } from '@tests/fixtures';

afterEach(() => vi.useRealTimers());

describe('contact slice', () => {
  const initial = () => contactReducer(undefined, { type: '@@init' });

  it('tracks the send lifecycle', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const pending = contactReducer(initial(), contactEmailSendingPending());
    expect(pending.api.loading).toBe(true);

    const done = contactReducer(pending, contactEmailSendingFulfilled());
    expect(done.api).toEqual({ loading: false, lastFetch: Date.parse('2026-01-01T00:00:00Z') });

    expect(contactReducer(pending, contactEmailSendingFailed()).api.loading).toBe(false);
  });
});

describe('dashboard slice', () => {
  const initial = () => dashboardReducer(undefined, { type: '@@init' });
  const data = { images: { uploaded_images_by_me_count: 3 } } as never;

  it('stores the stats payload', () => {
    const state = dashboardReducer(dashboardReducer(initial(), dashboardStatsRequested()), dashboardStatsReceived(data));

    expect(state.dashboardData).toEqual(data);
    expect(state.api.loading).toBe(false);
  });

  it('keeps stale data on failure', () => {
    const loaded = dashboardReducer(initial(), dashboardStatsReceived(data));
    expect(dashboardReducer(loaded, dashboardStatsRequestFailed()).dashboardData).toEqual(data);
  });
});

describe('changelogs entity slice', () => {
  const initial = () => changelogsReducer(undefined, { type: '@@init' });

  // Two independent flags: the id list and the content load are separate requests.
  it('tracks idsLoading and loading separately', () => {
    const both = changelogsReducer(
      changelogsReducer(initial(), changelogIdsRequested()),
      changelogsRequested(),
    );
    expect(both.api).toMatchObject({ idsLoading: true, loading: true });

    const idsDone = changelogsReducer(both, changelogIdsReceived([makeChangelogId()]));
    expect(idsDone.api).toMatchObject({ idsLoading: false, loading: true });

    const allDone = changelogsReducer(idsDone, changelogsReceived([makeChangelog()]));
    expect(allDone.api).toMatchObject({ idsLoading: false, loading: false });
  });

  it('replaces the id list', () => {
    const ids = [makeChangelogId({ id: 1 }), makeChangelogId({ id: 2 })];

    expect(changelogsReducer(initial(), changelogIdsReceived(ids)).changelogIds).toEqual(ids);
  });

  // Effects key on the id list; a fresh but equal array would refetch on every poll.
  it('keeps the id list reference when nothing changed', () => {
    const ids = [makeChangelogId({ id: 1 }), makeChangelogId({ id: 2 })];
    const first = changelogsReducer(initial(), changelogIdsReceived(ids));

    const second = changelogsReducer(first, changelogIdsReceived(ids.map((id) => ({ ...id }))));

    expect(second.changelogIds).toBe(first.changelogIds);
    expect(second.api.idsLastFetch).not.toBeNull();
  });

  it('takes a changed id list', () => {
    const first = changelogsReducer(initial(), changelogIdsReceived([makeChangelogId({ id: 1, title: 'alt' })]));

    const changed = [makeChangelogId({ id: 1, title: 'neu' })];
    expect(changelogsReducer(first, changelogIdsReceived(changed)).changelogIds).toEqual(changed);
  });

  it('merges received content by id', () => {
    const stale = makeChangelog({ id: 1, title: 'alt' });
    const fresh = makeChangelog({ id: 1, title: 'neu' });
    const other = makeChangelog({ id: 2 });

    const state = [changelogsReceived([stale, other]), changelogsReceived([fresh])].reduce(
      changelogsReducer,
      initial(),
    );

    expect(state.changelogs).toHaveLength(2);
    expect(state.changelogs).toEqual(expect.arrayContaining([fresh, other]));
  });

  it('drops content whose id is no longer listed', () => {
    const loaded = changelogsReducer(
      initial(),
      changelogsReceived([makeChangelog({ id: 1 }), makeChangelog({ id: 2 })]),
    );

    const state = changelogsReducer(loaded, changelogIdsReceived([makeChangelogId({ id: 2 })]));

    expect(state.changelogs.map((log) => log.id)).toEqual([2]);
  });

  it('clears only the matching flag on failure', () => {
    const loading = changelogsReducer(
      changelogsReducer(initial(), changelogIdsRequested()),
      changelogsRequested(),
    );

    expect(changelogsReducer(loading, changelogIdsRequestFailed()).api).toMatchObject({
      idsLoading: false,
      loading: true,
    });
    expect(changelogsReducer(loading, changelogsRequestFailed()).api).toMatchObject({
      idsLoading: true,
      loading: false,
    });
  });
});
