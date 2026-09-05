import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import Delete from '@/main/settings/user/delete/delete';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const render = () => renderWithProviders(<Delete />, { preloadedState: signedInState() });

const recordDelete = () => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    mswHttp.delete(apiUrl(authEndpoints.getMyUserDataUrl()), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return bodies;
};

const openDialog = async (user: ReturnType<typeof render>['user']) => {
  await user.click(screen.getByRole('button', { name: 'Mein Konto löschen' }));
  return screen.findByLabelText('Passwort');
};

// Deleting the account is irreversible, so the confirmation path matters.
describe('delete account', () => {
  it('does not delete anything without a confirmation', async () => {
    const bodies = recordDelete();
    render();

    expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('asks for the password before deleting', async () => {
    const { user } = render();

    await openDialog(user);

    expect(
      screen.getByText('Bitte bestätige die Löschung deines Kontos mit deinem Passwort.'),
    ).toBeVisible();
  });

  it('sends the password and anonymises the account', async () => {
    const bodies = recordDelete();
    const { user } = render();

    const password = await openDialog(user);
    await user.type(password, 'geheim123');
    await user.click(screen.getByRole('button', { name: 'Löschen bestätigen' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ password: 'geheim123', anonymize: true });
  });

  it('signs the user out afterwards', async () => {
    recordDelete();
    const { user, store } = render();

    const password = await openDialog(user);
    await user.type(password, 'geheim123');
    await user.click(screen.getByRole('button', { name: 'Löschen bestätigen' }));

    await waitFor(() => expect(localStorage.getItem('loggedIn')).toBeNull());
    expect(store.getState().auth.user.me.id).toBe(0);
  });

  it('keeps the account when the dialog is cancelled', async () => {
    const bodies = recordDelete();
    const { user } = render();

    await openDialog(user);
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument());
    expect(bodies).toHaveLength(0);
  });
});
