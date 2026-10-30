import { expect } from '@playwright/test';

const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:8125';

type Headers = Record<string, string[]>;
type Summary = { ID: string; Created: string; Subject: string; To: { Address: string }[] };

export type Mail = {
  created: Date;
  subject: string;
  headers: Headers;
  text: string;
  html: string;
};

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F}/u;

const header = (headers: Headers, name: string) =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]?.[0] ?? '';

const get = async <T>(path: string, as: 'json' | 'text' = 'json'): Promise<T> => {
  const response = await fetch(`${MAILPIT_URL}${path}`);
  expect(response.ok, `GET ${path}`).toBe(true);
  return (as === 'json' ? response.json() : response.text()) as Promise<T>;
};

/** Newest first. */
const summariesTo = async (address: string) => {
  const query = encodeURIComponent(`to:"${address}"`);
  const { messages } = await get<{ messages: Summary[] }>(`/api/v1/search?query=${query}`);
  return messages.filter((message) => message.To.some((to) => to.Address === address));
};

const load = async (summary: Summary): Promise<Mail> => {
  const [message, headers, raw] = await Promise.all([
    get<{ Text: string; HTML: string }>(`/api/v1/message/${summary.ID}`),
    get<Headers>(`/api/v1/message/${summary.ID}/headers`),
    get<string>(`/api/v1/message/${summary.ID}/raw`, 'text'),
  ]);
  return {
    created: new Date(summary.Created),
    subject: summary.Subject,
    headers,
    // Mailpit derives Text from the HTML when there is no plain-text part.
    text: /^Content-Type:\s*text\/plain/im.test(raw) ? message.Text : '',
    html: message.HTML,
  };
};

const matching = async (address: string, subject: string, since?: Date) =>
  (await summariesTo(address)).filter(
    (message) => message.Subject === subject && new Date(message.Created).getTime() >= (since?.getTime() ?? 0),
  );

type Expected = {
  subject: string;
  /** Only mails sent after this moment count; defaults to any. */
  since?: Date;
  /** Notifications carry the one-click unsubscribe headers, account mails never do. */
  unsubscribable?: boolean;
};

/**
 * Waits for the mail and checks what every mail must have: a plain-text and an
 * HTML part, no emojis, and unsubscribe headers only on notifications.
 */
export const expectMail = async (address: string, { subject, since, unsubscribable = false }: Expected) => {
  let found: Summary | undefined;
  await expect
    .poll(
      async () => {
        found = (await matching(address, subject, since))[0];
        return found !== undefined;
      },
      { message: `mail "${subject}" to ${address}`, timeout: 30_000 },
    )
    .toBe(true);

  const mail = await load(found!);
  expect(mail.text, 'plain-text part').not.toBe('');
  expect(mail.html, 'HTML part').toContain('<html');
  expect(EMOJI.test(mail.subject + mail.text + mail.html), 'emoji in the mail').toBe(false);
  expect(header(mail.headers, 'List-Unsubscribe') !== '', 'List-Unsubscribe header').toBe(unsubscribable);
  expect(header(mail.headers, 'List-Unsubscribe-Post') !== '', 'List-Unsubscribe-Post header').toBe(unsubscribable);
  return mail;
};

export const expectNoMail = async (address: string, subject: string, since: Date) => {
  expect(await matching(address, subject, since)).toEqual([]);
};

/** The first URL in the plain-text part that contains `path`. */
export const linkIn = (mail: Mail, path: string) => {
  const url = mail.text.match(/https?:\/\/\S+/g)?.find((candidate) => candidate.includes(path));
  expect(url, `link containing ${path}`).toBeDefined();
  return url!;
};

export const unsubscribeUrl = (mail: Mail) => header(mail.headers, 'List-Unsubscribe').replace(/^<|>$/g, '');
