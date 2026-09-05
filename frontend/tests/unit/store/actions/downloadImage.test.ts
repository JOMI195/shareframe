import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { downloadImage } from '@/store/entities/images/images.actions';
import { server } from '@tests/mocks/server';

const URL_PATH = 'http://localhost:8000/media/private/images/photo.jpg';

const serveBlob = (contentType = 'image/jpeg') =>
  server.use(
    mswHttp.get(URL_PATH, () =>
      HttpResponse.arrayBuffer(new Uint8Array([1, 2, 3]).buffer, {
        headers: { 'Content-Type': contentType },
      }),
    ),
  );

const run = async (fileName = 'foto.jpg') => {
  const dispatch = vi.fn();
  await downloadImage(URL_PATH, fileName)(dispatch as never);
  return dispatch;
};

// The download is a DOM side effect: a synthetic anchor is clicked and removed.
describe('downloadImage', () => {
  it('clicks a temporary anchor carrying the file name', async () => {
    serveBlob();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await run('urlaub.jpg');

    expect(click).toHaveBeenCalledOnce();
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('urlaub.jpg');
    expect(anchor.href).toMatch(/^blob:/);
  });

  it('leaves no anchor behind and revokes the object url', async () => {
    serveBlob();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await run();

    expect(document.querySelectorAll('a')).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('reports the request and the result to the store', async () => {
    serveBlob();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const dispatch = await run();

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      'images/downloadImageRequested',
      'images/downloadImageReceived',
    ]);
  });

  it('reports a failure instead of throwing', async () => {
    server.use(mswHttp.get(URL_PATH, () => new HttpResponse(null, { status: 404 })));

    const dispatch = await run();

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      'images/downloadImageRequested',
      'images/downloadImageFailed',
    ]);
  });
});
