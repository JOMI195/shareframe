import { describe, expect, it } from 'vitest';
import migration3 from '@/store/migrations/migration3';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage, makeSentImage } from '@tests/fixtures';

describe('migration3', () => {
  it('clears the sentImages preview selection', () => {
    const before = rootState();
    before.ui.sentImages.dialogs.preview.selectedSentImage = makeSentImage();

    const after = migration3(before);

    expect(after.ui.sentImages.dialogs.preview.selectedSentImage).toBeNull();
  });

  it('does not leak the images preview into the sentImages preview', () => {
    const before = rootState();
    before.ui.images.dialogs.preview.open = true;
    before.ui.images.dialogs.preview.selectedImage = makeImage({ id: 42 });

    const after = migration3(before) as unknown as {
      ui: { sentImages: { dialogs: { preview: { open: boolean; selectedImage?: { id: number } } } } };
    };

    expect(after.ui.sentImages.dialogs.preview.open).toBe(false);
    expect(after.ui.sentImages.dialogs.preview.selectedImage).toBeUndefined();
  });

  it('keeps the rest of the sentImages preview state', () => {
    const before = rootState();
    before.ui.sentImages.dialogs.preview.open = true;

    const after = migration3(before);

    expect(after.ui.sentImages.dialogs.preview.open).toBe(true);
  });

  it('leaves the filter dialog untouched', () => {
    const before = rootState();
    before.ui.sentImages.dialogs.filter.senderFilter = 'alice';

    const after = migration3(before);

    expect(after.ui.sentImages.dialogs.filter.senderFilter).toBe('alice');
  });
});
