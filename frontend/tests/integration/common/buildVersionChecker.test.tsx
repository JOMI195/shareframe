import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import BuildVersionChecker from '@/common/components/buildVersionChecker';
import * as appEndpoints from '@/assets/endpoints/api/appEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

// vitest.config pins VITE_APP_BUILD_VERSION to this value.
const FRONTEND_VERSION = 'test-build';

const serveVersion = (version: string, onCall?: () => void) =>
  server.use(
    mswHttp.get(apiUrl(appEndpoints.getAppVersionUrl()), () => {
      onCall?.();
      return HttpResponse.json({ version });
    }),
  );

const banner = () => screen.queryByText(/Eine neue Version von Shareframe ist verfügbar/);

describe('BuildVersionChecker', () => {
  afterEach(() => vi.useRealTimers());

  it('stays quiet while the backend runs the same build', async () => {
    serveVersion(FRONTEND_VERSION);
    const { store } = renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(store.getState().entities.app.version).toBe(FRONTEND_VERSION));
    expect(banner()).not.toBeInTheDocument();
  });

  it('announces a newer backend build', async () => {
    serveVersion('2026-09-05-deadbeef');
    renderWithProviders(<BuildVersionChecker />);

    expect(await screen.findByText(/Eine neue Version von Shareframe ist verfügbar/)).toBeVisible();
  });

  it('reloads the page on demand', async () => {
    serveVersion('2026-09-05-deadbeef');
    const { user } = renderWithProviders(<BuildVersionChecker />);

    await user.click(await screen.findByRole('button', { name: 'Jetzt neu laden' }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  // Dismissal is per version: the same build must not nag again, a newer one must.
  it('stays dismissed for the version that was dismissed', async () => {
    let version = '2026-09-05-deadbeef';
    server.use(
      mswHttp.get(apiUrl(appEndpoints.getAppVersionUrl()), () => HttpResponse.json({ version })),
    );
    const { user } = renderWithProviders(<BuildVersionChecker />);

    await screen.findByText(/Eine neue Version von Shareframe ist verfügbar/);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(banner()).not.toBeInTheDocument());

    window.dispatchEvent(new Event('focus'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(banner()).not.toBeInTheDocument();

    version = '2026-09-06-cafebabe';
    window.dispatchEvent(new Event('focus'));

    expect(await screen.findByText(/Eine neue Version von Shareframe ist verfügbar/)).toBeVisible();
  });

  it('re-checks when the window regains focus', async () => {
    const onCall = vi.fn();
    serveVersion(FRONTEND_VERSION, onCall);
    renderWithProviders(<BuildVersionChecker />);

    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(onCall).toHaveBeenCalledTimes(2));
  });
});
