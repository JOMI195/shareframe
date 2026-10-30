import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import AuthenticatedImage from '@/common/components/authenticatedImage';
import { server } from '@tests/mocks/server';
import { triggerIntersection } from '@tests/setup/vitest.setup';
import { clearImageCache } from '@/common/utils/imageCache';

const URL_PATH = 'http://localhost:8000/media/photo.jpg';

const serveImage = () =>
  server.use(
    mswHttp.get(URL_PATH, () =>
      HttpResponse.arrayBuffer(new Uint8Array([1, 2, 3]).buffer, {
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    ),
  );

const scroll = async () => {
  await act(async () => {
    triggerIntersection(true);
  });
};

describe('AuthenticatedImage', () => {
  // Nothing is fetched until the element scrolls into view.
  it('does not request the image before it intersects', async () => {
    const requests = vi.fn();
    server.use(
      mswHttp.get(URL_PATH, () => {
        requests();
        return HttpResponse.arrayBuffer(new Uint8Array([1]).buffer);
      }),
    );

    render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(requests).not.toHaveBeenCalled();
  });

  it('shows a skeleton until the blob arrives', async () => {
    serveImage();
    const { container } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();

    await scroll();
    expect(await screen.findByAltText('Foto')).toBeInTheDocument();
  });

  it('renders the object url returned for the blob', async () => {
    serveImage();
    render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await scroll();

    const img = await screen.findByAltText('Foto');
    expect(img).toHaveAttribute('src', expect.stringContaining('blob:'));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows a remounted image at once, without a second request', async () => {
    const requests = vi.fn();
    server.use(
      mswHttp.get(URL_PATH, () => {
        requests();
        return HttpResponse.arrayBuffer(new Uint8Array([1]).buffer);
      }),
    );
    const { unmount } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await scroll();
    const first = (await screen.findByAltText('Foto')).getAttribute('src');
    unmount();

    const { container } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);

    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument();
    expect(screen.getByAltText('Foto')).toHaveAttribute('src', first);
    expect(requests).toHaveBeenCalledOnce();
  });

  // Unmounting keeps the blob for the next mount; only sign-out drops it.
  it('revokes cached blobs when the cache is cleared', async () => {
    serveImage();
    const { unmount } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await scroll();
    const src = (await screen.findByAltText('Foto')).getAttribute('src');
    unmount();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    clearImageCache();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
  });

  it('reserves the box with a ratio placeholder while loading', () => {
    const { container } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" aspectRatio={16 / 9} />);

    const placeholder = container.querySelector('img[alt=""]');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder?.getAttribute('src')).toContain('svg%20xmlns');
  });

  it('blurs the image when the hideToYou filter is on', async () => {
    serveImage();
    render(<AuthenticatedImage url={URL_PATH} alt="Foto" hideToYouFilter />);
    await scroll();

    expect(await screen.findByAltText('Foto')).toHaveStyle({ filter: 'blur(25px)' });
  });

  it('reports a failed load through onError and shows a placeholder', async () => {
    server.use(mswHttp.get(URL_PATH, () => HttpResponse.json({ detail: 'nope' }, { status: 404 })));
    const onError = vi.fn();

    render(<AuthenticatedImage url={URL_PATH} alt="Foto" onError={onError} />);
    await scroll();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    expect(screen.queryByAltText('Foto')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto' })).toBeInTheDocument();
    expect(screen.getByTestId('BrokenImageOutlinedIcon')).toBeInTheDocument();
  });

  it('retries a failed image on the next mount', async () => {
    let fail = true;
    server.use(
      mswHttp.get(URL_PATH, () =>
        fail
          ? HttpResponse.json({ detail: 'nope' }, { status: 500 })
          : HttpResponse.arrayBuffer(new Uint8Array([1]).buffer),
      ),
    );
    const { unmount } = render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await scroll();
    await screen.findByTestId('BrokenImageOutlinedIcon');
    unmount();

    fail = false;
    render(<AuthenticatedImage url={URL_PATH} alt="Foto" />);
    await scroll();

    expect(await screen.findByAltText('Foto')).toBeInTheDocument();
  });

  it('fires onClick on the loaded image', async () => {
    serveImage();
    const onClick = vi.fn();

    render(<AuthenticatedImage url={URL_PATH} alt="Foto" onClick={onClick} />);
    await scroll();

    (await screen.findByAltText('Foto')).click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
