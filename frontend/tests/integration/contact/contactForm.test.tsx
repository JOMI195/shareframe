import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import ContactForm from '@/main/contact/contactForm';
import { getContactUrl } from '@/assets/endpoints/api/contactEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';
import { signedInState } from '@tests/helpers/preloadedState';
import { seedUser } from '@tests/fixtures';

const fill = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  over: Partial<Record<'Dein Name' | 'E-Mail-Adresse' | 'Betreff' | 'Nachricht', string>> = {},
) => {
  const values = {
    'Dein Name': 'Alice',
    'E-Mail-Adresse': 'alice@example.com',
    Betreff: 'Frage',
    Nachricht: 'Hallo',
    ...over,
  };
  for (const [label, value] of Object.entries(values)) {
    if (value) await user.type(screen.getByLabelText(label), value);
  }
};

const submit = (user: ReturnType<typeof renderWithProviders>['user']) =>
  user.click(screen.getByRole('button', { name: 'Nachricht absenden' }));

describe('ContactForm', () => {
  it('renders every field', () => {
    renderWithProviders(<ContactForm />);

    ['Dein Name', 'E-Mail-Adresse', 'Betreff', 'Nachricht'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument(),
    );
  });

  it('fills in the email of a signed-in user', () => {
    localStorage.setItem('loggedIn', 'true');
    renderWithProviders(<ContactForm />, { preloadedState: signedInState() });

    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue(seedUser.email);
  });

  it('requires every field', async () => {
    const { user } = renderWithProviders(<ContactForm />);

    await submit(user);

    expect(await screen.findByText('Bitte gib deine E-Mail-Adresse an')).toBeInTheDocument();
    expect(screen.getByText('Bitte schreib uns eine Nachricht')).toBeInTheDocument();
    expect(screen.getByText('Bitte gib deinen Namen an')).toBeInTheDocument();
    expect(screen.getByText('Bitte gib einen Betreff an')).toBeInTheDocument();
  });

  // Unlike sign-in, this form does validate the address shape.
  it('rejects a malformed email', async () => {
    const { user } = renderWithProviders(<ContactForm />);

    await fill(user, { 'E-Mail-Adresse': 'keine-email' });
    await submit(user);

    expect(await screen.findByText('Bitte gib eine gültige E-Mail-Adresse an')).toBeInTheDocument();
  });

  it('posts the values and resets the form', async () => {
    const body = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getContactUrl()), async ({ request }) => {
        body(await request.json());
        return HttpResponse.json({ detail: 'ok' });
      }),
    );

    const { user } = renderWithProviders(<ContactForm />);
    await fill(user);
    await submit(user);

    await waitFor(() =>
      expect(body).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Frage',
        message: 'Hallo',
      }),
    );
    await waitFor(() => expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue(''));
  });

  it('shows the sending snackbar state in the store', async () => {
    const { user, store } = renderWithProviders(<ContactForm />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(store.getState().ui.contact.snackbar.alert.open).toBe(true));
    expect(store.getState().ui.contact.snackbar.alert.message).toBe('Nachricht gesendet');
  });

  it('surfaces a backend failure through the snackbar', async () => {
    server.use(
      mswHttp.post(apiUrl(getContactUrl()), () => HttpResponse.json({ detail: 'Kaputt' }, { status: 500 })),
    );

    const { user, store } = renderWithProviders(<ContactForm />);
    await fill(user);
    await submit(user);

    await waitFor(() => expect(store.getState().ui.contact.snackbar.alert.severity).toBe('error'));
    expect(screen.getByLabelText('Nachricht')).toHaveValue('Hallo');
  });
});
