import { describe, expect, it, vi } from 'vitest';
import { materializeFile, materializeFiles } from '@/common/utils/files/fileCopy.helpers';

const file = (name: string, bytes: number[] = [1, 2, 3]) =>
  new File([new Uint8Array(bytes)], name, { type: 'image/jpeg', lastModified: 1_700_000_000_000 });

describe('materializeFile', () => {
  it('returns an independent file with the same identity and bytes', async () => {
    const source = file('a.jpg');

    const copy = await materializeFile(source);

    expect(copy).not.toBe(source);
    expect([copy.name, copy.type, copy.size, copy.lastModified]).toEqual([
      source.name,
      source.type,
      source.size,
      source.lastModified,
    ]);
    expect(new Uint8Array(await copy.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('survives a source that can no longer be read', async () => {
    const source = file('a.jpg');
    const copy = await materializeFile(source);
    vi.spyOn(source, 'arrayBuffer').mockRejectedValue(new Error('gone'));

    expect(new Uint8Array(await copy.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe('materializeFiles', () => {
  it('copies what it can and reports the rest by error name', async () => {
    const ok = file('gut.jpg');
    const broken = file('kaputt.jpg');
    vi.spyOn(broken, 'arrayBuffer').mockRejectedValue(
      Object.assign(new Error('boom'), { name: 'NotReadableError' }),
    );

    const { copies, failures } = await materializeFiles([ok, broken]);

    expect(copies.map(copy => copy.name)).toEqual(['gut.jpg']);
    expect(failures).toEqual([{ file: broken, reason: 'NotReadableError' }]);
  });

  it('reads one file at a time', async () => {
    let concurrent = 0;
    let peak = 0;
    const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')];
    files.forEach(entry =>
      vi.spyOn(entry, 'arrayBuffer').mockImplementation(async () => {
        peak = Math.max(peak, ++concurrent);
        await Promise.resolve();
        concurrent--;
        return new Uint8Array([1, 2, 3]).buffer;
      }),
    );

    await materializeFiles(files);

    expect(peak).toBe(1);
  });
});
