import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server, withFrames, withUser } from '@tests/mocks';
import { makeFrame, seedUser } from '@tests/fixtures';
import { renderRoute } from '@tests/helpers/renderRoute';
import { buildState, signedInState } from '@tests/helpers/preloadedState';

const publicRoutes: [string, RegExp][] = [
  ['/', /Teile deine schönsten Momente|Anmelden/i],
  ['/kontakt/', /Kontaktiere uns/i],
  ['/impressum/', /Impressum/i],
  ['/datenschutzerklaerung/', /Datenschutz/i],
  ['/auth/sign-in/', /Anmelden/i],
  ['/auth/users/password-reset/form/', /Passwort/i],
];

const protectedRoutes: [string, string][] = [
  ['/dashboard/', 'app'],
  ['/fotos/', 'app'],
  ['/freunde/', 'app'],
  ['/bilderrahmen/', 'app'],
  ['/aktivitaeten/', 'app'],
  ['/aenderungen/', 'app'],
  ['/settings/app/', 'settings'],
  ['/settings/user/', 'settings'],
];

// Exercises the real route table: a broken import, provider or guard shows up here.
describe('public routes', () => {
  it.each(publicRoutes)('renders %s', async (path, expected) => {
    renderRoute(path, { preloadedState: buildState() });

    expect(await screen.findAllByText(expected)).not.toHaveLength(0);
  });
});

describe('protected routes', () => {
  it.each(protectedRoutes)('renders %s and selects the %s feature', async (path, feature) => {
    const { store } = renderRoute(path, { preloadedState: signedInState() });

    await waitFor(() => expect(store.getState().ui.navigation.selectedFeature.title).toBe(feature));
  });

  it.each(protectedRoutes.map(([path]) => [path] as [string]))(
    'redirects %s to sign-in when signed out',
    async (path) => {
      renderRoute(path, { preloadedState: buildState() });

      expect(await screen.findAllByText(/Anmelden/i)).not.toHaveLength(0);
    },
  );
});

describe('unknown routes', () => {
  it.each([['/gibt-es-nicht/'], ['/auth/gibt-es-nicht/'], ['/settings/gibt-es-nicht/']])(
    'renders the not-found page for %s',
    async (path) => {
      renderRoute(path, { preloadedState: signedInState() });

      expect(await screen.findByText('Seite nicht gefunden')).toBeInTheDocument();
    },
  );
});

describe('in-app navigation', () => {
  // The sidebar is collapsed below the lg breakpoint, which is what jsdom reports.
  it('opens the sidebar and walks from the dashboard to the frames page', async () => {
    server.use(...withUser(seedUser), ...withFrames([makeFrame()]));
    const { user, router, store } = renderRoute('/dashboard/', { preloadedState: signedInState() });

    expect(screen.queryByRole('link', { name: 'Bilderrahmen' })).not.toBeInTheDocument();

    await user.click((await screen.findByTestId('MenuIcon')).closest('button')!);
    expect(store.getState().ui.navigation.sidebar.open).toBe(true);

    await user.click(await screen.findByRole('link', { name: 'Bilderrahmen' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/bilderrahmen/'));
    expect(await screen.findByText(/AAAA-BBBB/)).toBeInTheDocument();
    // Navigating closes it again on small screens.
    expect(store.getState().ui.navigation.sidebar.open).toBe(false);
  });
});

describe('seo head', () => {
  it('sets the document title from the route table', async () => {
    renderRoute('/impressum/', { preloadedState: buildState() });

    await waitFor(() => expect(document.title).toBe('Impressum – ShareFrame'));
  });

  it('marks app routes noindex', async () => {
    renderRoute('/dashboard/', { preloadedState: signedInState() });

    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
        'noindex, nofollow',
      ),
    );
  });
});
