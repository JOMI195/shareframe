import { http, HttpResponse } from 'msw';
import * as accounts from '@/assets/endpoints/api/accountsEndpoints';
import { seedUser } from '../../fixtures';
import { apiUrl } from '../apiUrl';

export const accountHandlers = [
  http.get(apiUrl(accounts.getMyAccountUrl()), () => HttpResponse.json(seedUser.account)),
  http.patch(apiUrl(accounts.getMyAccountUrl()), async ({ request }) => {
    const patch = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...seedUser.account, ...patch });
  }),
];
