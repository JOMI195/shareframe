import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import UploadDialog from '@/main/images/dialogs/upload/uploadDialog';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeImage } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';
import { uploadImage } from '@/store/entities/images/images.actions';

// jsdom has no layout, so react-easy-crop never reports a crop area, and no
// canvas, so the real getCroppedImg cannot run. Both are unit-tested separately.
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

// The request payload itself is covered by the action unit tests; what matters
// here is which file, hash and retention flag the dialog hands over.
vi.mock('@/store/entities/images/images.actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/entities/images/images.actions')>();
  return { ...actual, uploadImage: vi.fn(actual.uploadImage) };
});

const photo = (name: string, lastModified = 1) =>
  new File(['x'.repeat(64)], name, { type: 'image/jpeg', lastModified });

const openState = () =>
  signedInState({ ui: { images: { dialogs: { create: { open: true } } } } });

const render = () => renderWithProviders(<UploadDialog />, { preloadedState: openState() });

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

describe('UploadDialog selection step', () => {
  it('lists the selected photos', async () => {
    const { user } = render();

    await user.upload(fileInput(), [photo('a.jpg'), photo('b.jpg', 2)]);

    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('b.jpg')).toBeInTheDocument();
  });

  // The key is name+size+lastModified, so the same file picked twice is one photo.
  it('ignores a file that is already selected', async () => {
    const { user, store } = render();

    await user.upload(fileInput(), photo('a.jpg'));
    await user.upload(fileInput(), photo('a.jpg'));

    expect(screen.getAllByText('a.jpg')).toHaveLength(1);
    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(/bereits ausgewählt/),
    );
  });

  // vitest.config pins VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE to 15, and a batch
  // over that limit is rejected as a whole rather than trimmed.
  it('rejects a batch that is larger than the per-upload limit', async () => {
    const { user, store } = render();
    const many = Array.from({ length: 16 }, (_, i) => photo(`p${i}.jpg`, i + 1));

    await user.upload(fileInput(), many);

    expect(screen.queryByText('p0.jpg')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(
        /Maximal 15 Foto\(s\) können auf einmal hochgeladen werden/,
      ),
    );
  });

  it('accepts a batch at exactly the limit', async () => {
    const { user } = render();
    const many = Array.from({ length: 15 }, (_, i) => photo(`p${i}.jpg`, i + 1));

    await user.upload(fileInput(), many);

    expect(screen.getByText('p14.jpg')).toBeInTheDocument();
  });

  it('cannot continue without a photo', () => {
    render();

    expect(screen.getByRole('button', { name: 'Weiter zum Zuschneiden' })).toBeDisabled();
  });
});

describe('UploadDialog crop and upload step', () => {
  const goToCropping = async () => {
    const view = render();
    await view.user.upload(fileInput(), photo('urlaub.jpg'));
    await view.user.click(screen.getByRole('button', { name: 'Weiter zum Zuschneiden' }));
    await screen.findByTestId('cropper');
    return view;
  };

  it('uploads the cropped photo and closes once everything is done', async () => {
    const uploads: Request[] = [];
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), ({ request }) => {
        uploads.push(request.clone());
        return HttpResponse.json(makeImage({ id: 7 }), { status: 201 });
      }),
    );

    const { user, store } = await goToCropping();
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & Hochladen' }));

    await waitFor(() => expect(store.getState().ui.images.dialogs.create.open).toBe(false));
    expect(uploads).toHaveLength(1);
  });

  it('uploads the cropped jpeg with its hash and the chosen retention', async () => {
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
        HttpResponse.json(makeImage(), { status: 201 }),
      ),
    );

    const { user } = await goToCropping();
    await user.click(screen.getByRole('checkbox'));
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & Hochladen' }));

    await waitFor(() => expect(uploadImage).toHaveBeenCalledOnce());
    const [file, hash, autoDelete] = vi.mocked(uploadImage).mock.calls[0];
    expect(file.name).toBe('urlaub.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // The checkbox starts checked, so one click turns the short retention off.
    expect(autoDelete).toBe(false);
  });

  it('keeps the dialog open and explains a rejected upload', async () => {
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
        HttpResponse.json({ detail: 'Die Datei ist zu groß.' }, { status: 413 }),
      ),
    );

    const { user, store } = await goToCropping();
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & Hochladen' }));

    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(/Die Datei ist zu groß\./),
    );
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });
});
