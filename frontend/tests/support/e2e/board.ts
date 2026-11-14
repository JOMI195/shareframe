import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './stack';

interface SeedFrame {
  seed_b64: string;
  owner_username: string | null;
}

const SEED_FRAMES = path.resolve(import.meta.dirname, '../../../../seed-data/frames.json');
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32 = (bytes: Buffer) => {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
};

const keyOf = (seedB64: string) =>
  createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(seedB64, 'base64')]),
    format: 'der',
    type: 'pkcs8',
  });

// Derives the serial the same way the backend does.
const serialOf = (seedB64: string) => {
  const spki = createPublicKey(keyOf(seedB64)).export({ format: 'der', type: 'spki' });
  const digest = createHash('sha256').update(spki.subarray(-32)).digest().subarray(0, 10);
  return base32(digest).match(/.{4}/g)!.join('-');
};

const spareSeed = () => {
  const frames = JSON.parse(readFileSync(SEED_FRAMES, 'utf8')) as SeedFrame[];
  return frames.find((frame) => frame.owner_username === null)!.seed_b64;
};

/** Asks for a token the way an unowned board does and returns the code its panel would show. */
export const spareFrameClaim = async (request: APIRequestContext) => {
  const seedB64 = spareSeed();
  const serial = serialOf(seedB64);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(null, Buffer.from(`${serial}:${timestamp}`), keyOf(seedB64)).toString('base64');

  const response = await request.post(`${API_URL}/frames/obtain-frame-token/`, {
    headers: { Authorization: `Ed25519-Sig ${signature}`, 'X-Frame-ID': serial, 'X-Timestamp': timestamp },
    data: {},
  });
  const body = (await response.json()) as { claim_code: string };
  return { serial, code: body.claim_code };
};
