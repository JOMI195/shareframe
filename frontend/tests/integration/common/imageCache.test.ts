import { describe, expect, it } from 'vitest';
import { HttpResponse, http as mswHttp } from 'msw';
import { acquireImage, peekImage } from '@/common/utils/imageCache';
import { server } from '@tests/mocks/server';

const MB = 1024 * 1024;
const url = (n: number) => `http://localhost:8000/media/photo-${n}.jpg`;

// Each response is 20 MB, so the third one pushes the cache over its cap.
const serveLargeImages = () =>
  server.use(
    mswHttp.get('http://localhost:8000/media/:name', () =>
      HttpResponse.arrayBuffer(new ArrayBuffer(20 * MB), { headers: { 'Content-Type': 'image/jpeg' } }),
    ),
  );

describe('image cache', () => {
  it('shares one request between concurrent users of a url', async () => {
    let requests = 0;
    server.use(
      mswHttp.get(url(1), () => {
        requests += 1;
        return HttpResponse.arrayBuffer(new Uint8Array([1]).buffer);
      }),
    );

    const [a, b] = [acquireImage(url(1)), acquireImage(url(1))];

    expect(await a.objectUrl).toBe(await b.objectUrl);
    expect(requests).toBe(1);
  });

  it('evicts the least recently used released image over the cap', async () => {
    serveLargeImages();
    for (const n of [1, 2, 3]) {
      const image = acquireImage(url(n));
      await image.objectUrl;
      image.release();
    }

    expect(peekImage(url(1))).toBeUndefined();
    expect(peekImage(url(2))).toBeDefined();
    expect(peekImage(url(3))).toBeDefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('never evicts an image that is still on screen', async () => {
    serveLargeImages();
    const onScreen = acquireImage(url(1));
    await onScreen.objectUrl;
    for (const n of [2, 3]) {
      const image = acquireImage(url(n));
      await image.objectUrl;
      image.release();
    }

    expect(peekImage(url(1))).toBeDefined();
    expect(peekImage(url(2))).toBeUndefined();
  });

  it('does not keep a failed load', async () => {
    server.use(mswHttp.get(url(1), () => HttpResponse.json({}, { status: 500 })));

    await expect(acquireImage(url(1)).objectUrl).rejects.toThrow();

    expect(peekImage(url(1))).toBeUndefined();
  });
});
