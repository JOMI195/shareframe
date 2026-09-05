import { http, HttpResponse } from 'msw';
import * as app from '@/assets/endpoints/api/appEndpoints';
import { apiUrl } from '../apiUrl';

export const appHandlers = [
  http.get(apiUrl(app.getAppVersionUrl()), () => HttpResponse.json({ version: 'test-build' })),
];
