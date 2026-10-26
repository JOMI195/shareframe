import { expect } from '@playwright/test';

const MAILHOG_URL = process.env.E2E_MAILHOG_URL ?? 'http://127.0.0.1:8125';

type Headers = Record<string, string[]>;
type MimePart = { Headers: Headers; Body: string; MIME: { Parts: MimePart[] } | null };
type MailhogMessage = {
  Created: string;
  Content: { Headers: Headers; Body: string };
  MIME: { Parts: MimePart[] } | null;
};

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

const qpBytes = (body: string) => {
  const source = Buffer.from(body.replace(/=\r?\n/g, ''), 'utf8');
  const bytes: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const hex = source.subarray(i + 1, i + 3).toString('latin1');
    if (source[i] === 0x3d && /^[0-9A-F]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(source[i]);
    }
  }
  return Buffer.from(bytes);
};

const decodeBody = (headers: Headers, body: string) => {
  const encoding = header(headers, 'Content-Transfer-Encoding').toLowerCase();
  if (encoding === 'base64') return Buffer.from(body, 'base64').toString('utf8');
  if (encoding === 'quoted-printable') return qpBytes(body).toString('utf8');
  return body;
};

// RFC 2047 encoded words, as Python writes non-ASCII subjects.
const decodeHeader = (value: string) =>
  value
    .replace(/\?=\s+=\?/g, '?==?')
    .replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, _charset, kind: string, text: string) =>
      kind.toLowerCase() === 'b'
        ? Buffer.from(text, 'base64').toString('utf8')
        : qpBytes(text.replace(/_/g, ' ')).toString('utf8'),
    );

const leafParts = (message: MailhogMessage): MimePart[] => {
  const walk = (parts: MimePart[]): MimePart[] =>
    parts.flatMap((part) => (part.MIME?.Parts?.length ? walk(part.MIME.Parts) : [part]));
  return message.MIME ? walk(message.MIME.Parts) : [{ Headers: message.Content.Headers, Body: message.Content.Body, MIME: null }];
};

const toMail = (message: MailhogMessage): Mail => {
  const parts = leafParts(message);
  const partOf = (type: string) => {
    const part = parts.find((p) => header(p.Headers, 'Content-Type').startsWith(type));
    return part ? decodeBody(part.Headers, part.Body) : '';
  };
  return {
    created: new Date(message.Created),
    subject: decodeHeader(header(message.Content.Headers, 'Subject')),
    headers: message.Content.Headers,
    text: partOf('text/plain'),
    html: partOf('text/html'),
  };
};

/** Newest first. */
export const mailsTo = async (address: string) => {
  const response = await fetch(`${MAILHOG_URL}/api/v2/search?kind=to&query=${encodeURIComponent(address)}`);
  const body = (await response.json()) as { items: MailhogMessage[] };
  return body.items.map(toMail);
};

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
  let found: Mail | undefined;
  await expect
    .poll(
      async () => {
        // Mailhog stamps with second precision.
        const after = since ? since.getTime() - 1_000 : 0;
        found = (await mailsTo(address)).find((mail) => mail.subject === subject && mail.created.getTime() >= after);
        return found !== undefined;
      },
      { message: `mail "${subject}" to ${address}`, timeout: 30_000 },
    )
    .toBe(true);

  const mail = found!;
  expect(mail.text, 'plain-text part').not.toBe('');
  expect(mail.html, 'HTML part').toContain('<html');
  expect(EMOJI.test(mail.subject + mail.text + mail.html), 'emoji in the mail').toBe(false);
  expect(header(mail.headers, 'List-Unsubscribe') !== '', 'List-Unsubscribe header').toBe(unsubscribable);
  expect(header(mail.headers, 'List-Unsubscribe-Post') !== '', 'List-Unsubscribe-Post header').toBe(unsubscribable);
  return mail;
};

export const expectNoMail = async (address: string, subject: string, since: Date) => {
  const mails = await mailsTo(address);
  expect(mails.filter((mail) => mail.subject === subject && mail.created.getTime() >= since.getTime() - 1_000)).toEqual([]);
};

/** The first URL in the plain-text part that contains `path`. */
export const linkIn = (mail: Mail, path: string) => {
  const url = mail.text.match(/https?:\/\/\S+/g)?.find((candidate) => candidate.includes(path));
  expect(url, `link containing ${path}`).toBeDefined();
  return url!;
};

export const unsubscribeUrl = (mail: Mail) => header(mail.headers, 'List-Unsubscribe').replace(/^<|>$/g, '');
