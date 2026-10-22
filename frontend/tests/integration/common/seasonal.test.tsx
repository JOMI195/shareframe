import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { useTheme } from '@mui/material';
import Header from '@/main/home/dashboard/header/header';
import DataNotFound from '@/common/components/dataNotFound';
import SeasonalSpinner from '@/common/components/seasonal/seasonalSpinner';
import SeasonalFlyby from '@/common/components/seasonal/seasonalFlyby';
import SeasonalLogoBadge from '@/common/components/seasonal/seasonalLogoBadge';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';

const seasonal = (on: boolean) => ({ preloadedState: { ui: { settings: { design: { seasonalThemes: on } } } } });

const SecondaryProbe = () => <span>{useTheme().palette.secondary.main}</span>;

const flyby = () => screen.queryByTestId('SeasonalFlyby');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date('2026-10-22T12:00:00'));
  sessionStorage.clear();
});

afterEach(() => vi.useRealTimers());

describe('during halloween', () => {
  it('greets with the season on the dashboard', () => {
    renderWithProviders(<Header username="alice" />, seasonal(true));

    expect(screen.getByText('Schaurig schöne Halloween-Zeit!')).toBeVisible();
  });

  it('puts a ghost next to empty states', () => {
    renderWithProviders(<DataNotFound notFoundMessage="Nichts da" />, seasonal(true));

    expect(screen.getByTestId('GhostIcon')).toBeInTheDocument();
  });

  it('turns the spinner into a pumpkin', () => {
    renderWithProviders(<SeasonalSpinner />, seasonal(true));

    expect(screen.getByRole('progressbar')).toContainElement(screen.getByTestId('PumpkinIcon'));
  });

  it('tints the secondary colour', () => {
    renderWithProviders(<SecondaryProbe />, seasonal(true));

    expect(screen.getByText('#E8711A')).toBeInTheDocument();
  });

  it('lets the bats fly once per session', () => {
    const first = renderWithProviders(<SeasonalFlyby />, seasonal(true));
    expect(flyby()).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<SeasonalFlyby />, seasonal(true));
    expect(flyby()).not.toBeInTheDocument();
  });

  it('sends the bats again from the pumpkin', async () => {
    sessionStorage.setItem('seasonalFlybyShown', '1');
    const { user } = renderWithProviders(
      <>
        <SeasonalLogoBadge>Logo</SeasonalLogoBadge>
        <SeasonalFlyby />
      </>,
      seasonal(true),
    );
    expect(flyby()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Halloween' }));

    expect(flyby()).toBeInTheDocument();
  });

  it('clears the bats once they are gone', () => {
    renderWithProviders(<SeasonalFlyby />, seasonal(true));
    const bats = Array.from(flyby()!.firstElementChild!.children);

    // jsdom has no AnimationEvent, so React listens for the webkit name there.
    act(() => {
      bats.forEach((bat) => fireEvent(bat, new Event('webkitAnimationEnd', { bubbles: true })));
    });

    expect(flyby()).not.toBeInTheDocument();
  });
});

describe('with reduced motion', () => {
  beforeEach(() => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query.includes('prefers-reduced-motion')
        ? ({ ...matchMedia(query), matches: true, media: query } as MediaQueryList)
        : matchMedia(query),
    );
  });

  it('still shows the bats and clears them after fading', () => {
    renderWithProviders(<SeasonalFlyby />, seasonal(true));
    const bats = Array.from(flyby()!.firstElementChild!.children);

    act(() => {
      bats.forEach((bat) => fireEvent(bat, new Event('webkitAnimationEnd', { bubbles: true })));
    });

    expect(flyby()).not.toBeInTheDocument();
  });

  it('shows them again from the pumpkin', async () => {
    sessionStorage.setItem('seasonalFlybyShown', '1');
    const { user } = renderWithProviders(
      <>
        <SeasonalLogoBadge>Logo</SeasonalLogoBadge>
        <SeasonalFlyby />
      </>,
      seasonal(true),
    );

    await user.click(screen.getByRole('button', { name: 'Halloween' }));

    expect(flyby()).toBeInTheDocument();
  });
});

describe('switched off', () => {
  it('keeps everything plain', () => {
    renderWithProviders(
      <>
        <Header username="alice" />
        <DataNotFound notFoundMessage="Nichts da" />
        <SeasonalSpinner />
        <SeasonalFlyby />
      </>,
      seasonal(false),
    );

    expect(screen.getByText('Willkommen zu ShareFrame')).toBeVisible();
    expect(screen.queryByTestId('GhostIcon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('PumpkinIcon')).not.toBeInTheDocument();
    expect(flyby()).not.toBeInTheDocument();
  });
});
