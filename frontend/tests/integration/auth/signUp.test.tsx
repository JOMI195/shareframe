import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { Route, Routes } from 'react-router';
import SignUp from '@/main/authentication/signUp/signUp';
import { getUserListUrl } from '@/assets/endpoints/api/authEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { buildState } from '@tests/helpers/preloadedState';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const Page = () => (
  <Routes>
    <Route path="/" element={<SignUp />} />
  </Routes>
);

describe('SignUp form', () => {
  it('names the password rules before anything is typed', () => {
    renderWithProviders(<Page />, { preloadedState: buildState() });

    expect(screen.getByText(/8 bis 50 Zeichen/)).toBeInTheDocument();
  });

  it('keeps name and address after a failed attempt and only clears the passwords', async () => {
    server.use(mswHttp.post(apiUrl(getUserListUrl()), () => HttpResponse.json({ email: ['taken'] }, { status: 400 })));
    const { user } = renderWithProviders(<Page />, { preloadedState: buildState() });

    await user.type(screen.getByLabelText('E-Mail-Adresse'), 'new@example.com');
    await user.type(screen.getByLabelText('Nutzername'), 'newcomer');
    await user.type(screen.getByLabelText('Passwort'), 'abcdefg1');
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'abcdefg1');
    await user.click(screen.getByRole('button', { name: 'Registrieren' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/existiert/);
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue('new@example.com');
    expect(screen.getByLabelText('Nutzername')).toHaveValue('newcomer');
    expect(screen.getByLabelText('Passwort')).toHaveValue('');
    expect(screen.getByLabelText('Passwort wiederholen')).toHaveValue('');
  });
});
