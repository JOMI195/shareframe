import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks';

const openAppSettings = async () => {
  const view = renderRoute('/settings/app/', { preloadedState: signedInState() });
  // "Darstellung" is both the tab and the section heading.
  await screen.findAllByText('Darstellung');
  return view;
};

const openUserSettings = async () => {
  const view = renderRoute('/settings/user/', { preloadedState: signedInState() });
  await screen.findByLabelText('Nutzername');
  return view;
};

// The MUI Switch input is not exposed as a checkbox to the accessibility tree.
const appearanceSwitch = () => document.querySelector('.MuiSwitch-input') as HTMLInputElement;

describe('appearance', () => {
  it('switches to the dark theme and remembers it', async () => {
    const { user, store } = await openAppSettings();

    await user.click(appearanceSwitch());

    await waitFor(() => expect(store.getState().ui.settings.design.colorTheme).toBe('dark'));
    // The theme is also mirrored outside redux so the first paint is not light.
    expect(localStorage.getItem('colorTheme')).toBe('dark');
  });

  it('switches back to light', async () => {
    const { user, store } = await openAppSettings();

    await user.click(appearanceSwitch());
    await waitFor(() => expect(store.getState().ui.settings.design.colorTheme).toBe('dark'));
    await user.click(appearanceSwitch());

    await waitFor(() => expect(store.getState().ui.settings.design.colorTheme).toBe('light'));
  });

  it('is also reachable from the app bar', async () => {
    const { user, store } = await openAppSettings();

    await user.click(screen.getByRole('button', { name: 'Wechsel in den dunklen Modus' }));

    await waitFor(() => expect(store.getState().ui.settings.design.colorTheme).toBe('dark'));
    expect(appearanceSwitch()).toBeChecked();
  });
});

describe('profile', () => {
  it('shows the current profile', async () => {
    await openUserSettings();

    expect((screen.getByLabelText('Nutzername') as HTMLInputElement).value).toBe(seedUser.username);
    expect(screen.getByRole('checkbox', { name: 'Freundschaftsanfragen erhalten' })).toBeChecked();
  });

  it('saves a new username together with the searchable flag', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.patch(apiUrl(authEndpoints.getMyUserDataUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(seedUser);
      }),
    );
    const { user } = await openUserSettings();

    await user.clear(screen.getByLabelText('Nutzername'));
    await user.type(screen.getByLabelText('Nutzername'), 'alice2');
    await user.click(screen.getByRole('checkbox', { name: 'Freundschaftsanfragen erhalten' }));
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].username).toBe('alice2');
    expect((bodies[0].account as Record<string, unknown>).friendship_user_searchable).toBe(false);
  });

  it('refuses an empty username', async () => {
    const bodies: unknown[] = [];
    server.use(
      mswHttp.patch(apiUrl(authEndpoints.getMyUserDataUrl()), () => {
        bodies.push('called');
        return HttpResponse.json(seedUser);
      }),
    );
    const { user } = await openUserSettings();

    await user.clear(screen.getByLabelText('Nutzername'));
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findByText('Dieses Feld wird benötigt')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('puts the typed values back on demand', async () => {
    const { user } = await openUserSettings();

    await user.clear(screen.getByLabelText('Nutzername'));
    await user.type(screen.getByLabelText('Nutzername'), 'irgendwas');
    await user.click(screen.getByRole('button', { name: 'Eingaben zurücksetzen' }));

    expect((screen.getByLabelText('Nutzername') as HTMLInputElement).value).toBe(seedUser.username);
  });
});

describe('access', () => {
  // Settings sit behind the app-wide guard, so both tabs need a session.
  it.each([['/settings/app/'], ['/settings/user/']])(
    'sends a signed-out visitor from %s to sign-in',
    async (path) => {
      const { router } = renderRoute(path);

      await waitFor(() => expect(router.state.location.pathname).toBe('/auth/sign-in/'));
    },
  );
});
