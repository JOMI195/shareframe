import { isAxiosError } from 'axios';

export type ServerOutage = 'maintenance' | 'unavailable' | null;

const OUTAGE_STATUSES = [502, 503, 504];
const FIRST_RETRY_MS = 5000;
const MAX_RETRY_MS = 60000;

// Only the server being gone counts, never an answer it gave about the request itself.
export const classifyServerError = (error: unknown): ServerOutage => {
  if (!isAxiosError(error)) return null;
  const { response } = error;
  if (!response) return error.code === 'ERR_NETWORK' ? 'unavailable' : null;
  if (response.status === 503 && response.data?.maintenance === true) return 'maintenance';
  return OUTAGE_STATUSES.includes(response.status) ? 'unavailable' : null;
};

// Jitter spreads the retries of many open tabs, so they do not hit a recovering server at once.
export const retryDelay = (attempt: number, random: () => number = Math.random) =>
  Math.min(MAX_RETRY_MS, FIRST_RETRY_MS * 2 ** attempt) * (0.75 + random() * 0.5);
