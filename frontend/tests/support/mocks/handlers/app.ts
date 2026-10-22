import { http, HttpResponse } from 'msw';
import * as app from '@/assets/endpoints/api/appEndpoints';
import { getVersionFileUrl } from '@/assets/endpoints/app/appEndpoints';
import { apiUrl } from '../apiUrl';

export const appHandlers = [
  http.get(apiUrl(app.getHealthUrl()), () => HttpResponse.json({ status: 'ok' })),
  // Served by the frontend container, not the API, so any origin matches.
  http.get(`*${getVersionFileUrl()}`, () => HttpResponse.json({ version: 'test-build', force: false })),
];
