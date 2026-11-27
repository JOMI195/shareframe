import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NOW = Date.parse('2026-01-01T00:00:00Z');

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
  it('defaults to the system theme', async () => {
    const { default: reducer } = await loadSlice();
    const state = reducer(undefined, { type: '@@init' });

    expect(state).toEqual({
      design: { colorTheme: 'system', seasonalThemes: true },
      pwa: { installPromptDismissed: false, pushPromptDismissed: false },
      upload: { autoDelete: true },
    });
  });

  it('hydrates from localStorage', async () => {
    localStorage.setItem('colorTheme', 'dark');

    const { default: reducer } = await loadSlice();
    const state = reducer(undefined, { type: '@@init' });

    expect(state.design.colorTheme).toBe('dark');
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

describe('seasonalThemesSelected', () => {
  it('switches seasonal themes off', async () => {
    const { default: reducer, seasonalThemesSelected } = await loadSlice();

    const state = reducer(reducer(undefined, { type: '@@init' }), seasonalThemesSelected(false));

    expect(state.design.seasonalThemes).toBe(false);
  });
});

describe('push prompt', () => {
  it('is dismissed and reset', async () => {
    const { default: reducer, pushPromptDismissed, pushPromptReset } = await loadSlice();
    const dismissed = reducer(reducer(undefined, { type: '@@init' }), pushPromptDismissed());

    expect(dismissed.pwa.pushPromptDismissed).toBe(true);
    expect(reducer(dismissed, pushPromptReset()).pwa.pushPromptDismissed).toBe(false);
  });
});
