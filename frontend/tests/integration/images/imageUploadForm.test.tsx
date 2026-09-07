import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploadForm from '@/main/images/dialogs/upload/imageUpload/form/imageUploadForm';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { makePage } from '@tests/fixtures';

// The accept attribute is advisory: mobile pickers and drag-and-drop both hand
// over files the app still has to validate, so bypass user-event's own filter.
const permissiveUser = () => userEvent.setup({ applyAccept: false });

const file = (name: string, type: string, sizeMb = 1) =>
  new File([new Uint8Array(Math.round(sizeMb * 1024 * 1024))], name, { type });

const setup = (over: { existingCount?: number; selected?: number } = {}) => {
  const addImages = vi.fn();
  const removeImage = vi.fn();
  const markPreviewBroken = vi.fn();
  const imageStatuses = Array.from({ length: over.selected ?? 0 }, (_, i) => ({
    id: `id-${i}`,
    file: file(`vorhanden-${i}.jpg`, 'image/jpeg'),
    status: 'pending' as const,
  }));

  const rendered = renderWithProviders(
    <ImageUploadForm
      addImages={addImages}
      removeImage={removeImage}
      imageStatuses={imageStatuses}
      imagePreviews={{}}
      previewErrors={{}}
      markPreviewBroken={markPreviewBroken}
    />,
    {
      preloadedState: {
        entities: { images: { imagesPaginated: makePage([], { count: over.existingCount ?? 0 }) } },
      },
    },
  );

  const input = rendered.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { ...rendered, addImages, removeImage, markPreviewBroken, input };
};

describe('ImageUploadForm file input', () => {
  it('accepts only the configured MIME types', () => {
    expect(setup().input).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('forwards valid files to the parent', async () => {
    const { user, addImages, input } = setup();

    await user.upload(input, [file('a.jpg', 'image/jpeg'), file('b.png', 'image/png')]);

    await waitFor(() => expect(addImages).toHaveBeenCalledOnce());
    expect(addImages.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.jpg', 'b.png']);
  });

  it('rejects a wrong format and reports it in the snackbar', async () => {
    const { addImages, store, input } = setup();

    await permissiveUser().upload(input, [file('doc.pdf', 'application/pdf')]);

    await waitFor(() => expect(store.getState().ui.images.snackbar.alert.open).toBe(true));
    const { message, severity } = store.getState().ui.images.snackbar.alert;
    expect(message).toContain('doc.pdf: Falsches Dateiformat');
    expect(severity).toBe('warning');
    expect(addImages).not.toHaveBeenCalled();
  });

  it('rejects an oversized file', async () => {
    const { user, store, input } = setup();

    await user.upload(input, [file('gross.jpg', 'image/jpeg', 21)]);

    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toContain('Datei ist zu groß (maximal 20MB)'),
    );
  });

  it('adds the valid files and warns about the invalid ones in one go', async () => {
    const { addImages, store, input } = setup();

    await permissiveUser().upload(input, [
      file('gut.jpg', 'image/jpeg'),
      file('schlecht.pdf', 'application/pdf'),
    ]);

    await waitFor(() => expect(addImages).toHaveBeenCalledOnce());
    expect(addImages.mock.calls[0][0].map((f: File) => f.name)).toEqual(['gut.jpg']);
    expect(store.getState().ui.images.snackbar.alert.message).toContain('schlecht.pdf');
  });

  // Once the account total would be exceeded, nothing is added at all.
  it('rejects the whole selection when the account limit would be exceeded', async () => {
    const { user, addImages, store, input } = setup({ existingCount: 100 });

    await user.upload(input, [file('a.jpg', 'image/jpeg')]);

    await waitFor(() => expect(store.getState().ui.images.snackbar.alert.open).toBe(true));
    expect(store.getState().ui.images.snackbar.alert.message).toContain(
      'Maximale Gesamtanzahl von 100 Foto(s) würde überschritten',
    );
    expect(addImages).not.toHaveBeenCalled();
  });

  it('counts already-selected files towards the per-upload limit', async () => {
    const { user, addImages, input } = setup({ selected: 15 });

    await user.upload(input, [file('zuviel.jpg', 'image/jpeg')]);

    await waitFor(() => expect(addImages).not.toHaveBeenCalled());
  });
});

// Android Chrome releases the picker's staged file once the input is touched
// again, so the bytes have to be copied before that can happen.
describe('ImageUploadForm android file lifetime', () => {
  it('hands the parent a detached copy, not the picked file', async () => {
    const { user, addImages, input } = setup();
    const picked = file('a.jpg', 'image/jpeg');

    await user.upload(input, [picked]);

    await waitFor(() => expect(addImages).toHaveBeenCalledOnce());
    const forwarded: File = addImages.mock.calls[0][0][0];
    expect(forwarded).not.toBe(picked);
    expect([forwarded.name, forwarded.type, forwarded.size]).toEqual([picked.name, picked.type, picked.size]);
    expect(await forwarded.arrayBuffer()).toEqual(await picked.arrayBuffer());
  });

  it('leaves the input populated after a selection', async () => {
    const { user, addImages, input } = setup();

    await user.upload(input, [file('a.jpg', 'image/jpeg')]);

    await waitFor(() => expect(addImages).toHaveBeenCalledOnce());
    // past the window in which the input used to be cleared on a timer
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(input.files).toHaveLength(1);
  });

  it('clears the input when the picker is opened, so the same photo can be picked twice', async () => {
    const { user, input, getByRole } = setup();

    await user.upload(input, [file('a.jpg', 'image/jpeg')]);
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    await user.click(getByRole('button', { name: /Fotos auswählen/ }));

    expect(click).toHaveBeenCalled();
    expect(input.files).toHaveLength(0);
  });

  it('reports a file whose bytes cannot be read instead of failing silently', async () => {
    const { user, addImages, store, input } = setup();
    const unreadable = file('kaputt.jpg', 'image/jpeg');
    vi.spyOn(unreadable, 'arrayBuffer').mockRejectedValue(
      Object.assign(new Error('could not be read'), { name: 'NotReadableError' }),
    );

    await user.upload(input, [unreadable]);

    await waitFor(() => expect(store.getState().ui.images.snackbar.alert.open).toBe(true));
    expect(store.getState().ui.images.snackbar.alert.message).toContain('kaputt.jpg: NotReadableError');
    expect(addImages).not.toHaveBeenCalled();
  });
});
