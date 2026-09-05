import { describe, expect, it } from 'vitest';
import migration2 from '@/store/migrations/migration2';
import { rootState } from '@tests/helpers/preloadedState';
import { makeImage } from '@tests/fixtures';

describe('migration2', () => {
  it('clears the images preview selection', () => {
    const before = rootState();
    before.ui.images.dialogs.preview.selectedImage = makeImage();

    const after = migration2(before);

    expect(after.ui.images.dialogs.preview.selectedImage).toBeNull();
    expect(after.ui.images.dialogs.preview.open).toBe(false);
  });

  it('leaves unrelated branches intact', () => {
    const before = rootState();
    before.ui.navigation.sidebar.open = true;

    const after = migration2(before);

    expect(after.ui.navigation.sidebar.open).toBe(true);
    expect(after.entities).toBe(before.entities);
  });
});
