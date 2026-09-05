import { afterEach, describe, expect, it } from 'vitest';
import { fileToSha256Hex } from '@/common/utils/files/getFileHash.helpers';


const originalSubtle = globalThis.crypto?.subtle;

const withoutSubtle = () =>
  Object.defineProperty(globalThis.crypto, 'subtle', { configurable: true, value: undefined });

afterEach(() => {
  Object.defineProperty(globalThis.crypto, 'subtle', { configurable: true, value: originalSubtle });
});

const file = (content: string) => new File([content], 'photo.jpg', { type: 'image/jpeg' });

describe('fileToSha256Hex', () => {
  it('returns lowercase hex of the expected length', async () => {
    const hash = await fileToSha256Hex(file('hallo'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  // Plain HTTP on a LAN IP has no crypto.subtle; both paths must agree.
  it('produces the identical hash with and without crypto.subtle', async () => {
    const viaSubtle = await fileToSha256Hex(file('hallo'));
    withoutSubtle();
    const viaFallback = await fileToSha256Hex(file('hallo'));

    expect(viaFallback).toBe(viaSubtle);
  });

  it('hashes content, not the file name', async () => {
    const a = await fileToSha256Hex(new File(['same'], 'a.jpg'));
    const b = await fileToSha256Hex(new File(['same'], 'b.png'));
    const c = await fileToSha256Hex(new File(['different'], 'a.jpg'));

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('hashes an empty file', async () => {
    await expect(fileToSha256Hex(new File([], 'empty.jpg'))).resolves.toMatch(/^[0-9a-f]{64}$/);
  });
});
