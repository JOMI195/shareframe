import { http, HttpResponse } from 'msw';
import * as auth from '@/assets/endpoints/api/authEndpoints';
import { seedUser } from '../../fixtures';
import { apiUrl } from '../apiUrl';

export const authHandlers = [
  http.get(apiUrl(auth.getCsrfUrl()), () => HttpResponse.json({ detail: 'CSRF cookie set' })),
  http.post(apiUrl(auth.getTokenCreateUrl()), () => HttpResponse.json({ detail: 'Authenticated.' })),
  http.post(apiUrl(auth.getTokenRefreshUrl()), () => HttpResponse.json({ detail: 'Refreshed.' })),
  http.post(apiUrl(auth.getTokenLogoutUrl()), () => new HttpResponse(null, { status: 204 })),

  http.get(apiUrl(auth.getMyUserDataUrl()), () => HttpResponse.json(seedUser)),
  http.patch(apiUrl(auth.getMyUserDataUrl()), async ({ request }) => {
    const patch = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...seedUser, ...patch });
  }),
  http.delete(apiUrl(auth.getMyUserDataUrl()), () => new HttpResponse(null, { status: 204 })),

  http.post(apiUrl(auth.getUserListUrl()), () => HttpResponse.json(seedUser, { status: 201 })),
  http.post(apiUrl(auth.getUserActivationUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getUserActivationResendUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getSetPasswordUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getResetPasswordUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getResetPasswordConfirmUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getSetEmailUrl()), () => new HttpResponse(null, { status: 204 })),
  http.post(apiUrl(auth.getSetUsernameUrl()), () => new HttpResponse(null, { status: 204 })),
];
