import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpResponse, http as mswHttp } from 'msw';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';
import {
  getCsrfUrl,
  getTokenCreateUrl,
  getTokenLogoutUrl,
  getTokenRefreshUrl,
} from '@/assets/endpoints/api/authEndpoints';

const PROTECTED = 'frames/';

// httpService keeps module-level state (authFailureCount, isRefreshing,
// refreshSubscribers) with no reset hook, so each case gets a fresh module graph.
const loadHttp = async () => {
  vi.resetModules();
  const { default: http } = await import('@/services/httpService');
  const dispatch = vi.fn();
  const persistor = { flush: vi.fn().mockResolvedValue(undefined) };
  http.apiSetup({ dispatch } as never, persistor as never);
  return { http, dispatch, persistor };
};

const counting = () => {
  const calls: string[] = [];
  return {
    calls,
    handler: (path: string, response: () => Response) =>
      mswHttp.all(apiUrl(path), () => {
        calls.push(path);
        return response();
      }),
  };
};

beforeEach(() => {
  window.location.href = 'http://localhost/';
});

describe('401 refresh flow', () => {
  it('refreshes once and replays the original request', async () => {
    const { calls, handler } = counting();
    let first = true;
    server.use(
      handler(PROTECTED, () =>
        first ? ((first = false), HttpResponse.json({ detail: 'expired' }, { status: 401 })) : HttpResponse.json([{ id: 1 }]),
      ),
      handler(getTokenRefreshUrl(), () => HttpResponse.json({})),
    );

    const { http, dispatch } = await loadHttp();
    const response = await http.get(PROTECTED);

    expect(response.data).toEqual([{ id: 1 }]);
    expect(calls).toEqual([PROTECTED, getTokenRefreshUrl(), PROTECTED]);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'user/tokenRefreshFulfilled' }));
  });

  it('refreshes only once for concurrent 401s', async () => {
    const { calls, handler } = counting();
    const expired = new Set([1, 2]);
    let attempt = 0;
    server.use(
      handler(PROTECTED, () => {
        attempt += 1;
        return expired.delete(attempt)
          ? HttpResponse.json({ detail: 'expired' }, { status: 401 })
          : HttpResponse.json([{ id: attempt }]);
      }),
      handler(getTokenRefreshUrl(), () => HttpResponse.json({})),
    );

    const { http } = await loadHttp();
    const responses = await Promise.all([http.get(PROTECTED), http.get(PROTECTED)]);

    expect(responses).toHaveLength(2);
    expect(calls.filter((c) => c === getTokenRefreshUrl())).toHaveLength(1);
  });

  it('retries a request only once', async () => {
    const { calls, handler } = counting();
    server.use(
      handler(PROTECTED, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      handler(getTokenRefreshUrl(), () => HttpResponse.json({})),
    );

    const { http } = await loadHttp();
    await expect(http.get(PROTECTED)).rejects.toThrow();

    expect(calls.filter((c) => c === PROTECTED)).toHaveLength(2);
  });
});

