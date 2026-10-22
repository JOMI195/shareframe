import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { classifyServerError, retryDelay } from '@/services/serverStatus';

const answered = (status: number, data: unknown = {}) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse);

const unanswered = (code: string) => new AxiosError('failed', code);

describe('classifyServerError', () => {
  it.each([502, 503, 504])('treats %i from the gateway as an outage', (status) => {
    expect(classifyServerError(answered(status))).toBe('unavailable');
  });

  it('recognises the maintenance switch', () => {
    expect(classifyServerError(answered(503, { maintenance: true }))).toBe('maintenance');
  });

  it('needs the flag itself, not just any 503 body', () => {
    expect(classifyServerError(answered(503, { maintenance: 'yes' }))).toBe('unavailable');
  });

  // The server answered, so it is up; the request was the problem.
  it.each([400, 401, 403, 404, 429, 500])('ignores %i', (status) => {
    expect(classifyServerError(answered(status))).toBeNull();
  });

  it('treats an unreachable server as an outage', () => {
    expect(classifyServerError(unanswered('ERR_NETWORK'))).toBe('unavailable');
  });

  // A long upload can time out while the server is fine, and cancelling is the caller's choice.
  it.each(['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED'])('ignores %s', (code) => {
    expect(classifyServerError(unanswered(code))).toBeNull();
  });

  it('ignores errors that did not come from axios', () => {
    expect(classifyServerError(new Error('boom'))).toBeNull();
  });
});

describe('retryDelay', () => {
  const middle = () => 0.5;

  it('doubles from five seconds up to a minute', () => {
    expect([0, 1, 2, 3, 4, 5].map((attempt) => retryDelay(attempt, middle))).toEqual([
      5000, 10000, 20000, 40000, 60000, 60000,
    ]);
  });

  it('spreads each delay by a quarter in both directions', () => {
    expect(retryDelay(0, () => 0)).toBe(3750);
    expect(retryDelay(0, () => 1)).toBe(6250);
  });
});
