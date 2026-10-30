import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import UploadDialog from '@/main/images/dialogs/upload/uploadDialog';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { makeImage, makeTextPreset } from '@tests/fixtures';
import { apiUrl } from '@tests/mocks/apiUrl';
import { server } from '@tests/mocks/server';
import { uploadImage } from '@/store/entities/images/images.actions';
import type { ITextPreset } from '@/types';
import { exportStageToBlob } from '@/main/images/dialogs/upload/imageText/exportImage';
import { renderEpaper } from '@/main/images/epaper/renderEpaper';
import { pixelsToBlob } from '@/common/utils/canvas/pixels';
import { adjustImage } from '@/main/images/dialogs/upload/imageAdjust/adjustImage';
import { getCroppedImg } from '@/main/images/dialogs/upload/imageCropping/cropper/utils';

// jsdom has no layout, so react-easy-crop never reports a crop area, and no
// canvas, so the real getCroppedImg cannot run. Both are unit-tested separately.
vi.mock('react-easy-crop', async () => {
  const { useEffect } = await import('react');
  const area = { x: 0, y: 0, width: 100, height: 100 };

  type MockProps = {
    crop: { x: number; y: number };
    onCropChange: (crop: { x: number; y: number }) => void;
    onCropAreaChange: (a: unknown, b: unknown) => void;
  };

  const MockCropper = ({ crop, onCropChange, onCropAreaChange }: MockProps) => {
    useEffect(() => onCropAreaChange(area, area), [onCropAreaChange]);
    return (
      <div data-testid="cropper" data-crop={JSON.stringify(crop)}>
        <button type="button" onClick={() => onCropChange({ x: 5, y: 7 })}>Ausschnitt verschieben</button>
      </div>
    );
  };

  return { default: MockCropper };
});

vi.mock('@/main/images/dialogs/upload/imageCropping/cropper/utils', () => ({
  getCroppedImg: vi.fn(async () => new Blob(['cropped'], { type: 'image/jpeg' })),
}));

// jsdom has no layout either, so the konva stage never mounts and there is nothing to export.
vi.mock('@/main/images/dialogs/upload/imageText/useLoadedImage', () => import('@tests/mocks/loadedImage'));
vi.mock('@/main/images/dialogs/upload/imageText/exportImage', () => ({
  exportStageToBlob: vi.fn(async () => new Blob(['with-text'], { type: 'image/jpeg' })),
}));

// No canvas in jsdom either; the dithering and the adjustment math are unit-tested.
const epaperBlob = new Blob(['epaper'], { type: 'image/png' });
vi.mock('@/main/images/epaper/renderEpaper', () => ({
  renderEpaper: vi.fn(async () => epaperBlob),
}));
vi.mock('@/main/images/dialogs/upload/imageAdjust/adjustImage', () => ({
  adjustImage: vi.fn(async () => new Blob(['adjusted'], { type: 'image/jpeg' })),
}));
vi.mock('@/common/utils/canvas/pixels', () => ({
  readPixels: (_source: unknown, width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4).fill(100),
    width,
    height,
  }),
  pixelsToBlob: vi.fn(async () => new Blob(['preview'], { type: 'image/png' })),
}));

// The request payload itself is covered by the action unit tests; what matters
// here is which file, hash and retention flag the dialog hands over.
vi.mock('@/store/entities/images/images.actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/entities/images/images.actions')>();
  return { ...actual, uploadImage: vi.fn(actual.uploadImage) };
});

