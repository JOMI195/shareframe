import { type APIRequestContext, request } from '@playwright/test';
import { NGINX_URL } from './stack';

interface Account {
  email: string;
  password: string;
}

const csrfOf = async (context: APIRequestContext) =>
  (await context.storageState()).cookies.find((cookie) => cookie.name === 'csrftoken')?.value ?? '';

/** A cookie-carrying API client through nginx, the way the SPA talks to the backend. */
export const apiClient = async () => {
  const context = await request.newContext({ baseURL: NGINX_URL });
  await context.get('/api/auth/csrf/');

  const post = async (url: string, data?: unknown, headers: Record<string, string> = {}) =>
    context.post(url, { data, headers: { 'X-CSRFToken': await csrfOf(context), ...headers } });

  const postMultipart = async (url: string, multipart: NonNullable<Parameters<APIRequestContext['post']>[1]>['multipart']) =>
    context.post(url, { multipart, headers: { 'X-CSRFToken': await csrfOf(context) } });

  return {
    context,
    post,
    postMultipart,
    signIn: (account: Account) => post('/api/auth/jwt/create/', { email: account.email, password: account.password }),
    dispose: () => context.dispose(),
  };
};

export type ApiClient = Awaited<ReturnType<typeof apiClient>>;

export const signedInClient = async (account: Account) => {
  const client = await apiClient();
  const response = await client.signIn(account);
  if (!response.ok()) throw new Error(`sign-in as ${account.email}: HTTP ${response.status()}`);
  return client;
};
