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
  await user.type(screen.getByLabelText('E-Mail-Adresse'), email);
  await user.type(screen.getByLabelText('Passwort'), password);
  await user.click(screen.getByRole('button', { name: 'Anmelden' }));
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

    expect(await screen.findByText(/E-Mail-Adresse oder Passwort stimmen nicht/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/sign-in/');
    expect(localStorage.getItem('loggedIn')).toBeNull();
    // Only the password has to be typed again.
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue('alice@example.com');
    expect(screen.getByLabelText('Passwort')).toHaveValue('');
  });

  it('asks for both fields', async () => {
    const { user } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    expect(await screen.findAllByText('Dieses Feld wird benötigt')).toHaveLength(2);
  });

  it('sends a signed-out visitor from a protected route to sign-in', async () => {
    renderRoute('/fotos/', { preloadedState: buildState() });

    expect(await screen.findByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('returns to the protected page after signing in', async () => {
    const { user, router } = renderRoute('/fotos/', { preloadedState: buildState() });
    await screen.findByRole('button', { name: 'Anmelden' });

    await signInAs(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/fotos/'));
  });

  it('explains an expired session and returns to where it ended', async () => {
    sessionStorage.setItem('sessionExpired', '/freunde/');
    const { user, router } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    expect(await screen.findByText(/Sitzung ist abgelaufen/)).toBeInTheDocument();
    await signInAs(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/freunde/'));
    expect(sessionStorage.getItem('sessionExpired')).toBeNull();
  });

  it('ignores a return path that leaves the app', async () => {
    sessionStorage.setItem('sessionExpired', '//evil.example/');
    const { user, router } = renderRoute('/auth/sign-in/', { preloadedState: buildState() });

    await signInAs(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/'));
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

describe('confirming an email change', () => {
  const recordConfirm = (response = () => new HttpResponse(null, { status: 204 })) => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getConfirmEmailChangeUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return response();
      }),
    );
    return bodies;
  };

  it('sends the token from the link and asks to sign in with the new address', async () => {
    const bodies = recordConfirm();
    const { router, store } = renderRoute('/auth/users/email-change/abc:def:ghi', {
      preloadedState: buildState(),
    });

    await waitFor(() => expect(bodies).toEqual([{ token: 'abc:def:ghi' }]));
    expect(router.state.location.pathname).toBe('/auth/sign-in/');
    await waitFor(() =>
      expect(store.getState().ui.auth.snackbar.alert.message).toMatch(/mit der neuen Adresse an/),
    );
  });

  it('explains an expired link', async () => {
    recordConfirm(() =>
      HttpResponse.json({ detail: 'Der Link ist ungültig oder abgelaufen.' }, { status: 400 }),
    );
    const { store } = renderRoute('/auth/users/email-change/abc', { preloadedState: buildState() });

    await waitFor(() =>
      expect(store.getState().ui.auth.snackbar.alert).toMatchObject({
        message: 'Der Link ist ungültig oder abgelaufen.',
        severity: 'error',
      }),
    );
  });
});

describe('setting a new password from the reset link', () => {
  const fillNewPassword = async (user: ReturnType<typeof renderRoute>['user']) => {
    await user.type(screen.getByLabelText(/^Neues Passwort/, { selector: 'input' }), 'geheim123');
    await user.type(screen.getByLabelText(/^Passwort wiederholen/, { selector: 'input' }), 'geheim123');
    await user.click(screen.getByRole('button', { name: 'Passwort neu vergeben' }));
  };

  it('goes to sign-in once the password is set', async () => {
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getResetPasswordConfirmUrl()), () => new HttpResponse(null, { status: 204 })),
    );
    const { user, router } = renderRoute('/auth/users/password-reset/abc/token1', { preloadedState: buildState() });

    await fillNewPassword(user);

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/sign-in/'));
  });

  it('stays and offers a new link when the token is rejected', async () => {
    server.use(
      mswHttp.post(apiUrl(authEndpoints.getResetPasswordConfirmUrl()), () =>
        HttpResponse.json({ token: ['Invalid token for given user.'] }, { status: 400 }),
      ),
    );
    const { user, router } = renderRoute('/auth/users/password-reset/abc/token1', { preloadedState: buildState() });

    await fillNewPassword(user);

    expect(await screen.findByRole('link', { name: 'Neuen Link anfordern' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/auth/users/password-reset/abc/token1');
  });
});
