import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import ServerStatusNotice from '@/common/components/serverStatus/serverStatusNotice';
import { getHealthUrl } from '@/assets/endpoints/api/appEndpoints';
import http from '@/services/httpService';
import axiosInstance from '@/services/api';
import { setupStore } from '@/store/setupStore';
import { buildState } from '@tests/helpers/preloadedState';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';

const ANY_ROUTE = 'frames/';
const OUTAGE = /ShareFrame ist gerade nicht erreichbar/;
const MAINTENANCE = 'Wartung';
const MAINTENANCE_BODY = { detail: 'Service temporarily unavailable.', maintenance: true };

const renderNotice = () => {
  const store = setupStore(buildState());
  http.apiSetup(store as never, { flush: vi.fn().mockResolvedValue(undefined) } as never);
  renderWithProviders(<ServerStatusNotice />, { store });
};

const callFailing = (response: () => Response) => {
  server.use(mswHttp.get(apiUrl(ANY_ROUTE), response));
  return http.get(ANY_ROUTE).catch(() => undefined);
};

const countHealthCalls = (response: () => Response = () => HttpResponse.json({ status: 'ok' })) => {
  const calls = { count: 0 };
  server.use(mswHttp.get(apiUrl(getHealthUrl()), () => {
    calls.count += 1;
    return response();
  }));
  return calls;
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // No jitter, so the delays are exactly 5 s, 10 s, 20 s, ...
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  axiosInstance.interceptors.response.clear();
  vi.useRealTimers();
});

describe('ServerStatusNotice', () => {
  it('shows nothing and does not poll while the server answers', async () => {
    const health = countHealthCalls();
    renderNotice();

    await vi.advanceTimersByTimeAsync(60000);

    expect(screen.queryByText(OUTAGE)).not.toBeInTheDocument();
    expect(health.count).toBe(0);
  });

  it.each([
    ['a 502 from the gateway', () => new HttpResponse(null, { status: 502 })],
    ['an unreachable server', () => HttpResponse.error()],
  ])('reports %s and clears once the health check passes', async (_case, response) => {
    renderNotice();

    await callFailing(response);
    expect(await screen.findByText(OUTAGE)).toBeVisible();

    await vi.advanceTimersByTimeAsync(5000);

    await waitFor(() => expect(screen.queryByText(OUTAGE)).not.toBeInTheDocument());
  });

  // A 500 means the server is up and failed this request, which the caller reports.
  it.each([500, 404])('stays quiet on a %i', async (status) => {
    renderNotice();

    await callFailing(() => HttpResponse.json({ detail: 'x' }, { status }));
    await vi.advanceTimersByTimeAsync(100);

    expect(screen.queryByText(OUTAGE)).not.toBeInTheDocument();
  });

  it('backs off while the server stays away', async () => {
    const health = countHealthCalls(() => new HttpResponse(null, { status: 502 }));
    renderNotice();
    await callFailing(() => new HttpResponse(null, { status: 502 }));

    await vi.advanceTimersByTimeAsync(5000);
    expect(health.count).toBe(1);

    await vi.advanceTimersByTimeAsync(9000);
    expect(health.count).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(health.count).toBe(2);
    expect(screen.getByText(OUTAGE)).toBeVisible();
  });

  it('blocks the app during maintenance and lets go when it ends', async () => {
    let maintenance = true;
    countHealthCalls(() => (maintenance
      ? HttpResponse.json(MAINTENANCE_BODY, { status: 503 })
      : HttpResponse.json({ status: 'ok' })));
    renderNotice();

    await callFailing(() => HttpResponse.json(MAINTENANCE_BODY, { status: 503 }));
    expect(await screen.findByRole('dialog', { name: MAINTENANCE })).toBeVisible();
    expect(screen.queryByText(OUTAGE)).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);
    expect(screen.getByRole('dialog', { name: MAINTENANCE })).toBeVisible();

    maintenance = false;
    await vi.advanceTimersByTimeAsync(10000);

    await waitFor(() => expect(screen.queryByRole('dialog', { name: MAINTENANCE })).not.toBeInTheDocument());
  });

  it('treats a plain 503 as an outage, not as maintenance', async () => {
    renderNotice();

    await callFailing(() => new HttpResponse(null, { status: 503 }));

    expect(await screen.findByText(OUTAGE)).toBeVisible();
    expect(screen.queryByRole('dialog', { name: MAINTENANCE })).not.toBeInTheDocument();
  });
});
