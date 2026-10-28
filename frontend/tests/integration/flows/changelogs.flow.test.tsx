import { describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeChangelog } from '@tests/fixtures';
import { http, HttpResponse } from 'msw';
import * as changelogEndpoints from '@/assets/endpoints/api/changelogsEndpoints';
import { apiUrl, server, withChangelogs } from '@tests/mocks';

const older = makeChangelog({
  id: 1,
  date: '2026-05-01',
  title: 'Ältere Änderung',
  content: '# Ältere Änderung',
});

const newest = makeChangelog({
  id: 2,
  date: '2026-08-01',
  title: 'Neuste Änderung',
  content: '# Neuste Änderung',
});

// The announcement dialog is suppressed here so it does not cover the list.
const openChangelogs = async (entries = [older, newest]) => {
  server.use(...withChangelogs(entries));
  const view = renderRoute('/aenderungen/', {
    preloadedState: signedInState({
      ui: { changelogs: { deactivatedIds: entries.map((entry) => entry.id) } },
    }),
  });
  await screen.findByText('✨ Neuste Änderungen');
  return view;
};

describe('changelog list', () => {
  it('lists the entries the backend returns', async () => {
    await openChangelogs();

    expect(await screen.findAllByText(/Ältere Änderung/)).not.toHaveLength(0);
    expect(screen.getAllByText(/Neuste Änderung/)).not.toHaveLength(0);
  });

  // The announcement load fetches only undismissed entries; answering last must not shrink the list.
  it('keeps the newest entry when the announcement load answers last', async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => { release = resolve; });
    server.use(
      http.post(apiUrl(changelogEndpoints.getChangelogsByIdsUrl()), async ({ request }) => {
        const { ids } = (await request.json()) as { ids: number[] };
        if (!ids.includes(newest.id)) await held;
        return HttpResponse.json([older, newest].filter((entry) => ids.includes(entry.id)));
      }),
      ...withChangelogs([older, newest]),
    );
    const { store } = renderRoute('/aenderungen/', {
      preloadedState: signedInState({ ui: { changelogs: { deactivatedIds: [newest.id] } } }),
    });

    expect(await screen.findByText(/- Neuste Änderung$/)).toBeInTheDocument();
    const before = store.getState().entities.changelogs.changelogs;
    release();
    await waitFor(() => expect(store.getState().entities.changelogs.changelogs).not.toBe(before));

    expect(screen.getByText(/- Neuste Änderung$/)).toBeInTheDocument();
    expect(screen.getByText(/- Ältere Änderung$/)).toBeInTheDocument();
  });

  it('says so when there is nothing to report', async () => {
    await openChangelogs([]);

    expect(await screen.findByText('Keine Änderungen vorhanden')).toBeInTheDocument();
  });
});

describe('changelog pagination', () => {
  const entries = Array.from({ length: 11 }, (_, i) =>
    makeChangelog({
      id: i + 1,
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      title: `Eintrag ${i + 1}`,
    }),
  );

  const recordRequestedIds = () => {
    const requested: number[][] = [];
    server.use(
      http.post(apiUrl(changelogEndpoints.getChangelogsByIdsUrl()), async ({ request }) => {
        const { ids } = (await request.json()) as { ids: number[] };
        requested.push(ids);
        return HttpResponse.json(entries.filter((entry) => ids.includes(entry.id)));
      }),
      ...withChangelogs(entries),
    );
    return requested;
  };

  it('shows the newest page and loads only its content', async () => {
    const requested = recordRequestedIds();
    renderRoute('/aenderungen/', {
      preloadedState: signedInState({
        ui: { changelogs: { deactivatedIds: entries.map((entry) => entry.id) } },
      }),
    });

    expect(await screen.findByText(/- Eintrag 11$/)).toBeInTheDocument();
    expect(screen.getByText(/- Eintrag 2$/)).toBeInTheDocument();
    expect(screen.queryByText(/- Eintrag 1$/)).not.toBeInTheDocument();
    expect(screen.getByText('11 Änderungen')).toBeInTheDocument();
    expect(requested).not.toHaveLength(0);
    expect(requested.flat()).not.toContain(1);
  });

  it('loads the next page on demand', async () => {
    const requested = recordRequestedIds();
    const { user } = renderRoute('/aenderungen/', {
      preloadedState: signedInState({
        ui: { changelogs: { deactivatedIds: entries.map((entry) => entry.id) } },
      }),
    });
    await screen.findByText(/- Eintrag 11$/);

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(await screen.findByText(/- Eintrag 1$/)).toBeInTheDocument();
    expect(screen.queryByText(/- Eintrag 11$/)).not.toBeInTheDocument();
    expect(requested[requested.length - 1]).toEqual([1]);
  });

  it('hides the page control when everything fits on one page', async () => {
    await openChangelogs();

    await screen.findByText('2 Änderungen');
    expect(screen.queryByRole('navigation', { name: 'pagination navigation' })).not.toBeInTheDocument();
  });
});

describe('new changelog dialog', () => {
  it('announces the newest entry after signing in', async () => {
    server.use(...withChangelogs([older, newest]));
    renderRoute('/dashboard/', { preloadedState: signedInState() });

    expect(
      await screen.findByText('✨ Neue Änderungen während deiner Abwesenheit'),
    ).toBeInTheDocument();
  });

  it('remembers a dismissed entry so it does not come back', async () => {
    server.use(...withChangelogs([older, newest]));
    const { user, store } = renderRoute('/dashboard/', { preloadedState: signedInState() });

    await screen.findByText('✨ Neue Änderungen während deiner Abwesenheit');
    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    await waitFor(() =>
      expect(store.getState().ui.changelogs.deactivatedIds).toContain(newest.id),
    );
  });

  // Only the newest entry is ever announced; older unseen ones stay in the list.
  it('stays away once the newest entry has been dismissed', async () => {
    server.use(...withChangelogs([older, newest]));
    renderRoute('/dashboard/', {
      preloadedState: signedInState({ ui: { changelogs: { deactivatedIds: [newest.id] } } }),
    });

    await screen.findByText(/Hi, /);
    expect(
      screen.queryByText('✨ Neue Änderungen während deiner Abwesenheit'),
    ).not.toBeInTheDocument();
  });

  it('closes after the dismissal', async () => {
    server.use(...withChangelogs([older, newest]));
    const { user } = renderRoute('/dashboard/', { preloadedState: signedInState() });

    await screen.findByText('✨ Neue Änderungen während deiner Abwesenheit');
    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    await waitFor(() =>
      expect(
        screen.queryByText('✨ Neue Änderungen während deiner Abwesenheit'),
      ).not.toBeInTheDocument(),
    );
  });

  it('announces an entry published while the app was in the background', async () => {
    server.use(...withChangelogs([older]));
    renderRoute('/dashboard/', {
      preloadedState: signedInState({ ui: { changelogs: { deactivatedIds: [older.id] } } }),
    });
    await screen.findByText(/Hi, /);

    server.use(...withChangelogs([older, newest]));
    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(
      await screen.findByText('✨ Neue Änderungen während deiner Abwesenheit'),
    ).toBeInTheDocument();
  });

  it('stays away when everything has been seen', async () => {
    server.use(...withChangelogs([older, newest]));
    renderRoute('/dashboard/', {
      preloadedState: signedInState({ ui: { changelogs: { deactivatedIds: [older.id, newest.id] } } }),
    });

    await screen.findByText(/Hi, /);
    expect(
      screen.queryByText('✨ Neue Änderungen während deiner Abwesenheit'),
    ).not.toBeInTheDocument();
  });
});
