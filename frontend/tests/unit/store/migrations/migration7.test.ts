import { describe, expect, it } from 'vitest';
import migration7 from '@/store/migrations/migration7';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage } from '@tests/fixtures';

describe('migration7', () => {
  it('clears every image selection list', () => {
    const before = rootState();
    before.ui.images.dialogs.delete.imagesToDelete = [makeImage()];
    before.ui.images.dialogs.sendToFrame.imagesToSend = [makeImage()];
    before.ui.images.dialogs.selection = { open: true, selectedImages: [makeImage()] };

    const after = migration7(before);

    expect(after.ui.images.dialogs.delete.imagesToDelete).toEqual([]);
    expect(after.ui.images.dialogs.sendToFrame.imagesToSend).toEqual([]);
    expect(after.ui.images.dialogs.selection).toEqual({ open: false, selectedImages: [] });
  });

  it('keeps the delete dialog open flag', () => {
    const before = rootState();
    before.ui.images.dialogs.delete.open = true;

    expect(migration7(before).ui.images.dialogs.delete.open).toBe(true);
  });
});
