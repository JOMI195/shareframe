import { describe, expect, it } from 'vitest';
import reducer, {
  alertSnackbarClosed,
  alertSnackbarOpened,
  closeSelectionDialog,
  deactivateSendImageToUserFrameDialogClosed,
  deactivateSendImageToUserFrameDialogOpened,
  deleteImageDialogClosed,
  deleteImageDialogOpened,
  imageSelected,
  loadingSnackbarClosed,
  loadingSnackbarOpened,
  openPreviewImageDialog,
  openSelectionDialog,
  previewImageDialogClosed,
  previewImageDialogOpened,
  selectImage,
  selectionDialogOpened,
  sendImageToUserFrameDialogClosed,
  sendImageToUserFrameDialogOpened,
} from '@/store/ui/images/images.slice';
import {
  createImageFailed,
  createImageFulfilled,
  createImagePending,
  deleteImageFailed,
  deleteImageFulfilled,
  imagesRequestFailed,
} from '@/store/entities/images/images.slice';
import { makeImage } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

const withSelection = (images = [makeImage({ id: 1 }), makeImage({ id: 2 })]) => {
  let state = reducer(initial(), selectionDialogOpened());
  images.forEach((image) => {
    state = reducer(state, imageSelected({ image }));
  });
  return state;
};

describe('imageSelected', () => {
  it('adds an unselected image', () => {
    expect(withSelection().dialogs.selection.selectedImages.map((i) => i.id)).toEqual([1, 2]);
  });

  it('toggles a selected image off', () => {
    const state = reducer(withSelection(), imageSelected({ image: makeImage({ id: 1 }) }));
    expect(state.dialogs.selection.selectedImages.map((i) => i.id)).toEqual([2]);
  });

  // Used where re-tapping must not deselect (e.g. the preview flow).
  it('keeps a selected image when keepImageOnReSelect is set', () => {
    const state = reducer(
      withSelection(),
      imageSelected({ image: makeImage({ id: 1 }), keepImageOnReSelect: true }),
    );
    expect(state.dialogs.selection.selectedImages.map((i) => i.id)).toEqual([1, 2]);
  });

  it('matches on id, not object identity', () => {
    const state = reducer(withSelection(), imageSelected({ image: makeImage({ id: 2, name: 'other.jpg' }) }));
    expect(state.dialogs.selection.selectedImages.map((i) => i.id)).toEqual([1]);
  });
});

describe('dialogs that consume the selection', () => {
  // Both read from state, not from the action payload.
  it.each([
    ['delete', deleteImageDialogOpened, 'imagesToDelete'],
    ['sendToFrame', sendImageToUserFrameDialogOpened, 'imagesToSend'],
  ])('%s copies the current selection on open', (dialog, action, key) => {
    const state = reducer(withSelection(), action());
    const opened = state.dialogs[dialog as 'delete' | 'sendToFrame'] as Record<string, unknown>;

    expect(opened.open).toBe(true);
    expect((opened[key] as { id: number }[]).map((i) => i.id)).toEqual([1, 2]);
  });

  it.each([
    ['delete', deleteImageDialogClosed, 'imagesToDelete'],
    ['sendToFrame', sendImageToUserFrameDialogClosed, 'imagesToSend'],
  ])('%s empties its list on close', (dialog, action, key) => {
    const opened = reducer(withSelection(), dialog === 'delete' ? deleteImageDialogOpened() : sendImageToUserFrameDialogOpened());
    const state = reducer(opened, action());
    const closed = state.dialogs[dialog as 'delete' | 'sendToFrame'] as Record<string, unknown>;

    expect(closed.open).toBe(false);
    expect(closed[key]).toEqual([]);
  });
});

describe('preview dialog', () => {
  // Opening the preview drops the multi-select.
  it('clears the selection on open', () => {
    const image = makeImage({ id: 7 });
    const state = reducer(withSelection(), previewImageDialogOpened({ image }));

    expect(state.dialogs.selection.selectedImages).toEqual([]);
    expect(state.dialogs.preview).toEqual({ open: true, selectedImage: image });
  });

  it('resets on close', () => {
    const opened = reducer(initial(), previewImageDialogOpened({ image: makeImage() }));
    const state = reducer(opened, previewImageDialogClosed());

    expect(state.dialogs.preview).toEqual({ open: false, selectedImage: null });
  });
});

