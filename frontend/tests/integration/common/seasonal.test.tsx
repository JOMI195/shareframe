import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { useTheme } from '@mui/material';
import Header from '@/main/home/dashboard/header/header';
import DataNotFound from '@/common/components/dataNotFound';
import SeasonalSpinner from '@/common/components/seasonal/seasonalSpinner';
import SeasonalFlyby from '@/common/components/seasonal/seasonalFlyby';
import SeasonalLogoBadge from '@/common/components/seasonal/seasonalLogoBadge';
import SeasonalScreen from '@/common/components/seasonal/seasonalScreen';
import SeasonalAppBar from '@/common/components/seasonal/seasonalAppBar';
import halloween from '@/common/seasons/halloween/halloween';
import christmas from '@/common/seasons/christmas/christmas';
import newyear from '@/common/seasons/newyear/newyear';
import halloweenOverlays from '@/common/seasons/halloween/halloweenOverlays';
import christmasOverlays from '@/common/seasons/christmas/christmasOverlays';
import newyearOverlays from '@/common/seasons/newyear/newyearOverlays';
import { loadSeasonOverlays } from '@/common/seasons/seasons';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { buildState, signedInState } from '@tests/helpers/preloadedState';

const design = (on: boolean) => ({ ui: { settings: { design: { seasonalThemes: on } } } });
const seasonal = (on: boolean) => ({ preloadedState: signedInState(design(on)) });
const signedOut = () => ({ preloadedState: buildState(design(true)) });

const SecondaryProbe = () => <span>{useTheme().palette.secondary.main}</span>;

const flyby = () => screen.queryByTestId('SeasonalFlyby');

// jsdom has no AnimationEvent, so React listens for the webkit name there.
const endAnimations = (root: Element) =>
  act(() => {
    root.querySelectorAll('*').forEach((el) => fireEvent(el, new Event('webkitAnimationEnd', { bubbles: true })));
  });

const preferReducedMotion = () => {
  const matchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
    query.includes('prefers-reduced-motion')
      ? ({ ...matchMedia(query), matches: true, media: query } as MediaQueryList)
      : matchMedia(query),
  );
};

// Loaded once up front, so the provider finds the art cached on its first render.
beforeAll(async () => {
  await Promise.all([halloween, christmas, newyear].map(loadSeasonOverlays));
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date('2026-10-22T12:00:00'));
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('during halloween', () => {
  it('greets with the season on the dashboard', () => {
    renderWithProviders(<Header username="alice" />, seasonal(true));

    expect(screen.getByText('Schaurig schöne Halloween-Zeit!')).toBeVisible();
  });

  it('puts a ghost next to empty states', () => {
    renderWithProviders(<DataNotFound notFoundMessage="Nichts da" />, seasonal(true));

    expect(screen.getByTestId('GhostIcon')).toBeInTheDocument();
  });

  it('picks one of the season icons at random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    renderWithProviders(<DataNotFound notFoundMessage="Nichts da" />, seasonal(true));

    expect(screen.getByTestId('BatIcon')).toBeInTheDocument();
  });

  it('crowns the logo with a jack-o-lantern', () => {
    renderWithProviders(<SeasonalLogoBadge>Logo</SeasonalLogoBadge>, seasonal(true));

    expect(screen.getByRole('button', { name: 'Halloween' })).toContainElement(screen.getByTestId('JackOLanternIcon'));
  });

  it('turns the spinner into a pumpkin', () => {
    renderWithProviders(<SeasonalSpinner />, seasonal(true));

    expect(screen.getByRole('progressbar')).toContainElement(screen.getByTestId('PumpkinIcon'));
  });

  it('tints the secondary colour', () => {
    renderWithProviders(<SecondaryProbe />, seasonal(true));

    expect(screen.getByText('#E8711A')).toBeInTheDocument();
  });

  it('draws every app bar and screen overlay', () => {
    renderWithProviders(
      <>
        <SeasonalAppBar />
        <SeasonalScreen />
      </>,
      seasonal(true),
    );

    expect(screen.getByTestId('SeasonalAppBar').children).toHaveLength(halloweenOverlays.appBar.length);
    expect(screen.getByTestId('SeasonalScreen').children).toHaveLength(halloweenOverlays.screen.length);
  });

  it('lets a flyby pass once per session', () => {
    const first = renderWithProviders(<SeasonalFlyby />, seasonal(true));
    expect(flyby()).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<SeasonalFlyby />, seasonal(true));
    expect(flyby()).not.toBeInTheDocument();
  });

  it('sends another flyby from the pumpkin', async () => {
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

  it('sends another flyby every few minutes', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    sessionStorage.setItem('seasonalFlybyShown', '1');
    renderWithProviders(<SeasonalFlyby />, seasonal(true));
    expect(flyby()).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3 * 60_000));

    expect(flyby()).toBeInTheDocument();
  });

  it('clears the flyby once it is gone', () => {
    renderWithProviders(<SeasonalFlyby />, seasonal(true));

    endAnimations(flyby()!);

    expect(flyby()).not.toBeInTheDocument();
  });
});

