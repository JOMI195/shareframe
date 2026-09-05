import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { buildState, signedInState } from '@tests/helpers/preloadedState';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const signInAs = async (
  user: ReturnType<typeof renderRoute>['user'],
  email = 'alice@example.com',
  password = 'geheim123',
) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Passwort'), password);
  await user.click(screen.getByRole('button', { name: 'anmelden' }));
};

// The mocked mirror of tests/e2e/auth.spec.ts, plus the cases that do not need
// a real backend to be meaningful.
describe('signing in', () => {
  it('lands on the dashboard and loads the profile', async () => {
    const { user, router, store } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await signInAs(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/'));
    await waitFor(() => expect(store.getState().auth.user.me.username).toBe('alice'));
    expect(localStorage.getItem('loggedIn')).toBe('true');
  });

  it('sends the credentials that were typed', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getTokenCreateUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ detail: 'Authenticated.' });
      }),
    );
    const { user } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await signInAs(user, 'bob@example.com', 'passwort1');

    await waitFor(() => expect(bodies).toEqual([{ email: 'bob@example.com', password: 'passwort1' }]));
  });

  it('explains a rejected sign-in and stays on the page', async () => {
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getTokenCreateUrl()), () =>
        HttpResponse.json({ detail: 'No active account found' }, { status: 401 }),
      ),
    );
    const { user, router } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await signInAs(user, 'alice@example.com', 'falsch');

    expect(await screen.findByText(/Bitte überprüfe deine E-Mail-Adresse/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/sign-in/');
    expect(localStorage.getItem('loggedIn')).toBeNull();
  });

  it('asks for both fields', async () => {
    const { user } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    expect(await screen.findAllByText('Dieses Feld wird benötigt')).toHaveLength(2);
  });

  it('sends a signed-out visitor from a protected route to sign-in', async () => {
    renderRoute('/fotos/', { preloadedState: buildState() });

    expect(await screen.findByRole('button', { name: 'anmelden' })).toBeInTheDocument();
  });

  it('takes an already signed-in visitor straight to the dashboard', async () => {
    const { router } = renderRoute('/auth/sign-in/', { preloadedState: signedInState() });

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/'));
  });
});

describe('signing out', () => {
  it('ends the session after confirming', async () => {
    const { user, router } = renderRoute('/auth/sign-out/', { preloadedState: signedInState() });

    expect(
      await screen.findByText('Bist du dir wirklich sicher, dass du dich abmelden willst?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abmelden' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/sign-in/'));
    expect(localStorage.getItem('loggedIn')).toBeNull();
  });

  // A failed sign-out must not strand a signed-in UI either.
  it('ends the session even when the backend call fails', async () => {
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getTokenLogoutUrl()), () =>
        HttpResponse.json({ detail: 'kaputt' }, { status: 500 }),
      ),
    );
    const { user, store } = renderRoute('/auth/sign-out/', { preloadedState: signedInState() });

    await user.click(await screen.findByRole('button', { name: 'Abmelden' }));

    await waitFor(() => expect(store.getState().auth.user.me.id).toBe(0));
    expect(localStorage.getItem('loggedIn')).toBeNull();
  });

  it('keeps the session when the sign-out is cancelled', async () => {
    const { user, router } = renderRoute('/auth/sign-out/', { preloadedState: signedInState() });

    await user.click(await screen.findByRole('button', { name: 'Abbrechen' }));

    expect(router.state.location.pathname).not.toBe('/auth/sign-in/');
    expect(localStorage.getItem('loggedIn')).toBe('true');
  });
});
