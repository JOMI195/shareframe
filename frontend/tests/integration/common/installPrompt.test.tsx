import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import InstallPrompt from '@/common/components/pwa/installPrompt';
import { initInstallPrompt } from '@/common/utils/pwa/installPrompt';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { fireBeforeInstallPrompt, IPHONE_UA, restoreNavigator, stubNavigator } from '@tests/helpers/installPrompt';

const banner = () => screen.queryByText(/Installiere ShareFrame als App/);

beforeEach(() => initInstallPrompt());
afterEach(() => restoreNavigator());

describe('InstallPrompt', () => {
  it('stays hidden while the browser offers no install', () => {
    renderWithProviders(<InstallPrompt />);

    expect(banner()).not.toBeInTheDocument();
  });

  it('appears once the browser offers an install', async () => {
    renderWithProviders(<InstallPrompt />);
    fireBeforeInstallPrompt();

    expect(await screen.findByText(/Installiere ShareFrame als App/)).toBeVisible();
  });

  it('runs the browser prompt and does not ask again', async () => {
    const { user, store } = renderWithProviders(<InstallPrompt />);
    const event = fireBeforeInstallPrompt();

    await user.click(await screen.findByRole('button', { name: 'Installieren' }));

    expect(event.prompt).toHaveBeenCalledOnce();
    await waitFor(() => expect(store.getState().ui.settings.pwa.installPromptDismissed).toBe(true));
  });

  it('remembers a dismissal', async () => {
    const { user, store } = renderWithProviders(<InstallPrompt />);
    fireBeforeInstallPrompt();

    await user.click(await screen.findByRole('button', { name: 'Später' }));

    expect(store.getState().ui.settings.pwa.installPromptDismissed).toBe(true);
    await waitFor(() => expect(banner()).not.toBeInTheDocument());
  });

  it('stays hidden after an earlier dismissal', () => {
    renderWithProviders(<InstallPrompt />, {
      preloadedState: { ui: { settings: { pwa: { installPromptDismissed: true } } } },
    });
    fireBeforeInstallPrompt();

    expect(banner()).not.toBeInTheDocument();
  });

  it('shows the home screen steps on iOS', async () => {
    stubNavigator({ userAgent: IPHONE_UA });
    const { user } = renderWithProviders(<InstallPrompt />);

    await user.click(await screen.findByRole('button', { name: 'Installieren' }));

    expect(await screen.findByText('Wähle „Zum Home-Bildschirm“.')).toBeVisible();
  });
});
