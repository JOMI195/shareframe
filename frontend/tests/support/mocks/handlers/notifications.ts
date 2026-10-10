import { http, HttpResponse } from 'msw';
import * as notifications from '@/assets/endpoints/api/notificationsEndpoints';
import { apiUrl } from '../apiUrl';

export const notificationHandlers = [
  http.get(apiUrl(notifications.getPushKeyUrl()), () => HttpResponse.json({ public_key: 'AQID' })),
  http.post(apiUrl(notifications.getPushSubscriptionsUrl()), () => new HttpResponse(null, { status: 204 })),
  http.delete(apiUrl(notifications.getPushSubscriptionsUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(notifications.getUnsubscribeUrl()), () => new HttpResponse(null, { status: 204 })),
];
