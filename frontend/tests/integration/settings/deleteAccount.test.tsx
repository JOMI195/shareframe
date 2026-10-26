import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { useLocation } from 'react-router';
import Delete from '@/main/settings/user/delete/delete';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const Path = () => <output aria-label="path">{useLocation().pathname}</output>;

const render = () =>
  renderWithProviders(
    <>
      <Delete />
      <Path />
    </>,
    { preloadedState: signedInState(), route: '/settings/user/' },
  );

const recordDelete = (response = () => new HttpResponse(null, { status: 204 })) => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    mswHttp.delete(apiUrl(authEndpoints.getMyUserDataUrl()), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return response();
    }),
  );
  return bodies;
};

const enterPassword = async (user: ReturnType<typeof render>['user'], password = 'geheim123') => {
  await user.click(screen.getByRole('button', { name: 'Mein Konto löschen' }));
  if (password) await user.type(screen.getByLabelText('Passwort'), password);
  await user.click(screen.getByRole('button', { name: 'Konto löschen' }));
};

const confirmDialog = () => screen.queryByRole('dialog', { name: 'Konto endgültig löschen?' });

// Deleting the account is irreversible, so every step before the request matters.
describe('delete account', () => {
  it('shows no password field until asked', () => {
    render();

    expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument();
  });

  it('explains why the password is needed', async () => {
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Mein Konto löschen' }));

    expect(screen.getByText('Bitte gib zur Bestätigung dein Passwort ein.')).toBeVisible();
  });

  it('needs the password before it asks for confirmation', async () => {
    const bodies = recordDelete();
    const { user } = render();

    await enterPassword(user, '');

    expect(await screen.findByText('Dieses Feld wird benötigt')).toBeInTheDocument();
    expect(confirmDialog()).not.toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('asks for a final confirmation before sending anything', async () => {
    const bodies = recordDelete();
    const { user } = render();

    await enterPassword(user);

    expect(await screen.findByRole('dialog', { name: 'Konto endgültig löschen?' })).toBeVisible();
    expect(bodies).toHaveLength(0);
  });

  it('sends only the password and signs the user out', async () => {
    const bodies = recordDelete();
    const { user, store } = render();

    await enterPassword(user);
    await user.click(await screen.findByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ password: 'geheim123' });
    await waitFor(() => expect(screen.getByLabelText('path')).toHaveTextContent(/^\/$/));
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(store.getState().auth.user.me.id).toBe(0);
  });

  it('stays signed in on the page when the password is wrong', async () => {
    recordDelete(() => HttpResponse.json({ current_password: ['Ungültiges Passwort.'] }, { status: 400 }));
    const { user, store } = render();
    const id = store.getState().auth.user.me.id;

    await enterPassword(user);
    await user.click(await screen.findByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(confirmDialog()).not.toBeInTheDocument());
    expect(screen.getByLabelText('path')).toHaveTextContent('/settings/user/');
    expect(store.getState().auth.user.me.id).toBe(id);
    expect(screen.getByLabelText('Passwort')).toHaveValue('');
  });

  it('keeps the account when the confirmation is cancelled', async () => {
    const bodies = recordDelete();
    const { user } = render();

    await enterPassword(user);
    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => expect(confirmDialog()).not.toBeInTheDocument());
    expect(bodies).toHaveLength(0);
  });

  it('closes the password field on cancel', async () => {
    const { user } = render();
    await user.click(screen.getByRole('button', { name: 'Mein Konto löschen' }));

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument();
  });
});
