import { vi } from 'vitest';

export const PUSH_ENDPOINT = 'https://push.example.com/abc';

// jsdom has no Push API; this builds the browser shape push.ts relies on.
export const stubPush = (
  options: { permission?: NotificationPermission; currentPermission?: NotificationPermission; subscribed?: boolean } = {},
) => {
  const { permission = 'granted', currentPermission = 'default', subscribed = false } = options;
  const subscription = {
    endpoint: PUSH_ENDPOINT,
    toJSON: () => ({ endpoint: PUSH_ENDPOINT, keys: { p256dh: 'key', auth: 'secret' } }),
    unsubscribe: vi.fn(async () => {
      current = null;
      return true;
    }),
  };
  let current: typeof subscription | null = subscribed ? subscription : null;
  const pushManager = {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async () => {
      current = subscription;
      return subscription;
    }),
  };

  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('PushManager', class {});
  vi.stubGlobal('Notification', { permission: currentPermission, requestPermission: vi.fn().mockResolvedValue(permission) });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { getRegistration: vi.fn().mockResolvedValue({ pushManager }) },
    configurable: true,
  });

  return { pushManager, subscription };
};

export const restorePush = () => {
  vi.unstubAllGlobals();
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
};
