import { describe, expect, it } from 'vitest';
import { EPAPER_HEIGHT, EPAPER_WIDTH, ditherToEpaper } from '@/main/images/epaper/dither';

const grayImage = (values: number[]) => {
  const rgba = new Uint8ClampedArray(values.length * 4);
  values.forEach((value, i) => rgba.set([value, value, value, 255], i * 4));
  return rgba;
};

const uniform = (value: number) => grayImage(new Array(EPAPER_WIDTH * EPAPER_HEIGHT).fill(value));

const luma = (rgba: Uint8ClampedArray) => Array.from({ length: rgba.length / 4 }, (_, i) => rgba[i * 4]);

describe('ditherToEpaper', () => {
  it('keeps white white', () => {
    expect(luma(ditherToEpaper(uniform(255), EPAPER_WIDTH, EPAPER_HEIGHT)).every((v) => v === 255)).toBe(true);
  });

  it('keeps black black', () => {
    expect(luma(ditherToEpaper(uniform(0), EPAPER_WIDTH, EPAPER_HEIGHT)).every((v) => v === 0)).toBe(true);
  });

  it('outputs only opaque black or white pixels', () => {
    const values = Array.from({ length: 64 * 32 }, (_, i) => (i * 37) % 256);
    const out = ditherToEpaper(grayImage(values), 64, 32);

    for (let i = 0; i < out.length; i += 4) {
      expect([0, 255]).toContain(out[i]);
      expect(out[i + 1]).toBe(out[i]);
      expect(out[i + 2]).toBe(out[i]);
      expect(out[i + 3]).toBe(255);
    }
  });

  it('turns mid gray into about half black', () => {
    const black = luma(ditherToEpaper(uniform(128), EPAPER_WIDTH, EPAPER_HEIGHT)).filter((v) => v === 0).length;

    const share = black / (EPAPER_WIDTH * EPAPER_HEIGHT);
    expect(share).toBeGreaterThan(0.48);
    expect(share).toBeLessThan(0.52);
  });

  it('weights the channels like the board', () => {
    const red = new Uint8ClampedArray([255, 0, 0, 255]);
    const green = new Uint8ClampedArray([0, 255, 0, 255]);

    expect(ditherToEpaper(red, 1, 1)[0]).toBe(0);
    expect(ditherToEpaper(green, 1, 1)[0]).toBe(255);
  });

  it('diffuses the error like the board, dropping what falls off the edges', () => {
    // Traced by hand through 7/3/5/1 sixteenths: e.g. (0,0)=100 → black, pushing 43.75 right
    // and 31.25 down, which lifts (0,1) from 120 over the threshold.
    const out = ditherToEpaper(grayImage([
      100, 200, 50, 150,
      120, 60, 220, 130,
    ]), 4, 2);

    expect(luma(out)).toEqual([
      0, 255, 0, 255,
      255, 0, 255, 0,
    ]);
  });
});