// The text step is lazy and pulls in konva, which on a busy run takes longer than a findBy wait.
beforeAll(() => import('@/main/images/dialogs/upload/imageText/imageText'));

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

    const strip = screen.getByRole('list', { name: 'Ausgewählte Fotos' });
    expect(within(strip).getByRole('button', { name: 'a.jpg' })).toBeInTheDocument();
    expect(within(strip).getByRole('button', { name: 'b.jpg' })).toBeInTheDocument();
  });

  // The key is name+size+lastModified, so the same file picked twice is one photo.
  it('ignores a file that is already selected', async () => {
    const { user, store } = render();

    await user.upload(fileInput(), photo('a.jpg'));
    await user.upload(fileInput(), photo('a.jpg'));

    expect(screen.getAllByRole('button', { name: 'a.jpg' })).toHaveLength(1);
    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(/schon ausgewählt/),
    );
  });

  // vitest.config pins VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE to 15, and a batch
  // over that limit is rejected as a whole rather than trimmed.
  it('rejects a batch that is larger than the per-upload limit', async () => {
    const { user, store } = render();
    const many = Array.from({ length: 16 }, (_, i) => photo(`p${i}.jpg`, i + 1));

    await user.upload(fileInput(), many);

    expect(screen.queryByRole('button', { name: 'p0.jpg' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(
        /höchstens 15 Fotos auf einmal hochladen/,
      ),
    );
  });

  it('accepts a batch at exactly the limit', async () => {
    const { user } = render();
    const many = Array.from({ length: 15 }, (_, i) => photo(`p${i}.jpg`, i + 1));

    await user.upload(fileInput(), many);

    expect(screen.getByRole('button', { name: 'p14.jpg' })).toBeInTheDocument();
  });

  it('starts with the picker and no editor', () => {
    render();

    expect(screen.getByRole('button', { name: 'Fotos auswählen' })).toBeInTheDocument();
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
  });

  it('opens the first photo for cropping right after picking', async () => {
    const { user } = render();

    await user.upload(fileInput(), [photo('a.jpg'), photo('b.jpg', 2)]);

    expect(await screen.findByTestId('cropper')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Foto 1 von 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'a.jpg' })).toHaveAttribute('aria-current', 'true');
  });

  it('switches to another photo from the strip with a fresh crop', async () => {
    const { user } = render();
    await user.upload(fileInput(), [photo('a.jpg'), photo('b.jpg', 2)]);
    await user.click(await screen.findByRole('button', { name: 'Ausschnitt verschieben' }));
    await user.click(tab('Anpassen'));
    await adjustOpen();

    await user.click(screen.getByRole('button', { name: 'b.jpg' }));

    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-crop', JSON.stringify({ x: 0, y: 0 }));
    expect(screen.getByRole('heading', { name: 'Foto 2 von 2' })).toBeInTheDocument();
  });

  it('opens the next photo when the current one is removed', async () => {
    const { user } = render();
    await user.upload(fileInput(), [photo('a.jpg'), photo('b.jpg', 2)]);
    await screen.findByTestId('cropper');

    await user.click(screen.getByRole('button', { name: 'a.jpg entfernen' }));

    expect(screen.queryByRole('button', { name: 'a.jpg' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Foto 1 von 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'b.jpg' })).toHaveAttribute('aria-current', 'true');
  });

  it('returns to the picker when the last photo is removed', async () => {
    const { user } = render();
    await user.upload(fileInput(), photo('a.jpg'));
    await screen.findByTestId('cropper');

    await user.click(screen.getByRole('button', { name: 'a.jpg entfernen' }));

    expect(screen.getByRole('button', { name: 'Fotos auswählen' })).toBeInTheDocument();
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument();
  });

  it('adds more photos from the strip', async () => {
    const { user } = render();
    await user.upload(fileInput(), photo('a.jpg'));
    await screen.findByTestId('cropper');
    const click = vi.spyOn(fileInput(), 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: 'Fotos hinzufügen' }));
    expect(click).toHaveBeenCalled();
    await user.upload(fileInput(), photo('b.jpg', 2));

    expect(screen.getByRole('button', { name: 'b.jpg' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'a.jpg' })).toHaveAttribute('aria-current', 'true');
  });
});

const goToCropping = async (photos = [photo('urlaub.jpg')]) => {
  const view = render();
  await view.user.upload(fileInput(), photos);
  await screen.findByTestId('cropper');
  return view;
};

