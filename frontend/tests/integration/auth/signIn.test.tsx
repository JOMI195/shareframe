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
  await user.type(screen.getByLabelText('E-Mail-Adresse'), 'alice@example.com');
  await user.type(screen.getByLabelText('Passwort'), 'geheim');
};

describe('SignIn form', () => {
  it('renders the fields and the submit button', () => {
    renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Passwort vergessen?' })).toHaveAttribute(
      'href',
      '/auth/users/password-reset/form/',
    );
  });

  it('shows a required error for each empty field', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

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
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

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
    await user.type(screen.getByLabelText('E-Mail-Adresse'), 'keine-email');
    await user.type(screen.getByLabelText('Passwort'), 'geheim');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => expect(requests).toHaveBeenCalled());
  });

  it('records the session on success', async () => {
    succeedingSignIn();
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

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
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    expect(await screen.findByText('Startseite')).toBeInTheDocument();
    expect(profileRequests).toHaveBeenCalledOnce();
  });

  it('disables the submit button while a request is in flight', () => {
    renderWithProviders(<Page />, {
      preloadedState: buildState({ auth: { user: { api: { loading: true } } } }),
    });

    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeDisabled();
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

describe('SignIn with blocked cookies', () => {
  const COOKIE_HINT = /technisch erforderliche Cookies/;

  it('warns before the user signs in', () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false);
    renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.getByText(COOKIE_HINT)).toBeInTheDocument();
  });

  it('stays on the sign-in page after a successful login', async () => {
    succeedingSignIn();
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false);

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    expect(await screen.findByText(COOKIE_HINT)).toBeInTheDocument();
    expect(localStorage.getItem('loggedIn')).toBeNull();
    expect(screen.queryByText('Startseite')).not.toBeInTheDocument();
  });
});

describe('SignIn field adornments', () => {
  it('toggles password visibility', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });
    const password = screen.getByLabelText('Passwort');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Passwort anzeigen' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows a clear button only once the email has content', async () => {
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.queryByRole('button', { name: 'E-Mail-Adresse leeren' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('E-Mail-Adresse'), 'alice@example.com');
    await user.click(await screen.findByRole('button', { name: 'E-Mail-Adresse leeren' }));

    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue('');
  });
});