describe('selection and deactivate dialogs', () => {
  it('starts and ends with an empty selection', () => {
    const state = reducer(withSelection(), openSelectionDialog());
    expect(state.dialogs.selection).toEqual({ open: true, selectedImages: [] });

    expect(reducer(withSelection(), closeSelectionDialog()).dialogs.selection).toEqual({
      open: false,
      selectedImages: [],
    });
  });

  it('tracks the sent image being deactivated', () => {
    const opened = reducer(initial(), deactivateSendImageToUserFrameDialogOpened({ sentImageId: 5 }));
    expect(opened.dialogs.deactivate).toEqual({ open: true, sentImageId: 5 });

    expect(reducer(opened, deactivateSendImageToUserFrameDialogClosed()).dialogs.deactivate).toEqual({
      open: false,
      sentImageId: null,
    });
  });
});

describe('snackbars', () => {
  it('opens and closes the alert, keeping the message on close', () => {
    const opened = reducer(initial(), alertSnackbarOpened({ message: 'Hallo', severity: 'info' }));
    expect(opened.snackbar.alert).toEqual({ open: true, message: 'Hallo', severity: 'info' });

    expect(reducer(opened, alertSnackbarClosed()).snackbar.alert).toEqual({
      open: false,
      message: 'Hallo',
      severity: 'info',
    });
  });

  it('opens and closes the loading snackbar', () => {
    const opened = reducer(initial(), loadingSnackbarOpened({ message: 'Lädt' }));
    expect(opened.snackbar.loading).toEqual({ open: true, message: 'Lädt' });
    expect(reducer(opened, loadingSnackbarClosed()).snackbar.loading.open).toBe(false);
  });
});

describe('entity actions drive the snackbars', () => {
  it.each([
    ['imagesRequestFailed', imagesRequestFailed(), 'Bilder laden fehlgeschlagen', 'error'],
    ['createImageFulfilled', createImageFulfilled(makeImage()), 'Bild hochladen erfolgreich', 'success'],
    ['deleteImageFulfilled', deleteImageFulfilled(makeImage()), 'Bilder löschen erfolgreich', 'success'],
    ['deleteImageFailed', deleteImageFailed(), 'Bilder löschen fehlgeschlagen', 'error'],
  ])('%s shows an alert', (_name, action, message, severity) => {
    const state = reducer(initial(), action);
    expect(state.snackbar.alert).toEqual({ open: true, message, severity });
    expect(state.snackbar.loading.open).toBe(false);
  });

  it('shows a loading snackbar while uploading', () => {
    expect(reducer(initial(), createImagePending()).snackbar.loading).toEqual({
      open: true,
      message: 'Bild hochladen',
    });
  });

  // Only this one interpolates the backend's message. The entity slice declares
  // no payload, so the action is built the way apiMiddleware dispatches it.
  it('appends the backend error to the upload failure message', () => {
    const failedWith = (payload?: string) => ({ type: createImageFailed.type, payload });

    expect(reducer(initial(), failedWith('Datei zu groß')).snackbar.alert.message).toBe(
      'Bild hochladen fehlgeschlagen: Datei zu groß',
    );
    expect(reducer(initial(), failedWith()).snackbar.alert.message).toBe(
      'Bild hochladen fehlgeschlagen',
    );
  });
});

describe('plain action creators', () => {
  it('wrap the slice action types', () => {
    expect(openSelectionDialog()).toEqual({ type: selectionDialogOpened.type });
    expect(closeSelectionDialog()).toEqual({ type: 'images/selectionDialogClosed' });

    const image = makeImage();
    expect(openPreviewImageDialog({ image })).toEqual({
      type: previewImageDialogOpened.type,
      payload: { image },
    });
    expect(selectImage({ image, keepImageOnReSelect: true })).toEqual({
      type: imageSelected.type,
      payload: { image, keepImageOnReSelect: true },
    });
  });
});
