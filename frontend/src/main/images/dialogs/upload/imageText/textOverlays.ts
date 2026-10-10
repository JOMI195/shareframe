import { formatDateNumeric } from '@/common/utils/date/date';
import { ITextPresetDraft } from '@/types';

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
});

export const oppositeColor = (color: TextColor): TextColor => (color === 'black' ? 'white' : 'black');

export const backgroundPadding = (fontSize: number) => fontSize * BACKGROUND_PADDING_RATIO;

export const backgroundRadius = (fontSize: number) => fontSize * BACKGROUND_RADIUS_RATIO;
