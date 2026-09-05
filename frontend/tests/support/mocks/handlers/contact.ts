import { http, HttpResponse } from 'msw';
import * as contact from '@/assets/endpoints/api/contactEndpoints';
import { apiUrl } from '../apiUrl';

export const contactHandlers = [
  http.post(apiUrl(contact.getContactUrl()), () => HttpResponse.json({ detail: 'ok' })),
];
