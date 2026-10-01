import { afterEach, describe, expect, it } from 'vitest';
import { hasSharedFiles, takeSharedFiles } from '@/common/utils/pwa/sharedFiles';
import { clearSharedFilesStub, stubSharedFiles } from '@tests/helpers/sharedFiles';

afterEach(() => clearSharedFilesStub());

describe('takeSharedFiles', () => {
  it('returns nothing without Cache Storage', async () => {
    expect(await takeSharedFiles()).toEqual([]);
    expect(await hasSharedFiles()).toBe(false);
  });

  it('rebuilds the shared files with name and type', async () => {
    stubSharedFiles([{ name: 'Urlaub ä.png', type: 'image/png' }, { name: 'b.jpg' }]);

    const files = await takeSharedFiles();

    expect(files.map((file) => [file.name, file.type])).toEqual([
      ['Urlaub ä.png', 'image/png'],
      ['b.jpg', 'image/jpeg'],
    ]);
  });

  it('empties the cache so a share is taken only once', async () => {
    const entries = stubSharedFiles([{ name: 'a.jpg' }]);
    expect(await hasSharedFiles()).toBe(true);

    await takeSharedFiles();

    expect(entries.size).toBe(0);
    expect(await hasSharedFiles()).toBe(false);
  });

  it('drops shares older than ten minutes', async () => {
    stubSharedFiles([
      { name: 'old.jpg', sharedAt: Date.now() - 11 * 60 * 1000 },
      { name: 'new.jpg' },
    ]);

    expect((await takeSharedFiles()).map((file) => file.name)).toEqual(['new.jpg']);
  });
});
