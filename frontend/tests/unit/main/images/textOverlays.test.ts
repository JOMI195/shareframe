import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  applyWidthTransform,
  boxCenter,
  clampCenter,
  createDateOverlay,
  createTextOverlay,
  DEFAULT_TEXT,
  fitsSafeArea,
  maxWrapWidth,
  oppositeColor,
  overlayFromPreset,
  overlayToPreset,
  rotatedHalfExtents,
  wrapWidth,
} from '@/main/images/dialogs/upload/imageText/textOverlays';

describe('createTextOverlay', () => {
  it('starts as the default text in the image center', () => {
    const overlay = createTextOverlay(800, 480, 0);

    expect(overlay).toMatchObject({ text: DEFAULT_TEXT, color: 'black', background: false, x: 400, y: 240, rotation: 0, fontSize: 60, width: null });
  });

  it('scales the font with the image height', () => {
    expect(createTextOverlay(1600, 960, 0).fontSize).toBe(120);
  });

  it('offsets further texts so they do not hide each other', () => {
    const first = createTextOverlay(800, 480, 0);
    const second = createTextOverlay(800, 480, 1);

    expect(second.x).toBeGreaterThan(first.x);
    expect(second.y).toBeGreaterThan(first.y);
  });

  it('gives every text its own id', () => {
    expect(createTextOverlay(800, 480, 0).id).not.toBe(createTextOverlay(800, 480, 0).id);
  });
});

describe('createDateOverlay', () => {
  it('uses the given day in German numeric format', () => {
    expect(createDateOverlay(800, 480, 0, new Date('2026-10-10T08:00:00Z')).text).toBe('10.10.2026');
  });
});

describe('applyTransform', () => {
  const overlay = createTextOverlay(800, 480, 0);

  it('folds the handle scale into the font size', () => {
    const next = applyTransform(overlay, { x: 10, y: 20, rotation: 45, scale: 1.5 });

    expect(next).toMatchObject({ x: 10, y: 20, rotation: 45, fontSize: 90 });
  });

  it('scales a set line width with the font', () => {
    expect(applyTransform({ ...overlay, width: 200 }, { x: 0, y: 0, rotation: 0, scale: 1.5 }).width).toBe(300);
  });

  it('never shrinks a text below a readable size', () => {
    expect(applyTransform(overlay, { x: 0, y: 0, rotation: 0, scale: 0.01 }).fontSize).toBe(8);
  });

  it('keeps content and styling', () => {
    const styled = { ...overlay, text: 'Hallo', color: 'white' as const, bold: true, font: 'serif' as const };

    expect(applyTransform(styled, { x: 0, y: 0, rotation: 0, scale: 1 })).toMatchObject({
      text: 'Hallo',
      color: 'white',
      bold: true,
      font: 'serif',
    });
  });
});

describe('applyWidthTransform', () => {
  const overlay = createTextOverlay(800, 480, 0);

  it('sets the line width and keeps the font size', () => {
    expect(applyWidthTransform(overlay, { x: 10, y: 20, width: 300 })).toMatchObject({ x: 10, y: 20, width: 300, fontSize: 60 });
  });

  it('keeps at least one font size of width', () => {
    expect(applyWidthTransform(overlay, { x: 0, y: 0, width: 5 }).width).toBe(60);
  });
});

describe('safe area', () => {
  const safe = { x: 50, y: 20, width: 700, height: 440 };
  const size = { width: 200, height: 100 };

  it('swaps the extents of a quarter turn', () => {
    const half = rotatedHalfExtents(size, 90);

    expect(half.x).toBeCloseTo(50);
    expect(half.y).toBeCloseTo(100);
  });

  it('keeps a text inside the safe area untouched', () => {
    expect(clampCenter({ x: 400, y: 240 }, size, 0, safe)).toEqual({ x: 400, y: 240 });
  });

  it('pushes a text out of the passepartout', () => {
    expect(clampCenter({ x: 0, y: 480 }, size, 0, safe)).toEqual({ x: 150, y: 410 });
  });

  it('uses the turned size of a rotated text', () => {
    const center = clampCenter({ x: 0, y: 0 }, size, 90, safe);

    expect(center.x).toBeCloseTo(100);
    expect(center.y).toBeCloseTo(120);
  });

  it('centers a text that is larger than the safe area', () => {
    expect(clampCenter({ x: 0, y: 0 }, { width: 900, height: 100 }, 0, safe).x).toBe(400);
  });

  it('tells whether a text fits', () => {
    expect(fitsSafeArea({ x: 400, y: 240 }, size, 0, safe)).toBe(true);
    expect(fitsSafeArea({ x: 100, y: 240 }, size, 0, safe)).toBe(false);
  });

  it('allows the full safe width for straight text', () => {
    expect(maxWrapWidth(0, safe)).toBeCloseTo(700);
    expect(maxWrapWidth(90, safe)).toBeCloseTo(440);
  });

  it('wraps only when the text is wider than its limit', () => {
    const overlay = createTextOverlay(800, 480, 0);

    expect(wrapWidth(overlay, 300, safe)).toBe(300);
    expect(wrapWidth(overlay, 1000, safe)).toBeCloseTo(700);
    expect(wrapWidth({ ...overlay, width: 250 }, 300, safe)).toBe(250);
    expect(wrapWidth({ ...overlay, width: 900 }, 1000, safe)).toBeCloseTo(700);
  });

  it('finds the center of a rotated transformer box', () => {
    const center = boxCenter({ x: 100, y: 100, width: 200, height: 100, rotation: Math.PI / 2 });

    expect(center.x).toBeCloseTo(50);
    expect(center.y).toBeCloseTo(200);
  });
});

describe('oppositeColor', () => {
  it('puts the background in the other color of the text', () => {
    expect(oppositeColor('black')).toBe('white');
    expect(oppositeColor('white')).toBe('black');
  });
});

describe('text presets', () => {
  const overlay = {
    ...createTextOverlay(800, 480, 0, 'Vorlage'),
    x: 200, y: 360, rotation: 30, fontSize: 48, color: 'white' as const, background: true, font: 'serif' as const, bold: true,
  };

  it('stores position and size relative to the photo', () => {
    expect(overlayToPreset(overlay, 800, 480)).toEqual({
      text: 'Vorlage', x: 0.25, y: 0.75, rotation: 30, font_size: 0.1,
      color: 'white', background: true, font: 'serif', bold: true, width: null,
    });
  });

  it('stores a set line width relative to the photo width', () => {
    const preset = overlayToPreset({ ...overlay, width: 200 }, 800, 480);

    expect(preset.width).toBe(0.25);
    expect(overlayFromPreset(preset, 1600, 960).width).toBe(400);
  });

  it('lands at the same spot and style on a photo of another resolution', () => {
    const inserted = overlayFromPreset(overlayToPreset(overlay, 800, 480), 1600, 960);

    expect(inserted).toMatchObject({ x: 400, y: 720, rotation: 30, fontSize: 96, color: 'white', background: true, font: 'serif', bold: true });
  });

  it('inserts every preset as a new text', () => {
    const preset = overlayToPreset(overlay, 800, 480);

    expect(overlayFromPreset(preset, 800, 480).id).not.toBe(overlayFromPreset(preset, 800, 480).id);
  });

  // Dragging may leave the center off the photo, and turning past a full circle keeps counting.
  it('keeps stored values in range', () => {
    const preset = overlayToPreset({ ...overlay, x: -50, y: 900, rotation: 400 }, 800, 480);

    expect(preset).toMatchObject({ x: 0, y: 1, rotation: 40 });
  });
});
