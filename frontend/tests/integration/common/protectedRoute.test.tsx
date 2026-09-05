import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { Route, Routes } from 'react-router';
import ProtectedRoute from '@/common/components/protectedRoute';
import { getMyUserDataUrl } from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { buildState, signedInState } from '@tests/helpers/preloadedState';
import { seedUser } from '@tests/fixtures';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const Guarded = ({ redirectPath }: { redirectPath?: string } = {}) => (
  <Routes>
    <Route path="/auth/sign-in/" element={<div>Anmeldeseite</div>} />
    <Route path="/dashboard/" element={<div>Startseite</div>} />
    <Route element={<ProtectedRoute redirectPath={redirectPath} />}>
      <Route path="/geschuetzt/" element={<div>Geheim</div>} />
    </Route>
  </Routes>
);

describe('ProtectedRoute', () => {
  // The gate reads localStorage, not redux.
  it('redirects to sign-in when loggedIn is not set', () => {
    renderWithProviders(<Guarded />, { route: '/geschuetzt/', preloadedState: buildState() });

    expect(screen.getByText('Anmeldeseite')).toBeInTheDocument();
    expect(screen.queryByText('Geheim')).not.toBeInTheDocument();
  });

  it('honours a custom redirect path', () => {
    renderWithProviders(<Guarded redirectPath="/dashboard/" />, {
      route: '/geschuetzt/',
      preloadedState: buildState(),
    });

    expect(screen.getByText('Startseite')).toBeInTheDocument();
  });

  it('renders the outlet when the profile is already loaded', () => {
    renderWithProviders(<Guarded />, { route: '/geschuetzt/', preloadedState: signedInState() });

    expect(screen.getByText('Geheim')).toBeInTheDocument();
  });

  it('renders children instead of the outlet when given', () => {
    localStorage.setItem('loggedIn', 'true');
    renderWithProviders(
      <ProtectedRoute>
        <div>Kind</div>
      </ProtectedRoute>,
      { preloadedState: signedInState() },
    );

    expect(screen.getByText('Kind')).toBeInTheDocument();
  });

  it('shows a spinner and loads the profile when only localStorage says signed in', async () => {
    localStorage.setItem('loggedIn', 'true');
    const requests = vi.fn();
    server.use(
      mswHttp.get(apiUrl(getMyUserDataUrl()), () => {
        requests();
        return HttpResponse.json(seedUser);
      }),
    );

    const { store } = renderWithProviders(<Guarded />, {
      route: '/geschuetzt/',
      preloadedState: buildState(),
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => expect(store.getState().auth.user.me.id).toBe(seedUser.id));
    expect(await screen.findByText('Geheim')).toBeInTheDocument();
    expect(requests).toHaveBeenCalledOnce();
  });

  // The `requested` ref guards re-entry, so a re-render must not refetch.
  it('requests the profile only once across re-renders', async () => {
    localStorage.setItem('loggedIn', 'true');
    const requests = vi.fn();
    server.use(
      mswHttp.get(apiUrl(getMyUserDataUrl()), () => {
        requests();
        return HttpResponse.json(seedUser);
      }),
    );

    const { rerender } = renderWithProviders(<Guarded />, {
      route: '/geschuetzt/',
      preloadedState: buildState(),
    });

    rerender(<Guarded />);
    await waitFor(() => expect(requests).toHaveBeenCalled());
    rerender(<Guarded />);

    expect(requests).toHaveBeenCalledOnce();
  });

  // A failed profile load must not spin forever.
  it('renders the outlet once the profile request has failed', async () => {
    localStorage.setItem('loggedIn', 'true');
    server.use(mswHttp.get(apiUrl(getMyUserDataUrl()), () => HttpResponse.json({ detail: 'nope' }, { status: 403 })));

    renderWithProviders(<Guarded />, { route: '/geschuetzt/', preloadedState: buildState() });

    expect(await screen.findByText('Geheim')).toBeInTheDocument();
  });
});
