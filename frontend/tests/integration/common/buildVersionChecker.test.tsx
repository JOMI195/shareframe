import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import BuildVersionChecker from '@/common/components/buildVersionChecker';
import { getVersionFileUrl } from '@/assets/endpoints/app/appEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { server } from '@tests/mocks/server';

// vitest.config pins VITE_APP_BUILD_VERSION to this value.
const FRONTEND_VERSION = 'test-build';
const VERSION_FILE = `*${getVersionFileUrl()}`;

const serveVersion = (version: string, { force = false, onCall }: { force?: boolean; onCall?: () => void } = {}) =>
  server.use(
    mswHttp.get(VERSION_FILE, () => {
      onCall?.();
      return HttpResponse.json({ version, force });
    }),
  );

const banner = () => screen.queryByText(/Eine neue Version von ShareFrame ist da/);
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('BuildVersionChecker', () => {
  afterEach(() => vi.useRealTimers());

  it('stays quiet while the deployed frontend is this build', async () => {
    const onCall = vi.fn();
    serveVersion(FRONTEND_VERSION, { onCall });
    renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    await settle();
    expect(banner()).not.toBeInTheDocument();
  });

  it('announces a newer deployed build', async () => {
    serveVersion('2026-09-05-deadbeef');
    renderWithProviders(<BuildVersionChecker />);

    expect(await screen.findByText(/Eine neue Version von ShareFrame ist da/)).toBeVisible();
  });

  // The dev server has no version file and answers unknown paths with index.html.
  it.each([
    ['missing', () => new HttpResponse(null, { status: 404 })],
    ['not JSON', () => HttpResponse.html('<!doctype html><html></html>')],
    ['without a version', () => HttpResponse.json({})],
  ])('stays quiet when the version file is %s', async (_case, resolver) => {
    const onCall = vi.fn();
    server.use(mswHttp.get(VERSION_FILE, () => {
      onCall();
      return resolver();
    }));
    renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(onCall).toHaveBeenCalled());
    await settle();
    expect(banner()).not.toBeInTheDocument();
  });

  it('reloads the page on demand', async () => {
    serveVersion('2026-09-05-deadbeef');
    const { user } = renderWithProviders(<BuildVersionChecker />);

    await user.click(await screen.findByRole('button', { name: 'Jetzt neu laden' }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('reloads without asking when the deploy forces it', async () => {
    serveVersion('2026-09-05-deadbeef', { force: true });
    renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
    expect(banner()).not.toBeInTheDocument();
  });

  // A reload that still serves the old bundle would otherwise loop forever.
  it('falls back to asking once a forced reload did not help', async () => {
    serveVersion('2026-09-05-deadbeef', { force: true });
    const first = renderWithProviders(<BuildVersionChecker />);
    await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
    first.unmount();

    renderWithProviders(<BuildVersionChecker />);

    expect(await screen.findByText(/Eine neue Version von ShareFrame ist da/)).toBeVisible();
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  // Dismissal is per version: the same build must not nag again, a newer one must.
  it('stays dismissed for the version that was dismissed', async () => {
    let version = '2026-09-05-deadbeef';
    server.use(mswHttp.get(VERSION_FILE, () => HttpResponse.json({ version, force: false })));
    const { user } = renderWithProviders(<BuildVersionChecker />);

    await screen.findByText(/Eine neue Version von ShareFrame ist da/);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(banner()).not.toBeInTheDocument());

    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(banner()).not.toBeInTheDocument();

    version = '2026-09-06-cafebabe';
    window.dispatchEvent(new Event('focus'));

    expect(await screen.findByText(/Eine neue Version von ShareFrame ist da/)).toBeVisible();
  });

  it('re-checks when the window regains focus', async () => {
    const onCall = vi.fn();
    serveVersion(FRONTEND_VERSION, { onCall });
    renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(2));
  });
});
