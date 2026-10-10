import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  createDateOverlay,
  createTextOverlay,
  DEFAULT_TEXT,
  oppositeColor,
  overlayFromPreset,
  overlayToPreset,
} from '@/main/images/dialogs/upload/imageText/textOverlays';

describe('createTextOverlay', () => {
  it('starts as the default text in the image center', () => {
    const overlay = createTextOverlay(800, 480, 0);

    expect(overlay).toMatchObject({ text: DEFAULT_TEXT, color: 'black', background: false, x: 400, y: 240, rotation: 0, fontSize: 60 });
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
      color: 'white', background: true, font: 'serif', bold: true,
    });
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
