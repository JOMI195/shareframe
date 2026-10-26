import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import Email from '@/main/settings/user/email/email';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const NEW_EMAIL = 'neu@example.com';

const render = () => renderWithProviders(<Email />, { preloadedState: signedInState() });

const fill = async (
  user: ReturnType<typeof render>['user'],
  values: { email?: string; password?: string },
) => {
  await user.click(screen.getByRole('button', { name: 'E-Mail ändern' }));
  if (values.email) await user.type(screen.getByLabelText('Neue E-Mail-Adresse'), values.email);
  if (values.password) await user.type(screen.getByLabelText('Aktuelles Passwort'), values.password);
  await user.click(screen.getByRole('button', { name: 'Bestätigungslink senden' }));
};

const recordRequest = (response = () => new HttpResponse(null, { status: 204 })) => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    mswHttp.post(apiUrl(authEndpoints.getRequestEmailChangeUrl()), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return response();
    }),
  );
  return bodies;
};

describe('email settings', () => {
  it('shows the current address without a form', () => {
    render();

    expect(screen.getByLabelText('Email')).toHaveValue(seedUser.email);
    expect(screen.queryByLabelText('Neue E-Mail-Adresse')).not.toBeInTheDocument();
  });

  it('sends the new address with the current password', async () => {
    const bodies = recordRequest();
    const { user } = render();

    await fill(user, { email: NEW_EMAIL, password: 'geheim123' });

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ new_email: NEW_EMAIL, current_password: 'geheim123' });
  });

  it('keeps the old address and points to the mail after the request', async () => {
    recordRequest();
    const { user, store } = render();

    await fill(user, { email: NEW_EMAIL, password: 'geheim123' });

    expect(await screen.findByText(/Bestätigungslink an neu@example.com/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Neue E-Mail-Adresse')).not.toBeInTheDocument();
    expect(store.getState().auth.user.me.email).toBe(seedUser.email);
  });

  it('keeps the form open and shows why the backend refused', async () => {
    recordRequest(() =>
      HttpResponse.json({ new_email: ['Diese E-Mail ist bereits vergeben.'] }, { status: 400 }),
    );
    const { user, store } = render();

    await fill(user, { email: NEW_EMAIL, password: 'geheim123' });

    await waitFor(() =>
      expect(store.getState().ui.auth.snackbar.alert.message).toBe('Diese E-Mail ist bereits vergeben.'),
    );
    expect(screen.getByLabelText('Neue E-Mail-Adresse')).toHaveValue(NEW_EMAIL);
  });

  it('refuses an invalid address', async () => {
    const bodies = recordRequest();
    const { user } = render();

    await fill(user, { email: 'keine-adresse', password: 'geheim123' });

    expect(await screen.findByText('Bitte gib eine gültige E-Mail-Adresse ein')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('asks for both fields', async () => {
    const { user } = render();

    await fill(user, {});

    expect(await screen.findAllByText(/Dieses Feld wird benötigt/)).toHaveLength(2);
  });

  it('closes the form on cancel', async () => {
    const { user } = render();
    await user.click(screen.getByRole('button', { name: 'E-Mail ändern' }));

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(screen.queryByLabelText('Neue E-Mail-Adresse')).not.toBeInTheDocument();
  });
});
