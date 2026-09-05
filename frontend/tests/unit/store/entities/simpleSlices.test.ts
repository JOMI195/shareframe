import { afterEach, describe, expect, it, vi } from 'vitest';
import appReducer, {
  versionRequestedFailed,
  versionRequestedFulfilled,
  versionRequestedPending,
} from '@/store/entities/app/app.slice';
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

describe('app slice', () => {
  const initial = () => appReducer(undefined, { type: '@@init' });

  it('stores the version', () => {
    const pending = appReducer(initial(), versionRequestedPending());
    expect(pending.api.loading).toBe(true);

    const state = appReducer(pending, versionRequestedFulfilled({ version: '2026-01-01-abc' }));
    expect(state.version).toBe('2026-01-01-abc');
    expect(state.api.loading).toBe(false);
  });

  it('clears loading on failure without touching the version', () => {
    const state = appReducer({ ...initial(), version: 'old' }, versionRequestedFailed());
    expect(state.version).toBe('old');
    expect(state.api.loading).toBe(false);
  });

  // The reducer reads action.payload.version unconditionally.
  it('throws when the payload has no version', () => {
    expect(() => appReducer(initial(), versionRequestedFulfilled(undefined))).toThrow();
  });
});

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

  it('replaces both lists', () => {
    const ids = [makeChangelogId({ id: 1 }), makeChangelogId({ id: 2 })];
    const logs = [makeChangelog({ id: 1 })];

    const state = changelogsReducer(changelogsReducer(initial(), changelogIdsReceived(ids)), changelogsReceived(logs));

    expect(state.changelogIds).toEqual(ids);
    expect(state.changelogs).toEqual(logs);
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