describe('logout after repeated auth failures', () => {
  it('signs out once the failure count reaches the maximum', async () => {
    const { calls, handler } = counting();
    server.use(
      handler(PROTECTED, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      handler(getTokenRefreshUrl(), () => HttpResponse.json({ detail: 'invalid' }, { status: 401 })),
      handler(getTokenLogoutUrl(), () => HttpResponse.json({})),
    );

    const { http, dispatch, persistor } = await loadHttp();

    await expect(http.get(PROTECTED)).rejects.toThrow();
    await expect(http.get(PROTECTED)).rejects.toThrow();
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'user/signedOut' })));

    expect(calls).toContain(getTokenLogoutUrl());
    expect(persistor.flush).toHaveBeenCalled();
    expect(window.location.href).toBe('/auth/sign-in/');
  });

  // One expired session must not end it: the refresh failure counts once, and
  // MAX_AUTH_FAILURES is 2.
  it('keeps the session after a single failed refresh', async () => {
    const { calls, handler } = counting();
    server.use(
      handler(PROTECTED, () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      handler(getTokenRefreshUrl(), () => HttpResponse.json({ detail: 'invalid' }, { status: 401 })),
      handler(getTokenLogoutUrl(), () => HttpResponse.json({})),
    );

    const { http, dispatch } = await loadHttp();
    await expect(http.get(PROTECTED)).rejects.toThrow();

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'user/signedOut' }));
    expect(calls).not.toContain(getTokenLogoutUrl());
  });

  it('resets the failure count after a successful response', async () => {
    let failNext = true;
    server.use(
      mswHttp.all(apiUrl(PROTECTED), () =>
        failNext ? HttpResponse.json({ detail: 'expired' }, { status: 401 }) : HttpResponse.json({ ok: true }),
      ),
      mswHttp.all(apiUrl(getTokenRefreshUrl()), () => HttpResponse.json({ detail: 'invalid' }, { status: 401 })),
      mswHttp.all(apiUrl(getTokenLogoutUrl()), () => HttpResponse.json({})),
    );

    const { http, dispatch } = await loadHttp();

    await expect(http.get(PROTECTED)).rejects.toThrow();
    failNext = false;
    await http.get(PROTECTED);
    failNext = true;
    await expect(http.get(PROTECTED)).rejects.toThrow();

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'user/signedOut' }));
  });

  // Bad credentials are a form error, not an expired session.
  it('never signs out because of rejected sign-in attempts', async () => {
    server.use(
      mswHttp.all(apiUrl(getTokenCreateUrl()), () => HttpResponse.json({ detail: 'bad' }, { status: 401 })),
      mswHttp.all(apiUrl(getTokenLogoutUrl()), () => HttpResponse.json({})),
    );

    const { http, dispatch } = await loadHttp();
    await expect(http.post(getTokenCreateUrl())).rejects.toThrow();
    await expect(http.post(getTokenCreateUrl())).rejects.toThrow();
    await expect(http.post(getTokenCreateUrl())).rejects.toThrow();

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'user/signedOut' }));
  });
});

describe('auth endpoints', () => {
  // Retrying these would loop: the refresh call itself would trigger a refresh.
  it.each([[getTokenCreateUrl()], [getTokenRefreshUrl()], [getTokenLogoutUrl()]])(
    'never retries %s on a 401',
    async (endpoint) => {
      const { calls, handler } = counting();
      server.use(handler(endpoint, () => HttpResponse.json({ detail: 'nope' }, { status: 401 })));

      const { http } = await loadHttp();
      await expect(http.post(endpoint)).rejects.toThrow();

      expect(calls.filter((c) => c === endpoint)).toHaveLength(1);
    },
  );
});

describe('CSRF re-seeding', () => {
  it('fetches a fresh token and replays the request once', async () => {
    const { calls, handler } = counting();
    let first = true;
    server.use(
      handler(PROTECTED, () =>
        first
          ? ((first = false), HttpResponse.json({ detail: 'CSRF Failed: token missing' }, { status: 403 }))
          : HttpResponse.json([{ id: 1 }]),
      ),
      handler(getCsrfUrl(), () => HttpResponse.json({ detail: 'ok' })),
    );

    const { http } = await loadHttp();
    const response = await http.post(PROTECTED, {});

    expect(response.data).toEqual([{ id: 1 }]);
    expect(calls).toEqual([PROTECTED, getCsrfUrl(), PROTECTED]);
  });

  it('gives up after one csrf retry', async () => {
    const { calls, handler } = counting();
    server.use(
      handler(PROTECTED, () => HttpResponse.json({ detail: 'CSRF Failed' }, { status: 403 })),
      handler(getCsrfUrl(), () => HttpResponse.json({ detail: 'ok' })),
    );

    const { http } = await loadHttp();
    await expect(http.post(PROTECTED, {})).rejects.toThrow();

    expect(calls.filter((c) => c === getCsrfUrl())).toHaveLength(1);
  });

  it('ignores a 403 that is not a CSRF failure', async () => {
    const { calls, handler } = counting();
    server.use(
      handler(PROTECTED, () => HttpResponse.json({ detail: 'Kein Zugriff' }, { status: 403 })),
      handler(getCsrfUrl(), () => HttpResponse.json({ detail: 'ok' })),
    );

    const { http } = await loadHttp();
    await expect(http.post(PROTECTED, {})).rejects.toThrow();

    expect(calls).toEqual([PROTECTED]);
  });
});
