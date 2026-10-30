import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import RouteError from '@/common/components/error/routeError/routeError';
import { setupStore } from '@/store/setupStore';
import { buildState } from '@tests/helpers/preloadedState';

const renderThrowing = (error: Error, signedIn = false) => {
  const Boom = () => {
    throw error;
  };
  const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }]);
  const store = setupStore(buildState(signedIn ? { auth: { user: { me: { id: 1 } } } } : {}));

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  sessionStorage.clear();
});

describe('RouteError', () => {
  it('shows a German error page with reload', () => {
    renderThrowing(new Error('kaputt'));

    expect(screen.getByRole('heading', { name: 'Etwas ist schiefgelaufen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zur Startseite' })).toHaveAttribute('href', '/');
  });

  it('links signed-in users to the dashboard', () => {
    renderThrowing(new Error('kaputt'), true);

    expect(screen.getByRole('link', { name: 'Zur Übersicht' })).toHaveAttribute('href', '/dashboard/');
  });

  it('reloads once when a chunk of an old build is missing', () => {
    renderThrowing(new TypeError('Failed to fetch dynamically imported module: /assets/home-abc.js'));

    expect(screen.getByRole('heading', { name: 'Es gibt eine neue Version' })).toBeInTheDocument();
    expect(window.location.reload).toHaveBeenCalledOnce();
  });
});