describe('during christmas', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-12-10T12:00:00'));
  });

  it('counts the nights until christmas eve on the dashboard', () => {
    renderWithProviders(<Header username="alice" />, seasonal(true));

    expect(screen.getByText('Noch 14 Mal schlafen bis Heiligabend!')).toBeVisible();
  });

  it('puts a christmas tree next to empty states', () => {
    renderWithProviders(<DataNotFound notFoundMessage="Nichts da" />, seasonal(true));

    expect(screen.getByTestId('ChristmasTreeArt')).toBeInTheDocument();
  });

  it('turns the spinner into an ornament', () => {
    renderWithProviders(<SeasonalSpinner />, seasonal(true));

    expect(screen.getByRole('progressbar')).toContainElement(screen.getByTestId('OrnamentIcon'));
  });

  it('puts a santa hat on the logo', () => {
    renderWithProviders(<SeasonalLogoBadge>Logo</SeasonalLogoBadge>, seasonal(true));

    expect(screen.getByRole('button', { name: 'Weihnachten' })).toContainElement(screen.getByTestId('SantaHatIcon'));
  });

  it('tints the secondary colour', () => {
    renderWithProviders(<SecondaryProbe />, seasonal(true));

    expect(screen.getByText('#1F7A5A')).toBeInTheDocument();
  });

  it('draws every app bar and screen overlay', () => {
    renderWithProviders(
      <>
        <SeasonalAppBar />
        <SeasonalScreen />
      </>,
      seasonal(true),
    );

    expect(screen.getByTestId('SeasonalAppBar').children).toHaveLength(christmasOverlays.appBar.length);
    expect(screen.getByTestId('SeasonalScreen').children).toHaveLength(christmasOverlays.screen.length);
  });
});

describe('during silvester', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00'));
  });

  it('wishes a good slide into the new year on the dashboard', () => {
    renderWithProviders(<Header username="alice" />, seasonal(true));

    expect(screen.getByText('Guten Rutsch ins Jahr 2027!')).toBeVisible();
  });

  it('puts a party hat on the logo', () => {
    renderWithProviders(<SeasonalLogoBadge>Logo</SeasonalLogoBadge>, seasonal(true));

    expect(screen.getByRole('button', { name: 'Silvester' })).toContainElement(screen.getByTestId('PartyHatIcon'));
  });

  it('puts clinking glasses next to empty states', () => {
    renderWithProviders(<DataNotFound notFoundMessage="Nichts da" />, seasonal(true));

    expect(screen.getByTestId('ToastArt')).toBeInTheDocument();
  });

  it('turns the spinner into a champagne glass', () => {
    renderWithProviders(<SeasonalSpinner />, seasonal(true));

    expect(screen.getByRole('progressbar')).toContainElement(screen.getByTestId('ChampagneGlass'));
  });

  it('tints the secondary colour', () => {
    renderWithProviders(<SecondaryProbe />, seasonal(true));

    expect(screen.getByText('#B7791F')).toBeInTheDocument();
  });

  it('draws every app bar and screen overlay', () => {
    renderWithProviders(
      <>
        <SeasonalAppBar />
        <SeasonalScreen />
      </>,
      seasonal(true),
    );

    expect(screen.getByTestId('SeasonalAppBar').children).toHaveLength(newyearOverlays.appBar.length);
    expect(screen.getByTestId('SeasonalScreen').children).toHaveLength(newyearOverlays.screen.length);
  });

  it('is still on new year\'s day', () => {
    vi.setSystemTime(new Date('2027-01-01T12:00:00'));
    renderWithProviders(<Header username="alice" />, seasonal(true));

    expect(screen.getByText('Frohes neues Jahr 2027!')).toBeVisible();
  });
});

const allFlybys = [halloweenOverlays, christmasOverlays, newyearOverlays].flatMap((overlays) => overlays.flyby);

describe.each([false, true])('every flyby (reduced motion: %s)', (reducedMotion) => {
  it.each(allFlybys.map((Flyby) => [Flyby.name, Flyby]))('%s finishes once', (_, Flyby) => {
    const onDone = vi.fn();
    const { container } = renderWithProviders(<Flyby onDone={onDone} reducedMotion={reducedMotion} />);

    endAnimations(container);

    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe('with reduced motion', () => {
  beforeEach(preferReducedMotion);

  it('still shows the flyby and clears it after fading', () => {
    renderWithProviders(<SeasonalFlyby />, seasonal(true));

    endAnimations(flyby()!);

    expect(flyby()).not.toBeInTheDocument();
  });

  it('shows it again from the pumpkin', async () => {
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

const everything = (
  <>
    <Header username="alice" />
    <DataNotFound notFoundMessage="Nichts da" />
    <SeasonalSpinner />
    <SeasonalLogoBadge>Logo</SeasonalLogoBadge>
    <SeasonalAppBar />
    <SeasonalScreen />
    <SeasonalFlyby />
    <SecondaryProbe />
  </>
);

const expectPlain = () => {
  expect(screen.getByText('Willkommen bei ShareFrame')).toBeVisible();
  expect(screen.queryByTestId('GhostIcon')).not.toBeInTheDocument();
  expect(screen.queryByTestId('PumpkinIcon')).not.toBeInTheDocument();
  expect(screen.queryByTestId('JackOLanternIcon')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Halloween' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('SeasonalAppBar')).not.toBeInTheDocument();
  expect(screen.queryByTestId('SeasonalScreen')).not.toBeInTheDocument();
  expect(screen.queryByText('#E8711A')).not.toBeInTheDocument();
  expect(flyby()).not.toBeInTheDocument();
};

describe('switched off', () => {
  it('keeps everything plain', () => {
    renderWithProviders(everything, seasonal(false));

    expectPlain();
  });
});

describe('signed out', () => {
  it('keeps everything plain despite the setting', () => {
    renderWithProviders(everything, signedOut());

    expectPlain();
  });
});
