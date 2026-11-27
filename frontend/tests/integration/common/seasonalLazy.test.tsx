import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import SeasonalAppBar from '@/common/components/seasonal/seasonalAppBar';
import christmasOverlays from '@/common/seasons/christmas/christmasOverlays';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date('2026-12-10T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

// Own file, so no other test has cached the art yet.
it('shows the season art once it has loaded', async () => {
  renderWithProviders(<SeasonalAppBar />, {
    preloadedState: signedInState({ ui: { settings: { design: { seasonalThemes: true } } } }),
  });

  expect(screen.queryByTestId('SeasonalAppBar')).toBeNull();
  expect((await screen.findByTestId('SeasonalAppBar')).children).toHaveLength(christmasOverlays.appBar.length);
});
