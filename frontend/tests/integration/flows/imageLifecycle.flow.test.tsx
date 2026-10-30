import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, makeImage, makeImages, makePage, seedUser } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server, withFriendships, withImages } from '@tests/mocks';
import { clickSpeedDialAction } from '@tests/helpers/speedDial';
import { triggerIntersection } from '@tests/setup/vitest.setup';

vi.mock('react-easy-crop', async () => {
  const { useEffect } = await import('react');
  const area = { x: 0, y: 0, width: 100, height: 100 };

  const MockCropper = ({ onCropAreaChange }: { onCropAreaChange: (a: unknown, b: unknown) => void }) => {
    useEffect(() => onCropAreaChange(area, area), [onCropAreaChange]);
    return <div data-testid="cropper" />;
  };

  return { default: MockCropper };
});

vi.mock('@/main/images/dialogs/upload/imageCropping/cropper/utils', () => ({
  getCroppedImg: vi.fn(async () => new Blob(['cropped'], { type: 'image/jpeg' })),
}));

vi.mock('@/main/images/dialogs/upload/imageText/useLoadedImage', () => import('@tests/mocks/loadedImage'));

// The dialogs are lazy; warming their modules keeps the first open within the default find timeout.
await Promise.all([
  import('@/main/images/dialogs/upload/uploadDialog'),
  import('@/main/images/dialogs/sendImageToUserFrame/sendImageToUserFrameDialog'),
]);

const library = makeImages(3);

const openLibrary = async (images = library) => {
  server.use(
    ...withImages(images),
    ...withFriendships([
      makeFriendship({ id: 1, sender: seedUser.username, reciever: 'bob', status: 'accepted' }),
    ]),
  );
  const view = renderRoute('/fotos/', { preloadedState: signedInState() });
  await screen.findByText(`${images.length} Fotos`);
  return view;
};

const enterSelectionMode = async (user: ReturnType<typeof renderRoute>['user']) => {
  await user.click((await screen.findByTestId('HighlightAltIcon')).closest('button')!);
  await screen.findByText('Tippe Fotos an, um sie auszuwählen');
};

const selectFirstPhoto = async (user: ReturnType<typeof renderRoute>['user']) => {
  const items = document.querySelectorAll('.MuiImageListItem-root');
  await user.click(items[0] as HTMLElement);
};

// The mocked mirror of tests/e2e/imageLifecycle.spec.ts.
describe('photo library', () => {
  it('comes back on the first page with a single request', async () => {
    const pages: string[] = [];
    server.use(
      mswHttp.get(apiUrl(imageEndpoints.getImagesUrl()), ({ request }) => {
        pages.push(new URL(request.url).searchParams.get('page') ?? '');
        return HttpResponse.json(makePage(makeImages(10), { count: 25 }));
      }),
    );
    const { user, router } = renderRoute('/fotos/', { preloadedState: signedInState() });
    await user.click(await screen.findByRole('button', { name: 'Go to page 2' }));
    await waitFor(() => expect(pages).toEqual(['1', '2']));

    await act(() => router.navigate('/aktivitaeten/'));
    await act(() => router.navigate('/fotos/'));

    await waitFor(() => expect(pages).toHaveLength(3));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(pages).toEqual(['1', '2', '1']);
  });

  it('shows how many photos there are and renders their thumbnails', async () => {
    await openLibrary();

    await act(async () => triggerIntersection(true));

    // Each thumbnail resolves its own blob, so they arrive one by one.
    await waitFor(() => expect(screen.getAllByAltText(/^photo-\d+\.jpg$/)).toHaveLength(3), { timeout: 10_000 });
  });

  it('opens a photo from the keyboard', async () => {
    const { user, store } = await openLibrary();

    const tile = screen.getByRole('button', { name: library[0].display_name || library[0].name });
    tile.focus();
    await user.keyboard('{Enter}');

    expect(store.getState().ui.images.dialogs.preview.open).toBe(true);
  });

  it('offers the first upload in the empty library', async () => {
    server.use(...withImages([]));
    const { user, store } = renderRoute('/fotos/', { preloadedState: signedInState() });

    await user.click(await screen.findByRole('button', { name: 'Foto hochladen' }));

    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });

  it('offers a retry when the library could not be loaded', async () => {
    let fail = true;
    server.use(
      mswHttp.get(apiUrl(imageEndpoints.getImagesUrl()), () =>
        fail ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(makePage(library, { count: library.length })),
      ),
    );
    const { user } = renderRoute('/fotos/', { preloadedState: signedInState() });
    const retry = await screen.findByRole('button', { name: 'Erneut versuchen' });

    fail = false;
    await user.click(retry);

    expect(await screen.findByText(`${library.length} Fotos`)).toBeInTheDocument();
  });

  it('says so when the library is empty', async () => {
    server.use(...withImages([]));
    renderRoute('/fotos/', { preloadedState: signedInState() });

    expect(await screen.findByText('Keine Fotos vorhanden')).toBeInTheDocument();
  });

  it('adds an uploaded photo to the gallery', async () => {
    const { user } = await openLibrary();
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
        HttpResponse.json(makeImage({ id: 99, name: 'neu.jpg', display_name: 'neu' }), { status: 201 }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /Foto hinzufügen/ }));
    // The editor loads on first open.
    const fileInput = await waitFor(() => {
      const input = document.querySelector<HTMLInputElement>('input[type="file"]');
      expect(input).not.toBeNull();
      return input!;
    });
    await user.upload(
      fileInput,
      new File(['x'.repeat(64)], 'neu.jpg', { type: 'image/jpeg', lastModified: 1 }),
    );
    await screen.findByTestId('cropper');
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await screen.findByText('4 Fotos')).toBeInTheDocument();
  });

  it('offers to send the photo right after the upload', async () => {
    const { user, store } = await openLibrary();
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
        HttpResponse.json(makeImage({ id: 99, name: 'neu.jpg', display_name: 'neu' }), { status: 201 }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /Foto hinzufügen/ }));
    await user.upload(
      await waitFor(() => {
        const input = document.querySelector<HTMLInputElement>('input[type="file"]');
        expect(input).not.toBeNull();
        return input!;
      }),
      new File(['x'.repeat(64)], 'neu.jpg', { type: 'image/jpeg', lastModified: 1 }),
    );
    await screen.findByTestId('cropper');
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await screen.findByText('Foto hochgeladen')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jetzt senden' }));

    await waitFor(() => expect(store.getState().ui.images.dialogs.sendToFrame.open).toBe(true));
    expect(store.getState().ui.images.dialogs.sendToFrame.imagesToSend.map((image) => image.id)).toEqual([99]);
  });
});

