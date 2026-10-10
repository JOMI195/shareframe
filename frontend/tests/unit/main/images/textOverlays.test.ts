import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  createDateOverlay,
  createTextOverlay,
  DEFAULT_TEXT,
  oppositeColor,
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
