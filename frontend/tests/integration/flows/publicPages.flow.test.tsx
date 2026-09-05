import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { canonicalUrl, pages } from '@/seo/pageMeta';
import { landingContent } from '@/seo/landingContent';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';

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
});
