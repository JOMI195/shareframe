import { formatDateNumeric } from '@/common/utils/date/date';
import { ITextPresetDraft } from '@/types';
import { Bounds } from '../passepartout';

export type TextColor = 'black' | 'white';
export type TextFont = 'sans' | 'serif' | 'handwritten';

export interface TextOverlay {
    id: string;
    text: string;
    // center of the text in cropped-image pixels
    x: number;
    y: number;
    rotation: number;
    fontSize: number;
    color: TextColor;
    // box behind the text in the opposite color
    background: boolean;
    font: TextFont;
    bold: boolean;
    // manual line width in cropped-image pixels, null wraps only at the passepartout
    width: number | null;
}

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export const DEFAULT_TEXT = 'Text';

export const FONTS: Record<TextFont, { label: string; family: string }> = {
    sans: { label: 'Inter', family: 'Inter' },
    serif: { label: 'Merriweather', family: 'Merriweather' },
    handwritten: { label: 'Caveat', family: 'Caveat' },
};

const FONT_SIZE_RATIO = 1 / 8;
const MIN_FONT_SIZE = 8;
const BACKGROUND_PADDING_RATIO = 0.2;
const BACKGROUND_RADIUS_RATIO = 0.15;
const CASCADE_STEPS = 4;

let idCounter = 0;

// Each new text lands slightly offset so stacked ones stay distinguishable.
export const createTextOverlay = (
    imageWidth: number,
    imageHeight: number,
    existingCount: number,
    text = DEFAULT_TEXT
): TextOverlay => {
    const fontSize = Math.max(MIN_FONT_SIZE, Math.round(imageHeight * FONT_SIZE_RATIO));
    const offset = (existingCount % CASCADE_STEPS) * fontSize * 0.75;
    return {
        id: `text-${Date.now()}-${++idCounter}`,
        text,
        x: imageWidth / 2 + offset,
        y: imageHeight / 2 + offset,
        rotation: 0,
        fontSize,
        color: 'black',
        background: false,
        font: 'sans',
        bold: false,
        width: null,
    };
};

export const createDateOverlay = (imageWidth: number, imageHeight: number, existingCount: number, now = new Date()) =>
    createTextOverlay(imageWidth, imageHeight, existingCount, formatDateNumeric(now));

export const applyTransform = (
    overlay: TextOverlay,
    transform: { x: number; y: number; rotation: number; scale: number }
): TextOverlay => ({
    ...overlay,
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation,
    fontSize: Math.max(MIN_FONT_SIZE, Math.round(overlay.fontSize * transform.scale)),
    width: overlay.width === null ? null : Math.round(overlay.width * transform.scale),
});

// A new crop changes the photo's pixel size; the frame aspect is fixed, so one factor fits both axes.
export const scaleOverlays = (overlays: TextOverlay[], factor: number): TextOverlay[] =>
    overlays.map((overlay) => ({
        ...overlay,
        x: overlay.x * factor,
        y: overlay.y * factor,
        fontSize: Math.max(MIN_FONT_SIZE, Math.round(overlay.fontSize * factor)),
        width: overlay.width === null ? null : Math.round(overlay.width * factor),
    }));

export const applyWidthTransform = (
    overlay: TextOverlay,
    transform: { x: number; y: number; width: number }
): TextOverlay => ({
    ...overlay,
    x: transform.x,
    y: transform.y,
    width: Math.max(overlay.fontSize, Math.round(transform.width)),
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeRotation = (rotation: number) => {
    const turned = ((rotation % 360) + 360) % 360;
    return turned > 180 ? turned - 360 : turned;
};

export const overlayToPreset = (overlay: TextOverlay, imageWidth: number, imageHeight: number): ITextPresetDraft => ({
    text: overlay.text,
    x: clamp(overlay.x / imageWidth, 0, 1),
    y: clamp(overlay.y / imageHeight, 0, 1),
    rotation: normalizeRotation(overlay.rotation),
    font_size: Math.min(1, overlay.fontSize / imageHeight),
    color: overlay.color,
    background: overlay.background,
    font: overlay.font,
    bold: overlay.bold,
    width: overlay.width === null ? null : clamp(overlay.width / imageWidth, 0, 1),
});

export const overlayFromPreset = (preset: ITextPresetDraft, imageWidth: number, imageHeight: number): TextOverlay => ({
    id: `text-${Date.now()}-${++idCounter}`,
    text: preset.text,
    x: preset.x * imageWidth,
    y: preset.y * imageHeight,
    rotation: preset.rotation,
    fontSize: Math.max(MIN_FONT_SIZE, Math.round(preset.font_size * imageHeight)),
    color: preset.color,
    background: preset.background,
    font: preset.font,
    bold: preset.bold,
    width: preset.width === null ? null : preset.width * imageWidth,
});

export const oppositeColor = (color: TextColor): TextColor => (color === 'black' ? 'white' : 'black');

export const backgroundPadding = (fontSize: number) => fontSize * BACKGROUND_PADDING_RATIO;

export const backgroundRadius = (fontSize: number) => fontSize * BACKGROUND_RADIUS_RATIO;

const EPSILON = 1e-6;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const rotatedHalfExtents = (size: Size, rotation: number): Point => {
    const cos = Math.abs(Math.cos(toRadians(rotation)));
    const sin = Math.abs(Math.sin(toRadians(rotation)));
    return {
        x: (size.width * cos + size.height * sin) / 2,
        y: (size.width * sin + size.height * cos) / 2,
    };
};

// Too large for the safe area means centered, so the overflow is even on both sides.
const clampAxis = (value: number, half: number, start: number, length: number) =>
    half * 2 >= length ? start + length / 2 : clamp(value, start + half, start + length - half);

export const clampCenter = (center: Point, size: Size, rotation: number, safe: Bounds): Point => {
    const half = rotatedHalfExtents(size, rotation);
    return {
        x: clampAxis(center.x, half.x, safe.x, safe.width),
        y: clampAxis(center.y, half.y, safe.y, safe.height),
    };
};

export const fitsSafeArea = (center: Point, size: Size, rotation: number, safe: Bounds) => {
    const half = rotatedHalfExtents(size, rotation);
    return (
        center.x - half.x >= safe.x - EPSILON &&
        center.x + half.x <= safe.x + safe.width + EPSILON &&
        center.y - half.y >= safe.y - EPSILON &&
        center.y + half.y <= safe.y + safe.height + EPSILON
    );
};

// Longest line that still fits the safe area at this rotation, ignoring the text height.
export const maxWrapWidth = (rotation: number, safe: Bounds) => {
    const cos = Math.abs(Math.cos(toRadians(rotation)));
    const sin = Math.abs(Math.sin(toRadians(rotation)));
    return Math.min(
        cos > EPSILON ? safe.width / cos : Infinity,
        sin > EPSILON ? safe.height / sin : Infinity
    );
};

export const wrapWidth = (overlay: TextOverlay, naturalWidth: number, safe: Bounds) =>
    Math.min(naturalWidth, overlay.width ?? Infinity, maxWrapWidth(overlay.rotation, safe));

// Konva hands transformer boxes as top-left corner plus rotation in radians.
export const boxCenter = (box: { x: number; y: number; width: number; height: number; rotation: number }): Point => ({
    x: box.x + (box.width / 2) * Math.cos(box.rotation) - (box.height / 2) * Math.sin(box.rotation),
    y: box.y + (box.width / 2) * Math.sin(box.rotation) + (box.height / 2) * Math.cos(box.rotation),
});