const tab = (name: 'Zuschnitt' | 'Anpassen' | 'Text') => screen.getByRole('tab', { name });

const adjustOpen = () => screen.findByRole('slider', { name: 'Kontrast' });

const textOpen = () =>
  waitFor(() => expect(screen.getByRole('button', { name: 'Text hinzufügen' })).toBeEnabled());

const goToAdjust = async (photos?: File[]) => {
  const view = await goToCropping(photos);
  await view.user.click(tab('Anpassen'));
  await adjustOpen();
  return view;
};

const goToText = async (photos?: File[]) => {
  const view = await goToAdjust(photos);
  await view.user.click(tab('Text'));
  await textOpen();
  return view;
};

const goToPreview = async (photos?: File[]) => {
  const view = await goToText(photos);
  await view.user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
  await screen.findByRole('button', { name: 'Hochladen' });
  return view;
};

const objectUrlOf = (blob: Blob) => {
  const { calls, results } = vi.mocked(URL.createObjectURL).mock;
  const index = calls.map(([arg]) => arg).lastIndexOf(blob);
  return results[index]?.value;
};

const textField = () => screen.getByRole('textbox', { name: 'Text' });

const uploadedFile = async () => {
  await waitFor(() => expect(uploadImage).toHaveBeenCalledOnce());
  return vi.mocked(uploadImage).mock.calls[0][0];
};

const acceptUploads = () =>
  server.use(
    mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
      HttpResponse.json(makeImage(), { status: 201 }),
    ),
  );

describe('UploadDialog closing', () => {
  const desktop = () => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      ...matchMedia(query),
      matches: query.includes('min-width'),
    }));
  };

  it('closes from the header on the picker', async () => {
    const { user, store } = render();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(store.getState().ui.images.dialogs.create.open).toBe(false);
  });

  it('asks before discarding a photo in edit, then closes', async () => {
    desktop();
    const { user, store } = await goToText();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(await screen.findByText('Bearbeitung verwerfen?')).toBeInTheDocument();
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(store.getState().ui.images.dialogs.create.open).toBe(false);
  });

  it('keeps the edit when the discard is declined', async () => {
    desktop();
    const { user, store } = await goToText();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    await user.click(await screen.findByRole('button', { name: 'Weiter bearbeiten' }));

    await waitFor(() => expect(screen.queryByText('Bearbeitung verwerfen?')).not.toBeInTheDocument());
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });

  it('has no other close buttons in the tools', async () => {
    desktop();
    await goToText();

    expect(screen.getAllByRole('button', { name: /Schließen|Dialog schließen|Abbrechen/ })).toHaveLength(1);
  });

  it('offers going back next to the upload button on larger screens', async () => {
    desktop();
    const { user } = await goToPreview();
    const [header, footer] = screen.getAllByRole('button', { name: 'Zurück zum Bearbeiten' });
    expect(header).toBeInTheDocument();

    await user.click(footer);

    expect(await screen.findByRole('button', { name: 'Weiter zur Vorschau' })).toBeInTheDocument();
  });

  it('steps back from the preview instead of closing', async () => {
    const { user, store } = await goToPreview();
    expect(screen.queryByRole('button', { name: 'Schließen' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zurück zum Bearbeiten' }));

    expect(await screen.findByRole('button', { name: 'Weiter zur Vorschau' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument();
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });
});

describe('UploadDialog fast path', () => {
  beforeEach(acceptUploads);

  it('uploads the plain crop straight from the crop tool', async () => {
    const { user } = await goToCropping();

    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await (await uploadedFile()).text()).toBe('cropped');
    expect(adjustImage).not.toHaveBeenCalled();
    expect(exportStageToBlob).not.toHaveBeenCalled();
  });

  it('burns in the texts when the preview is opened from another tool', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(tab('Zuschnitt'));
    await screen.findByTestId('cropper');

    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await (await uploadedFile()).text()).toBe('with-text');
  });

  it('offers the e-paper view only once the photo is cropped', async () => {
    const { user } = await goToCropping();
    expect(screen.queryByRole('button', { name: 'E-Paper' })).not.toBeInTheDocument();

    await user.click(tab('Anpassen'));

    expect(await screen.findByRole('button', { name: 'E-Paper' })).toBeInTheDocument();
  });
});

describe('UploadDialog crop step', () => {
  it('keeps the crop when coming back from the adjust step', async () => {
    const { user } = await goToCropping();
    await user.click(screen.getByRole('button', { name: 'Ausschnitt verschieben' }));
    await user.click(tab('Anpassen'));
    await adjustOpen();

    await user.click(tab('Zuschnitt'));

    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-crop', JSON.stringify({ x: 5, y: 7 }));
  });

  it('crops once while the crop stays the same', async () => {
    const { user } = await goToAdjust();

    await user.click(tab('Text'));
    await textOpen();
    await user.click(tab('Anpassen'));
    await adjustOpen();

    expect(getCroppedImg).toHaveBeenCalledOnce();
  });

  it('crops again after a rotation', async () => {
    const { user } = await goToAdjust();
    await user.click(tab('Zuschnitt'));
    await screen.findByTestId('cropper');

    fireEvent.change(screen.getByRole('slider', { name: 'Rotation' }), { target: { value: 90 } });
    await user.click(tab('Anpassen'));
    await adjustOpen();

    expect(getCroppedImg).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getCroppedImg).mock.lastCall![2]).toBe(90);
  });
});

