import { startStack } from './stack';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8100/api';

const reachable = async (url: string) => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
};

const waitFor = async (label: string, url: string, attempts = 40) => {
  for (let i = 0; i < attempts; i++) {
    if (await reachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`${label} is not reachable at ${url}.`);
};

export default async function globalSetup() {
  await startStack();
  // `up --wait` already gates on the healthcheck; this also covers E2E_NO_STACK.
  await waitFor('The backend', `${API_URL}/auth/csrf/`);
}
