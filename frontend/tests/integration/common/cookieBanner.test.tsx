import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CookieBanner from '@/common/components/cookieBanner';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';

const inAWeek = () => Date.now() + 7 * 24 * 60 * 60 * 1000;
const lastWeek = () => Date.now() - 7 * 24 * 60 * 60 * 1000;

const title = () => screen.queryByRole('heading', { name: /Nutzung von Cookies/ });

describe('CookieBanner', () => {
  it('asks for consent when none was given', () => {
    renderWithProviders(<CookieBanner />, { preloadedState: { ui: { settings: { cookies: { consentExpiry: null } } } } });

    expect(title()).toBeVisible();
  });

  it('stays hidden while the consent is still valid', () => {
    renderWithProviders(<CookieBanner />, {
      preloadedState: { ui: { settings: { cookies: { consentExpiry: inAWeek() } } } },
    });

    expect(title()).not.toBeInTheDocument();
  });

  it('asks again once the consent has expired', () => {
    renderWithProviders(<CookieBanner />, {
      preloadedState: { ui: { settings: { cookies: { consentExpiry: lastWeek() } } } },
    });

    expect(title()).toBeVisible();
  });

  it('accepts everything and closes', async () => {
    const { user, store } = renderWithProviders(<CookieBanner />, {
      preloadedState: { ui: { settings: { cookies: { consentExpiry: null } } } },
    });

    await user.click(screen.getByRole('button', { name: 'Alle akzeptieren' }));

    const { cookies } = store.getState().ui.settings;
    expect(cookies.analyticsCookies).toBe(true);
    expect(cookies.consentExpiry).toBeGreaterThan(Date.now());
    expect(localStorage.getItem('analyticsCookies')).toBe('true');
    await waitFor(() => expect(title()).not.toBeInTheDocument());
  });

  it('records a decline without analytics cookies', async () => {
    const { user, store } = renderWithProviders(<CookieBanner />, {
      preloadedState: { ui: { settings: { cookies: { consentExpiry: null } } } },
    });

    await user.click(screen.getByRole('button', { name: 'Nur notwendige Cookies' }));

    const { cookies } = store.getState().ui.settings;
    expect(cookies.analyticsCookies).toBe(false);
    // A decline is still a decision, so it gets an expiry and stops the prompt.
    expect(cookies.consentExpiry).toBeGreaterThan(Date.now());
  });
});
