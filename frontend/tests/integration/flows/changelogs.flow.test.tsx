import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeChangelog } from '@tests/fixtures';
import { server, withChangelogs } from '@tests/mocks';

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

  it('says so when there is nothing to report', async () => {
    await openChangelogs([]);

    expect(await screen.findByText('Keine Änderungen vorhanden')).toBeInTheDocument();
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
