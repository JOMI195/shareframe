import axiosInstance from '@/services/api';
import { getPushKeyUrl, getPushSubscriptionsUrl } from '@/assets/endpoints/api/notificationsEndpoints';

export type SubscribeResult = 'subscribed' | 'denied' | 'unavailable';

export const isPushSupported = () =>
  window.isSecureContext === true
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

export const urlBase64ToUint8Array = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

// Only production builds register the service worker.
const getRegistration = async () =>
  isPushSupported() ? navigator.serviceWorker.getRegistration() : undefined;

export const getPushSubscription = async () => {
  const registration = await getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
};

export const subscribePush = async (): Promise<SubscribeResult> => {
  if (!isPushSupported()) return 'unavailable';

  // First await in the click handler: iOS rejects permission requests without a user gesture.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await getRegistration();
  if (!registration) return 'unavailable';

  const { data } = await axiosInstance.get<{ public_key: string }>(getPushKeyUrl());
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.public_key),
  });
  const { endpoint, keys } = subscription.toJSON();
  await axiosInstance.post(getPushSubscriptionsUrl(), { endpoint, p256dh: keys?.p256dh, auth: keys?.auth });
  return 'subscribed';
};

export const unsubscribePush = async () => {
  const subscription = await getPushSubscription();
  if (!subscription) return;

  await axiosInstance
    .delete(getPushSubscriptionsUrl(), { data: { endpoint: subscription.endpoint } })
    .catch(() => undefined);
  await subscription.unsubscribe();
};
