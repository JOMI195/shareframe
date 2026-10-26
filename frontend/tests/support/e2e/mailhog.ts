import { expect } from '@playwright/test';

const MAILHOG_URL = process.env.E2E_MAILHOG_URL ?? 'http://127.0.0.1:8125';

type MailhogMessage = { Raw: { To: string[]; Data: string } };

// Undoes quoted-printable soft breaks and escapes, so links read back whole.
const decode = (raw: string) => raw.replace(/=\r?\n/g, '').replace(/=3D/g, '=');

const mailsTo = async (address: string) => {
  const response = await fetch(`${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(address)}`);
  const body = (await response.json()) as { items: MailhogMessage[] };
  return body.items.map((item) => decode(item.Raw.Data));
};

/** Waits for the newest mail to `address` that matches `pattern` and returns the first capture group. */
export const readFromMail = async (address: string, pattern: RegExp) => {
  let match: RegExpMatchArray | null = null;
  await expect
    .poll(
      async () => {
        match = (await mailsTo(address)).map((mail) => mail.match(pattern)).find(Boolean) ?? null;
        return match !== null;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return match![1];
};

export const hasMailTo = async (address: string, pattern: RegExp) =>
  (await mailsTo(address)).some((mail) => pattern.test(mail));
