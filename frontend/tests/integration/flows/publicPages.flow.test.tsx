import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { canonicalUrl, OG_IMAGE, pages, SITE_ORIGIN } from '@/seo/pageMeta';
import { landingContent } from '@/seo/landingContent';
import { renderRoute } from '@tests/helpers/renderRoute';
import { buildState, signedInState } from '@tests/helpers/preloadedState';

const publicPaths = pages.filter((page) => !page.noindex).map((page) => [page.path, page.title]);
const privatePaths = pages.filter((page) => page.noindex && !page.matchPrefix).map((page) => [page.path]);

const head = (selector: string) => document.head.querySelector(selector);

// Mirrors the dropped legal.spec.ts: everything here is static markup plus the
// head, none of which needs a backend.
describe('public pages', () => {
  it.each(publicPaths)('%s carries its own title', async (path, title) => {
    renderRoute(path);

    await waitFor(() => expect(document.title).toBe(title));
  });

  it.each(publicPaths)('%s is indexable and canonical', async (path) => {
    renderRoute(path);

    await waitFor(() => expect(head('link[rel="canonical"]')).not.toBeNull());
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(canonicalUrl(path));
    expect(head('meta[name="robots"]')?.getAttribute('content')).not.toBe('noindex, nofollow');
  });

  it('never emits more than one canonical link', async () => {
    renderRoute('/impressum/');

    await waitFor(() => expect(document.title).toBe('Impressum – ShareFrame'));
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it.each(privatePaths)('%s is marked noindex', async (path) => {
    renderRoute(path, { preloadedState: signedInState() });

    await waitFor(() =>
      expect(head('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow'),
    );
  });

  it('shares the large preview image', async () => {
    renderRoute('/');

    await waitFor(() => expect(head('meta[property="og:image"]')?.getAttribute('content')).toBe(SITE_ORIGIN + OG_IMAGE.src));
    expect(head('meta[property="og:image:width"]')?.getAttribute('content')).toBe(String(OG_IMAGE.width));
    expect(head('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
  });

  it('describes each public page for search results', async () => {
    renderRoute('/kontakt/');

    await waitFor(() => expect(head('meta[name="description"]')?.getAttribute('content')).toMatch(/Kontaktformular/));
  });
});

describe('landing page', () => {
  it('leads with the headline and a way in', async () => {
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { name: landingContent.headline }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Anmelden/ })).not.toHaveLength(0);
  });

  it('switches between light and dark mode', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(await screen.findByRole('button', { name: 'Wechsel in den dunklen Modus' }));

    expect(screen.getByRole('button', { name: 'Wechsel in den hellen Modus' })).toBeInTheDocument();
  });

  it('explains the project in its own sections', async () => {
    renderRoute('/');

    await screen.findByRole('heading', { level: 1, name: landingContent.headline });
    [landingContent.featuresHeading, landingContent.screenshotsHeading].forEach((name) =>
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument(),
    );
    landingContent.features.forEach(({ title }) =>
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument(),
    );
  });

  it('switches the app screenshot with its tab', async () => {
    const user = userEvent.setup();
    renderRoute('/');
    const [first, second] = landingContent.screenshots;

    expect(await screen.findByText(first.caption)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: second.label }));

    expect(screen.getByText(second.caption)).toBeInTheDocument();
    expect(screen.queryByText(first.caption)).not.toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(second.label);
  });

  // The landing page is pointless once you have a session.
  it('sends a signed-in visitor to the dashboard', async () => {
    const { router } = renderRoute('/', { preloadedState: signedInState() });

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/'));
  });

  // The public footer rides along with the authentication layout.
  it('links to the legal pages from the sign-in page', async () => {
    renderRoute('/auth/sign-in/');

    expect(await screen.findByRole('link', { name: 'Datenschutzerklärung' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kontakt' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Impressum' })).toBeInTheDocument();
  });

  it.each([['/impressum/'], ['/datenschutzerklaerung/'], ['/kontakt/']])(
    '%s has the public header and footer',
    async (path) => {
      renderRoute(path);

      expect(await screen.findByRole('link', { name: 'Anmelden' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Datenschutzerklärung' })).toBeInTheDocument();
      expect(screen.getByText(/Copyright ©/)).toBeInTheDocument();
    },
  );

  it('leads from the header logo back to the start page', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/impressum/');

    await user.click(await screen.findByRole('img', { name: 'ShareFrame' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  // Already on the way in, so the header drops its own sign-in button.
  it('keeps the header but hides its sign-in button on the sign-in page', async () => {
    renderRoute('/auth/sign-in/');

    expect(await screen.findByRole('img', { name: 'ShareFrame' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anmelden' })).not.toBeInTheDocument();
  });

  // Seasonal decorations are a perk of the signed-in app.
  it('stays plain during a season', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(new Date('2026-10-22T12:00:00'));
    renderRoute('/', { preloadedState: buildState({ ui: { settings: { design: { seasonalThemes: true } } } }) });

    expect(await screen.findByRole('img', { name: 'ShareFrame' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Halloween' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('SeasonalScreen')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
