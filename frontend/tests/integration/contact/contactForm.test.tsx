import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import ContactForm from '@/main/contact/contactForm';
import { getContactUrl } from '@/assets/endpoints/api/contactEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const fill = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  over: Partial<Record<'Dein Name' | 'Email' | 'Betreff' | 'Message', string>> = {},
) => {
  const values = {
    'Dein Name': 'Alice',
    Email: 'alice@example.com',
    Betreff: 'Frage',
    Message: 'Hallo',
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

    ['Dein Name', 'Email', 'Betreff', 'Message'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument(),
    );
  });

  it('requires every field', async () => {
    const { user } = renderWithProviders(<ContactForm />);

    await submit(user);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
    // The subject field reuses the name field's message.
    expect(screen.getAllByText('Name is required')).toHaveLength(2);
  });

  // Unlike sign-in, this form does validate the address shape.
  it('rejects a malformed email', async () => {
    const { user } = renderWithProviders(<ContactForm />);

    await fill(user, { Email: 'keine-email' });
    await submit(user);

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveValue(''));
  });

  it('shows the sending snackbar state in the store', async () => {
    const { user, store } = renderWithProviders(<ContactForm />);

    await fill(user);
    await submit(user);

    await waitFor(() => expect(store.getState().ui.contact.snackbar.alert.open).toBe(true));
    expect(store.getState().ui.contact.snackbar.alert.message).toBe('Senden der Kontaktemail erfolgreich');
  });

  it('surfaces a backend failure through the snackbar', async () => {
    server.use(
      mswHttp.post(apiUrl(getContactUrl()), () => HttpResponse.json({ detail: 'Kaputt' }, { status: 500 })),
    );

    const { user, store } = renderWithProviders(<ContactForm />);
    await fill(user);
    await submit(user);

    await waitFor(() => expect(store.getState().ui.contact.snackbar.alert.severity).toBe('error'));
  });
});
