import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
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

const goToCropping = async (photos = [photo('urlaub.jpg')]) => {
  const view = render();
  await view.user.upload(fileInput(), photos);
  await view.user.click(screen.getByRole('button', { name: 'Weiter zum Zuschneiden' }));
  await screen.findByTestId('cropper');
  return view;
};

const goToText = async (photos?: File[]) => {
  const view = await goToCropping(photos);
  await view.user.click(await screen.findByRole('button', { name: 'Zuschneiden & weiter' }));
  await screen.findByRole('button', { name: 'Weiter zur Vorschau' });
  return view;
};

const goToPreview = async (photos?: File[]) => {
  const view = await goToText(photos);
  await view.user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
  await screen.findByRole('button', { name: 'Hochladen' });
  return view;
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

describe('UploadDialog close buttons', () => {
  const desktop = () => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      ...matchMedia(query),
      matches: query.includes('min-width'),
    }));
  };

  // On phones the dialog is full screen and its header already has the X.
  it('leaves closing to the header on phones', async () => {
    const { user } = await goToText();

    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dialog schließen' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));
    await screen.findByRole('button', { name: 'Hochladen' });
    expect(screen.queryByRole('button', { name: 'Dialog schließen' })).not.toBeInTheDocument();
  });

  it('hides the cancel button of the selection step on phones', () => {
    render();

    expect(screen.queryByRole('button', { name: 'Abbrechen' })).not.toBeInTheDocument();
  });

  it('offers cancel on larger screens without a header', () => {
    desktop();
    render();

    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'cancel' })).not.toBeInTheDocument();
  });

  it('offers closing in the later steps on larger screens', async () => {
    desktop();
    await goToText();

    // The crop step keeps its own button until it has collapsed.
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Dialog schließen' })).toHaveLength(1));
  });
});

describe('UploadDialog step navigation', () => {
  const scrolledToTop = (title: string) =>
    vi.mocked(Element.prototype.scrollIntoView).mock.contexts.some(
      (element) => element instanceof Element && within(element as HTMLElement).queryAllByText(title).length > 0,
    );

  it('scrolls the title of every newly opened step to the top', async () => {
    const { user } = await goToCropping();
    await waitFor(() => expect(scrolledToTop('Fotos zuschneiden')).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Zuschneiden & weiter' }));
    await waitFor(() => expect(scrolledToTop('Text hinzufügen')).toBe(true));

    await user.click(await screen.findByRole('button', { name: 'Weiter zur Vorschau' }));
    await waitFor(() => expect(scrolledToTop('Vorschau und hochladen')).toBe(true));
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

describe('UploadDialog crop step', () => {
  it('keeps the crop when coming back from the text step', async () => {
    const { user } = await goToCropping();
    await user.click(screen.getByRole('button', { name: 'Ausschnitt verschieben' }));
    await user.click(screen.getByRole('button', { name: 'Zuschneiden & weiter' }));

    await user.click(await screen.findByRole('button', { name: 'Zurück zum Zuschneiden' }));

    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-crop', JSON.stringify({ x: 5, y: 7 }));
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

  it('keeps the texts when going back to cropping and on again', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.clear(textField());
    await user.type(textField(), 'Bleibt');

    await user.click(screen.getByRole('button', { name: 'Zurück zum Zuschneiden' }));
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & weiter' }));

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

  it('goes back to the text step with the texts kept', async () => {
    const { user } = await goToText();
    await user.click(screen.getByRole('button', { name: 'Text hinzufügen' }));
    await user.click(screen.getByRole('button', { name: 'Weiter zur Vorschau' }));

    await user.click(await screen.findByRole('button', { name: 'Zurück zum Text' }));

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

    expect(await screen.findByText('Fotos: 1/2 hochgeladen')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Zuschneiden & weiter' }));
    await screen.findByRole('button', { name: 'Weiter zur Vorschau' });
    expect(screen.queryByRole('button', { name: 'Text' })).not.toBeInTheDocument();
    expect(store.getState().ui.images.dialogs.create.open).toBe(true);
  });
});
