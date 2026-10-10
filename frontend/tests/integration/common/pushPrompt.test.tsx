import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import PushPrompt from '@/common/components/pwa/pushPrompt';
import * as notificationsEndpoints from '@/assets/endpoints/api/notificationsEndpoints';
import { initInstallPrompt } from '@/common/utils/pwa/installPrompt';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { PUSH_ENDPOINT, restorePush, stubPush } from '@tests/helpers/push';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const dialog = () => screen.queryByText('Push-Benachrichtigungen aktivieren?');
const lookedUp = () => vi.mocked(navigator.serviceWorker.getRegistration).mock.calls.length > 0;

const asInstalled = () => {
  vi.spyOn(window, 'matchMedia').mockReturnValueOnce({ matches: true } as MediaQueryList);
  initInstallPrompt();
};

const render = (pushPromptDismissed = false) =>
  renderWithProviders(<PushPrompt />, {
    preloadedState: signedInState({
      ui: { settings: { pwa: { installPromptDismissed: true, pushPromptDismissed } } },
    }),
  });

afterEach(() => {
  restorePush();
  initInstallPrompt();
});

describe('PushPrompt', () => {
  it('stays hidden in the browser', () => {
    stubPush();
    initInstallPrompt();
    render();

    expect(lookedUp()).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('asks in the installed app', async () => {
    stubPush();
    asInstalled();
    render();

    expect(await screen.findByText('Push-Benachrichtigungen aktivieren?')).toBeVisible();
  });

  it('stays hidden when this device already has push', async () => {
    const { pushManager } = stubPush({ subscribed: true });
    asInstalled();
    render();

    await waitFor(() => expect(pushManager.getSubscription).toHaveBeenCalled());
    expect(dialog()).not.toBeInTheDocument();
  });

  it('stays hidden when notifications are blocked', () => {
    stubPush({ currentPermission: 'denied' });
    asInstalled();
    render();

    expect(lookedUp()).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('stays hidden after an earlier answer', () => {
    stubPush();
    asInstalled();
    render(true);

    expect(lookedUp()).toBe(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('subscribes this device and does not ask again', async () => {
    const bodies: unknown[] = [];
    server.use(
      mswHttp.post(apiUrl(notificationsEndpoints.getPushSubscriptionsUrl()), async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    stubPush();
    asInstalled();
    const { user, store } = render();

    await user.click(await screen.findByRole('button', { name: 'Aktivieren' }));

    await waitFor(() => expect(store.getState().ui.settings.pwa.pushPromptDismissed).toBe(true));
    expect(bodies).toEqual([{ endpoint: PUSH_ENDPOINT, p256dh: 'key', auth: 'secret' }]);
  });

  it('remembers a dismissal without asking for permission', async () => {
    stubPush();
    asInstalled();
    const { user, store } = render();

    await user.click(await screen.findByRole('button', { name: 'Später' }));

    expect(store.getState().ui.settings.pwa.pushPromptDismissed).toBe(true);
    expect(Notification.requestPermission).not.toHaveBeenCalled();
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
  });
});
