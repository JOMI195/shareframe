import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NOW = Date.parse('2026-01-01T00:00:00Z');
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

// The slice reads localStorage at module scope, so it must be imported per test.
const loadSlice = async () => {
  vi.resetModules();
  return import('@/store/ui/settings/settings.slice');
};

beforeEach(() => {
  vi.useFakeTimers().setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('initial state', () => {
  it('defaults to the light theme with no consent', async () => {
    const { default: reducer } = await loadSlice();
    const state = reducer(undefined, { type: '@@init' });

    expect(state).toEqual({
      design: { colorTheme: 'light' },
      cookies: { analyticsCookies: false, consentExpiry: null },
      navigation: { bottomNavigation: { open: false } },
    });
  });

  it('hydrates from localStorage', async () => {
    localStorage.setItem('colorTheme', 'dark');
    localStorage.setItem('analyticsCookies', 'true');
    localStorage.setItem('consentExpiry', String(NOW + 1000));

    const { default: reducer } = await loadSlice();
    const state = reducer(undefined, { type: '@@init' });

    expect(state.design.colorTheme).toBe('dark');
    expect(state.cookies).toEqual({ analyticsCookies: true, consentExpiry: NOW + 1000 });
  });
});

describe('designSelected', () => {
  it('mirrors the theme to localStorage', async () => {
    const { default: reducer, designSelected } = await loadSlice();

    const state = reducer(reducer(undefined, { type: '@@init' }), designSelected('dark'));

    expect(state.design.colorTheme).toBe('dark');
    expect(localStorage.getItem('colorTheme')).toBe('dark');
  });
});

describe('cookie consent', () => {
  it('records acceptance and a fresh expiry', async () => {
    const { default: reducer, analyticsCookiesAccepted } = await loadSlice();

    const state = reducer(reducer(undefined, { type: '@@init' }), analyticsCookiesAccepted());

    expect(state.cookies).toEqual({ analyticsCookies: true, consentExpiry: NOW + THIRTY_DAYS });
    expect(localStorage.getItem('analyticsCookies')).toBe('true');
    expect(JSON.parse(localStorage.getItem('consentExpiry')!)).toBe(NOW + THIRTY_DAYS);
  });

  it('records a decline but still refreshes the expiry', async () => {
    const { default: reducer, analyticsCookiesDeclined } = await loadSlice();

    const state = reducer(reducer(undefined, { type: '@@init' }), analyticsCookiesDeclined());

    expect(state.cookies).toEqual({ analyticsCookies: false, consentExpiry: NOW + THIRTY_DAYS });
    expect(localStorage.getItem('analyticsCookies')).toBe('false');
  });

  // allCookies* currently behave identically to their analytics counterparts.
  it('treats the "all cookies" variants the same', async () => {
    const { default: reducer, allCookiesAccepted, allCookiesDeclined, analyticsCookiesAccepted, analyticsCookiesDeclined } =
      await loadSlice();
    const base = reducer(undefined, { type: '@@init' });

    expect(reducer(base, allCookiesAccepted()).cookies).toEqual(reducer(base, analyticsCookiesAccepted()).cookies);
    expect(reducer(base, allCookiesDeclined()).cookies).toEqual(reducer(base, analyticsCookiesDeclined()).cookies);
  });
});

describe('bottom navigation', () => {
  it('opens and closes', async () => {
    const { default: reducer, bottomNavigationOpened, bottomNavigationClosed } = await loadSlice();
    const base = reducer(undefined, { type: '@@init' });

    expect(reducer(base, bottomNavigationOpened()).navigation.bottomNavigation.open).toBe(true);
    expect(reducer(base, bottomNavigationClosed()).navigation.bottomNavigation.open).toBe(false);
  });
});