describe('UploadDialog adjust step', () => {
  const painted = () => vi.mocked(pixelsToBlob).mock.lastCall![0];
  const slider = (name: string) => screen.getByRole('slider', { name });
  const move = (name: string, value: number) => fireEvent.change(slider(name), { target: { value } });

  it('repaints the preview as the contrast changes', async () => {
    await goToAdjust();
    await waitFor(() => expect(painted().data[0]).toBe(100));

    move('Kontrast', 50);

    await waitFor(() => expect(painted().data[0]).toBeLessThan(100));
  });

  it('shows the adjusted photo as the e-paper frame renders it', async () => {
    const { user } = await goToAdjust();

    await user.click(screen.getByRole('button', { name: 'E-Paper' }));

    await waitFor(() => expect(painted().width).toBe(800));
    expect(painted().data.every((value) => value === 0 || value === 255)).toBe(true);
  });

  it('keeps the e-paper view through the following steps', async () => {
    const { user } = await goToAdjust();
    await user.click(screen.getByRole('button', { name: 'E-Paper' }));

    await user.click(tab('Text'));
    await textOpen();
    expect(screen.getByRole('button', { name: 'E-Paper' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('img', { name: 'E-Paper-Vorschau von urlaub.jpg' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await screen.findByRole('button', { name: 'Hochladen' });
    expect(screen.getByRole('button', { name: 'E-Paper' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Vorschau von urlaub.jpg' })).toHaveAttribute('src', objectUrlOf(epaperBlob)),
    );
  });

  it('starts the next photo in the original view', async () => {
    acceptUploads();
    const { user } = await goToAdjust([photo('a.jpg'), photo('b.jpg', 2)]);
    await user.click(screen.getByRole('button', { name: 'E-Paper' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await screen.findByRole('heading', { name: 'Foto 2 von 2' })).toBeInTheDocument();
    await user.click(await screen.findByRole('tab', { name: 'Anpassen' }));
    await adjustOpen();

    expect(screen.getByRole('button', { name: 'Original' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uploads the adjusted photo', async () => {
    acceptUploads();
    const { user } = await goToAdjust();
    move('Helligkeit', 30);

    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await (await uploadedFile()).text()).toBe('adjusted');
    const [source, adjustment] = vi.mocked(adjustImage).mock.calls[0];
    expect(await source.text()).toBe('cropped');
    expect(adjustment).toEqual({ brightness: 30, contrast: 0 });
  });

  it('keeps the values when coming back from the text step', async () => {
    const { user } = await goToAdjust();
    move('Kontrast', 40);

    await user.click(tab('Text'));
    await textOpen();
    await user.click(tab('Anpassen'));

    expect(await screen.findByRole('slider', { name: 'Kontrast' })).toHaveValue('40');
  });

  it('resets both values at once', async () => {
    const { user } = await goToAdjust();
    move('Helligkeit', -20);
    move('Kontrast', 40);

    await user.click(screen.getByRole('button', { name: 'Zurücksetzen' }));

    expect(slider('Helligkeit')).toHaveValue('0');
    expect(slider('Kontrast')).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Zurücksetzen' })).toBeDisabled();
  });
});

describe('UploadDialog text step', () => {
  beforeEach(acceptUploads);

  it('adds a text with the default content and selects it for editing', async () => {
    const { user } = await goToText();

    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    expect(within(screen.getByRole('group', { name: 'Ausgewählter Text' })).getByRole('textbox', { name: 'Text' })).toHaveValue('Text');
  });

  it('edits a text after it was created', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    await user.clear(textField());
    await user.type(textField(), 'Hallo Oma');

    expect(screen.getByRole('button', { name: 'Hallo Oma' })).toBeInTheDocument();
  });

  it('switches between several texts', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.clear(textField());
    await user.type(textField(), 'Erster');
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    expect(textField()).toHaveValue('Text');
    await user.click(screen.getByRole('button', { name: 'Erster' }));
    expect(textField()).toHaveValue('Erster');
  });

  it('adds today as an editable text', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-05T10:00:00Z'));
    try {
      const { user } = await goToText();

      await user.click(screen.getByRole('button', { name: 'Datum hinzufügen' }));
      expect(textField()).toHaveValue('05.03.2026');

      await user.type(textField(), ' Geburtstag');
      expect(textField()).toHaveValue('05.03.2026 Geburtstag');
    } finally {
      vi.useRealTimers();
    }
  });

  it('toggles the background box of the selected text', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    const background = screen.getByRole('button', { name: 'Hintergrund' });
    expect(background).toHaveAttribute('aria-pressed', 'false');

    await user.click(background);

    expect(background).toHaveAttribute('aria-pressed', 'true');
  });

  it('deletes the selected text', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    await user.click(screen.getByRole('button', { name: 'Text löschen' }));

    expect(screen.queryByRole('group', { name: 'Ausgewählter Text' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Text' })).not.toBeInTheDocument();
  });

  it('shows the photo as the e-paper frame renders it behind the editable texts', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    await user.click(screen.getByRole('button', { name: 'E-Paper' }));

    expect(await screen.findByRole('img', { name: 'E-Paper-Vorschau von urlaub.jpg' })).toHaveAttribute('src', objectUrlOf(epaperBlob));
    expect(await vi.mocked(renderEpaper).mock.lastCall![0].text()).toBe('cropped');
    expect(exportStageToBlob).not.toHaveBeenCalled();
    expect(textField()).toHaveValue('Text');

    await user.click(screen.getByRole('button', { name: 'Original' }));
    expect(screen.queryByRole('img', { name: 'E-Paper-Vorschau von urlaub.jpg' })).not.toBeInTheDocument();
  });

  it('keeps the texts when going back to adjusting and on again', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.clear(textField());
    await user.type(textField(), 'Bleibt');

    await user.click(tab('Anpassen'));
    await adjustOpen();
    await user.click(tab('Text'));

    expect(await screen.findByRole('button', { name: 'Bleibt' })).toBeInTheDocument();
  });
});

const servePresets = (presets: ITextPreset[]) =>
  server.use(mswHttp.get(apiUrl(imageEndpoints.getTextPresetsUrl()), () => HttpResponse.json(presets)));

const presetsGroup = () => screen.findByRole('group', { name: 'Vorlagen' });

describe('UploadDialog text presets', () => {
  beforeEach(acceptUploads);

  it('saves the selected text with its style and a position relative to the photo', async () => {
    let saved: unknown;
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getTextPresetsUrl()), async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json(makeTextPreset({ ...(saved as object), id: 7 }), { status: 201 });
      }),
    );
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiß' }));
    await user.click(screen.getByRole('button', { name: 'Fett' }));

    await user.click(screen.getByRole('button', { name: 'Als Vorlage speichern' }));

    expect(within(await presetsGroup()).getByRole('button', { name: /^Text/ })).toBeInTheDocument();
    expect(saved).toEqual({
      text: 'Text', x: 0.5, y: 0.5, rotation: 0, font_size: 0.125,
      color: 'white', background: false, font: 'sans', bold: true, width: null,
    });
  });

  it('cannot save an empty text as a preset', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    await user.clear(textField());

    expect(screen.getByRole('button', { name: 'Als Vorlage speichern' })).toBeDisabled();
  });

  it('inserts a saved preset with its style as a new text', async () => {
    servePresets([makeTextPreset({ text: 'Gespeichert', color: 'white', bold: true })]);
    const { user } = await goToText();

    await user.click(within(await presetsGroup()).getByRole('button', { name: /^Gespeichert/ }));

    const selected = screen.getByRole('group', { name: 'Ausgewählter Text' });
    expect(within(selected).getByRole('textbox', { name: 'Text' })).toHaveValue('Gespeichert');
    expect(within(selected).getByRole('button', { name: 'Weiß' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(selected).getByRole('button', { name: 'Fett' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('wraps a text with its own line width automatically again on request', async () => {
    servePresets([makeTextPreset({ text: 'Schmal', width: 0.3 })]);
    const { user } = await goToText();
    await user.click(within(await presetsGroup()).getByRole('button', { name: /^Schmal/ }));
    const selected = screen.getByRole('group', { name: 'Ausgewählter Text' });

    await user.click(within(selected).getByRole('button', { name: 'Automatisch umbrechen' }));

    expect(within(selected).queryByRole('button', { name: 'Automatisch umbrechen' })).not.toBeInTheDocument();
  });

  it('offers automatic wrapping only for a text with its own line width', async () => {
    const { user } = await goToText();

    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));

    expect(screen.queryByRole('button', { name: 'Automatisch umbrechen' })).not.toBeInTheDocument();
  });

  it('deletes a preset only after confirming', async () => {
    servePresets([makeTextPreset({ id: 3, text: 'Weg damit' })]);
    const deleted = vi.fn();
    server.use(
      mswHttp.delete(apiUrl(imageEndpoints.getTextPresetDetailUrl(3)), () => {
        deleted();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = await goToText();
    const removeIcon = () => within(screen.getByRole('group', { name: 'Vorlagen' })).getByRole('img', { name: 'Vorlage löschen' });
    await presetsGroup();

    await user.click(removeIcon());
    await user.click(within(screen.getByRole('dialog', { name: 'Vorlage löschen?' })).getByRole('button', { name: 'Abbrechen' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Vorlage löschen?' })).not.toBeInTheDocument());
    expect(deleted).not.toHaveBeenCalled();

    await user.click(removeIcon());
    await user.click(within(screen.getByRole('dialog', { name: 'Vorlage löschen?' })).getByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(screen.queryByRole('group', { name: 'Vorlagen' })).not.toBeInTheDocument());
    expect(deleted).toHaveBeenCalledOnce();
  });
});

describe('UploadDialog preview and upload step', () => {
  it('shows the final photo before uploading', async () => {
    await goToPreview();

    expect(screen.getByRole('img', { name: 'Vorschau von urlaub.jpg' })).toBeInTheDocument();
  });

  it('shows the photo as the e-paper frame renders it and uploads the original anyway', async () => {
    acceptUploads();
    const { user } = await goToPreview();
    const preview = () => screen.getByRole('img', { name: 'Vorschau von urlaub.jpg' });
    const originalSrc = preview().getAttribute('src');

    await user.click(screen.getByRole('button', { name: 'E-Paper' }));

    await waitFor(() => expect(preview()).toHaveAttribute('src', objectUrlOf(epaperBlob)));
    expect(await vi.mocked(renderEpaper).mock.calls[0][0].text()).toBe('cropped');

    await user.click(screen.getByRole('button', { name: 'Original' }));
    expect(preview()).toHaveAttribute('src', originalSrc);

    await user.click(screen.getByRole('button', { name: 'E-Paper' }));
    await user.click(screen.getByRole('button', { name: 'Hochladen' }));
    expect(await (await uploadedFile()).text()).toBe('cropped');
  });


  it('uploads the photo and closes once everything is done', async () => {
    const uploads: Request[] = [];
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), ({ request }) => {
        uploads.push(request.clone());
        return HttpResponse.json(makeImage({ id: 7 }), { status: 201 });
      }),
    );

    const { user, store } = await goToPreview();
    await user.click(screen.getByRole('button', { name: 'Hochladen' }));

    await waitFor(() => expect(store.getState().ui.images.dialogs.create.open).toBe(false));
    expect(uploads).toHaveLength(1);
  });

  it('uploads the jpeg with its hash and the chosen retention', async () => {
    acceptUploads();

    const { user } = await goToPreview();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Hochladen' }));

    await waitFor(() => expect(uploadImage).toHaveBeenCalledOnce());
    const [file, hash, autoDelete] = vi.mocked(uploadImage).mock.calls[0];
    expect(file.name).toBe('urlaub.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // The checkbox starts checked, so one click turns the short retention off.
    expect(autoDelete).toBe(false);
  });

  it('uploads the cropped photo untouched without texts', async () => {
    acceptUploads();
    const { user } = await goToPreview();

    await user.click(screen.getByRole('button', { name: 'Hochladen' }));

    expect(await (await uploadedFile()).text()).toBe('cropped');
    expect(exportStageToBlob).not.toHaveBeenCalled();
  });

  it('uploads the photo with the texts burned in', async () => {
    acceptUploads();
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));

    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    const file = await uploadedFile();
    expect(await file.text()).toBe('with-text');
    expect(file.name).toBe('urlaub.jpg');
  });

  it('renders the texts at full output size even when the crop is smaller', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));

    await waitFor(() => expect(exportStageToBlob).toHaveBeenCalledOnce());
    expect(vi.mocked(exportStageToBlob).mock.calls[0][1]).toBe(1600);
  });

  it('goes back to editing with the texts kept', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));

    await user.click(await screen.findByRole('button', { name: 'Zurück zum Bearbeiten' }));

    expect(await screen.findByRole('button', { name: 'Text' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hochladen' })).not.toBeInTheDocument();
  });

  it('keeps the dialog open and explains a rejected upload', async () => {
    server.use(
      mswHttp.post(apiUrl(imageEndpoints.getImagesUrl()), () =>
        HttpResponse.json({ detail: 'Die Datei ist zu groß.' }, { status: 413 }),
      ),
    );

    const { user, store } = await goToPreview();
    await user.click(screen.getByRole('button', { name: 'Hochladen' }));

    await waitFor(() =>
      expect(store.getState().ui.images.snackbar.alert.message).toMatch(/Die Datei ist zu groß\./),
    );
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });

  it('continues with a fresh crop of the next photo after an upload', async () => {
    acceptUploads();

    const { user, store } = await goToText([photo('a.jpg'), photo('b.jpg', 2)]);
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await user.click(await screen.findByRole('button', { name: 'Hochladen' }));

    expect(await screen.findByRole('heading', { name: 'Foto 2 von 2' })).toBeInTheDocument();
    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-crop', JSON.stringify({ x: 0, y: 0 }));
    await user.click(tab('Text'));
    await textOpen();
    expect(screen.queryByRole('button', { name: 'Text' })).not.toBeInTheDocument();
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });
});
