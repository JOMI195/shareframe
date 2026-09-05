import { describe, expect, it } from 'vitest';
import { getCroppedImg, getRadianAngle, rotateSize } from '@/main/images/dialogs/upload/imageCropping/cropper/utils';

describe('getRadianAngle', () => {
  it('converts degrees to radians', () => {
    expect(getRadianAngle(0)).toBe(0);
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI);
    expect(getRadianAngle(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

describe('rotateSize', () => {
  it('leaves an unrotated rectangle unchanged', () => {
    expect(rotateSize(800, 600, 0)).toEqual({ width: 800, height: 600 });
  });

  it('swaps the sides at 90 degrees', () => {
    const { width, height } = rotateSize(800, 600, 90);
    expect(width).toBeCloseTo(600);
    expect(height).toBeCloseTo(800);
  });

  it('grows the bounding box at 45 degrees', () => {
    const { width, height } = rotateSize(100, 100, 45);
    expect(width).toBeCloseTo(Math.sqrt(2) * 100);
    expect(height).toBeCloseTo(Math.sqrt(2) * 100);
  });

  it('is sign-agnostic', () => {
    expect(rotateSize(800, 600, -90)).toEqual(rotateSize(800, 600, 90));
  });
});

describe('getCroppedImg', () => {
  it('rejects a sub-pixel crop before touching the canvas', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(getCroppedImg(file, { width: 0.5, height: 10, x: 0, y: 0 })).rejects.toThrow(
      'Der Zuschnitt ist noch nicht bereit. Bitte erneut versuchen.',
    );
  });
});
