import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import Password from '@/main/settings/user/password/password';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const VALID = 'geheim123';

const render = () => renderWithProviders(<Password />, { preloadedState: signedInState() });

const fill = async (
  user: ReturnType<typeof render>['user'],
  values: { current?: string; next?: string; repeat?: string },
) => {
  if (values.current) await user.type(screen.getByLabelText('Aktuelles Passwort'), values.current);
  if (values.next) await user.type(screen.getByLabelText('Neues Passwort'), values.next);
  if (values.repeat) await user.type(screen.getByLabelText('Neues Passwort wiederholen'), values.repeat);
  await user.click(screen.getByRole('button', { name: 'Speichern' }));
};

const recordChange = () => {
  const bodies: Record<string, unknown>[] = [];
  server.use(
    mswHttp.post(apiUrl(authEndpoints.getSetPasswordUrl()), async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return bodies;
};

describe('password settings', () => {
  it('sends the current and the new password', async () => {
    const bodies = recordChange();
    const { user } = render();

    await fill(user, { current: 'altes123', next: VALID, repeat: VALID });

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      current_password: 'altes123',
      new_password: VALID,
      re_new_password: VALID,
    });
  });

  it('clears the form after a successful change', async () => {
    recordChange();
    const { user } = render();

    await fill(user, { current: 'altes123', next: VALID, repeat: VALID });

    await waitFor(() =>
      expect((screen.getByLabelText('Neues Passwort') as HTMLInputElement).value).toBe(''),
    );
  });

  it('refuses two passwords that do not match', async () => {
    const bodies = recordChange();
    const { user } = render();

    await fill(user, { current: 'altes123', next: VALID, repeat: 'anderes123' });

    expect(await screen.findByText('Passwörter müssen gleich sein')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it.each([
    ['too short', 'kurz1'],
    ['letters only', 'nurbuchstaben'],
    ['digits only', '12345678'],
    ['contains a space', 'geheim 123'],
  ])('rejects a new password that is %s', async (_name, candidate) => {
    const bodies = recordChange();
    const { user } = render();

    await fill(user, { current: 'altes123', next: candidate, repeat: candidate });

    expect(await screen.findAllByText(/Dein Passwort muss/)).not.toHaveLength(0);
    expect(bodies).toHaveLength(0);
  });

  it('asks for every field', async () => {
    const { user } = render();

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(await screen.findAllByText(/Dieses Feld wird benötigt/)).toHaveLength(3);
  });

  it('empties the form on demand', async () => {
    const { user } = render();
    await user.type(screen.getByLabelText('Neues Passwort'), VALID);

    await user.click(screen.getByRole('button', { name: 'Eingaben zurücksetzen' }));

    expect((screen.getByLabelText('Neues Passwort') as HTMLInputElement).value).toBe('');
  });
});
