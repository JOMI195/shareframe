export const getNotificationsBaseUrl = () => "notifications/";

export const getPushKeyUrl = () => `${getNotificationsBaseUrl()}push/key/`;

export const getPushSubscriptionsUrl = () => `${getNotificationsBaseUrl()}push/subscriptions/`;

export const getUnsubscribeUrl = () => `${getNotificationsBaseUrl()}unsubscribe/`;
