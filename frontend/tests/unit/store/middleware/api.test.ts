import { describe, expect, it, vi } from 'vitest';
import { HttpResponse, http as mswHttp } from 'msw';
import apiMiddleware from '@/store/middleware/api';
import { apiFailed, apiRequest, apiSuccess } from '@/common/utils/constants/api.constants';
import { server } from '@tests/mocks/server';
import { apiUrl } from '@tests/mocks/apiUrl';

const URL = 'frames/';

const run = async (action: unknown) => {
  const dispatch = vi.fn();
  const next = vi.fn();
  const result = await apiMiddleware({ dispatch, getState: vi.fn() } as never)(next)(action);
  return { dispatch, next, result };
};

const types = (dispatch: ReturnType<typeof vi.fn>) =>
  dispatch.mock.calls.map(([action]) => action.type);

describe('non-api actions', () => {
  it('pass straight through untouched', async () => {
    const action = { type: 'ui/somethingHappened' };
    const { dispatch, next } = await run(action);

    expect(next).toHaveBeenCalledWith(action);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([[null], [undefined], ['a string'], [{ type: 'api/request' }]])(
    'passes %o through when it is not a valid api request',
    async (action) => {
      const { next, dispatch } = await run(action);
      expect(next).toHaveBeenCalledWith(action);
      expect(dispatch).not.toHaveBeenCalled();
    },
  );
});

describe('successful requests', () => {
  it('dispatches onStart before forwarding the action', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.json([{ id: 1 }])));

    const order: string[] = [];
    const dispatch = vi.fn((action) => order.push(`dispatch:${action.type}`));
    const next = vi.fn(() => order.push('next'));

    await apiMiddleware({ dispatch, getState: vi.fn() } as never)(next)(
      apiRequest({ url: URL, onStart: 'frames/framesRequested', onSuccess: 'frames/framesReceived' }),
    );

    expect(order[0]).toBe('dispatch:frames/framesRequested');
    expect(order[1]).toBe('next');
  });

  it('dispatches apiSuccess and onSuccess with the response body', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.json([{ id: 1 }])));

    const { dispatch, result } = await run(
      apiRequest({ url: URL, onSuccess: 'frames/framesReceived' }),
    );

    expect(types(dispatch)).toEqual([apiSuccess.type, 'frames/framesReceived']);
    expect(dispatch.mock.calls[1][0].payload).toEqual([{ id: 1 }]);
    expect(result).toEqual([{ id: 1 }]);
  });

  // registerDialog and createDialog await the middleware's return value.
  it('returns onSuccessPayload when given, in place of the body', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.json([{ id: 1 }])));

    const { dispatch, result } = await run(
      apiRequest({ url: URL, onSuccess: 'frames/framesReceived', onSuccessPayload: 'fixed' }),
    );

    expect(result).toBe('fixed');
    expect(dispatch.mock.calls[1][0].payload).toBe('fixed');
  });

  it('forwards the onStart payload', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.json([])));

    const { dispatch } = await run(
      apiRequest({ url: URL, onStart: 'images/createImagePending', onStartPayload: 'photo.jpg' }),
    );

    expect(dispatch.mock.calls[0][0].payload).toBe('photo.jpg');
  });

  it('defaults the onStart payload to null', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.json([])));

    const { dispatch } = await run(apiRequest({ url: URL, onStart: 'frames/framesRequested' }));

    expect(dispatch.mock.calls[0][0].payload).toBeNull();
  });

  it('sends the configured method, body and headers', async () => {
    const seen: { method?: string; body?: unknown; contentType?: string | null } = {};
    server.use(
      mswHttp.post(apiUrl(URL), async ({ request }) => {
        seen.method = request.method;
        seen.contentType = request.headers.get('content-type');
        seen.body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );

    await run(
      apiRequest({ url: URL, method: 'post', data: { a: 1 }, headers: { 'X-Test': 'yes' } }),
    );

    expect(seen.method).toBe('POST');
    expect(seen.body).toEqual({ a: 1 });
  });
});

