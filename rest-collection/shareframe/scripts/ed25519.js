const crypto = require('crypto');

const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function privateKeyFromSeed(seedB64) {
  const seed = Buffer.from(seedB64, 'base64');
  if (seed.length !== 32) throw new Error('ed25519 private key seed must be 32 bytes');
  return crypto.createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8'
  });
}

function publicKeyRaw(seedB64) {
  const spki = crypto.createPublicKey(privateKeyFromSeed(seedB64)).export({ type: 'spki', format: 'der' });
  return spki.subarray(spki.length - 32);
}

function base32(buf) {
  let out = '';
  let bits = 0;
  let acc = 0;
  for (const byte of buf) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32_ALPHABET[(acc >> bits) & 0x1f];
    }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) out += B32_ALPHABET[(acc << (5 - bits)) & 0x1f];
  return out;
}

function sign(message, seedB64) {
  return crypto.sign(null, Buffer.from(message), privateKeyFromSeed(seedB64)).toString('base64');
}

/** Mirrors FrameIdentity::fingerprint (board) and public_key_fingerprint (backend). */
function serial(seedB64) {
  const digest = crypto.createHash('sha256').update(publicKeyRaw(seedB64)).digest().subarray(0, 10);
  const b32 = base32(digest);
  return b32.match(/.{1,4}/g).join('-');
}

function publicKeyB64(seedB64) {
  return publicKeyRaw(seedB64).toString('base64');
}

function authHeaders(seedB64, frameId) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const id = frameId || serial(seedB64);
  return {
    Authorization: `Ed25519-Sig ${sign(`${id}:${timestamp}`, seedB64)}`,
    'X-Frame-ID': id,
    'X-Timestamp': timestamp,
    'Content-Type': 'application/json'
  };
}

module.exports = { sign, serial, publicKeyB64, authHeaders };
