import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { Route, Routes } from 'react-router';
import SignIn from '@/main/authentication/signIn/signIn';
import { getMyUserDataUrl, getTokenCreateUrl } from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { buildState } from '@tests/helpers/preloadedState';
import { seedUser } from '@tests/fixtures';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const Page = () => (
  <Routes>
    <Route path="/" element={<SignIn />} />
    <Route path="/dashboard/" element={<div>Startseite</div>} />
  </Routes>
);

// The slice writes localStorage.loggedIn; the component reads it back to decide success.
const succeedingSignIn = () =>
  server.use(
    mswHttp.post(apiUrl(getTokenCreateUrl()), () => HttpResponse.json({})),
    mswHttp.get(apiUrl(getMyUserDataUrl()), () => HttpResponse.json(seedUser)),
  );

const fill = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByLabelText('Email'), 'alice@example.com');
  await user.type(screen.getByLabelText('Passwort'), 'geheim');
};

describe('SignIn form', () => {
  it('renders the fields and the submit button', () => {
    renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'anmelden' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Passwort vergessen?' })).toHaveAttribute(
      'href',
      '/auth/users/password-reset/form/',
    );
  });

  it('shows a required error for each empty field', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    await waitFor(() => expect(screen.getAllByText('Dieses Feld wird benötigt')).toHaveLength(2));
  });

  it('does not call the api while the form is invalid', async () => {
    const requests = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getTokenCreateUrl()), () => {
        requests();
        return HttpResponse.json({});
      }),
    );

    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });
    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    await waitFor(() => expect(screen.getAllByText('Dieses Feld wird benötigt')).toHaveLength(2));
    expect(requests).not.toHaveBeenCalled();
  });

  // No .email() rule on sign-in, unlike the contact form.
  it('accepts an email that is not a valid address', async () => {
    const requests = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getTokenCreateUrl()), () => {
        requests();
        return HttpResponse.json({}, { status: 401 });
      }),
    );

    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });
    await user.type(screen.getByLabelText('Email'), 'keine-email');
    await user.type(screen.getByLabelText('Passwort'), 'geheim');
    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    await waitFor(() => expect(requests).toHaveBeenCalled());
  });

  it('records the session on success', async () => {
    succeedingSignIn();
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    await waitFor(() => expect(localStorage.getItem('loggedIn')).toBe('true'));
  });

  it('requests the profile exactly once and redirects to the dashboard', async () => {
    const profileRequests = vi.fn();
    server.use(
      mswHttp.post(apiUrl(getTokenCreateUrl()), () => HttpResponse.json({})),
      mswHttp.get(apiUrl(getMyUserDataUrl()), () => {
        profileRequests();
        return HttpResponse.json(seedUser);
      }),
    );

    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'anmelden' }));

    expect(await screen.findByText('Startseite')).toBeInTheDocument();
    expect(profileRequests).toHaveBeenCalledOnce();
  });

  it('disables the submit button while a request is in flight', () => {
    renderWithProviders(<Page />, {
      preloadedState: buildState({ auth: { user: { api: { loading: true } } } }),
    });

    expect(screen.getByRole('button', { name: 'anmelden' })).toBeDisabled();
  });

  it('redirects straight to the dashboard when already signed in', async () => {
    localStorage.setItem('loggedIn', 'true');
    server.use(mswHttp.get(apiUrl(getMyUserDataUrl()), () => HttpResponse.json(seedUser)));

    renderWithProviders(<Page />, {
      preloadedState: buildState({ auth: { user: { me: seedUser } } }),
    });

    expect(await screen.findByText('Startseite')).toBeInTheDocument();
  });
});

describe('SignIn field adornments', () => {
  it('toggles password visibility', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });
    const password = screen.getByLabelText('Passwort');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'toggle current password visibility' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows a clear button only once the email has content', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.queryByRole('button', { name: 'clear email field' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.click(await screen.findByRole('button', { name: 'clear email field' }));

    expect(screen.getByLabelText('Email')).toHaveValue('');
  });
});
