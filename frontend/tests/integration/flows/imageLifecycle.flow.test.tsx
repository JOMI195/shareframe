import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import { renderRoute } from '@tests/helpers/renderRoute';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeFriendship, makeImage, makeImages, seedUser } from '@tests/fixtures';
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
  // The intro backdrop covers the gallery until it is dismissed.
  await user.click(document.querySelector('.MuiBackdrop-root')!);
};

const selectFirstPhoto = async (user: ReturnType<typeof renderRoute>['user']) => {
  const items = document.querySelectorAll('.MuiImageListItem-root');
  await user.click(items[0] as HTMLElement);
};

// The mocked mirror of tests/e2e/imageLifecycle.spec.ts.
describe('photo library', () => {
  it('shows how many photos there are and renders their thumbnails', async () => {
    await openLibrary();

    await act(async () => triggerIntersection(true));

    // Each thumbnail resolves its own blob, so they arrive one by one.
    await waitFor(() => expect(screen.getAllByAltText(/^photo-\d+\.jpg$/)).toHaveLength(3));
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
    await user.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      new File(['x'.repeat(64)], 'neu.jpg', { type: 'image/jpeg', lastModified: 1 }),
    );
    await user.click(screen.getByRole('button', { name: 'Weiter zum Zuschneiden' }));
    await screen.findByTestId('cropper');
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & Hochladen' }));

    expect(await screen.findByText('4 Fotos')).toBeInTheDocument();
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

    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(await within(await screen.findByRole('listbox')).findByRole('option', { name: 'bob' }));

    await user.click(await screen.findByRole('button', { name: /an 1 Empfänger senden/ }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].reciever_username).toBe('bob');
    expect(bodies[0].image_id).toBe(library[0].id);
    await waitFor(() => expect(store.getState().ui.images.dialogs.selection.open).toBe(false));
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
    await user.click(screen.getByRole('button', { name: 'Löschen bestätigen' }));

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