describe('sending photos to a frame', () => {
  it('sends the selected photo to the chosen receiver', async () => {
    const bodies: Record<string, unknown>[] = [];
    server.use(
      mswHttp.post(apiUrl(frameEndpoints.getSentImageToFrameUrl()), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ message: 'Image sent successful.' });
      }),
    );

    const { user, store } = await openLibrary();
    await enterSelectionMode(user);
    await selectFirstPhoto(user);
    await clickSpeedDialAction(user, 'Ausgewählte Fotos senden');
    // The send dialog loads on first open; until then the only combobox is the page size.
    await screen.findByText(/Wähle die Empfänger/);

    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await within(await screen.findByRole('listbox')).findByRole('option', { name: 'bob' }));
    await user.keyboard('{Escape}');

    await user.click(await screen.findByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].reciever_username).toBe('bob');
    expect(bodies[0].image_id).toBe(library[0].id);
    await waitFor(() => expect(store.getState().ui.images.dialogs.selection.open).toBe(false));
  });

  it('counts the selection and selects the whole page at once', async () => {
    const { user, store } = await openLibrary();
    await enterSelectionMode(user);

    await selectFirstPhoto(user);
    expect(screen.getByText('1 ausgewählt')).toBeInTheDocument();
    expect(document.querySelectorAll('.MuiImageListItem-root')[0]).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Alle auswählen' }));
    expect(store.getState().ui.images.dialogs.selection.selectedImages).toHaveLength(library.length);

    await user.click(screen.getByRole('button', { name: 'Auswahl aufheben' }));
    expect(screen.getByText('Nichts ausgewählt')).toBeInTheDocument();
  });

  it('cannot act on an empty selection', async () => {
    const { user } = await openLibrary();
    await enterSelectionMode(user);

    expect(screen.getByRole('button', { name: 'Aktionen' })).toBeDisabled();
  });
});

describe('deleting photos', () => {
  it('warns, then deletes the selected photo', async () => {
    const deleted: string[] = [];
    server.use(
      mswHttp.delete(apiUrl(imageEndpoints.getImagesDetailUrl(library[0].id)), () => {
        deleted.push(String(library[0].id));
        return HttpResponse.json(library[0]);
      }),
    );

    const { user } = await openLibrary();
    await enterSelectionMode(user);
    await selectFirstPhoto(user);
    await clickSpeedDialAction(user, 'Ausgewählte Fotos löschen');

    expect(await screen.findByText(/Das Löschen von Fotos ist unwiderruflich/)).toBeInTheDocument();
    expect(screen.getByText(/Geplante Sendungen dieses Fotos werden abgebrochen/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(deleted).toEqual([String(library[0].id)]));
    expect(await screen.findByText('2 Fotos')).toBeInTheDocument();
  });

  it('keeps the photo when the confirmation is cancelled', async () => {
    const deleted: string[] = [];
    server.use(
      mswHttp.delete(apiUrl(imageEndpoints.getImagesDetailUrl(library[0].id)), () => {
        deleted.push(String(library[0].id));
        return HttpResponse.json(library[0]);
      }),
    );

    const { user } = await openLibrary();
    await enterSelectionMode(user);
    await selectFirstPhoto(user);
    await clickSpeedDialAction(user, 'Ausgewählte Fotos löschen');
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(deleted).toEqual([]);
    expect(screen.getByText('3 Fotos')).toBeInTheDocument();
  });
});
