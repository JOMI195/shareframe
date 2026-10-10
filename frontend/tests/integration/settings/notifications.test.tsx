import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import Notifications from '@/main/settings/user/notifications/notifications';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import * as notificationsEndpoints from '@/assets/endpoints/api/notificationsEndpoints';
import { initInstallPrompt } from '@/common/utils/pwa/installPrompt';
import type { INotificationKindSettings } from '@/types';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { PUSH_ENDPOINT, restorePush, stubPush } from '@tests/helpers/push';
import { seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const REMINDERS: INotificationKindSettings = {
  kind: 'inactivity_reminder',
  enabled: true,
  channels: [{ channel: 'email', enabled: true }],
};
const NEWS: INotificationKindSettings = {
  kind: 'changelog',
  enabled: true,
  channels: [
    { channel: 'push', enabled: true },
    { channel: 'email', enabled: false },
  ],
};

const deviceSwitch = () => screen.queryByRole('switch', { name: 'Push-Benachrichtigungen erhalten' });
const kindSwitch = (title: string) => screen.getByRole('switch', { name: title });
const channelSwitch = (name: string) => screen.getByRole('switch', { name });

const asInstalled = () => {
  vi.spyOn(window, 'matchMedia').mockReturnValueOnce({ matches: true } as MediaQueryList);
  initInstallPrompt();
};

const render = (preferences: INotificationKindSettings[] = []) =>
  renderWithProviders(<Notifications />, {
    preloadedState: signedInState({
      auth: { user: { me: { ...seedUser, account: { ...seedUser.account, notification_preferences: preferences } } } },
    }),
  });

const record = (method: 'post' | 'patch', url: string) => {
  const bodies: unknown[] = [];
  server.use(
    mswHttp[method](url, async ({ request }) => {
      bodies.push(await request.json());
      return method === 'patch' ? HttpResponse.json(seedUser) : new HttpResponse(null, { status: 204 });
    }),
  );
  return bodies;
};

afterEach(() => {
  restorePush();
  initInstallPrompt();
});

describe('device push', () => {
  it('points to the installed app', () => {
    stubPush();
    initInstallPrompt();
    render();

    expect(screen.getByText(/nur in der installierten App/)).toBeVisible();
    expect(deviceSwitch()).not.toBeInTheDocument();
  });

  it('subscribes this device', async () => {
    const bodies = record('post', apiUrl(notificationsEndpoints.getPushSubscriptionsUrl()));
    stubPush();
    asInstalled();
    const { user } = render();

    await user.click(deviceSwitch()!);

    await waitFor(() => expect(deviceSwitch()).toBeChecked());
    expect(bodies).toEqual([{ endpoint: PUSH_ENDPOINT, p256dh: 'key', auth: 'secret' }]);
  });

  it('explains a blocked permission', async () => {
    stubPush({ permission: 'denied' });
    asInstalled();
    const { user } = render();

    await user.click(deviceSwitch()!);

    expect(await screen.findByText(/Benachrichtigungen sind blockiert/)).toBeVisible();
    expect(deviceSwitch()).not.toBeChecked();
  });
});

describe('notification kinds', () => {
  it('shows one section per kind with its channels', () => {
    render([REMINDERS, NEWS]);

    expect(kindSwitch('Erinnerungen')).toBeChecked();
    expect(channelSwitch('Erinnerungen per E-Mail')).toBeChecked();
    expect(kindSwitch('Neuigkeiten')).toBeChecked();
    expect(channelSwitch('Neuigkeiten per Push')).toBeChecked();
    expect(channelSwitch('Neuigkeiten per E-Mail')).not.toBeChecked();
  });

  it('turns a whole kind off', async () => {
    const bodies = record('patch', apiUrl(authEndpoints.getMyUserDataUrl()));
    const { user } = render([NEWS]);

    await user.click(kindSwitch('Neuigkeiten'));

    await waitFor(() =>
      expect(bodies).toEqual([{ account: { notification_preferences: [{ kind: 'changelog', enabled: false }] } }]),
    );
  });

  it('turns a single channel on', async () => {
    const bodies = record('patch', apiUrl(authEndpoints.getMyUserDataUrl()));
    const { user } = render([NEWS]);

    await user.click(channelSwitch('Neuigkeiten per E-Mail'));

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          account: {
            notification_preferences: [{ kind: 'changelog', channels: [{ channel: 'email', enabled: true }] }],
          },
        },
      ]),
    );
  });

  it('locks the channels of a kind that is off', () => {
    render([{ ...NEWS, enabled: false }]);

    expect(channelSwitch('Neuigkeiten per Push')).toBeDisabled();
    expect(channelSwitch('Neuigkeiten per E-Mail')).toBeDisabled();
  });

  it('says when nothing can be configured', () => {
    render();

    expect(screen.getByText(/keine Benachrichtigungen/)).toBeVisible();
  });
});
