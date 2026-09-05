import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAcceptedFileTypes,
  getAllowedExtensionLabels,
  validateImage,
  validateImages,
} from '@/main/images/dialogs/upload/imageUpload/validation/imageValidation';

const makeFile = (name: string, type: string, sizeMb = 1) =>
  new File([new Uint8Array(Math.round(sizeMb * 1024 * 1024))], name, { type });

afterEach(() => vi.unstubAllEnvs());

describe('accepted types', () => {
  it('maps the configured extensions to deduped MIME types', () => {
    // jpg and jpeg both map to image/jpeg.
    expect(getAcceptedFileTypes()).toBe('image/jpeg,image/png');
    expect(getAllowedExtensionLabels()).toEqual(['jpg', 'jpeg', 'png']);
  });

  it('returns nothing when no formats are configured', () => {
    vi.stubEnv('VITE_APP_UPLOADED_FILES_FILE_FORMATS', '');
    expect(getAcceptedFileTypes()).toBe('');
    expect(getAllowedExtensionLabels()).toEqual([]);
  });
});

describe('validateImage format', () => {
  it('accepts by extension', () => {
    expect(validateImage(makeFile('photo.PNG', ''), 0).valid).toBe(true);
  });

  // Mobile pickers hand over files without a usable name.
  it('accepts by MIME type when the name has no known extension', () => {
    expect(validateImage(makeFile('image', 'image/jpeg'), 0).valid).toBe(true);
  });

  it('rejects an unknown format', () => {
    const result = validateImage(makeFile('doc.pdf', 'application/pdf'), 0);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falsches Dateiformat');
  });

  it('rejects everything when no formats are configured', () => {
    vi.stubEnv('VITE_APP_UPLOADED_FILES_FILE_FORMATS', '');
    expect(validateImage(makeFile('photo.jpg', 'image/jpeg'), 0).valid).toBe(false);
  });
});

describe('validateImage limits', () => {
  it('rejects a batch larger than the per-upload limit', () => {
    const result = validateImage(makeFile('photo.jpg', 'image/jpeg'), 0, 16);
    expect(result.errors).toContain('Maximal 15 Foto(s) können auf einmal hochgeladen werden');
  });

  it('rejects a file whose index is past the per-upload limit', () => {
    expect(validateImage(makeFile('photo.jpg', 'image/jpeg'), 15, 1).valid).toBe(false);
  });

  it('rejects a file over the size limit', () => {
    const result = validateImage(makeFile('photo.jpg', 'image/jpeg', 21), 0);
    expect(result.errors).toContain('Datei ist zu groß (maximal 20MB)');
  });

  it('rejects when the account total would be exceeded', () => {
    const result = validateImage(makeFile('photo.jpg', 'image/jpeg'), 0, 1, 100);
    expect(result.errors).toContain(
      'Maximale Gesamtanzahl von 100 hochgeladenen Foto(s) würde überschritten werden',
    );
  });

  it('collects every failure at once', () => {
    const result = validateImage(makeFile('doc.pdf', 'application/pdf', 21), 0, 16, 100);
    expect(result.errors).toHaveLength(4);
  });

  // The per-upload check fails closed on a missing env var, the total check fails open.
  it('fails closed when the per-upload limit is unset', () => {
    vi.stubEnv('VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE', undefined);
    expect(validateImage(makeFile('photo.jpg', 'image/jpeg'), 0).valid).toBe(false);
  });

  it('fails open when the total limit is unset', () => {
    vi.stubEnv('VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL', undefined);
    expect(validateImage(makeFile('photo.jpg', 'image/jpeg'), 0, 1, 9999).valid).toBe(true);
  });
});

describe('validateImages', () => {
  it('splits valid from invalid files', () => {
    const { validFiles, invalidFiles } = validateImages([
      makeFile('a.jpg', 'image/jpeg'),
      makeFile('b.pdf', 'application/pdf'),
    ]);

    expect(validFiles.map((f) => f.name)).toEqual(['a.jpg']);
    expect(invalidFiles).toHaveLength(1);
    expect(invalidFiles[0].errors).toContain('Falsches Dateiformat');
  });

  // When the grand total would be exceeded, per-file validation is skipped entirely.
  it('marks every file invalid with one error when the total would be exceeded', () => {
    const files = [makeFile('a.jpg', 'image/jpeg'), makeFile('b.jpg', 'image/jpeg')];
    const { validFiles, invalidFiles } = validateImages(files, 99);

    expect(validFiles).toHaveLength(0);
    expect(invalidFiles).toHaveLength(2);
    invalidFiles.forEach(({ errors }) => {
      expect(errors).toEqual(['Maximale Gesamtanzahl von 100 Foto(s) würde überschritten']);
    });
  });

  it('counts already-selected files towards the per-upload index', () => {
    const { invalidFiles } = validateImages([makeFile('a.jpg', 'image/jpeg')], 0, 15);
    expect(invalidFiles).toHaveLength(1);
  });

  it('accepts an empty selection', () => {
    expect(validateImages([])).toEqual({ validFiles: [], invalidFiles: [] });
  });
});
