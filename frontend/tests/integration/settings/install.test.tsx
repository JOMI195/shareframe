import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Install from '@/main/settings/app/install/install';
import { initInstallPrompt } from '@/common/utils/pwa/installPrompt';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { fireBeforeInstallPrompt, IPHONE_UA, restoreNavigator, stubNavigator } from '@tests/helpers/installPrompt';

const installButton = () => screen.queryByRole('button', { name: 'App installieren' });

beforeEach(() => initInstallPrompt());
afterEach(() => restoreNavigator());

describe('install settings', () => {
  it('confirms an existing installation', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValueOnce({ matches: true } as MediaQueryList);
    initInstallPrompt();
    renderWithProviders(<Install />);

    expect(screen.getByText('ShareFrame ist bereits installiert.')).toBeVisible();
    expect(installButton()).not.toBeInTheDocument();
  });

  it('runs the browser prompt', async () => {
    const { user } = renderWithProviders(<Install />);
    const event = fireBeforeInstallPrompt();

    await user.click(installButton()!);

    expect(event.prompt).toHaveBeenCalledOnce();
  });

  it('shows the home screen steps on iOS', async () => {
    stubNavigator({ userAgent: IPHONE_UA });
    const { user } = renderWithProviders(<Install />);

    await user.click(installButton()!);

    expect(await screen.findByText('Wähle „Zum Home-Bildschirm“.')).toBeVisible();
  });

  it('points to the browser menu when no install is offered', () => {
    renderWithProviders(<Install />);

    expect(screen.getByText(/Nutze dafür das Browsermenü/)).toBeVisible();
    expect(installButton()).not.toBeInTheDocument();
  });
});
