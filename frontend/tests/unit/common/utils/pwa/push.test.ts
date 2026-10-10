import { afterEach, describe, expect, it } from 'vitest';
import { getPushSubscription, isPushSupported, subscribePush, urlBase64ToUint8Array } from '@/common/utils/pwa/push';
import { restorePush, stubPush } from '@tests/helpers/push';

afterEach(() => restorePush());

describe('urlBase64ToUint8Array', () => {
  it('decodes url-safe base64 without padding', () => {
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255]);
  });
});

describe('isPushSupported', () => {
  it('is false without the Push API', () => {
    expect(isPushSupported()).toBe(false);
  });

  it('is true once the browser offers it', () => {
    stubPush();

    expect(isPushSupported()).toBe(true);
  });
});

describe('subscribePush', () => {
  it('reports unavailable without the Push API', async () => {
    expect(await subscribePush()).toBe('unavailable');
  });

  it('reports a denied permission without subscribing', async () => {
    const { pushManager } = stubPush({ permission: 'denied' });

    expect(await subscribePush()).toBe('denied');
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });
});

describe('getPushSubscription', () => {
  it('returns null without the Push API', async () => {
    expect(await getPushSubscription()).toBeNull();
  });

  it('returns the existing subscription', async () => {
    const { subscription } = stubPush({ subscribed: true });

    expect(await getPushSubscription()).toBe(subscription);
  });
});