describe('failed requests', () => {
  const fail = async (response: Response, extra: Record<string, unknown> = {}) => {
    server.use(mswHttp.get(apiUrl(URL), () => response));
    return run(apiRequest({ url: URL, onError: 'frames/framesRequestFailed', ...extra }));
  };

  it('dispatches apiFailed and onError instead of rejecting', async () => {
    const { dispatch, result } = await fail(HttpResponse.json({ detail: 'Kaputt' }, { status: 400 }));

    expect(types(dispatch)).toEqual([apiFailed.type, 'frames/framesRequestFailed']);
    expect(result).toBe('Kaputt');
  });

  it('returns onErrorPayload when given', async () => {
    const { result } = await fail(HttpResponse.json({ detail: 'Kaputt' }, { status: 400 }), {
      onErrorPayload: 'fixed',
    });

    expect(result).toBe('fixed');
  });

  it.each([
    ['413 with an html body', HttpResponse.text('<html>too large</html>', { status: 413 }), 'Die Datei ist zu groß.'],
    [
      '429 with the DRF throttle detail',
      HttpResponse.json({ detail: 'Request was throttled.' }, { status: 429 }),
      'Zu viele Versuche. Bitte warte kurz.',
    ],
    ['a detail field', HttpResponse.json({ detail: 'Kein Zugriff' }, { status: 400 }), 'Kein Zugriff'],
    // DRF's English defaults for these never reach the user.
    ['a 403', HttpResponse.json({ detail: 'You do not have permission.' }, { status: 403 }), 'Dafür fehlt dir die Berechtigung.'],
    ['a 404', HttpResponse.json({ detail: 'Not found.' }, { status: 404 }), 'Das gibt es nicht mehr.'],
    ['a plain string body', HttpResponse.text('Kaputt', { status: 400 }), 'Kaputt'],
    [
      'the first field of a DRF error object',
      HttpResponse.json({ email: ['Ungültige Email'] }, { status: 400 }),
      'Ungültige Email',
    ],
    ['a first field holding a bare string', HttpResponse.json({ email: 'Ungültig' }, { status: 400 }), 'Ungültig'],
  ])('extracts the message from %s', async (_name, response, expected) => {
    const { dispatch } = await fail(response);
    expect(dispatch.mock.calls[0][0].payload).toBe(expected);
  });

  // An HTML error page must not be shown to the user verbatim.
  it('reports a server error in German instead of its html page', async () => {
    const { dispatch } = await fail(HttpResponse.text('<html>nginx</html>', { status: 502 }));

    expect(dispatch.mock.calls[0][0].payload).toBe('Auf dem Server ist ein Fehler aufgetreten.');
  });

  it('prefers detail over the other fields', async () => {
    const { dispatch } = await fail(
      HttpResponse.json({ email: ['Ungültig'], detail: 'Kein Zugriff' }, { status: 400 }),
    );

    expect(dispatch.mock.calls[0][0].payload).toBe('Kein Zugriff');
  });

  it('reports a network failure', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.error()));

    const { dispatch } = await run(apiRequest({ url: URL, onError: 'frames/framesRequestFailed' }));

    expect(dispatch.mock.calls[0][0].type).toBe(apiFailed.type);
    expect(dispatch.mock.calls[0][0].payload).toBe('Der Server ist gerade nicht erreichbar.');
  });

  it('tells an offline device that it is offline', async () => {
    server.use(mswHttp.get(apiUrl(URL), () => HttpResponse.error()));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const { dispatch } = await run(apiRequest({ url: URL, onError: 'frames/framesRequestFailed' }));

    expect(dispatch.mock.calls[0][0].payload).toBe('Du bist offline. Prüfe deine Internetverbindung.');
  });

  it('translates a known error code and passes it on as meta', async () => {
    const { dispatch, result } = await fail(
      HttpResponse.json({ detail: 'Friendship request already sent', code: 'friend_request_pending' }, { status: 400 }),
    );

    expect(result).toBe('Du hast dieser Person schon eine Anfrage geschickt.');
    expect(dispatch.mock.calls[1][0].meta).toEqual({ code: 'friend_request_pending' });
  });

  it('keeps the backend text for an unknown code', async () => {
    const { result } = await fail(HttpResponse.json({ detail: 'Kaputt', code: 'something_new' }, { status: 400 }));

    expect(result).toBe('Kaputt');
  });
});
